import { apiClient } from "./api";

// ─────────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror docchain-backend/internal/dto/search.go
// ─────────────────────────────────────────────────────────────────────────

interface BackendSearchResult {
   document_id: string;
   title: string;
   snippet: string;
   relevance_score: number;
   chunk_index?: number;
   page?: number;
   mime_type: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Frontend shapes
// ─────────────────────────────────────────────────────────────────────────

export interface SearchResult {
   documentId: string;
   title: string;
   snippet: string;
   relevanceScore: number;
   chunkIndex?: number;
   /**
    * Page number (1-indexed) extracted from embedding metadata. Present for
    * PDFs with a known page; omitted for non-paginated formats.
    */
   page?: number;
   mimeType: string;
}

function adaptResult(raw: BackendSearchResult): SearchResult {
   return {
      documentId: raw.document_id,
      title: raw.title,
      snippet: raw.snippet,
      relevanceScore: raw.relevance_score,
      chunkIndex: raw.chunk_index,
      page: raw.page,
      mimeType: raw.mime_type,
   };
}

export interface KeywordSearchParams {
   query: string;
   folderId?: string;
   tag?: string;
   page?: number;
   pageSize?: number;
}

export interface AiSearchParams {
   query: string;
   documentIds?: string[];
   folderId?: string;
}

export const searchService = {
   /** Full-text keyword search. Fast, paginated. */
   keyword: async (params: KeywordSearchParams): Promise<SearchResult[]> => {
      if (!params.query.trim()) return [];
      const query: Record<string, string | number> = { q: params.query };
      if (params.folderId) query.folder_id = params.folderId;
      if (params.tag) query.tag = params.tag;
      if (params.page) query.page = params.page;
      if (params.pageSize) query.page_size = params.pageSize;
      const raw = await apiClient.get<BackendSearchResult[]>("/search", {
         params: query,
      });
      return (raw ?? []).map(adaptResult);
   },

   /**
    * Semantic vector search via embeddings. Slower + more expensive than
    * keyword — call on explicit submit, not every keystroke.
    */
   ai: async (params: AiSearchParams): Promise<SearchResult[]> => {
      if (!params.query.trim()) return [];
      const body: Record<string, unknown> = { query: params.query };
      if (params.documentIds?.length)
         body.document_ids = params.documentIds;
      if (params.folderId) body.folder_id = params.folderId;
      const raw = await apiClient.post<BackendSearchResult[]>(
         "/search/ai",
         body
      );
      return (raw ?? []).map(adaptResult);
   },
};
