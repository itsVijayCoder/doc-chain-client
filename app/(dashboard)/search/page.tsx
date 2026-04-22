"use client";

import { FC, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
   ArrowRight,
   FileText,
   Loader2,
   Search as SearchIcon,
   Sparkles,
} from "lucide-react";
import { useAiSearch, useKeywordSearch } from "@/lib/hooks/useSearch";
import { useHighlightStore } from "@/lib/stores/highlightStore";
import type { SearchResult } from "@/lib/services/searchService";
import {
   DcButton,
   Panel,
   VerifiedBadge,
} from "@/components/design/primitives";
import { cn } from "@/lib/utils";

type Mode = "keyword" | "ai";

export default function SearchPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const requestHighlight = useHighlightStore((s) => s.request);

   const urlQuery = searchParams?.get("q") ?? "";
   const [mode, setMode] = useState<Mode>("keyword");
   const [query, setQuery] = useState(urlQuery);
   const [submittedAiQuery, setSubmittedAiQuery] = useState("");

   // Keep URL in sync with the debounced query (replace, not push — so the
   // back button doesn't get polluted with every keystroke).
   const lastSyncedRef = useRef(urlQuery);
   useEffect(() => {
      if (query === lastSyncedRef.current) return;
      const id = setTimeout(() => {
         const params = new URLSearchParams(searchParams?.toString() ?? "");
         if (query.trim()) params.set("q", query);
         else params.delete("q");
         const qs = params.toString();
         router.replace(qs ? `/search?${qs}` : "/search");
         lastSyncedRef.current = query;
      }, 300);
      return () => clearTimeout(id);
   }, [query, router, searchParams]);

   const keywordQuery = useKeywordSearch({
      query: mode === "keyword" ? query : "",
      pageSize: 30,
   });
   const aiMutation = useAiSearch();

   const results: SearchResult[] =
      mode === "keyword" ? (keywordQuery.data ?? []) : (aiMutation.data ?? []);

   const isSearching =
      mode === "keyword"
         ? keywordQuery.isFetching && query.trim().length > 0
         : aiMutation.isPending;

   const error = mode === "keyword" ? keywordQuery.error : aiMutation.error;

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      if (mode === "ai") {
         setSubmittedAiQuery(q);
         aiMutation.mutate({ query: q });
      }
      // Keyword mode fires via the debounced useQuery — no explicit submit.
   };

   const handleResultClick = (result: SearchResult) => {
      // Seed the highlight request BEFORE navigation so the viewer picks
      // it up on mount with the correct page + snippet.
      requestHighlight({
         documentId: result.documentId,
         page: result.page,
         snippet: result.snippet,
      });
      router.push(`/documents/${result.documentId}`);
   };

   const hasResults = results.length > 0;
   const hasEverSubmitted =
      mode === "keyword" ? query.trim().length > 0 : submittedAiQuery !== "";
   const showEmptyState = !hasResults && !isSearching && hasEverSubmitted;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)] max-w-[760px] mx-auto'>
         {/* ── Centered page head ────────────────────────────────── */}
         <div className='text-center mb-5 mt-4'>
            <h1
               className='text-[26px] font-semibold tracking-[-0.02em] m-0'
               style={{
                  color: "var(--dc-text)",
                  fontFamily: "var(--dc-font-display)",
               }}
            >
               Search
            </h1>
            <p
               className='text-[13px] mt-1'
               style={{ color: "var(--dc-text-dim)" }}
            >
               Find documents by keyword or ask a natural-language question
               across your library.
            </p>
         </div>

         {/* ── Mode toggle ───────────────────────────────────────── */}
         <div className='flex justify-center mb-3.5'>
            <Segment>
               <SegmentBtn
                  active={mode === "keyword"}
                  onClick={() => setMode("keyword")}
                  icon={<SearchIcon size={12} strokeWidth={1.75} />}
               >
                  Keyword
               </SegmentBtn>
               <SegmentBtn
                  active={mode === "ai"}
                  onClick={() => setMode("ai")}
                  icon={<Sparkles size={12} strokeWidth={1.75} />}
               >
                  AI semantic
               </SegmentBtn>
            </Segment>
         </div>

         {/* ── Large search form ────────────────────────────────── */}
         <form
            onSubmit={handleSubmit}
            className='flex items-center gap-2 mb-4'
         >
            <div
               className='flex items-center gap-2.5 flex-1 h-11 px-3.5 rounded-md transition-all'
               style={{
                  background: "var(--dc-surface)",
                  border: "1px solid var(--dc-border)",
               }}
               onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--dc-accent-border)";
                  e.currentTarget.style.boxShadow =
                     "0 0 0 3px var(--dc-accent-soft)";
               }}
               onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--dc-border)";
                  e.currentTarget.style.boxShadow = "none";
               }}
            >
               <SearchIcon
                  size={16}
                  strokeWidth={1.75}
                  style={{ color: "var(--dc-text-dim)" }}
               />
               <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                     mode === "keyword"
                        ? "Search by keyword or phrase…"
                        : "Ask a question about your documents…"
                  }
                  autoFocus
                  className='flex-1 bg-transparent border-none outline-none text-[14px] min-w-0'
                  style={{ color: "var(--dc-text)" }}
               />
               {isSearching && (
                  <Loader2
                     size={14}
                     className='animate-spin'
                     style={{ color: "var(--dc-text-dim)" }}
                  />
               )}
            </div>
            {mode === "ai" && (
               <DcButton
                  variant='primary'
                  disabled={!query.trim() || isSearching}
                  icon={
                     aiMutation.isPending ? (
                        <Loader2 size={14} className='animate-spin' />
                     ) : (
                        <Sparkles size={14} strokeWidth={2} />
                     )
                  }
                  onClick={handleSubmit as unknown as () => void}
               >
                  {aiMutation.isPending ? "Thinking" : "Ask AI"}
               </DcButton>
            )}
         </form>

         {/* ── Error banner ─────────────────────────────────────── */}
         {error && (
            <div
               className='rounded-md p-4 text-[13px] mb-4'
               style={{
                  background: "var(--dc-danger-soft)",
                  border: "1px solid var(--dc-danger-border)",
                  color: "var(--dc-danger)",
               }}
            >
               <p className='font-medium'>Search failed</p>
               <p className='opacity-80'>
                  {error?.message ?? "Please try again"}
               </p>
            </div>
         )}

         {/* ── Empty state (submitted but no results) ─────────── */}
         {showEmptyState && (
            <div
               className='text-center py-14 rounded-xl'
               style={{
                  background: "var(--dc-surface)",
                  border: "1px solid var(--dc-border)",
               }}
            >
               <p
                  className='text-[14px] font-medium'
                  style={{ color: "var(--dc-text)" }}
               >
                  No results
               </p>
               <p
                  className='text-[12px] mt-1 max-w-sm mx-auto'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {mode === "keyword"
                     ? "No documents matched your keyword. Try broader terms or switch to AI semantic search."
                     : "AI couldn't find a strong match. Try rephrasing or switch to keyword search."}
               </p>
            </div>
         )}

         {/* ── Results ─────────────────────────────────────────── */}
         {hasResults && (
            <ResultsPanel
               results={results}
               mode={mode}
               query={mode === "keyword" ? query : submittedAiQuery}
               onResultClick={handleResultClick}
            />
         )}

         {/* ── Intro help panel (before any query) ─────────────── */}
         {!hasEverSubmitted && !hasResults && <EmptyIntro mode={mode} />}
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Segment control — matches .tweak-segment from the design
// ─────────────────────────────────────────────────────────────────────
const Segment: FC<{ children: React.ReactNode }> = ({ children }) => (
   <div
      className='inline-flex rounded-md p-[3px] gap-[2px]'
      style={{
         background: "var(--dc-surface-2)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {children}
   </div>
);

const SegmentBtn: FC<{
   active?: boolean;
   onClick?: () => void;
   icon?: React.ReactNode;
   children: React.ReactNode;
}> = ({ active, onClick, icon, children }) => (
   <button
      type='button'
      onClick={onClick}
      className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-medium transition-colors'
      style={
         active
            ? {
                 background: "var(--dc-surface)",
                 color: "var(--dc-text)",
                 boxShadow: "var(--dc-shadow-sm)",
              }
            : { background: "transparent", color: "var(--dc-text-dim)" }
      }
   >
      {icon}
      {children}
   </button>
);

// ─────────────────────────────────────────────────────────────────────
// Results list — uses Panel shell + custom rows to show snippet/score
// ─────────────────────────────────────────────────────────────────────
interface ResultsPanelProps {
   results: SearchResult[];
   mode: Mode;
   query: string;
   onResultClick: (r: SearchResult) => void;
}

const ResultsPanel: FC<ResultsPanelProps> = ({
   results,
   mode,
   query,
   onResultClick,
}) => (
   <Panel
      title={
         <>
            {results.length} result{results.length === 1 ? "" : "s"}
            {mode === "ai" && (
               <span
                  className='ml-2 text-[11px] font-normal'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  · ranked by semantic relevance
               </span>
            )}
         </>
      }
   >
      {results.map((r, i) => (
         <SearchResultRow
            key={`${r.documentId}-${r.chunkIndex ?? i}`}
            result={r}
            highlight={query}
            showScore={mode === "ai"}
            onClick={() => onResultClick(r)}
         />
      ))}
   </Panel>
);

// ─── A single result row (clickable, with snippet + match highlight) ──
const SearchResultRow: FC<{
   result: SearchResult;
   highlight: string;
   showScore: boolean;
   onClick: () => void;
}> = ({ result, highlight, showScore, onClick }) => {
   const snippet = useMemo(
      () => highlightMatches(result.snippet, highlight),
      [result.snippet, highlight]
   );
   const scorePct = Math.round(result.relevanceScore * 100);

   return (
      <button
         type='button'
         onClick={onClick}
         className={cn(
            "group w-full text-left flex items-start gap-3 px-3 py-3 rounded-md transition-colors cursor-pointer"
         )}
         onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--dc-surface-2)")
         }
         onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
         <div
            className='w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
               color: "var(--dc-text-muted)",
            }}
         >
            <FileText size={14} strokeWidth={1.75} />
         </div>

         <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap mb-0.5'>
               <h3
                  className='text-[13.5px] font-semibold truncate tracking-[-0.005em]'
                  style={{ color: "var(--dc-text)" }}
                  title={result.title}
               >
                  {result.title}
               </h3>
               <span
                  className='text-[10.5px] px-1.5 py-[1px] rounded font-medium whitespace-nowrap'
                  style={{
                     background: "var(--dc-surface-2)",
                     color: "var(--dc-text-muted)",
                     border: "1px solid var(--dc-border)",
                     fontFamily: "var(--dc-font-mono)",
                  }}
               >
                  {mimeShort(result.mimeType)}
               </span>
               {showScore && (
                  <span
                     className='text-[10.5px] px-1.5 py-[1px] rounded font-medium tabular-nums whitespace-nowrap'
                     style={{
                        background: "var(--dc-accent-soft)",
                        color: "var(--dc-accent)",
                        border: "1px solid var(--dc-accent-border)",
                     }}
                     title={`Relevance: ${result.relevanceScore.toFixed(3)}`}
                  >
                     {scorePct}% match
                  </span>
               )}
               {typeof result.page === "number" && result.page > 0 && (
                  <span
                     className='text-[10.5px] tabular-nums'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     p.{result.page}
                  </span>
               )}
               <VerifiedBadge status='verified' />
            </div>
            <p
               className='text-[12.5px] leading-relaxed line-clamp-3'
               style={{ color: "var(--dc-text-muted)" }}
               dangerouslySetInnerHTML={{ __html: snippet }}
            />
         </div>

         <ArrowRight
            size={14}
            strokeWidth={1.75}
            className='shrink-0 mt-2 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all'
            style={{ color: "var(--dc-text-muted)" }}
         />
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Intro help panel (visible before first query submission)
// ─────────────────────────────────────────────────────────────────────
const EmptyIntro: FC<{ mode: Mode }> = ({ mode }) => (
   <Panel>
      <div className='flex items-start gap-3 p-3'>
         <div
            className='w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
               color:
                  mode === "ai" ? "var(--dc-accent)" : "var(--dc-text-muted)",
            }}
         >
            {mode === "keyword" ? (
               <SearchIcon size={14} strokeWidth={1.75} />
            ) : (
               <Sparkles size={14} strokeWidth={1.75} />
            )}
         </div>
         <div className='min-w-0'>
            <div
               className='text-[13px] font-semibold mb-1'
               style={{ color: "var(--dc-text)" }}
            >
               {mode === "keyword" ? "Keyword search" : "AI semantic search"}
            </div>
            <p
               className='text-[12.5px] leading-relaxed'
               style={{ color: "var(--dc-text-muted)" }}
            >
               {mode === "keyword"
                  ? "Matches exact words in document text. Fast; good for finding known phrases like contract numbers or names."
                  : "Understands meaning, not just words. Ask questions like “What are our termination clauses?” and AI will surface conceptually related passages."}
            </p>
            <p
               className='text-[11.5px] mt-2'
               style={{ color: "var(--dc-text-dim)" }}
            >
               Clicking a result opens the document and scrolls to the
               matching snippet automatically.
            </p>
         </div>
      </div>
   </Panel>
);

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

