import { UserRole } from "@/lib/types";

export const APP_NAME = "DocChain";
export const APP_DESCRIPTION = "Blockchain-Secured Document Management System";

export const ROUTES = {
   // Public
   LOGIN: "/login",
   REGISTER: "/register",
   FORGOT_PASSWORD: "/forgot-password",
   RESET_PASSWORD: "/reset-password",

   // Dashboard
   DASHBOARD: "/dashboard",
   DOCUMENTS: "/documents",
   DOCUMENT_UPLOAD: "/documents/upload",
   DOCUMENT_VIEW: (id: string) => `/documents/${id}`,
   SEARCH: "/search",
   SHARED: "/shared",
   FAVORITES: "/favorites",
   TRASH: "/trash",

   // Settings
   SETTINGS: "/settings",
   SETTINGS_PROFILE: "/settings/profile",
   SETTINGS_SECURITY: "/settings/security",
   SETTINGS_PREFERENCES: "/settings/preferences",

   // Admin
   ADMIN_DASHBOARD: "/admin/dashboard",
   ADMIN_USERS: "/admin/users",
   ADMIN_SECURITY: "/admin/security",
   ADMIN_BLOCKCHAIN: "/admin/blockchain",
   ADMIN_AUDIT_LOGS: "/admin/audit-logs",
} as const;

export const NAVIGATION = {
   main: [
      {
         icon: "Home",
         label: "Dashboard",
         href: ROUTES.DASHBOARD,
         roles: ["all"] as const,
      },
      {
         icon: "FileText",
         label: "My Documents",
         href: ROUTES.DOCUMENTS,
         roles: ["all"] as const,
      },
      {
         icon: "Share2",
         label: "Shared with Me",
         href: ROUTES.SHARED,
         roles: ["all"] as const,
      },
      {
         icon: "Search",
         label: "Search",
         href: ROUTES.SEARCH,
         roles: ["all"] as const,
      },
      {
         icon: "Heart",
         label: "Favorites",
         href: ROUTES.FAVORITES,
         roles: ["all"] as const,
      },
      {
         icon: "Trash2",
         label: "Trash",
         href: ROUTES.TRASH,
         roles: ["all"] as const,
      },
   ],
   admin: [
      {
         icon: "Users",
         label: "Users",
         href: ROUTES.ADMIN_USERS,
         roles: ["admin"] as const,
      },
      {
         icon: "Lock",
         label: "Security",
         href: ROUTES.ADMIN_SECURITY,
         roles: ["admin"] as const,
      },
      {
         icon: "Shield",
         label: "Blockchain",
         href: ROUTES.ADMIN_BLOCKCHAIN,
         roles: ["admin"] as const,
      },
      {
         icon: "BrainCircuit",
         label: "Audit Logs",
         href: ROUTES.ADMIN_AUDIT_LOGS,
         roles: ["admin"] as const,
      },
   ],
   settings: [
      {
         icon: "Settings",
         label: "Settings",
         href: ROUTES.SETTINGS,
         roles: ["all"] as const,
      },
   ],
} as const;

export const PUBLIC_ROUTES = [
   ROUTES.LOGIN,
   ROUTES.REGISTER,
   ROUTES.FORGOT_PASSWORD,
   ROUTES.RESET_PASSWORD,
];

export const ADMIN_ROUTES = [
   ROUTES.ADMIN_DASHBOARD,
   ROUTES.ADMIN_USERS,
   ROUTES.ADMIN_SECURITY,
   ROUTES.ADMIN_BLOCKCHAIN,
   ROUTES.ADMIN_AUDIT_LOGS,
];

export const FILE_UPLOAD = {
   MAX_SIZE: 100 * 1024 * 1024, // 100MB
   ACCEPTED_TYPES: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
         [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
         ".xlsx",
      ],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "text/*": [".txt", ".md", ".csv"],
   },
} as const;

export const PAGINATION = {
   DEFAULT_PAGE_SIZE: 20,
   PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

export const THEME = {
   LIGHT: "light",
   DARK: "dark",
   SYSTEM: "system",
} as const;
