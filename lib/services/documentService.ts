import api, { apiClient, ApiEnvelope, PaginationMeta } from "./api";
import type { Document, DocumentVersion, User } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror docchain-backend/internal/dto/document.go + tag.go
// ─────────────────────────────────────────────────────────────────────────

interface BackendTagResponse {
   id: string;
   name: string;
   slug?: string;
   color?: string;
}

// Backend embeds a minimal owner on document list responses — no status/roles,
// just identity fields. That's enough to render a name + avatar fallback.
interface BackendDocumentOwner {
   id: string;
   email: string;
   first_name: string;
   last_name: string;
}

export interface BackendDocumentResponse {
   id: string;
   title: string;
   description?: string;
   mime_type: string;
   file_size: number;
   current_version: number;
   owner_id: string;
   owner?: BackendDocumentOwner;
   folder_id?: string | null;
   is_archived: boolean;
   is_searchable: boolean;
   is_confidential: boolean;
   is_favorited: boolean;
   share_count: number;
   expires_at?: string | null;
   reminder_days?: number[];
   is_expired: boolean;
   file_icon?: string;
   thumbnail_url?: string;
   tags: BackendTagResponse[];
   created_at: string;
   updated_at: string;
}

interface BackendVersionResponse {
   id: string;
   version_number: number;
   file_hash: string;
   file_size: number;
   uploaded_by: string;
   changelog: string;
   thumbnail_url?: string;
   has_thumbnail: boolean;
   file_icon: string;
   created_at: string;
}

interface BackendDocumentDetailResponse extends BackendDocumentResponse {
   versions: BackendVersionResponse[];
}

// Document content — GET /documents/:id/content
interface BackendDocumentPage {
   page: number;
   content: string;
}

interface BackendDocumentContent {
   document_id: string;
   title: string;
   mime_type: string;
   pages: BackendDocumentPage[];
   full_text: string;
   word_count: number;
   /** "native" | "ocr" | "none" | "not_searchable" */
   source: string;
}

export interface DocumentPage {
   page: number;
   content: string;
}

export interface DocumentContent {
   documentId: string;
   title: string;
   mimeType: string;
   pages: DocumentPage[];
   fullText: string;
   wordCount: number;
   source: "native" | "ocr" | "none" | "not_searchable" | string;
}

function adaptDocumentContent(raw: BackendDocumentContent): DocumentContent {
   return {
      documentId: raw.document_id,
      title: raw.title,
      mimeType: raw.mime_type,
      pages: (raw.pages ?? []).map((p) => ({ page: p.page, content: p.content })),
      fullText: raw.full_text ?? "",
      wordCount: raw.word_count ?? 0,
      source: raw.source ?? "none",
   };
}

// Vision API highlight — docchain-backend/internal/dto/document.go
interface BackendHighlightBox {
   text: string;
   x: number;
   y: number;
   width: number;
   height: number;
}

interface BackendHighlightResponse {
   page: number;
   text: string;
   highlights: BackendHighlightBox[];
   /** "vision" | "fallback" — "fallback" means backend couldn't run OCR. */
   method: string;
   message?: string;
}

export interface HighlightBox {
   /** Normalized 0..1 relative to the page. Multiply by canvas dimensions. */
   x: number;
   y: number;
   width: number;
   height: number;
   text: string;
}

export interface HighlightResult {
   page: number;
   text: string;
   highlights: HighlightBox[];
   method: "vision" | "fallback" | string;
   message?: string;
}

function adaptHighlight(raw: BackendHighlightResponse): HighlightResult {
   return {
      page: raw.page,
      text: raw.text,
      highlights: (raw.highlights ?? []).map((h) => ({
         x: h.x,
         y: h.y,
         width: h.width,
         height: h.height,
         text: h.text,
      })),
      method: raw.method,
      message: raw.message,
   };
}

