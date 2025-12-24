import { apiClient } from "./api";
import { LoginCredentials, RegisterData, User } from "@/lib/types";

// Mock users for testing
const MOCK_USERS = {
   admin: {
      email: "admin@docchain.com",
      password: "admin123",
      user: {
         id: "admin-001",
         email: "admin@docchain.com",
         name: "Admin User",
         role: "admin" as const,
         avatar: undefined,
         createdAt: new Date("2024-01-01"),
         updatedAt: new Date(),
         mfaEnabled: false,
         isActive: true,
      },
      token: "mock-admin-token-" + Date.now(),
   },
   standard: {
      email: "user@docchain.com",
      password: "user123",
      user: {
         id: "user-001",
         email: "user@docchain.com",
         name: "Standard User",
         role: "viewer" as const,
         avatar: undefined,
         createdAt: new Date("2024-01-15"),
         updatedAt: new Date(),
         mfaEnabled: false,
         isActive: true,
      },
      token: "mock-user-token-" + Date.now(),
   },
};

// Check if we're in development mode or demo mode and should use mock authentication
const shouldUseMockAuth = () => {
   // Check both client and server side
   if (typeof window !== "undefined") {
      // Client side - check environment variable or default to true in development
      return (
         process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true" ||
         process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
         (process.env.NEXT_PUBLIC_USE_MOCK_AUTH !== "false" &&
            process.env.NODE_ENV === "development")
      );
   }
   // Server side
   return (
      process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true" ||
      process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
      process.env.NODE_ENV === "development"
   );
};

export const authService = {
   login: async (credentials: LoginCredentials) => {
      // Mock authentication for testing
      if (shouldUseMockAuth()) {
         await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate network delay

         const mockUser = Object.values(MOCK_USERS).find(
            (u) =>
               u.email === credentials.email &&
               u.password === credentials.password
         );

         if (mockUser) {
            return {
               user: mockUser.user,
               token: mockUser.token,
            };
         }

         throw {
            message: "Invalid credentials",
            code: "AUTH_FAILED",
            statusCode: 401,
         };
      }

      return apiClient.post<{ user: User; token: string }>(
         "/auth/login",
         credentials
      );
   },

   register: async (data: RegisterData) => {
      return apiClient.post<{ user: User; token: string }>(
         "/auth/register",
         data
      );
   },

   logout: async () => {
      return apiClient.post("/auth/logout");
   },

   forgotPassword: async (email: string) => {
      return apiClient.post("/auth/forgot-password", { email });
   },

   resetPassword: async (token: string, newPassword: string) => {
      return apiClient.post("/auth/reset-password", { token, newPassword });
   },

   me: async () => {
      // Mock authentication for testing
      if (shouldUseMockAuth()) {
         await new Promise((resolve) => setTimeout(resolve, 300));

         const token = localStorage.getItem("token");
         if (!token || !token.startsWith("mock-")) {
            throw {
               message: "Unauthorized",
               code: "AUTH_REQUIRED",
               statusCode: 401,
            };
         }

         // Determine which user based on token
         const isAdmin = token.includes("admin");
         const mockUser = isAdmin ? MOCK_USERS.admin : MOCK_USERS.standard;

         return mockUser.user;
      }

      return apiClient.get<User>("/auth/me");
   },

   refreshToken: async () => {
      return apiClient.post<{ token: string }>("/auth/refresh");
   },
};
