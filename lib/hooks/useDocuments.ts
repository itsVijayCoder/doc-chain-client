"use client";

import { useState } from "react";
import {
   keepPreviousData,
   useMutation,
   useQuery,
   useQueryClient,
} from "@tanstack/react-query";
import {
   documentService,
   type DocumentListParams,
   type SharedWithMeParams,
   type UploadMetadata,
} from "@/lib/services/documentService";
import type { ApiError } from "@/lib/types";

export const DOCUMENTS_QUERY_KEY = "documents" as const;
export const FAVORITES_QUERY_KEY = "favorites" as const;
export const SHARED_WITH_ME_QUERY_KEY = "shared-with-me" as const;

export function documentListKey(params: DocumentListParams) {
   return [DOCUMENTS_QUERY_KEY, "list", params] as const;
}

const DEFAULTS: Required<
   Pick<DocumentListParams, "page" | "pageSize" | "sortBy" | "sortDir">
> = {
   page: 1,
   pageSize: 20,
   sortBy: "created_at",
   sortDir: "desc",
};

export function useDocuments(params: DocumentListParams = {}) {
   const merged: DocumentListParams = { ...DEFAULTS, ...params };
   return useQuery({
      queryKey: documentListKey(merged),
      queryFn: () => documentService.list(merged),
      // Keep previous page visible while the next page loads to avoid flicker
      // when users paginate or tweak filters.
      placeholderData: keepPreviousData,
      staleTime: 30_000,
   });
}

export function documentDetailKey(id: string) {
   return [DOCUMENTS_QUERY_KEY, "detail", id] as const;
}

export function documentTrashKey(params: DocumentListParams) {
   return [DOCUMENTS_QUERY_KEY, "trash", params] as const;
}

export function documentArchivedKey(params: DocumentListParams) {
   return [DOCUMENTS_QUERY_KEY, "archived", params] as const;
}

/**
 * Fetch a single document + its versions. Query is disabled until `id` is
 * defined, so this is safe to call with a possibly-empty route param.
 */
export function useDocument(id: string | undefined) {
   return useQuery({
      queryKey: documentDetailKey(id ?? ""),
      queryFn: () => documentService.getById(id as string),
      enabled: !!id,
      staleTime: 30_000,
   });
}

export function useTrashDocuments(params: DocumentListParams = {}) {
   const merged: DocumentListParams = { ...DEFAULTS, ...params };
   return useQuery({
      queryKey: documentTrashKey(merged),
      queryFn: () => documentService.listTrash(merged),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
   });
}

/**
 * List only archived documents. Uses the main /documents endpoint with
 * is_archived=true — the backend filters server-side.
 */
export function useArchivedDocuments(
   params: Omit<DocumentListParams, "isArchived"> = {}
) {
   const merged: DocumentListParams = {
      ...DEFAULTS,
      ...params,
      isArchived: true,
   };
   return useQuery({
      queryKey: documentArchivedKey(merged),
      queryFn: () => documentService.list(merged),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
   });
}

// Invalidate every document query — list, trash, and any cached detail.
// Cheaper than enumerating specific keys and safe because TanStack is
// conservative about refetches.
function invalidateAllDocuments(queryClient: ReturnType<typeof useQueryClient>) {
   queryClient.invalidateQueries({ queryKey: [DOCUMENTS_QUERY_KEY] });
}

/** Same as the private version, exported for non-hook consumers (chat action handlers). */
export function invalidateDocuments(
   queryClient: ReturnType<typeof useQueryClient>
) {
   invalidateAllDocuments(queryClient);
}

export function useUpdateDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: {
         id: string;
         updates: Parameters<typeof documentService.update>[1];
      }) => documentService.update(args.id, args.updates),
      onSuccess: () => invalidateAllDocuments(queryClient),
   });
}

export function useSoftDeleteDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.softDelete(id),
      onSuccess: (_data, id) => {
         queryClient.removeQueries({ queryKey: documentDetailKey(id) });
         invalidateAllDocuments(queryClient);
      },
   });
}

export function usePermanentDeleteDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.permanentDelete(id),
      onSuccess: (_data, id) => {
         queryClient.removeQueries({ queryKey: documentDetailKey(id) });
         invalidateAllDocuments(queryClient);
      },
   });
}

export function useRestoreDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.restore(id),
      onSuccess: () => invalidateAllDocuments(queryClient),
   });
}

export function useArchiveDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.archive(id),
      onSuccess: () => invalidateAllDocuments(queryClient),
   });
}

export function useUnarchiveDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.unarchive(id),
      onSuccess: () => invalidateAllDocuments(queryClient),
   });
}

// ─── Favorites ────────────────────────────────────────────────────────────

export function favoritesListKey(params: DocumentListParams) {
   return [FAVORITES_QUERY_KEY, "list", params] as const;
}

export function useFavoritedDocuments(params: DocumentListParams = {}) {
   const merged: DocumentListParams = { ...DEFAULTS, ...params };
   return useQuery({
      queryKey: favoritesListKey(merged),
      queryFn: () => documentService.listFavorites(merged),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
   });
}

export function useAddFavorite() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.addFavorite(id),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: [FAVORITES_QUERY_KEY] });
         invalidateAllDocuments(queryClient);
      },
   });
}

export function useRemoveFavorite() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => documentService.removeFavorite(id),
      onSuccess: (_data, id) => {
         // Optimistically remove from favorites cache so the card disappears immediately
         queryClient.setQueriesData<ReturnType<typeof documentService.listFavorites> extends Promise<infer T> ? T : never>(
            { queryKey: [FAVORITES_QUERY_KEY] },
            (old) => old
               ? { ...old, documents: old.documents.filter((d) => d.id !== id) }
               : old
         );
         queryClient.invalidateQueries({ queryKey: [FAVORITES_QUERY_KEY] });
         invalidateAllDocuments(queryClient);
      },
   });
}

// ─── Shared with me ───────────────────────────────────────────────────────

export function sharedWithMeListKey(params: SharedWithMeParams) {
   return [SHARED_WITH_ME_QUERY_KEY, "list", params] as const;
}

export function useSharedWithMe(params: SharedWithMeParams = {}) {
   return useQuery({
      queryKey: sharedWithMeListKey(params),
      queryFn: () => documentService.listSharedWithMe(params),
      placeholderData: keepPreviousData,
      staleTime: 30_000,
   });
}

export type UseDocumentsError = ApiError;

/**
 * Upload a document. Exposes a progress percentage (0–100) alongside the
 * standard mutation fields. Automatically invalidates the documents list
 * on success so the new row appears without a manual refresh.
 */
export function useUploadDocument() {
   const [progress, setProgress] = useState(0);
   const queryClient = useQueryClient();

   const mutation = useMutation({
      mutationFn: async (args: { file: File; metadata: UploadMetadata }) => {
         setProgress(0);
         return documentService.upload(args.file, args.metadata, (p) =>
            setProgress(p)
         );
      },
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: [DOCUMENTS_QUERY_KEY, "list"],
         });
      },
      onSettled: () => {
         // Reset so the next upload starts from 0 without a stale tail value.
         setProgress(0);
      },
   });

   return { ...mutation, progress };
}