// Short, human label for a full mimeType string ("application/pdf" → "PDF")
function mimeShort(mimeType: string): string {
   if (!mimeType) return "FILE";
   if (mimeType === "application/pdf") return "PDF";
   if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") return "DOCX";
   if (mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel") return "XLSX";
   if (mimeType.includes("presentationml") || mimeType === "application/vnd.ms-powerpoint") return "PPTX";
   if (mimeType === "text/csv") return "CSV";
   if (mimeType === "text/markdown") return "MD";
   if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase().slice(0, 4);
   if (mimeType.startsWith("video/")) return "VIDEO";
   if (mimeType.startsWith("audio/")) return "AUDIO";
   if (mimeType.startsWith("text/")) return "TXT";
   // Fallback — trim to the subtype
   const sub = mimeType.split("/")[1] ?? mimeType;
   return sub.slice(0, 6).toUpperCase();
}

function escapeHtml(s: string): string {
   return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
}

function escapeRegExp(s: string): string {
   return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Wraps matching words in <mark>. HTML is escaped first so the snippet
// can't inject rendered markup. Longer words are matched first to avoid
// partial-word overlap.
function highlightMatches(snippet: string, query: string): string {
   const escaped = escapeHtml(snippet);
   const words = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .sort((a, b) => b.length - a.length);
   if (words.length === 0) return escaped;
   const pattern = new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi");
   return escaped.replace(
      pattern,
      '<mark style="background: var(--dc-warn-soft); color: var(--dc-warn); padding: 0 2px; border-radius: 2px;">$1</mark>'
   );
}
