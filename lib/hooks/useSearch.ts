"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
   searchService,
   type AiSearchParams,
   type KeywordSearchParams,
   type SearchResult,
} from "@/lib/services/searchService";
import { useDebounce } from "./useDebounce";
import type { ApiError } from "@/lib/types";

export const SEARCH_QUERY_KEY = "search" as const;

export function keywordSearchKey(params: KeywordSearchParams) {
   return [SEARCH_QUERY_KEY, "keyword", params] as const;
}

/**
 * Keyword search. Debounced so typing doesn't thrash the backend;
 * queryKey includes the debounced value so rapid typing collapses into
 * a single live request.
 */
export function useKeywordSearch(params: KeywordSearchParams) {
   const debouncedQuery = useDebounce(params.query.trim(), 300);
   const debouncedParams: KeywordSearchParams = {
      ...params,
      query: debouncedQuery,
   };
   return useQuery<SearchResult[], ApiError>({
      queryKey: keywordSearchKey(debouncedParams),
      queryFn: () => searchService.keyword(debouncedParams),
      enabled: debouncedQuery.length > 0,
      staleTime: 30_000,
   });
}

/**
 * AI semantic search. Mutation-based: user submits explicitly (Enter or
 * button) and the returned data hangs around in the mutation's state until
 * the next submit. AI search is slow and costs tokens — we don't want it
 * firing on every keystroke.
 */
export function useAiSearch() {
   return useMutation<SearchResult[], ApiError, AiSearchParams>({
      mutationFn: (params) => searchService.ai(params),
   });
}