function adaptVersion(
   raw: BackendVersionResponse,
   documentId: string
): DocumentVersion {
   return {
      id: raw.id,
      documentId,
      version: raw.version_number,
      fileSize: raw.file_size,
      fileHash: raw.file_hash,
      createdById: raw.uploaded_by,
      createdAt: new Date(raw.created_at),
      changes: raw.changelog || undefined,
      thumbnailUrl: raw.thumbnail_url,
      hasThumbnail: raw.has_thumbnail,
      fileIcon: raw.file_icon,
   };
}

function adaptOwner(raw: BackendDocumentOwner): User {
   const firstName = raw.first_name ?? "";
   const lastName = raw.last_name ?? "";
   const name = `${firstName} ${lastName}`.trim() || raw.email || raw.id;
   return {
      id: raw.id,
      email: raw.email,
      firstName,
      lastName,
      name,
      role: "viewer", // backend doesn't ship roles on the document owner subobject
   };
}

// ─────────────────────────────────────────────────────────────────────────
// Adapter
// ─────────────────────────────────────────────────────────────────────────

export function adaptDocument(raw: BackendDocumentResponse): Document {
   return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      mimeType: raw.mime_type,
      fileSize: raw.file_size,
      ownerId: raw.owner_id,
      owner: raw.owner ? adaptOwner(raw.owner) : undefined,
      tags: (raw.tags ?? []).map((t) => t.name),
      isFavorite: raw.is_favorited,
      shareCount: raw.share_count,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
      version: raw.current_version,
      isArchived: raw.is_archived,
      folderId: raw.folder_id ?? undefined,
      isExpired: raw.is_expired,
      expiresAt: raw.expires_at ? new Date(raw.expires_at) : undefined,
      fileIcon: raw.file_icon,
      thumbnailUrl: raw.thumbnail_url,
      isConfidential: raw.is_confidential,
   };
}

// ─────────────────────────────────────────────────────────────────────────
// Request params
// ─────────────────────────────────────────────────────────────────────────

export type DocumentSortBy = "created_at" | "updated_at" | "title";
export type DocumentSortDir = "asc" | "desc";
export type SharedWithMeSortBy = "shared_at" | "title" | "permission" | "updated_at";
export type SharedPermissionFilter = "view" | "comment" | "edit" | "admin";

export interface DocumentListParams {
   page?: number;
   pageSize?: number;
   sortBy?: DocumentSortBy;
   sortDir?: DocumentSortDir;
   folderId?: string;
   search?: string;
   /**
    * Tag filter. Multiple tags are joined with commas and sent as ?tags=a,b
    * — backend applies AND semantics (document must carry every tag).
    * Empty array or undefined omits the filter.
    */
   tags?: string[];
   /**
    * Mime-type filter. Backend accepts convenience values: "pdf", "image",
    * "word", "sheet", "slides", "archive", "video", "audio" — ILIKE match
    * against the stored MIME type column.
    */
   mimeType?: string;
   /** Filter by document owner (UUID). */
   ownerId?: string;
   /** Confidential flag — true returns only confidential, false excludes them. */
   isConfidential?: boolean;
   /** Expired flag — compares against expires_at column at query time. */
   isExpired?: boolean;
   /** RFC3339 timestamp. Docs with updated_at >= this value. */
   updatedAfter?: string;
   /** RFC3339 timestamp. Docs with updated_at <= this value. */
   updatedBefore?: string;
   // Backend accepts:
   //   true  → archived only (the Archive tab)
   //   "all" → both archived + active (search / admin view)
   //   undefined/false → default; backend hides archived
   isArchived?: boolean | "all";
}

export interface SharedWithMeParams {
   page?: number;
   pageSize?: number;
   sortBy?: SharedWithMeSortBy;
   sortDir?: DocumentSortDir;
   permission?: SharedPermissionFilter;
}

