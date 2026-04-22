import { create } from "zustand";

// The switchable accent palette. Default is "emerald" (the design's default).
// Drives data-accent on <html>, which swaps --dc-accent + --dc-info + --dc-warn
// via CSS overrides in globals.css. Future admin setting will set this for
// all users via a system-wide config.
export type AccentPalette = "emerald" | "indigo" | "amber";

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

   // Accent palette — applied via data-accent on <html>
   accent: AccentPalette;

   // Command palette (⌘K) open state — shared between header trigger and
   // the CommandPalette overlay so the keyboard shortcut and click both flow
   // through the same state.
   commandPaletteOpen: boolean;

   // Actions
   toggleSidebar: () => void;
   setSidebarOpen: (open: boolean) => void;
   toggleSidebarCollapse: () => void;
   setMobileMenuOpen: (open: boolean) => void;
   openModal: (modalId: string, data?: any) => void;
   closeModal: () => void;
   setTheme: (theme: "light" | "dark" | "system") => void;
   setAccent: (accent: AccentPalette) => void;
   setCommandPaletteOpen: (open: boolean) => void;
   toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
   sidebarOpen: true,
   sidebarCollapsed: false,
   mobileMenuOpen: false,
   activeModal: null,
   modalData: null,
   theme: "system",
   accent: "emerald",
   commandPaletteOpen: false,

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

   setAccent: (accent) => {
      set({ accent });
      // data-accent drives the CSS override in globals.css.
      if (typeof document !== "undefined") {
         document.documentElement.setAttribute("data-accent", accent);
      }
   },

   setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
   toggleCommandPalette: () =>
      set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
