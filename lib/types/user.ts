export type UserStatus = "active" | "inactive";

// Canonical roles known on the backend. Kept as string union for ergonomics,
// but roles[] is treated as string[] so new slugs don't break compilation.
export type UserRoleSlug = "super_admin" | "admin" | string;

// Legacy alias for call sites that still import `UserRole`. Prefer
// `UserRoleSlug` in new code; this stays until mock data is retired.
export type UserRole = UserRoleSlug;

export interface User {
   id: string;
   email: string;
   // Derived from firstName + lastName (or email fallback). Every adapter
   // output guarantees this field is populated.
   name: string;
   // Derived: first of roles[] (or "viewer" if empty). Kept for legacy call
   // sites that expect a single role; prefer `roles[]` in new code.
   role: UserRoleSlug;
   totp_enabled?: boolean;

   // Fields below are relaxed to optional to keep mock data in not-yet-retired
   // stores/pages (Phase 2+) compiling. Real auth-derived users always have
   // firstName, lastName, status, and roles populated by authService.adaptUser.
   firstName?: string;
   lastName?: string;
   status?: UserStatus;
   roles?: UserRoleSlug[];
   avatar?: string;
   bio?: string;
   createdAt?: Date;
   updatedAt?: Date;
   mfaEnabled?: boolean;
   isActive?: boolean;
}

export interface RegisterData {
   name: string;
   email: string;
   password: string;
   confirmPassword: string;
   agreeToTerms: boolean;
}

export interface LoginCredentials {
   email: string;
   password: string;
   rememberMe?: boolean;
}

// Convenience exports used elsewhere in the UI. Kept here to avoid a breaking
// rename wave; backend has no endpoints for these today.
export interface UserPreferences {
   theme: "light" | "dark" | "system";
   language: string;
   timezone: string;
   emailNotifications: boolean;
   aiEnabled: boolean;
   defaultView: "grid" | "list";
}

export interface UserProfile {
   id: string;
   email: string;
   name: string;
   firstName: string;
   lastName: string;
   avatar?: string;
   bio?: string;
   roles: UserRoleSlug[];
   role: UserRoleSlug;
}

export interface Session {
   id: string;
   userId: string;
   deviceName: string;
   ipAddress: string;
   location?: string;
   lastActive: Date;
   createdAt: Date;
   isCurrent: boolean;
}
