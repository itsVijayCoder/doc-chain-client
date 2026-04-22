// Refresh orchestration. Owns the /auth/refresh call, concurrency, retries,
// and cross-tab logout signalling. Uses the native fetch API (not our axios
// instance) to avoid interceptor recursion.
//
// Key properties:
//   - Single-flight: only one /auth/refresh is in flight per tab at a time.
//     Concurrent callers await the same promise.
//   - Cross-tab refresh race: if two tabs 401 at once and both attempt refresh,
//     whichever hits the backend first rotates the refresh token. The slower
//     tab's call returns 401 — we detect this by re-reading the refresh token
//     from localStorage (which the winning tab will have written) and retry
//     with the new value once.
//   - Cross-tab logout: on unrecoverable failure, broadcast a logout message
//     so sibling tabs clear their in-memory access tokens too.
//   - Network/5xx: bounded exponential backoff (1s / 2s / 4s) then give up.

import {
   clearTokens,
   getRefreshToken,
   setTokens,
} from "./tokens";

const API_URL =
   process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";
const CHANNEL_NAME = "docchain:auth";
const BACKOFF_MS = [1000, 2000, 4000];

type RefreshMessage =
   | { type: "logout" }
   | { type: "refreshed"; at: number };

let inFlight: Promise<string> | null = null;

const channel: BroadcastChannel | null =
   typeof BroadcastChannel !== "undefined"
      ? new BroadcastChannel(CHANNEL_NAME)
      : null;

if (channel) {
   channel.addEventListener("message", (e: MessageEvent<RefreshMessage>) => {
      if (e.data?.type === "logout") {
         clearTokens();
      }
   });
}

export function broadcastLogout(): void {
   channel?.postMessage({ type: "logout" } satisfies RefreshMessage);
}

interface TokenPairResponse {
   access_token: string;
   refresh_token: string;
}

interface Envelope<T> {
   success: boolean;
   data?: T;
   error?: { code: string; message: string; details?: string[] };
}

class RefreshFailedError extends Error {
   status?: number;
   code?: string;
   constructor(message: string, status?: number, code?: string) {
      super(message);
      this.name = "RefreshFailedError";
      this.status = status;
      this.code = code;
   }
}

async function callRefreshEndpoint(refreshToken: string): Promise<TokenPairResponse> {
   const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
   });

   let body: Envelope<TokenPairResponse> | null = null;
   try {
      body = (await res.json()) as Envelope<TokenPairResponse>;
   } catch {
      // Non-JSON body — treat as generic failure.
   }

   if (!res.ok || !body?.success || !body.data) {
      throw new RefreshFailedError(
         body?.error?.message ?? `refresh failed (${res.status})`,
         res.status,
         body?.error?.code
      );
   }
   return body.data;
}

async function sleep(ms: number) {
   return new Promise((resolve) => setTimeout(resolve, ms));
}

async function doRefresh(): Promise<string> {
   // Track the refresh token we used in the most recent attempt so that if
   // we get 401/403 we can tell whether a sibling tab rotated it on us.
   let lastUsedRefreshToken: string | null = null;
   let lastError: unknown;

   for (let attempt = 0; attempt < BACKOFF_MS.length; attempt++) {
      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
         // Nothing to refresh with — force logout.
         break;
      }

      try {
         lastUsedRefreshToken = currentRefreshToken;
         const pair = await callRefreshEndpoint(currentRefreshToken);
         setTokens({
            accessToken: pair.access_token,
            refreshToken: pair.refresh_token,
         });
         return pair.access_token;
      } catch (err) {
         lastError = err;
         const status = err instanceof RefreshFailedError ? err.status : undefined;

         if (status === 401 || status === 403) {
            // The refresh token was rejected. Check if a sibling tab just
            // rotated it — if so, retry with the new value immediately.
            const latest = getRefreshToken();
            if (latest && latest !== lastUsedRefreshToken) {
               continue;
            }
            // Our refresh token is genuinely invalid. Stop retrying.
            break;
         }

         // Network / 5xx: backoff and retry.
         if (attempt < BACKOFF_MS.length - 1) {
            await sleep(BACKOFF_MS[attempt]);
         }
      }
   }

   // Unrecoverable. Clear tokens locally and tell sibling tabs to do the same.
   clearTokens();
   broadcastLogout();
   throw lastError ?? new RefreshFailedError("refresh exhausted");
}

/**
 * Returns a freshly-refreshed access token. Concurrent callers share one
 * /auth/refresh round-trip. Throws on unrecoverable failure; callers should
 * treat a throw as "user is logged out" and surface it accordingly.
 */
export function refreshAccessToken(): Promise<string> {
   if (inFlight) return inFlight;
   inFlight = doRefresh().finally(() => {
      inFlight = null;
   });
   return inFlight;
}
