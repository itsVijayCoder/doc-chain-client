/**
 * Helpers for searching + drawing highlight overlays on the pdf.js text
 * layer. react-pdf v10 doesn't expose pdf.js's findController, so we walk
 * the rendered text layer DOM. The text layer is many <span> elements —
 * phrases often span multiple nodes. We build a Range across nodes, read
 * its getClientRects(), and render absolute-positioned overlay divs.
 */

export interface OverlayRect {
   left: number;
   top: number;
   width: number;
   height: number;
}

interface NodeOffset {
   node: Text;
   /** Offset in the NORMALIZED concatenated text string. */
   start: number;
   /** Length in the normalized concatenated text string. */
   normLength: number;
}

/**
 * Normalize whitespace inside a string — collapses any run of whitespace
 * (tabs, newlines, non-breaking spaces) into a single regular space.
 * Critical for matching backend-extracted snippets against pdf.js's text
 * layer output, which often has slightly different whitespace / line breaks.
 */
function normalizeWs(s: string): string {
   return s.replace(/\s+/g, " ");
}

function collectTextNodes(container: HTMLElement): {
   normalizedText: string;
   map: NodeOffset[];
} {
   let normalizedText = "";
   const map: NodeOffset[] = [];
   const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      null
   );
   let node: Node | null = walker.nextNode();
   while (node) {
      const raw = node.textContent ?? "";
      if (raw.length > 0) {
         const norm = normalizeWs(raw);
         map.push({
            node: node as Text,
            start: normalizedText.length,
            normLength: norm.length,
         });
         normalizedText += norm;
      }
      node = walker.nextNode();
   }
   return { normalizedText, map };
}

/**
 * Find the text node that contains a given normalized-text offset, and
 * return both the node and its RAW (original) offset inside that node.
 * Normalization can collapse whitespace, so we walk the raw text counting
 * normalized positions to get an accurate reverse-mapping.
 */
function resolveRawOffset(
   map: NodeOffset[],
   normalizedOffset: number
): { node: Text; rawOffset: number } | null {
   for (const entry of map) {
      const normEnd = entry.start + entry.normLength;
      if (normalizedOffset >= entry.start && normalizedOffset <= normEnd) {
         const raw = entry.node.textContent ?? "";
         const targetInNode = normalizedOffset - entry.start;
         let rawIdx = 0;
         let normIdx = 0;
         let lastWasWs = false;
         while (rawIdx < raw.length && normIdx < targetInNode) {
            const isWs = /\s/.test(raw[rawIdx]);
            if (isWs) {
               if (!lastWasWs) {
                  normIdx += 1;
               }
               lastWasWs = true;
            } else {
               normIdx += 1;
               lastWasWs = false;
            }
            rawIdx += 1;
         }
         return { node: entry.node, rawOffset: rawIdx };
      }
   }
   return null;
}

/**
 * Build a Range for the first occurrence of `phrase` (case-insensitive,
 * whitespace-normalized) inside `container`, across however many child
 * nodes it spans. Returns null if not found.
 */
export function findPhraseRange(
   container: HTMLElement,
   phrase: string
): Range | null {
   if (!phrase) return null;
   const normPhrase = normalizeWs(phrase).toLowerCase();
   if (normPhrase.length === 0) return null;

   const { normalizedText, map } = collectTextNodes(container);
   if (map.length === 0) return null;

   const idx = normalizedText.toLowerCase().indexOf(normPhrase);
   if (idx < 0) return null;
   const endIdx = idx + normPhrase.length;

   const startLoc = resolveRawOffset(map, idx);
   const endLoc = resolveRawOffset(map, endIdx);
   if (!startLoc || !endLoc) return null;

   try {
      const range = document.createRange();
      range.setStart(startLoc.node, startLoc.rawOffset);
      range.setEnd(endLoc.node, endLoc.rawOffset);
      return range;
   } catch {
      return null;
   }
}

/**
 * Merge horizontally adjacent rects that sit on the same line into a single
 * wider rect. `range.getClientRects()` returns one DOMRect per text span in
 * the PDF text layer — a phrase across N spans produces N rects on the same
 * row. Rendering each as its own 40%-opacity div compounds their opacity and
 * covers the text. One merged rect per line stays legible.
 *
 * Two rects are on the same line when their vertical overlap exceeds half
 * the average height (tolerates minor baseline differences between spans).
 * A small horizontal gap (≤4 px) is bridged so word-boundary whitespace
 * between adjacent spans doesn't break the merge.
 */
