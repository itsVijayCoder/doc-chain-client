"use client";

import { useEffect } from "react";
import {
   useMutation,
   useQuery,
   useQueryClient,
} from "@tanstack/react-query";
import { authService, type AuthResult } from "@/lib/services/authService";
import {
   getAccessToken,
   getRefreshToken,
   onTokensChange,
} from "@/lib/auth/tokens";
import type { ApiError, LoginCredentials, RegisterData, User } from "@/lib/types";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

// ─────────────────────────────────────────────────────────────────────────
// useMe — the single source of truth for "who is the current user"
// ─────────────────────────────────────────────────────────────────────────

function hasAnyStoredToken(): boolean {
   return !!(getAccessToken() || getRefreshToken());
}

export function useMe() {
   const queryClient = useQueryClient();

   // Keep the query state in sync with token changes (login in another tab,
   // logout broadcast, etc.). When tokens clear, reset the cached user.
   useEffect(() => {
      const unsubscribe = onTokensChange((state) => {
         if (!state.accessToken && !state.refreshToken) {
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
         }
      });
      return unsubscribe;
   }, [queryClient]);

   return useQuery<User | null, ApiError>({
      queryKey: AUTH_QUERY_KEY,
      queryFn: async () => {
         if (!hasAnyStoredToken()) return null;
         try {
            return await authService.me();
         } catch {
            // If refresh failed or the JWT is invalid, tokens.ts has already
            // cleared local state. Surface null so AuthGuard redirects.
            return null;
         }
      },
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: false,
      refetchOnWindowFocus: false,
   });
}

// ─────────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────────

export function useLogin() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
      onSuccess: (result) => {
         // Only populate the user cache when we have a full auth result.
         // When requires2fa is true, we only have a temp_token — no user yet.
         if (!result.requires2fa) {
            queryClient.setQueryData(AUTH_QUERY_KEY, result.user);
         }
      },
   });
}

export function useValidate2fa() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ code, tempToken }: { code: string; tempToken: string }) =>
         authService.validate2fa(code, tempToken),
      onSuccess: (result: AuthResult) => {
         queryClient.setQueryData(AUTH_QUERY_KEY, result.user);
      },
   });
}

export function useRegister() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (data: RegisterData) => authService.register(data),
      onSuccess: (result) => {
         queryClient.setQueryData(AUTH_QUERY_KEY, result.user);
      },
   });
}

export function useLogout() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: () => authService.logout(),
      onSettled: () => {
         // Whether backend logout succeeded or not, local state is gone.
         queryClient.setQueryData(AUTH_QUERY_KEY, null);
         queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      },
   });
}

export function useForgotPassword() {
   return useMutation({
      mutationFn: (email: string) => authService.forgotPassword(email),
   });
}

export function useResetPassword() {
   return useMutation({
      mutationFn: (args: { token: string; newPassword: string }) =>
         authService.resetPassword(args.token, args.newPassword),
   });
}

// ─────────────────────────────────────────────────────────────────────────
// useAuth — backward-compatible facade for the existing call sites
// ─────────────────────────────────────────────────────────────────────────

/**
 * Facade matching the old `useAuthStore()` public API so call sites don't
 * have to change shape. Under the hood this is TanStack Query + mutations;
 * new code should prefer `useMe()`, `useLogin()`, etc. directly.
 */
export function useAuth() {
   const queryClient = useQueryClient();
   const meQuery = useMe();
   const login = useLogin();
   const register = useRegister();
   const logout = useLogout();
   const forgot = useForgotPassword();
   const reset = useResetPassword();

   const user = meQuery.data ?? null;
   const isAuthenticated = !!user;

   // Merge loading flags from the query and any in-flight mutation.
   const isLoading =
      meQuery.isLoading ||
      login.isPending ||
      register.isPending ||
      logout.isPending ||
      forgot.isPending ||
      reset.isPending;

   const error =
      login.error?.message ||
      register.error?.message ||
      logout.error?.message ||
      forgot.error?.message ||
      reset.error?.message ||
      meQuery.error?.message ||
      null;

   return {
      user,
      isAuthenticated,
      isLoading,
      error,

      login: async (credentials: LoginCredentials) => {
         await login.mutateAsync(credentials);
      },
      register: async (data: RegisterData) => {
         await register.mutateAsync(data);
      },
      logout: async () => {
         await logout.mutateAsync();
      },
      forgotPassword: async (email: string) => {
         await forgot.mutateAsync(email);
      },
      resetPassword: async (token: string, newPassword: string) => {
         await reset.mutateAsync({ token, newPassword });
      },

      // Kept for backward compatibility with the old store API — not needed
      // in new code because TanStack revalidates automatically.
      checkAuth: async () => {
         await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      },
      clearError: () => {
         login.reset();
         register.reset();
         logout.reset();
         forgot.reset();
         reset.reset();
      },
   };
}
