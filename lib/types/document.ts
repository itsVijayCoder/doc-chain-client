import { User } from "./user";

export interface Document {
   id: string;
   title: string;
   description?: string;
   mimeType: string;
   ownerId: string;
   // Tags as display names. Backend returns TagResponse objects with
   // {id, name, slug, color}; adapter maps to .name for now. Future work
   // can expose richer tag shape when we build the tag picker UI.
   tags: string[];
   isFavorite: boolean;
   createdAt: Date;
   updatedAt: Date;
   version: number;
   // Present on DocumentResponse (backend). Prefer reading these in new code.
   isArchived?: boolean;
   folderId?: string;
   isExpired?: boolean;
   expiresAt?: Date;
   fileIcon?: string;
   thumbnailUrl?: string;
   /**
    * When true, every download is routed through the forensic-watermark path
    * on the backend and the UI shows a tracked-download confirmation. The
    * flag is set at upload or via Document Settings; viewers cannot disable
    * it.
    */
   isConfidential?: boolean;

   // Legacy/enrichment fields — populated only when the backend surfaces them
   // (detail view, blockchain verify, search result). The list endpoint does
   // NOT return these, so every component that reads them must handle undef.
   fileName?: string;
   fileSize?: number;
   owner?: User;
   blockchainHash?: string;
   blockchainVerified?: boolean;
   isEncrypted?: boolean;
   isDeleted?: boolean;
   deletedAt?: Date;
   shareCount?: number;
   downloadUrl?: string;
   // Shared-with-me fields — only present on GET /documents/shared-with-me responses
   myPermission?: "view" | "comment" | "edit" | "admin";
   sharedAt?: Date;
}

export interface DocumentMetadata {
   title: string;
   description?: string;
   tags: string[];
   isEncrypted: boolean;
   /** When true, every download is forensically watermarked on the backend. */
   isConfidential?: boolean;
   shareWith?: string[];
}

export interface DocumentFilters {
   search?: string;
   type?: string[];
   tags?: string[];
   owner?: string[];
   dateFrom?: Date;
   dateTo?: Date;
   blockchainVerified?: boolean;
   isEncrypted?: boolean;
   isFavorite?: boolean;
}

export type SortOption =
   | "recent"
   | "oldest"
   | "name-asc"
   | "name-desc"
   | "size-asc"
   | "size-desc"
   | "ai-suggested";

export interface DocumentVersion {
   id: string;
   documentId: string;
   version: number;
   fileSize: number;
   // SHA-256 content hash from the backend (file_hash field).
   fileHash?: string;
   // Blockchain record hash, if anchored. Populated only when blockchain
   // verification endpoints return data for this version.
   blockchainHash?: string;
   // Backend returns uploaded_by as a UUID only (no user object on version
   // responses). Adapter sets a minimal stub; UI should handle undefined.
   createdBy?: User;
   createdById?: string;
   createdAt: Date;
   changes?: string;
   fileName?: string;
   thumbnailUrl?: string;
   hasThumbnail?: boolean;
   fileIcon?: string;
}

export interface DocumentComment {
   id: string;
   documentId: string;
   userId: string;
   user: User;
   text: string;
   createdAt: Date;
   updatedAt: Date;
}

export interface Share {
   id: string;
   documentId: string;
   sharedWith: User;
   permission: "view" | "edit";
   sharedBy: User;
   expiresAt?: Date;
   createdAt: Date;
}

export interface ShareLinkOptions {
   permission: "view" | "edit";
   expiresAt?: Date;
   password?: string;
   allowDownload: boolean;
   blockchainAudit: boolean;
}

export interface ShareLink {
   id: string;
   documentId: string;
   token: string;
   url: string;
   permission: "view" | "edit";
   expiresAt?: Date;
   createdBy: User;
   createdAt: Date;
   accessCount: number;
}