function mergeLineRects(rects: OverlayRect[]): OverlayRect[] {
   if (rects.length === 0) return [];

   const sorted = [...rects].sort(
      (a, b) => a.top - b.top || a.left - b.left
   );

   const merged: OverlayRect[] = [];
   let cur = { ...sorted[0] };

   for (let i = 1; i < sorted.length; i++) {
      const r = sorted[i];
      const avgH = (cur.height + r.height) / 2;
      const overlapY =
         Math.min(cur.top + cur.height, r.top + r.height) -
         Math.max(cur.top, r.top);

      const sameLine = overlapY > avgH * 0.4;
      const adjacent = r.left <= cur.left + cur.width + 4;

      if (sameLine && adjacent) {
         const right = Math.max(cur.left + cur.width, r.left + r.width);
         const top = Math.min(cur.top, r.top);
         const bottom = Math.max(cur.top + cur.height, r.top + r.height);
         cur = { left: Math.min(cur.left, r.left), top, width: right - Math.min(cur.left, r.left), height: bottom - top };
      } else {
         merged.push(cur);
         cur = { ...r };
      }
   }
   merged.push(cur);
   return merged;
}

/**
 * Convert a Range's client rects to positions relative to `container`.
 * Accounts for the container's scroll offset so overlay divs line up with
 * the underlying text even if the container has been scrolled.
 * Merges per-span rects into per-line rects to prevent opacity stacking.
 */
export function rangeRectsRelativeTo(
   range: Range,
   container: HTMLElement
): OverlayRect[] {
   const containerRect = container.getBoundingClientRect();
   const raw = Array.from(range.getClientRects()).filter(
      (r) => r.width > 0 && r.height > 0
   );
   const relative = raw.map((r) => ({
      left: r.left - containerRect.left + container.scrollLeft,
      top: r.top - containerRect.top + container.scrollTop,
      width: r.width,
      height: r.height,
   }));
   return mergeLineRects(relative);
}

/**
 * Progressive phrase fallbacks. The caller iterates and stops at the first
 * match, so earlier candidates win. Strategy:
 *
 *   1. Longest prefix first (full anchor sentence, then trim one word at
 *      a time). Succeeds when the anchor matches pdf.js's extracted text
 *      cleanly — most of the time for digital PDFs.
 *   2. Suffix slices (last 10 … 2 words). Catches cases where the end of
 *      the anchor matches cleanly but mid-phrase text is garbled — typical
 *      for sentences with numbers, hyphenated words, or currency symbols
 *      that pdf.js tokenizes inconsistently.
 *   3. Minimum length 2 words — single-word matches highlight too broadly
 *      and often land on the wrong occurrence.
 */
export function phraseCandidates(snippet: string): string[] {
   const words = snippet
      .replace(/[\r\n]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0);
   const seen = new Set<string>();
   const out: string[] = [];

   const push = (phrase: string) => {
      const trimmed = phrase.trim();
      if (trimmed.length >= 2 && !seen.has(trimmed)) {
         seen.add(trimmed);
         out.push(trimmed);
      }
   };

   // Longest prefix first, down to 2 words. Every length is tried so we
   // find the longest matching prefix — if the full 19-word sentence matches
   // we use it; if only the first 12 match, we use those 12. Searching 19
   // indexOf calls against a 5 KB text layer is fractions of a millisecond.
   for (let n = words.length; n >= 2; n--) {
      push(words.slice(0, n).join(" "));
   }

   // Suffix slices — last N words. Only go up to 10 to avoid overlap with
   // long prefixes on short anchors; dedup drops actual duplicates anyway.
   const maxSuffix = Math.min(words.length - 1, 10);
   for (let n = maxSuffix; n >= 2; n--) {
      push(words.slice(-n).join(" "));
   }

   return out;
}

/** Back-compat single-phrase helper used elsewhere. */
export function extractKeyPhrase(snippet: string, maxWords = 6): string {
   void maxWords;
   return phraseCandidates(snippet)[0] ?? snippet.slice(0, 80).trim();
}
