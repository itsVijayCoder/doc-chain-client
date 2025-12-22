import { create } from "zustand";

interface UIState {
   // Sidebar
   sidebarOpen: boolean;
   sidebarCollapsed: boolean;

   // Mobile Menu
   mobileMenuOpen: boolean;

   // Modals
   activeModal: string | null;
   modalData: any;

   // Theme
   theme: "light" | "dark" | "system";

   // Actions
   toggleSidebar: () => void;
   setSidebarOpen: (open: boolean) => void;
   toggleSidebarCollapse: () => void;
   setMobileMenuOpen: (open: boolean) => void;
   openModal: (modalId: string, data?: any) => void;
   closeModal: () => void;
   setTheme: (theme: "light" | "dark" | "system") => void;
}

export const useUIStore = create<UIState>((set) => ({
   sidebarOpen: true,
   sidebarCollapsed: false,
   mobileMenuOpen: false,
   activeModal: null,
   modalData: null,
   theme: "system",

   toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

   setSidebarOpen: (open) => set({ sidebarOpen: open }),

   toggleSidebarCollapse: () =>
      set((state) => ({
         sidebarCollapsed: !state.sidebarCollapsed,
      })),

   setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

   openModal: (modalId, data) =>
      set({
         activeModal: modalId,
         modalData: data,
      }),

   closeModal: () =>
      set({
         activeModal: null,
         modalData: null,
      }),

   setTheme: (theme) => {
      set({ theme });

      // Apply theme to document
      const root = document.documentElement;
      if (theme === "dark") {
         root.classList.add("dark");
      } else if (theme === "light") {
         root.classList.remove("dark");
      } else {
         // System theme
         const isDark = window.matchMedia(
            "(prefers-color-scheme: dark)"
         ).matches;
         if (isDark) {
            root.classList.add("dark");
         } else {
            root.classList.remove("dark");
         }
      }
   },
}));
