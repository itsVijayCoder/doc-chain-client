"use client";

import { FC, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
   ArrowRight,
   File,
   Loader2,
   Search as SearchIcon,
   Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
   useAiSearch,
   useKeywordSearch,
} from "@/lib/hooks/useSearch";
import { useHighlightStore } from "@/lib/stores/highlightStore";
import type { SearchResult } from "@/lib/services/searchService";
import { cn } from "@/lib/utils";

type Mode = "keyword" | "ai";

const SearchPage: FC = () => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const requestHighlight = useHighlightStore((s) => s.request);

   // Seed from ?q= so navigating here from the global top-bar Search
   // (or a refresh of the page) lands with the query prefilled and results
   // already loading — no "type it again" frustration.
   const urlQuery = searchParams?.get("q") ?? "";

   const [mode, setMode] = useState<Mode>("keyword");
   const [query, setQuery] = useState(urlQuery);
   const [submittedAiQuery, setSubmittedAiQuery] = useState("");

   // Keep the URL in sync with the current query (replace, not push — so
   // the back button doesn't get polluted with every keystroke).
   const lastSyncedRef = useRef(urlQuery);
   useEffect(() => {
      if (query === lastSyncedRef.current) return;
      const id = setTimeout(() => {
         const params = new URLSearchParams(searchParams?.toString() ?? "");
         if (query.trim()) {
            params.set("q", query);
         } else {
            params.delete("q");
         }
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

   // Unified results view regardless of mode.
   const results: SearchResult[] =
      mode === "keyword"
         ? keywordQuery.data ?? []
         : aiMutation.data ?? [];

   const isSearching =
      mode === "keyword"
         ? keywordQuery.isFetching && query.trim().length > 0
         : aiMutation.isPending;

   const error =
      mode === "keyword" ? keywordQuery.error : aiMutation.error;

   const handleSubmit = (e: FormEvent) => {
      e.preventDefault();
      const q = query.trim();
      if (!q) return;
      if (mode === "ai") {
         setSubmittedAiQuery(q);
         aiMutation.mutate({ query: q });
      }
      // Keyword mode: the useQuery is already reacting to the debounced
      // `query` state — no explicit submit needed, but Enter also works
      // because it's a form.
   };

   const handleResultClick = (result: SearchResult) => {
      // Push a highlight request BEFORE navigation so the viewer picks it
      // up on mount. The id in the store changes with each click, letting
      // the viewer re-trigger if the user returns to the same doc.
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
      <div className='container mx-auto p-6 max-w-4xl space-y-6'>
         <div>
            <h1 className='text-3xl font-bold tracking-tight'>Search</h1>
            <p className='text-sm text-muted-foreground mt-1'>
               Find documents by keyword or ask a natural-language question
               across your library.
            </p>
         </div>

         {/* Mode toggle */}
         <ModeToggle mode={mode} onChange={setMode} />

         {/* Search form */}
         <form onSubmit={handleSubmit} className='flex items-center gap-2'>
            <div className='flex-1 relative'>
               <SearchIcon
                  size={16}
                  className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none'
               />
               <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                     mode === "keyword"
                        ? "Search by keyword or phrase…"
                        : "Ask a question about your documents…"
                  }
                  className='pl-9'
                  autoFocus
               />
               {isSearching && (
                  <Loader2
                     size={14}
                     className='absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground'
                  />
               )}
            </div>
            {mode === "ai" && (
               <Button type='submit' disabled={!query.trim() || isSearching}>
                  {aiMutation.isPending ? (
                     <>
                        <Loader2
                           size={14}
                           className='mr-2 animate-spin'
                        />
                        Thinking
                     </>
                  ) : (
                     <>
                        <Sparkles size={14} className='mr-2' />
                        Ask AI
                     </>
                  )}
               </Button>
            )}
         </form>

         {/* Results */}
         {error && (
            <div className='rounded-md border border-(--error)/40 bg-(--error)/5 p-4 text-sm'>
               <p className='font-medium'>Search failed</p>
               <p className='text-muted-foreground'>
                  {error?.message ?? "Please try again"}
               </p>
            </div>
         )}

         {showEmptyState && (
            <div className='text-center py-16 text-muted-foreground'>
               <p className='font-medium'>No results</p>
               <p className='text-sm mt-1'>
                  {mode === "keyword"
                     ? "No documents matched your keyword. Try broader terms or switch to AI search for semantic matching."
                     : "AI couldn't find a strong match. Try rephrasing or switch to keyword search."}
               </p>
            </div>
         )}

         {hasResults && (
            <ResultsList
               results={results}
               mode={mode}
               query={mode === "keyword" ? query : submittedAiQuery}
               onResultClick={handleResultClick}
            />
         )}

         {!hasEverSubmitted && !hasResults && (
            <EmptyIntro mode={mode} />
         )}
      </div>
   );
};

// ─────────────────────────────────────────────────────────────────────────

const ModeToggle: FC<{ mode: Mode; onChange: (m: Mode) => void }> = ({
   mode,
   onChange,
}) => (
   <div className='inline-flex border rounded-lg p-1 bg-muted/30'>
      <button
         type='button'
         onClick={() => onChange("keyword")}
         className={cn(
            "px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-colors",
            mode === "keyword"
               ? "bg-background shadow-sm font-medium"
               : "text-muted-foreground hover:text-foreground"
         )}
      >
         <SearchIcon size={12} />
         Keyword
      </button>
      <button
         type='button'
         onClick={() => onChange("ai")}
         className={cn(
            "px-3 py-1.5 text-xs rounded-md flex items-center gap-1.5 transition-colors",
            mode === "ai"
               ? "bg-background shadow-sm font-medium"
               : "text-muted-foreground hover:text-foreground"
         )}
      >
         <Sparkles size={12} />
         AI semantic
      </button>
   </div>
);

// ─────────────────────────────────────────────────────────────────────────

interface ResultsListProps {
   results: SearchResult[];
   mode: Mode;
   query: string;
   onResultClick: (r: SearchResult) => void;
}

const ResultsList: FC<ResultsListProps> = ({
   results,
   mode,
   query,
   onResultClick,
}) => (
   <div className='space-y-3'>
      <p className='text-xs text-muted-foreground'>
         {results.length} result{results.length === 1 ? "" : "s"}
         {mode === "ai" && " · ranked by semantic relevance"}
      </p>
      {results.map((r, i) => (
         <SearchResultCard
            key={`${r.documentId}-${r.chunkIndex ?? i}`}
            result={r}
            highlight={query}
            showScore={mode === "ai"}
            onClick={() => onResultClick(r)}
         />
      ))}
   </div>
);

// ─────────────────────────────────────────────────────────────────────────

interface CardProps {
   result: SearchResult;
   highlight: string;
   showScore: boolean;
   onClick: () => void;
}

const SearchResultCard: FC<CardProps> = ({
   result,
   highlight,
   showScore,
   onClick,
}) => {
   const snippet = useMemo(
      () => highlightMatches(result.snippet, highlight),
      [result.snippet, highlight]
   );
   const scorePct = Math.round(result.relevanceScore * 100);

   return (
      <button
         type='button'
         onClick={onClick}
         className='group w-full text-left border rounded-lg p-4 bg-card hover:shadow-md hover:border-primary/40 transition-all'
      >
         <div className='flex items-start gap-3'>
            <div className='h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center'>
               <File size={16} className='text-muted-foreground' />
            </div>
            <div className='flex-1 min-w-0 space-y-1.5'>
               <div className='flex items-center gap-2 flex-wrap'>
                  <h3
                     className='font-medium truncate group-hover:text-primary transition-colors'
                     title={result.title}
                  >
                     {result.title}
                  </h3>
                  <Badge variant='outline' className='text-[10px] shrink-0'>
                     {result.mimeType}
                  </Badge>
                  {showScore && (
                     <Badge
                        variant='secondary'
                        className='text-[10px] shrink-0'
                        title={`Relevance: ${result.relevanceScore.toFixed(3)}`}
                     >
                        {scorePct}% match
                     </Badge>
                  )}
               </div>
               <p
                  className='text-sm text-muted-foreground leading-relaxed line-clamp-3'
                  dangerouslySetInnerHTML={{ __html: snippet }}
               />
            </div>
            <ArrowRight
               size={14}
               className='mt-1 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0'
            />
         </div>
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────────

const EmptyIntro: FC<{ mode: Mode }> = ({ mode }) => (
   <div className='border rounded-lg p-6 bg-muted/30 space-y-3'>
      <div className='flex items-center gap-2'>
         {mode === "keyword" ? (
            <SearchIcon size={16} className='text-muted-foreground' />
         ) : (
            <Sparkles size={16} className='text-primary' />
         )}
         <h3 className='text-sm font-medium'>
            {mode === "keyword"
               ? "Keyword search"
               : "AI semantic search"}
         </h3>
      </div>
      <p className='text-sm text-muted-foreground'>
         {mode === "keyword"
            ? "Matches exact words in document text. Fast, good for finding known phrases like contract numbers or names."
            : "Uses embeddings to find conceptually related content even when the exact words aren't present. Good for natural-language questions like “What are our termination clauses?”"}
      </p>
      <p className='text-xs text-muted-foreground'>
         Clicking a result opens the document and scrolls to the matching
         snippet automatically.
      </p>
   </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Utility — wraps query-word matches in <mark>. Escapes HTML first so the
// snippet can't inject rendered markup. Highlights longer words first to
// avoid partial-word overlap.
// ─────────────────────────────────────────────────────────────────────────

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
      '<mark class="bg-yellow-200/60 dark:bg-yellow-500/30 rounded-sm px-0.5">$1</mark>'
   );
}

export default SearchPage;
