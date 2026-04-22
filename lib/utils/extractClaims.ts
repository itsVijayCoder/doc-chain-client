/**
 * Extract high-signal phrases from an AI answer — currency amounts, dates,
 * percentages, quoted strings, proper-noun sequences, and address-like
 * patterns. Used by the chat UI to turn AI replies into clickable
 * "find in document" buttons for the exact claim.
 *
 * Intentionally regex-only: good enough for the common patterns, no
 * dependency cost. Backend can supersede with AI-extracted claims later
 * for nuanced cases (numeric colloquialisms, named-entity recognition).
 */

export type ClaimKind =
   | "currency"
   | "date"
   | "percent"
   | "quoted"
   | "proper-noun"
   | "address"
   | "number";

export interface ExtractedClaim {
   phrase: string;
   kind: ClaimKind;
}

const MAX_CLAIMS = 6;

// ─────────────────────────────────────────────────────────────────────────
// Patterns
// ─────────────────────────────────────────────────────────────────────────

// Currency: $75,000 | USD 75,000 | 75,000 USD | ₹5,00,000 | Rs. 500
const CURRENCY_RE =
   /(?:USD|EUR|GBP|INR|JPY|CAD|AUD|CHF|CNY|Rs\.?)\s*[$€£¥₹]?\s*[\d,]+(?:\.\d+)?|[$€£¥₹]\s*[\d,]+(?:\.\d+)?(?:\s*(?:USD|EUR|GBP|INR|JPY|CAD|AUD|CHF|CNY))?|\b[\d,]+(?:\.\d+)?\s*(?:USD|EUR|GBP|INR|JPY|CAD|AUD|CHF|CNY)\b/g;

// Dates: "January 1, 2024" | "2024-01-15" | "Q1 2024" | "FY 2024"
const DATE_RE =
   /\b(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:,\s*\d{4})?\b|\b\d{4}-\d{2}-\d{2}\b|\b(?:Q[1-4]|FY)\s*\d{4}\b/g;

const PERCENT_RE = /\b\d+(?:\.\d+)?\s*%/g;

// Quoted text (straight, smart, backtick) 4–120 chars inside
const QUOTED_RE =
   /["“]([^"”]{4,120})["”]|[‘']([^’']{4,120})[’']|`([^`]{4,120})`/g;

// Proper-noun sequences: 2-5 consecutive capitalized words. No mid-phrase
// lowercase words — too noisy (would catch "Both of the Parties").
// Allows internal "&" so "J.P. Morgan & Chase" style stays intact.
const PROPER_NOUN_RE =
   /\b[A-Z][A-Za-z]+(?:\s+(?:[A-Z][A-Za-z]+|&))+\b/g;

// Address-ish: digit(s) + 1-4 capitalized words. Catches "21 Collyer Quay",
// "1600 Pennsylvania Avenue", "10 Downing Street".
const ADDRESS_RE = /\b\d+\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\b/g;

// Unit / suite: "#03-114", "Ste 200", "Apt 5B"
const UNIT_RE = /#\d+[-\d]*\b|\b(?:Ste|Apt|Unit|Room)\.?\s+\w+\b/g;

// Generic "find answer" fallback uses the first sentence OR the full content
// if it's short enough. Used when specific extraction yields nothing.
const MAX_FALLBACK_CHARS = 140;

/**
 * Returns a single "search this whole thing" phrase useful as a last-resort
 * find-in-document action. Prefers the first sentence; falls back to a
 * truncated version of the answer.
 */
export function fallbackAnswerPhrase(content: string): string {
   const trimmed = content.trim();
   if (!trimmed) return "";
   // Take the first sentence if the text is long enough to have one.
   const match = trimmed.match(/^[^.!?]{10,}[.!?]/);
   const candidate = match ? match[0].trim() : trimmed;
   if (candidate.length <= MAX_FALLBACK_CHARS) return candidate;
   return candidate.slice(0, MAX_FALLBACK_CHARS).trimEnd() + "…";
}

// ─────────────────────────────────────────────────────────────────────────
// Extraction
// ─────────────────────────────────────────────────────────────────────────

export function extractAnswerClaims(content: string): ExtractedClaim[] {
   const raw: ExtractedClaim[] = [];
   const pushAll = (re: RegExp, kind: ClaimKind, extract?: (m: RegExpMatchArray) => string | undefined) => {
      for (const m of content.matchAll(re)) {
         const phrase = (extract ? extract(m) : m[0]) ?? "";
         if (phrase.trim()) raw.push({ phrase: phrase.trim(), kind });
      }
   };

   pushAll(CURRENCY_RE, "currency");
   pushAll(DATE_RE, "date");
   pushAll(PERCENT_RE, "percent");
   pushAll(QUOTED_RE, "quoted", (m) => m[1] || m[2] || m[3]);
   pushAll(PROPER_NOUN_RE, "proper-noun");
   pushAll(ADDRESS_RE, "address");
   pushAll(UNIT_RE, "address");

   // De-duplicate. Case-insensitive match keys. Also drop claims that are
   // strict substrings of a kept claim (e.g. "Collyer Quay" if we already
   // have "21 Collyer Quay") — users want the longer context.
   const priority: Record<ClaimKind, number> = {
      currency: 0,
      date: 1,
      quoted: 2,
      address: 3,
      "proper-noun": 4,
      percent: 5,
      number: 6,
   };
   raw.sort((a, b) => {
      const p = priority[a.kind] - priority[b.kind];
      if (p !== 0) return p;
      // Longer phrases first within a kind — more specific, fewer false hits.
      return b.phrase.length - a.phrase.length;
   });

   const kept: ExtractedClaim[] = [];
   const keys = new Set<string>();
   for (const claim of raw) {
      const key = claim.phrase.toLowerCase();
      if (keys.has(key)) continue;
      const isSubstringOfKept = kept.some((k) =>
         k.phrase.toLowerCase().includes(key)
      );
      if (isSubstringOfKept) continue;
      keys.add(key);
      kept.push(claim);
      if (kept.length >= MAX_CLAIMS) break;
   }

   return kept;
}
