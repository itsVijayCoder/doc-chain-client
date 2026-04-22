import { create } from "zustand";
import { persist } from "zustand/middleware";
import { profileService } from "@/lib/services/profileService";

export interface UserProfile {
   id: string;
   email: string;
   name: string;
   bio?: string;
   avatar?: string;
   role: "admin" | "editor" | "viewer";
   createdAt: Date;
   updatedAt: Date;
}

export interface UserPreferences {
   theme: "light" | "dark" | "system";
   language: string;
   timezone: string;
   dateFormat: string;
   notifications: {
      email: boolean;
      push: boolean;
      documentShared: boolean;
      documentVerified: boolean;
      securityAlerts: boolean;
   };
   ai: {
      enabled: boolean;
      suggestions: boolean;
      autoSummarize: boolean;
      autoTag: boolean;
   };
   display: {
      defaultView: "grid" | "list";
      itemsPerPage: number;
      sidebarCollapsed: boolean;
   };
}

export interface Session {
   id: string;
   deviceName: string;
   deviceType: "desktop" | "mobile" | "tablet";
   browser: string;
   ipAddress: string;
   location: string;
   lastActive: Date;
   isCurrent: boolean;
}

export interface SecurityEvent {
   id: string;
   type:
      | "login"
      | "logout"
      | "password_change"
      | "mfa_enabled"
      | "mfa_disabled"
      | "session_revoked";
   timestamp: Date;
   ipAddress: string;
   location: string;
   deviceName: string;
   success: boolean;
}

interface UserState {
   // Profile
   profile: UserProfile | null;
   preferences: UserPreferences | null;
   sessions: Session[];
   securityEvents: SecurityEvent[];

   // Loading states
   isLoading: boolean;
   isUpdating: boolean;
   isUploadingAvatar: boolean;

   // Error
   error: string | null;

   // Actions - Profile
   fetchProfile: () => Promise<void>;
   updateProfile: (data: Partial<UserProfile>) => Promise<void>;
   uploadAvatar: (file: File) => Promise<void>;
   deleteAccount: (password: string) => Promise<void>;

   // Actions - Security
   changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
   fetchSessions: () => Promise<void>;
   logoutSession: (sessionId: string) => Promise<void>;
   logoutAllSessions: () => Promise<void>;
   fetchSecurityEvents: () => Promise<void>;

   // Actions - Preferences
   fetchPreferences: () => Promise<void>;
   updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
   setTheme: (theme: "light" | "dark" | "system") => Promise<void>;

   // Utility
   clearError: () => void;
   reset: () => void;
}

const defaultPreferences: UserPreferences = {
   theme: "system",
   language: "en",
   timezone: "UTC",
   dateFormat: "MM/DD/YYYY",
   notifications: {
      email: true,
      push: true,
      documentShared: true,
      documentVerified: true,
      securityAlerts: true,
   },
   ai: {
      enabled: true,
      suggestions: true,
      autoSummarize: true,
      autoTag: true,
   },
   display: {
      defaultView: "grid",
      itemsPerPage: 20,
      sidebarCollapsed: false,
   },
};

