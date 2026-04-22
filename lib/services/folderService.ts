import { apiClient } from "./api";
import type { Document } from "@/lib/types/document";
import {
   adaptDocument,
   type BackendDocumentResponse,
} from "./documentService";

// ─────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror dto.FolderResponse + dto.FolderDetailResponse
// ─────────────────────────────────────────────────────────────────────
interface BackendFolder {
   id: string;
   name: string;
   owner_id: string;
   parent_id?: string | null;
   /** Materialized path: "/uuid1/uuid2/uuid3". */
   path: string;
   /** Depth from root (0 = top level). Max depth 10 on backend. */
   depth: number;
   created_at: string;
   updated_at: string;
}

interface BackendFolderDetail extends BackendFolder {
   children?: BackendFolder[];
   documents?: BackendDocumentResponse[];
}

interface BackendBreadcrumbItem {
   id: string;
   name: string;
}

// ─────────────────────────────────────────────────────────────────────
// Frontend shapes — camelCase, with Date fields where useful
// ─────────────────────────────────────────────────────────────────────
export interface Folder {
   id: string;
   name: string;
   ownerId: string;
   parentId?: string;
   path: string;
   depth: number;
   createdAt: Date;
   updatedAt: Date;
}

export interface FolderDetail extends Folder {
   children: Folder[];
   documents: Document[];
}

export interface BreadcrumbItem {
   id: string;
   name: string;
}

// ─────────────────────────────────────────────────────────────────────
// Adapters
// ─────────────────────────────────────────────────────────────────────
function adaptFolder(raw: BackendFolder): Folder {
   return {
      id: raw.id,
      name: raw.name,
      ownerId: raw.owner_id,
      parentId: raw.parent_id ?? undefined,
      path: raw.path,
      depth: raw.depth,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
   };
}

function adaptFolderDetail(raw: BackendFolderDetail): FolderDetail {
   return {
      ...adaptFolder(raw),
      children: (raw.children ?? []).map(adaptFolder),
      documents: (raw.documents ?? []).map(adaptDocument),
   };
}

// ─────────────────────────────────────────────────────────────────────
// Requests
// ─────────────────────────────────────────────────────────────────────
export interface CreateFolderArgs {
   name: string;
   /** Omit for root-level folder. */
   parentId?: string;
}

export interface UpdateFolderArgs {
   name: string;
}

// ─────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────
export const folderService = {
   /** List top-level (root) folders for the current user. */
   listRoots: async (): Promise<Folder[]> => {
      const raw = await apiClient.get<BackendFolder[]>("/folders");
      return (raw ?? []).map(adaptFolder);
   },

   /** Get one folder with its immediate children + documents. */
   getById: async (id: string): Promise<FolderDetail> => {
      const raw = await apiClient.get<BackendFolderDetail>(`/folders/${id}`);
      return adaptFolderDetail(raw);
   },

   /** Create a new folder. Parent ID optional — omit for root. */
   create: async (args: CreateFolderArgs): Promise<Folder> => {
      const body: Record<string, unknown> = { name: args.name.trim() };
      if (args.parentId) body.parent_id = args.parentId;
      const raw = await apiClient.post<BackendFolder>("/folders", body);
      return adaptFolder(raw);
   },

   /** Rename a folder. */
   update: async (id: string, args: UpdateFolderArgs): Promise<Folder> => {
      const raw = await apiClient.put<BackendFolder>(`/folders/${id}`, {
         name: args.name.trim(),
      });
      return adaptFolder(raw);
   },

   /** Delete a folder. Backend cascades to subfolders. */
   delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/folders/${id}`);
   },

   /**
    * Move a folder to a new parent.
    * Pass `null` or omit parentId to move to root.
    */
   move: async (id: string, parentId?: string | null): Promise<Folder> => {
      const body = parentId ? { parent_id: parentId } : {};
      const raw = await apiClient.post<BackendFolder>(`/folders/${id}/move`, body);
      return adaptFolder(raw);
   },

   /**
    * Get the breadcrumb trail from root to the given folder.
    * Returns an array ordered root → target (inclusive).
    */
   breadcrumb: async (id: string): Promise<BreadcrumbItem[]> => {
      const raw = await apiClient.get<BackendBreadcrumbItem[]>(
         `/folders/${id}/breadcrumb`
      );
      return raw ?? [];
   },
};
