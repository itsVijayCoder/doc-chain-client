import { apiClient } from "./api";
import {
   clearTokens,
   getAccessToken,
   getRefreshToken,
   setTokens,
} from "@/lib/auth/tokens";
import {
   broadcastLogout,
   refreshAccessToken,
} from "@/lib/auth/refresh";
import {
   LoginCredentials,
   RegisterData,
   User,
   UserRoleSlug,
   UserStatus,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror docchain-backend/internal/dto/auth.go + user.go
// ─────────────────────────────────────────────────────────────────────────

interface BackendUserResponse {
   id: string;
   email: string;
   first_name: string;
   last_name: string;
   status: UserStatus;
   roles: string[];
   totp_enabled?: boolean;
}

// Full login response (no 2FA, or after 2FA validate).
interface BackendLoginResponse {
   access_token: string;
   refresh_token: string;
   user: BackendUserResponse;
}

// Partial login response when the account has 2FA enabled.
interface BackendTwoFaChallengeResponse {
   requires_2fa: true;
   temp_token: string;
}

type RawLoginResponse = BackendLoginResponse | BackendTwoFaChallengeResponse;

// ─────────────────────────────────────────────────────────────────────────
// Adapters
// ─────────────────────────────────────────────────────────────────────────

export function adaptUser(raw: BackendUserResponse): User {
   const firstName = raw.first_name ?? "";
   const lastName = raw.last_name ?? "";
   const fullName = `${firstName} ${lastName}`.trim() || raw.email;
   const primaryRole: UserRoleSlug = raw.roles?.[0] ?? "viewer";
   return {
      id: raw.id,
      email: raw.email,
      firstName,
      lastName,
      name: fullName,
      status: raw.status,
      roles: raw.roles ?? [],
      role: primaryRole,
      totp_enabled: raw.totp_enabled ?? false,
      avatar: undefined,
   };
}

// Splits "Jane Doe" → ["Jane", "Doe"]. Backend requires both first_name and
// last_name; we accept "Jane" alone by sending last_name = "" (server will
// validate the required binding — frontend Zod schema already requires two
// words, so this is a defensive fallback).
function splitName(name: string): { firstName: string; lastName: string } {
   const trimmed = name.trim().replace(/\s+/g, " ");
   const space = trimmed.indexOf(" ");
   if (space === -1) return { firstName: trimmed, lastName: "" };
   return {
      firstName: trimmed.slice(0, space),
      lastName: trimmed.slice(space + 1),
   };
}

// ─────────────────────────────────────────────────────────────────────────
// Public result types
// ─────────────────────────────────────────────────────────────────────────

export interface AuthResult {
   requires2fa?: false;
   user: User;
   accessToken: string;
   refreshToken: string;
}

export interface TwoFaChallenge {
   requires2fa: true;
   tempToken: string;
}

export type LoginResult = AuthResult | TwoFaChallenge;

// ─────────────────────────────────────────────────────────────────────────
// authService — the only place that talks to /auth/*
// ─────────────────────────────────────────────────────────────────────────

export const authService = {
   login: async (credentials: LoginCredentials): Promise<LoginResult> => {
      const raw = await apiClient.post<RawLoginResponse>(
         "/auth/login",
         {
            email: credentials.email,
            password: credentials.password,
         }
      );

      if ("requires_2fa" in raw && raw.requires_2fa) {
         return { requires2fa: true, tempToken: raw.temp_token };
      }

      const full = raw as BackendLoginResponse;
      setTokens({
         accessToken: full.access_token,
         refreshToken: full.refresh_token,
      });
      return {
         user: adaptUser(full.user),
         accessToken: full.access_token,
         refreshToken: full.refresh_token,
      };
   },

   // Step-2 of the 2FA login: validate the TOTP/backup code using the
   // temp_token as Bearer. On success returns full tokens like a normal login.
   validate2fa: async (code: string, tempToken: string): Promise<AuthResult> => {
      const raw = await apiClient.post<BackendLoginResponse>(
         "/auth/2fa/validate",
         { code },
         { headers: { Authorization: `Bearer ${tempToken}` } }
      );
      setTokens({
         accessToken: raw.access_token,
         refreshToken: raw.refresh_token,
      });
      return {
         user: adaptUser(raw.user),
         accessToken: raw.access_token,
         refreshToken: raw.refresh_token,
      };
   },

   register: async (data: RegisterData): Promise<AuthResult> => {
      const { firstName, lastName } = splitName(data.name);
      const raw = await apiClient.post<BackendLoginResponse>(
         "/auth/register",
         {
            email: data.email,
            password: data.password,
            first_name: firstName,
            last_name: lastName,
         }
      );
      // Backend returns LoginResponse with tokens — auto-login after register.
      setTokens({
         accessToken: raw.access_token,
         refreshToken: raw.refresh_token,
      });
      return {
         user: adaptUser(raw.user),
         accessToken: raw.access_token,
         refreshToken: raw.refresh_token,
      };
   },

   logout: async (): Promise<void> => {
      // Best-effort backend call. Swallow errors — we always clear local state.
      try {
         await apiClient.post("/auth/logout");
      } catch {
         // Ignore: network failure, already-invalid token, etc.
      }
      clearTokens();
      broadcastLogout();
   },

   // Fetch the authenticated user's full profile. On hard reload we may not
   // have an access token in memory yet — mint one from the refresh token
   // first, then call /auth/me.
   me: async (): Promise<User> => {
      if (!getAccessToken()) {
         if (!getRefreshToken()) {
            throw {
               message: "Not authenticated",
               code: "AUTH_REQUIRED",
               statusCode: 401,
            };
         }
         await refreshAccessToken(); // throws on unrecoverable failure
      }
      const raw = await apiClient.get<BackendUserResponse>("/auth/me");
      return adaptUser(raw);
   },

   forgotPassword: async (email: string): Promise<void> => {
      await apiClient.post("/auth/forgot-password", { email });
   },

   resetPassword: async (token: string, newPassword: string): Promise<void> => {
      await apiClient.post("/auth/reset-password", {
         token,
         new_password: newPassword,
      });
   },
};
