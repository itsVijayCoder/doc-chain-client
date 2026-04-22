import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * "global" for app-wide chat that has no document scope; otherwise the
 * document UUID the chat is scoped to. Used as the key in the per-scope
 * active-session map so each document remembers its own conversation.
 */
export type ChatScopeKey = string; // "global" | documentId

interface ChatState {
   isOpen: boolean;
   /** scopeKey → active sessionId. Persisted so conversations resume. */
   activeSessions: Record<ChatScopeKey, string>;

   open: () => void;
   close: () => void;
   toggle: () => void;
   setActiveSession: (scope: ChatScopeKey, sessionId: string) => void;
   clearActiveSession: (scope: ChatScopeKey) => void;
}

export const useChatStore = create<ChatState>()(
   persist(
      (set) => ({
         isOpen: false,
         activeSessions: {},

         open: () => set({ isOpen: true }),
         close: () => set({ isOpen: false }),
         toggle: () => set((s) => ({ isOpen: !s.isOpen })),

         setActiveSession: (scope, sessionId) =>
            set((s) => ({
               activeSessions: { ...s.activeSessions, [scope]: sessionId },
            })),

         clearActiveSession: (scope) =>
            set((s) => {
               const next = { ...s.activeSessions };
               delete next[scope];
               return { activeSessions: next };
            }),
      }),
      {
         name: "docchain.chat",
         // Only persist session map — the open flag is ephemeral UI state.
         partialize: (s) => ({ activeSessions: s.activeSessions }),
      }
   )
);
