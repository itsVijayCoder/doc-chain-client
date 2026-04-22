"use client";

import { useCallback, useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────────────
// Track recently-opened documents in localStorage for the command bar's
// "Recent" section. No backend needed — the user's own view history is
// inherently per-device and per-browser anyway, and we don't want to
// ship every doc-open event to the server.
// ─────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "docchain:recent_docs";
const MAX_RECENT = 8;

export interface RecentDoc {
   id: string;
   title: string;
   mimeType?: string;
   /** Display hint — "viewed" | "edited". We only write "viewed" today. */
   verb?: "viewed" | "edited";
   /** Unix ms — used for relative-time rendering and sort. */
   openedAt: number;
}

function readStorage(): RecentDoc[] {
   if (typeof window === "undefined") return [];
   try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
         (x): x is RecentDoc =>
            x && typeof x.id === "string" && typeof x.title === "string"
      );
   } catch {
      return [];
   }
}

function writeStorage(items: RecentDoc[]) {
   if (typeof window === "undefined") return;
   try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
   } catch {
      // Quota exceeded or SSR — ignore silently.
   }
}

/** Read-only hook for displaying the list. */
export function useRecentDocuments(): RecentDoc[] {
   const [items, setItems] = useState<RecentDoc[]>([]);

   useEffect(() => {
      setItems(readStorage());
      // Cross-tab sync: if another tab opens a doc, refresh this list.
      const onStorage = (e: StorageEvent) => {
         if (e.key === STORAGE_KEY) setItems(readStorage());
      };
      window.addEventListener("storage", onStorage);
      return () => window.removeEventListener("storage", onStorage);
   }, []);

   return items;
}

/**
 * Push a "recently opened" entry. Dedupes by doc id (promotes to most
 * recent). Keeps at most MAX_RECENT entries.
 */
export function useTrackRecentDocument() {
   return useCallback((doc: Omit<RecentDoc, "openedAt" | "verb"> & { verb?: RecentDoc["verb"] }) => {
      if (typeof window === "undefined") return;
      const current = readStorage();
      const filtered = current.filter((x) => x.id !== doc.id);
      const next: RecentDoc[] = [
         { ...doc, verb: doc.verb ?? "viewed", openedAt: Date.now() },
         ...filtered,
      ].slice(0, MAX_RECENT);
      writeStorage(next);
      // Nudge listeners in this tab (StorageEvent only fires cross-tab).
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
   }, []);
}