function toBackendQuery(
   params: DocumentListParams
): Record<string, string | number | boolean> {
   const out: Record<string, string | number | boolean> = {};
   if (params.page) out.page = params.page;
   if (params.pageSize) out.page_size = params.pageSize;
   if (params.sortBy) out.sort_by = params.sortBy;
   if (params.sortDir) out.sort_dir = params.sortDir;
   if (params.folderId) out.folder_id = params.folderId;
   if (params.search) out.search = params.search;
   if (params.tags && params.tags.length > 0) {
      // Backend accepts either `tags=a,b` (AND) or single `tag=a` (legacy).
      // Always prefer the plural form — it works for 1+ tags.
      out.tags = params.tags.join(",");
   }
   if (params.mimeType) out.mime_type = params.mimeType;
   if (params.ownerId) out.owner_id = params.ownerId;
   if (params.isConfidential !== undefined)
      out.is_confidential = params.isConfidential ? "true" : "false";
   if (params.isExpired !== undefined)
      out.is_expired = params.isExpired ? "true" : "false";
   if (params.updatedAfter) out.updated_after = params.updatedAfter;
   if (params.updatedBefore) out.updated_before = params.updatedBefore;
   if (params.isArchived === true) out.is_archived = "true";
   else if (params.isArchived === "all") out.is_archived = "all";
   return out;
}

// ─────────────────────────────────────────────────────────────────────────
// documentService
// ─────────────────────────────────────────────────────────────────────────

export interface DocumentListResult {
   documents: Document[];
   meta: PaginationMeta;
}

export interface DocumentDetailResult {
   document: Document;
   versions: DocumentVersion[];
}

// Extracts a filename from a Content-Disposition header if present. Falls back
// to the caller's default. Tolerates both `filename="…"` and RFC 5987
// `filename*=UTF-8''…` variants.
function parseFilenameFromDisposition(
   disposition: string | undefined,
   fallback: string
): string {
   if (!disposition) return fallback;
   const star = disposition.match(/filename\*=UTF-8''([^;]+)/i);
   if (star?.[1]) {
      try {
         return decodeURIComponent(star[1]);
      } catch {
         /* fall through */
      }
   }
   const plain = disposition.match(/filename="?([^";]+)"?/i);
   if (plain?.[1]) return plain[1];
   return fallback;
}

const MIME_EXT: Record<string, string> = {
   "application/pdf": ".pdf",
   "application/msword": ".doc",
   "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
   "application/vnd.ms-excel": ".xls",
   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
   "application/vnd.ms-powerpoint": ".ppt",
   "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
   "text/plain": ".txt",
   "text/csv": ".csv",
   "text/markdown": ".md",
   "text/html": ".html",
   "application/rtf": ".rtf",
   "application/zip": ".zip",
   "image/jpeg": ".jpg",
   "image/png": ".png",
   "image/gif": ".gif",
   "image/webp": ".webp",
   "image/svg+xml": ".svg",
   "video/mp4": ".mp4",
   "video/webm": ".webm",
   "audio/mpeg": ".mp3",
   "audio/wav": ".wav",
};

