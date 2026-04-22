import axios, {
   AxiosError,
   AxiosRequestConfig,
   AxiosResponse,
   InternalAxiosRequestConfig,
} from "axios";
import {
   getAccessToken,
   getAccessTokenSecondsLeft,
   getRefreshToken,
   clearTokens,
} from "@/lib/auth/tokens";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { ApiError } from "@/lib/types";

// Proactively refresh the access token if fewer than this many seconds remain
// when a request is about to fire. Wider window for multipart uploads so a
// 500 MB POST doesn't reach the server with an expired token.
const PROACTIVE_WINDOW_DEFAULT = 30;
const PROACTIVE_WINDOW_MULTIPART = 60;

// Minimum time between consecutive proactive refreshes, to absorb clock skew
// and prevent thrash if the user's system clock is far ahead of the server's.
const MIN_REFRESH_INTERVAL_MS = 10_000;

let lastRefreshAt = 0;

export const BASE_URL =
   process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";

const api = axios.create({
   baseURL: BASE_URL,
   timeout: 30_000,
   headers: { "Content-Type": "application/json" },
});

// ─────────────────────────────────────────────────────────────────────────
// Envelope types — see docchain-backend/internal/handler/response.go
// ─────────────────────────────────────────────────────────────────────────

export interface ApiEnvelope<T> {
   success: boolean;
   request_id?: string;
   data?: T;
   meta?: PaginationMeta;
   error?: { code: string; message: string; details?: string[] };
}

export interface PaginationMeta {
   page: number;
   page_size: number;
   total: number;
   total_pages: number;
}

// ─────────────────────────────────────────────────────────────────────────
// Request interceptor — proactive refresh + attach Authorization
// ─────────────────────────────────────────────────────────────────────────

type RetriableRequest = InternalAxiosRequestConfig & {
   __isRetry?: boolean;
   __skipProactiveRefresh?: boolean;
};

function isMultipart(config: AxiosRequestConfig | undefined): boolean {
   if (!config) return false;
   if (config.data instanceof FormData) return true;
   const contentType = config.headers?.["Content-Type"];
   return typeof contentType === "string" && contentType.includes("multipart");
}

api.interceptors.request.use(async (config) => {
   const req = config as RetriableRequest;

   if (!req.__skipProactiveRefresh) {
      const window_ = isMultipart(req)
         ? PROACTIVE_WINDOW_MULTIPART
         : PROACTIVE_WINDOW_DEFAULT;
      const secondsLeft = getAccessTokenSecondsLeft();
      const hasRefreshToken = !!getRefreshToken();
      const sinceLastRefresh = Date.now() - lastRefreshAt;

      const shouldRefresh =
         secondsLeft !== null &&
         secondsLeft < window_ &&
         hasRefreshToken &&
         sinceLastRefresh > MIN_REFRESH_INTERVAL_MS;

      if (shouldRefresh) {
         try {
            await refreshAccessToken();
            lastRefreshAt = Date.now();
         } catch {
            // Refresh failed. Let the request proceed so the response
            // interceptor can observe the eventual 401 and surface it
            // through the normal unauth handling path.
         }
      }
   }

   const token = getAccessToken();
   if (token) {
      req.headers.Authorization = `Bearer ${token}`;
   }
   return req;
});

// ─────────────────────────────────────────────────────────────────────────
// Response interceptor — envelope-aware error transformation + 401 retry
// ─────────────────────────────────────────────────────────────────────────

api.interceptors.response.use(
   (response: AxiosResponse) => response,
   async (error: AxiosError<ApiEnvelope<unknown>>) => {
      const originalRequest = error.config as RetriableRequest | undefined;
      const status = error.response?.status;
      const envelope = error.response?.data;
      const envelopeError = envelope?.error;

      const multipart = isMultipart(originalRequest);
      const isExpiredToken =
         status === 401 && envelopeError?.code === "AUTH_TOKEN_EXPIRED";

      // Reactive 401 retry — only for non-multipart, single attempt. Multipart
      // uploads are not auto-retried because a silent re-upload of a large
      // file would surprise the user; instead we let the caller handle the 401.
      if (
         isExpiredToken &&
         originalRequest &&
         !originalRequest.__isRetry &&
         !multipart
      ) {
         try {
            await refreshAccessToken();
            lastRefreshAt = Date.now();
            originalRequest.__isRetry = true;
            originalRequest.__skipProactiveRefresh = true;
            const newToken = getAccessToken();
            if (newToken && originalRequest.headers) {
               originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return api(originalRequest);
         } catch {
            // Refresh failed permanently; fall through to unauth handling.
         }
      }

      // Any terminal 401: clear local tokens so AuthGuard can redirect on
      // the next render. We do NOT hard-redirect from here — that's UI's job.
      if (status === 401) {
         clearTokens();
      }

      const apiError: ApiError = {
         message: envelopeError?.message ?? error.message ?? "An error occurred",
         code: envelopeError?.code,
         statusCode: status ?? 0,
         details: envelopeError?.details,
         requestId: envelope?.request_id,
      };
      return Promise.reject(apiError);
   }
);

// ─────────────────────────────────────────────────────────────────────────
// Typed helpers — unwrap the envelope so callers receive plain payloads
// ─────────────────────────────────────────────────────────────────────────

export const apiClient = {
   get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
      const res = await api.get<ApiEnvelope<T>>(url, config);
      return res.data.data as T;
   },
   post: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
   ): Promise<T> => {
      const res = await api.post<ApiEnvelope<T>>(url, data, config);
      return res.data.data as T;
   },
   put: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
   ): Promise<T> => {
      const res = await api.put<ApiEnvelope<T>>(url, data, config);
      return res.data.data as T;
   },
   patch: async <T>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
   ): Promise<T> => {
      const res = await api.patch<ApiEnvelope<T>>(url, data, config);
      return res.data.data as T;
   },
   delete: async <T = void>(
      url: string,
      config?: AxiosRequestConfig
   ): Promise<T> => {
      const res = await api.delete<ApiEnvelope<T>>(url, config);
      return res.data.data as T;
   },
   // For paginated endpoints — returns both data and meta.
   getPaginated: async <T>(
      url: string,
      config?: AxiosRequestConfig
   ): Promise<{ data: T[]; meta: PaginationMeta }> => {
      const res = await api.get<ApiEnvelope<T[]>>(url, config);
      return {
         data: res.data.data ?? [],
         meta: res.data.meta ?? {
            page: 1,
            page_size: 0,
            total: 0,
            total_pages: 0,
         },
      };
   },
};

export default api;
