import { create } from "zustand";

/**
 * Cross-page "please highlight this phrase when the viewer is ready" event bus.
 * Originally lived in the chat store because chat was the only producer; now
 * search results also push to it. Decoupled to avoid unrelated stores
 * depending on chat state.
 */
export interface HighlightRequest {
   /** Unique per click so consumers can re-fire when the same snippet is re-requested. */
   id: string;
   documentId: string;
   page?: number;
   snippet?: string;
}

interface HighlightState {
   pending: HighlightRequest | null;
   request: (req: Omit<HighlightRequest, "id">) => void;
   clear: () => void;
}

export const useHighlightStore = create<HighlightState>((set) => ({
   pending: null,
   request: (req) => {
      // DIAGNOSTIC — verifies what value the frontend actually receives
      // for the page number. Paste the console output when filing the
      // off-by-one bug so we can confirm whether the backend is sending
      // the claimed value. Remove once the issue is settled.
      if (typeof console !== "undefined") {
         console.log("[highlightStore] request()", {
            documentId: req.documentId,
            page: req.page,
            snippet: req.snippet?.slice(0, 80),
         });
      }
      set({
         pending: {
            ...req,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
         },
      });
   },
   clear: () => set({ pending: null }),
}));