export const useUserStore = create<UserState>()(
   persist(
      (set) => ({
         // Initial state
         profile: null,
         preferences: null,
         sessions: [],
         securityEvents: [],
         isLoading: false,
         isUpdating: false,
         isUploadingAvatar: false,
         error: null,

         fetchProfile: async () => {
            set({ isLoading: true, error: null });
            try {
               const profile = await profileService.getMe();
               set({ profile, isLoading: false });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to fetch profile",
                  isLoading: false,
               });
            }
         },

         updateProfile: async (data) => {
            set({ isUpdating: true, error: null });
            try {
               const updated = await profileService.updateMe({
                  name: data.name,
                  bio: data.bio,
               });
               set({ profile: updated, isUpdating: false });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to update profile",
                  isUpdating: false,
               });
               throw error;
            }
         },

         uploadAvatar: async (file) => {
            set({ isUploadingAvatar: true, error: null });
            try {
               const updated = await profileService.uploadAvatar(file);
               set({ profile: updated, isUploadingAvatar: false });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to upload avatar",
                  isUploadingAvatar: false,
               });
               throw error;
            }
         },

         deleteAccount: async (password) => {
            set({ isLoading: true, error: null });
            try {
               await profileService.deleteAccount(password);
               set({
                  profile: null,
                  preferences: null,
                  sessions: [],
                  securityEvents: [],
                  isLoading: false,
               });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to delete account",
                  isLoading: false,
               });
               throw error;
            }
         },

         changePassword: async (oldPassword, newPassword) => {
            set({ isUpdating: true, error: null });
            try {
               await profileService.changePassword(oldPassword, newPassword);
               set({ isUpdating: false });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to change password",
                  isUpdating: false,
               });
               throw error;
            }
         },

         fetchSessions: async () => {
            set({ isLoading: true, error: null });
            try {
               const sessions = await profileService.getSessions();
               set({ sessions, isLoading: false });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to fetch sessions",
                  isLoading: false,
               });
            }
         },

         logoutSession: async (sessionId) => {
            set({ isUpdating: true, error: null });
            try {
               await profileService.revokeSession(sessionId);
               set((state) => ({
                  sessions: state.sessions.filter((s) => s.id !== sessionId),
                  isUpdating: false,
               }));
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to logout session",
                  isUpdating: false,
               });
               throw error;
            }
         },

         logoutAllSessions: async () => {
            set({ isUpdating: true, error: null });
            try {
               await profileService.revokeAllSessions();
               set((state) => ({
                  sessions: state.sessions.filter((s) => s.isCurrent),
                  isUpdating: false,
               }));
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to logout all sessions",
                  isUpdating: false,
               });
               throw error;
            }
         },

         fetchSecurityEvents: async () => {
            set({ isLoading: true, error: null });
            try {
               const securityEvents = await profileService.getSecurityEvents();
               set({ securityEvents, isLoading: false });
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to fetch security events",
                  isLoading: false,
               });
            }
         },

         fetchPreferences: async () => {
            set({ isLoading: true, error: null });
            try {
               // Preferences are stored locally (persisted via Zustand).
               // Backend preferences sync not yet implemented.
               set((state) => ({
                  preferences: state.preferences ?? defaultPreferences,
                  isLoading: false,
               }));
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to fetch preferences",
                  isLoading: false,
               });
            }
         },

         updatePreferences: async (prefs) => {
            set({ isUpdating: true, error: null });
            try {
               set((state) => ({
                  preferences: state.preferences
                     ? { ...state.preferences, ...prefs }
                     : { ...defaultPreferences, ...prefs },
                  isUpdating: false,
               }));
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to update preferences",
                  isUpdating: false,
               });
               throw error;
            }
         },

         setTheme: async (theme) => {
            set({ isUpdating: true, error: null });
            try {
               document.documentElement.classList.remove("light", "dark");
               if (theme !== "system") {
                  document.documentElement.classList.add(theme);
               } else {
                  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                     ? "dark"
                     : "light";
                  document.documentElement.classList.add(systemTheme);
               }

               set((state) => ({
                  preferences: state.preferences
                     ? { ...state.preferences, theme }
                     : { ...defaultPreferences, theme },
                  isUpdating: false,
               }));
            } catch (error) {
               set({
                  error: error instanceof Error ? error.message : "Failed to set theme",
                  isUpdating: false,
               });
               throw error;
            }
         },

         clearError: () => set({ error: null }),

         reset: () =>
            set({
               profile: null,
               preferences: null,
               sessions: [],
               securityEvents: [],
               isLoading: false,
               isUpdating: false,
               isUploadingAvatar: false,
               error: null,
            }),
      }),
      {
         name: "user-store",
         partialize: (state) => ({
            preferences: state.preferences,
         }),
      }
   )
);
