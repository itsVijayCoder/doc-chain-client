"use client";

import {
   useMutation,
   useQuery,
   useQueryClient,
} from "@tanstack/react-query";
import {
   folderService,
   type Folder,
   type FolderDetail,
   type BreadcrumbItem,
   type CreateFolderArgs,
} from "@/lib/services/folderService";
import type { ApiError } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// Query keys — single source of truth for cache invalidation
// ─────────────────────────────────────────────────────────────────────
export const FOLDER_KEYS = {
   all: ["folders"] as const,
   roots: () => ["folders", "roots"] as const,
   detail: (id: string) => ["folders", "detail", id] as const,
   breadcrumb: (id: string) => ["folders", "breadcrumb", id] as const,
};

// ─────────────────────────────────────────────────────────────────────
// Reads
// ─────────────────────────────────────────────────────────────────────

/** List of root folders (top-level). */
export function useRootFolders() {
   return useQuery<Folder[], ApiError>({
      queryKey: FOLDER_KEYS.roots(),
      queryFn: () => folderService.listRoots(),
      staleTime: 30_000,
   });
}

/** One folder + its immediate children + documents. */
export function useFolderDetail(folderId: string | undefined) {
   return useQuery<FolderDetail, ApiError>({
      queryKey: FOLDER_KEYS.detail(folderId ?? ""),
      queryFn: () => folderService.getById(folderId as string),
      enabled: !!folderId,
      staleTime: 30_000,
   });
}

/**
 * Full breadcrumb trail for a folder (root → target inclusive).
 * Cache for 5 minutes — breadcrumbs only change on move/rename of an ancestor.
 */
export function useFolderBreadcrumb(folderId: string | undefined) {
   return useQuery<BreadcrumbItem[], ApiError>({
      queryKey: FOLDER_KEYS.breadcrumb(folderId ?? ""),
      queryFn: () => folderService.breadcrumb(folderId as string),
      enabled: !!folderId,
      staleTime: 5 * 60_000,
   });
}

// ─────────────────────────────────────────────────────────────────────
// Mutations
// ─────────────────────────────────────────────────────────────────────

/**
 * Create a folder. Invalidates the parent's detail query (so the children
 * list refreshes) plus the roots list when creating at root.
 */
export function useCreateFolder() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: CreateFolderArgs) => folderService.create(args),
      onSuccess: (folder) => {
         if (folder.parentId) {
            queryClient.invalidateQueries({
               queryKey: FOLDER_KEYS.detail(folder.parentId),
            });
         } else {
            queryClient.invalidateQueries({ queryKey: FOLDER_KEYS.roots() });
         }
      },
   });
}

/** Rename a folder. Updates the folder's own cached detail + its parent's. */
export function useRenameFolder() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) =>
         folderService.update(id, { name }),
      onSuccess: (folder) => {
         // Own detail
         queryClient.invalidateQueries({
            queryKey: FOLDER_KEYS.detail(folder.id),
         });
         // Parent detail (so children list label updates)
         if (folder.parentId) {
            queryClient.invalidateQueries({
               queryKey: FOLDER_KEYS.detail(folder.parentId),
            });
         } else {
            queryClient.invalidateQueries({ queryKey: FOLDER_KEYS.roots() });
         }
         // Breadcrumbs for any folder under this one are stale
         queryClient.invalidateQueries({
            queryKey: ["folders", "breadcrumb"],
         });
      },
   });
}

/**
 * Delete a folder. Cascades on the backend, so every descendant's cache
 * is wiped too via broad invalidation.
 */
export function useDeleteFolder() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => folderService.delete(id),
      onSuccess: () => {
         // Nuke everything — cheaper than tracking descendants.
         queryClient.invalidateQueries({ queryKey: FOLDER_KEYS.all });
         queryClient.invalidateQueries({ queryKey: ["documents"] });
      },
   });
}

/** Move a folder. Same broad invalidation as delete — paths change everywhere. */
export function useMoveFolder() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({
         id,
         parentId,
      }: {
         id: string;
         parentId?: string | null;
      }) => folderService.move(id, parentId),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: FOLDER_KEYS.all });
      },
   });
}