async function streamDownload(url: string, fallbackFilename: string) {
   const res = await api.get<Blob>(url, { responseType: "blob" });
   const disposition =
      (res.headers["content-disposition"] as string | undefined) ?? undefined;
   let filename = parseFilenameFromDisposition(disposition, fallbackFilename);

   // If the resolved filename has no extension, derive one from the blob's
   // MIME type. Covers the common case where doc.title is used as fallback
   // and the server doesn't send Content-Disposition.
   if (!filename.includes(".")) {
      const mimeType = res.data.type.split(";")[0].trim();
      const ext = MIME_EXT[mimeType];
      if (ext) filename = filename + ext;
   }

   const blobUrl = URL.createObjectURL(res.data);
   const anchor = window.document.createElement("a");
   anchor.href = blobUrl;
   anchor.download = filename;
   window.document.body.appendChild(anchor);
   anchor.click();
   anchor.remove();
   // Defer revocation so the browser's download worker has time to read.
   setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export interface UploadMetadata {
   title: string;
   description?: string;
   folderId?: string;
   // Tag IDs (UUIDs). Backend's CreateDocumentRequest expects existing tag
   // identifiers. The current upload dialog collects free-text tags — those
   // will be ignored here until the tag-picker phase wires GET/POST /tags.
   tagIds?: string[];
   /** Mark the document confidential on upload (enables forensic watermarking). */
   isConfidential?: boolean;
}

export type UploadProgressHandler = (percent: number) => void;

export const documentService = {
   list: async (params: DocumentListParams = {}): Promise<DocumentListResult> => {
      const { data, meta } = await apiClient.getPaginated<BackendDocumentResponse>(
         "/documents",
         { params: toBackendQuery(params) }
      );
      return {
         documents: data.map(adaptDocument),
         meta,
      };
   },

   getById: async (id: string): Promise<DocumentDetailResult> => {
      const raw = await apiClient.get<BackendDocumentDetailResponse>(
         `/documents/${id}`
      );
      return {
         document: adaptDocument(raw),
         versions: (raw.versions ?? []).map((v) => adaptVersion(v, raw.id)),
      };
   },

   downloadCurrent: async (id: string, title: string): Promise<void> => {
      await streamDownload(`/documents/${id}/download`, title);
   },

   downloadForensic: async (id: string, title: string): Promise<void> => {
      await streamDownload(`/documents/${id}/download?watermark=forensic`, title);
   },

   downloadVersion: async (
      id: string,
      versionNumber: number,
      title: string
   ): Promise<void> => {
      await streamDownload(
         `/documents/${id}/versions/${versionNumber}/download`,
         `${title}-v${versionNumber}`
      );
   },

   /**
    * Upload a new document. Uses the raw axios instance (not apiClient) so
    * we can attach onUploadProgress. Multipart uploads are exempt from the
    * automatic 401 retry in api.ts — a silent re-upload of a large file
    * would surprise users. If 401 fires, the caller sees it as an error and
    * the user is prompted to retry.
    */
   upload: async (
      file: File,
      metadata: UploadMetadata,
      onProgress?: UploadProgressHandler
   ): Promise<Document> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", metadata.title);
      if (metadata.description) {
         formData.append("description", metadata.description);
      }
      if (metadata.folderId) {
         formData.append("folder_id", metadata.folderId);
      }
      if (metadata.isConfidential) {
         formData.append("is_confidential", "true");
      }
      // Backend accepts repeated "tags" form fields for the []string binding.
      metadata.tagIds?.forEach((id) => formData.append("tags", id));

      const res = await api.post<ApiEnvelope<BackendDocumentResponse>>(
         "/documents",
         formData,
         {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (event) => {
               if (!onProgress) return;
               if (event.total) {
                  onProgress(Math.round((event.loaded * 100) / event.total));
               }
            },
         }
      );
      const payload = res.data.data;
      if (!payload) {
         throw new Error("Upload response missing document payload");
      }
      return adaptDocument(payload);
   },

   /**
    * Patch document metadata. Backend's UpdateDocumentRequest accepts
    * optional title, description, folder_id, expires_at, reminder_days.
    * Used by chat action handlers (set_metadata / move_to_folder intents)
    * and will be used by future settings forms.
    */
   update: async (
      id: string,
      updates: {
         title?: string;
         description?: string;
         folderId?: string | null;
         expiresAt?: string | null;
         reminderDays?: number[] | null;
         isConfidential?: boolean;
      }
   ): Promise<Document> => {
      const body: Record<string, unknown> = {};
      if (updates.title !== undefined) body.title = updates.title;
      if (updates.description !== undefined)
         body.description = updates.description;
      if (updates.folderId !== undefined) body.folder_id = updates.folderId;
      if (updates.expiresAt !== undefined) body.expires_at = updates.expiresAt;
      if (updates.reminderDays !== undefined)
         body.reminder_days = updates.reminderDays;
      if (updates.isConfidential !== undefined)
         body.is_confidential = updates.isConfidential;
      const raw = await apiClient.put<BackendDocumentResponse>(
         `/documents/${id}`,
         body
      );
      return adaptDocument(raw);
   },

   /** Soft-delete a document (moves to trash). Reversible via restore(). */
   softDelete: async (id: string): Promise<void> => {
      await apiClient.delete(`/documents/${id}`);
   },

   /**
    * Permanently delete a document and its files. Admin-only on the backend;
    * non-admins will hit 403. Irreversible.
    */
   permanentDelete: async (id: string): Promise<void> => {
      await apiClient.delete(`/documents/${id}/permanent`);
   },

   /** Pull a trashed document back into the active list. */
   restore: async (id: string): Promise<void> => {
      await apiClient.post(`/documents/${id}/restore`);
   },

   /** Archive — hides from main list but keeps record active (not trash). */
   archive: async (id: string): Promise<void> => {
      await apiClient.post(`/documents/${id}/archive`);
   },

   unarchive: async (id: string): Promise<void> => {
      await apiClient.post(`/documents/${id}/unarchive`);
   },

   /**
    * Ask the backend for pixel-level highlight rectangles on a page. Used as
    * a fallback for scanned PDFs where the pdf.js text layer can't resolve
    * the snippet via DOM walk. Returns normalized [0..1] coords that the
    * caller multiplies by the canvas dimensions.
    */
   getHighlights: async (
      documentId: string,
      page: number,
      text: string
   ): Promise<HighlightResult> => {
      const raw = await apiClient.get<BackendHighlightResponse>(
         `/documents/${documentId}/highlight`,
         { params: { page, text } }
      );
      return adaptHighlight(raw);
   },

   /** Fetch pre-computed text content. Zero-cost — reads from stored embeddings. */
   getContent: async (id: string): Promise<DocumentContent> => {
      const raw = await apiClient.get<BackendDocumentContent>(
         `/documents/${id}/content`
      );
      return adaptDocumentContent(raw);
   },

   /** List the current user's trashed documents. Same shape as list(). */
   listTrash: async (
      params: DocumentListParams = {}
   ): Promise<DocumentListResult> => {
      const { data, meta } = await apiClient.getPaginated<BackendDocumentResponse>(
         "/documents/trash",
         { params: toBackendQuery(params) }
      );
      return {
         documents: data.map(adaptDocument),
         meta,
      };
   },

   /**
    * List the current user's favorited documents.
    * GET /favorites returns FavoriteResponse[] where each item wraps the full
    * document under a `.document` key. We unwrap it so callers get Document[].
    */
   listFavorites: async (
      params: DocumentListParams = {}
   ): Promise<DocumentListResult> => {
      interface BackendFavoriteResponse {
         id: string;
         document_id: string;
         user_id: string;
         created_at: string;
         document: BackendDocumentResponse;
      }
      const { data, meta } = await apiClient.getPaginated<BackendFavoriteResponse>(
         "/favorites",
         { params: toBackendQuery(params) }
      );
      return {
         documents: data.map((f) => adaptDocument(f.document)),
         meta,
      };
   },

   /** Add a document to the current user's favorites. */
   addFavorite: async (id: string): Promise<void> => {
      await apiClient.post(`/documents/${id}/favorite`);
   },

   /** Remove a document from the current user's favorites. */
   removeFavorite: async (id: string): Promise<void> => {
      await apiClient.delete(`/documents/${id}/favorite`);
   },

   /**
    * Documents shared with the current user.
    * GET /documents/shared-with-me — response items extend BackendDocumentResponse
    * with `my_permission` and `shared_at` extras.
    */
   listSharedWithMe: async (
      params: SharedWithMeParams = {}
   ): Promise<DocumentListResult> => {
      interface BackendSharedDocumentResponse extends BackendDocumentResponse {
         my_permission: "view" | "comment" | "edit" | "admin";
         shared_at: string;
      }
      const query: Record<string, string | number> = {};
      if (params.page) query.page = params.page;
      if (params.pageSize) query.page_size = params.pageSize;
      if (params.sortBy) query.sort_by = params.sortBy;
      if (params.sortDir) query.sort_dir = params.sortDir;
      if (params.permission) query.permission = params.permission;

      const { data, meta } =
         await apiClient.getPaginated<BackendSharedDocumentResponse>(
            "/documents/shared-with-me",
            { params: query }
         );
      return {
         documents: data.map((raw) => ({
            ...adaptDocument(raw),
            myPermission: raw.my_permission,
            sharedAt: new Date(raw.shared_at),
         })),
         meta,
      };
   },
};
