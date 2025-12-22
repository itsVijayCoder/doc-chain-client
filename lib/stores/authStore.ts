import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, LoginCredentials, RegisterData } from "@/lib/types";
import { authService } from "@/lib/services/authService";

interface AuthState {
   user: User | null;
   isAuthenticated: boolean;
   isLoading: boolean;
   error: string | null;

   // Actions
   login: (credentials: LoginCredentials) => Promise<void>;
   register: (data: RegisterData) => Promise<void>;
   logout: () => void;
   forgotPassword: (email: string) => Promise<void>;
   resetPassword: (token: string, newPassword: string) => Promise<void>;
   checkAuth: () => Promise<void>;
   clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
   persist(
      (set, get) => ({
         user: null,
         isAuthenticated: false,
         isLoading: false,
         error: null,

         login: async (credentials) => {
            set({ isLoading: true, error: null });
            try {
               const { user, token } = await authService.login(credentials);

               // Store token
               localStorage.setItem("token", token);

               set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
               });
            } catch (error: any) {
               set({
                  error: error?.message || "Login failed",
                  isLoading: false,
               });
               throw error;
            }
         },

         register: async (data) => {
            set({ isLoading: true, error: null });
            try {
               const { user, token } = await authService.register(data);

               // Store token
               localStorage.setItem("token", token);

               set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
               });
            } catch (error: any) {
               set({
                  error: error?.message || "Registration failed",
                  isLoading: false,
               });
               throw error;
            }
         },

         logout: async () => {
            try {
               await authService.logout();
            } catch (error) {
               // Ignore logout errors
            }
            localStorage.removeItem("token");
            set({
               user: null,
               isAuthenticated: false,
               error: null,
            });
         },

         forgotPassword: async (email) => {
            set({ isLoading: true, error: null });
            try {
               await authService.forgotPassword(email);
               set({ isLoading: false });
            } catch (error: any) {
               set({
                  error: error?.message || "Failed to send reset email",
                  isLoading: false,
               });
               throw error;
            }
         },

         resetPassword: async (token, newPassword) => {
            set({ isLoading: true, error: null });
            try {
               await authService.resetPassword(token, newPassword);
               set({ isLoading: false });
            } catch (error: any) {
               set({
                  error: error?.message || "Failed to reset password",
                  isLoading: false,
               });
               throw error;
            }
         },

         checkAuth: async () => {
            const token = localStorage.getItem("token");
            if (!token) {
               set({ isAuthenticated: false, user: null });
               return;
            }

            set({ isLoading: true });
            try {
               const user = await authService.me();

               set({
                  user,
                  isAuthenticated: true,
                  isLoading: false,
               });
            } catch (error) {
               localStorage.removeItem("token");
               set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
               });
            }
         },

         clearError: () => set({ error: null }),
      }),
      {
         name: "auth-storage",
         partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
         }),
      }
   )
);
