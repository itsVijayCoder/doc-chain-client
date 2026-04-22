"use client";

import { RefObject, useEffect, useRef } from "react";
import { useHighlightStore } from "@/lib/stores/highlightStore";

/**
 * Shortens a snippet to something that can usefully locate text in the DOM.
 * Long snippets often contain trailing punctuation or wrapped text that
 * breaks exact matching — the first ~8 meaningful words hit the right spot
 * for a single-occurrence scroll.
 */
function extractKeyPhrase(snippet: string, maxWords = 8): string {
   const words = snippet
      .replace(/[\r\n]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);
   return words.slice(0, maxWords).join(" ").trim();
}

/**
 * Finds the first occurrence of `phrase` inside `container`, scrolls it
 * into view, and temporarily wraps the match in a <mark class="docchain-highlight">.
 * Returns true if found. No-op if the phrase isn't present.
 *
 * DOM-mutating but safe as long as the surrounding React tree doesn't
 * re-render the matched text node during the mark's lifetime — our text
 * viewers render once per query and don't re-render on unrelated state.
 */
function scrollAndMark(container: HTMLElement, phrase: string): boolean {
   if (!phrase) return false;
   const needle = phrase.toLowerCase();
   const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
   );
   let node: Node | null = walker.nextNode();
   while (node) {
      const hay = (node.textContent ?? "").toLowerCase();
      const idx = hay.indexOf(needle);
      if (idx >= 0 && node.textContent) {
         try {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + phrase.length);
            const mark = document.createElement("mark");
            mark.className = "docchain-highlight";
            // Scoped yellow with a soft ring. Works on light + dark.
            mark.style.cssText =
               "background:rgba(253, 224, 71, 0.6);color:inherit;padding:0 2px;border-radius:2px;box-shadow:0 0 0 2px rgba(253, 224, 71, 0.3);";
            range.surroundContents(mark);
            mark.scrollIntoView({ block: "center", behavior: "smooth" });
            // Remove the wrap after a few seconds so the mark doesn't
            // persist across new clicks. Keep the text in place.
            setTimeout(() => {
               const parent = mark.parentNode;
               if (!parent) return;
               while (mark.firstChild)
                  parent.insertBefore(mark.firstChild, mark);
               parent.removeChild(mark);
               parent.normalize();
            }, 3500);
            return true;
         } catch {
            // surroundContents throws if the range crosses element boundaries.
            // Fall back to scrolling the parent into view without a mark.
            const parent = (node as Node).parentElement;
            parent?.scrollIntoView({ block: "center", behavior: "smooth" });
            return true;
         }
      }
      node = walker.nextNode();
   }
   return false;
}

/**
 * Observe the chat store's pendingHighlight and react to requests aimed at
 * this viewer's document. Used by text / markdown / docx viewers.
 *
 * Because the effect keys on `request.id`, re-clicking the same source
 * re-fires it — handy when the user scrolled away and wants to return.
 */
export function useScrollToHighlight(
   containerRef: RefObject<HTMLElement | null>,
   documentId: string | undefined,
   /** Gate that tells the hook the content is rendered and ready to walk. */
   ready: boolean
) {
   const request = useHighlightStore((s) => s.pending);
   const lastProcessedId = useRef<string | null>(null);

   useEffect(() => {
      if (!ready || !request || !documentId) return;
      if (request.documentId !== documentId) return;
      if (request.id === lastProcessedId.current) return;
      if (!request.snippet) {
         lastProcessedId.current = request.id;
         return;
      }
      const container = containerRef.current;
      if (!container) return;

      const phrase = extractKeyPhrase(request.snippet);
      // Defer one frame so newly-rendered children are in the DOM.
      const raf = requestAnimationFrame(() => {
         scrollAndMark(container, phrase);
         lastProcessedId.current = request.id;
      });
      return () => cancelAnimationFrame(raf);
   }, [request, ready, documentId, containerRef]);
}
