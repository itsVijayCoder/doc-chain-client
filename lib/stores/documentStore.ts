import { create } from "zustand";
import {
   Document,
   DocumentFilters,
   SortOption,
   DocumentMetadata,
   DocumentVersion,
   DocumentComment,
   Share,
   ShareLinkOptions,
   ShareLink,
} from "@/lib/types";

interface DocumentState {
   // Documents list
   documents: Document[];
   currentDocument: Document | null;
   filters: DocumentFilters;
   sortBy: SortOption;
   viewMode: "grid" | "list";
   selectedDocuments: string[];

   // Loading states
   isLoading: boolean;
   isUploading: boolean;
   uploadProgress: number;
   isVerifying: boolean;

   // Document details
   aiSummary: string | null;
   comments: DocumentComment[];
   versions: DocumentVersion[];
   shares: Share[];

   // Error
   error: string | null;

   // Actions - List
   fetchDocuments: (filters?: DocumentFilters) => Promise<void>;
   setFilters: (filters: DocumentFilters) => void;
   setSortBy: (sortBy: SortOption) => void;
   setViewMode: (mode: "grid" | "list") => void;
   toggleSelectDocument: (id: string) => void;
   selectAll: () => void;
   clearSelection: () => void;

   // Actions - Upload
   uploadDocument: (file: File, metadata: DocumentMetadata) => Promise<void>;

   // Actions - Single document
   fetchDocument: (id: string) => Promise<void>;
   updateDocument: (id: string, data: Partial<Document>) => Promise<void>;
   deleteDocument: (id: string) => Promise<void>;
   deleteMultiple: (ids: string[]) => Promise<void>;

   // Actions - Blockchain
   verifyBlockchain: (id: string) => Promise<void>;

   // Actions - AI
   generateAISummary: (id: string) => Promise<void>;

   // Actions - Comments
   addComment: (documentId: string, text: string) => Promise<void>;
   fetchComments: (documentId: string) => Promise<void>;

   // Actions - Versions
   fetchVersions: (documentId: string) => Promise<void>;

   // Actions - Sharing
   shareDocument: (
      documentId: string,
      userId: string,
      permission: "view" | "edit" | "admin"
   ) => Promise<void>;
   removeShare: (shareId: string) => Promise<void>;
   generateShareLink: (
      documentId: string,
      options: ShareLinkOptions
   ) => Promise<ShareLink>;
   fetchShares: (documentId: string) => Promise<void>;

   // Actions - Favorites
   toggleFavorite: (documentId: string) => Promise<void>;

   // Utility
   clearError: () => void;
   reset: () => void;
}

const initialFilters: DocumentFilters = {
   search: "",
   type: [],
   tags: [],
   owner: [],
};

export const useDocumentStore = create<DocumentState>((set, get) => ({
   documents: [],
   currentDocument: null,
   filters: initialFilters,
   sortBy: "recent",
   viewMode: "grid",
   selectedDocuments: [],
   isLoading: false,
   isUploading: false,
   uploadProgress: 0,
   isVerifying: false,
   aiSummary: null,
   comments: [],
   versions: [],
   shares: [],
   error: null,

   fetchDocuments: async (filters) => {
      set({ isLoading: true, error: null });
      try {
         const currentFilters = filters || get().filters;
         const sortBy = get().sortBy;

         // TODO: Replace with actual API call
         const response = await fetch(
            "/api/documents?" +
               new URLSearchParams({
                  ...currentFilters,
                  sortBy,
               } as any)
         );

         if (!response.ok) throw new Error("Failed to fetch documents");

         const documents = await response.json();
         set({ documents, isLoading: false });
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to fetch documents",
            isLoading: false,
         });
      }
   },

   setFilters: (filters) => {
      set({ filters });
      get().fetchDocuments(filters);
   },

   setSortBy: (sortBy) => {
      set({ sortBy });
      get().fetchDocuments();
   },

   setViewMode: (mode) => set({ viewMode: mode }),

   toggleSelectDocument: (id) =>
      set((state) => {
         const isSelected = state.selectedDocuments.includes(id);
         return {
            selectedDocuments: isSelected
               ? state.selectedDocuments.filter((docId) => docId !== id)
               : [...state.selectedDocuments, id],
         };
      }),

   selectAll: () =>
      set((state) => ({
         selectedDocuments: state.documents.map((doc) => doc.id),
      })),

   clearSelection: () => set({ selectedDocuments: [] }),

   uploadDocument: async (file, metadata) => {
      set({ isUploading: true, uploadProgress: 0, error: null });
      try {
         const formData = new FormData();
         formData.append("file", file);
         formData.append("metadata", JSON.stringify(metadata));

         // TODO: Replace with actual API call with progress tracking
         const response = await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
         });

         if (!response.ok) throw new Error("Upload failed");

         const document = await response.json();
         set((state) => ({
            documents: [document, ...state.documents],
            isUploading: false,
            uploadProgress: 100,
         }));

         // Refresh documents list
         await get().fetchDocuments();
      } catch (error) {
         set({
            error: error instanceof Error ? error.message : "Upload failed",
            isUploading: false,
            uploadProgress: 0,
         });
         throw error;
      }
   },

   fetchDocument: async (id) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/${id}`);
         if (!response.ok) throw new Error("Failed to fetch document");

         const document = await response.json();
         set({ currentDocument: document, isLoading: false });
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to fetch document",
            isLoading: false,
         });
      }
   },

   updateDocument: async (id, data) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
         });

         if (!response.ok) throw new Error("Failed to update document");

         const updatedDocument = await response.json();
         set((state) => ({
            documents: state.documents.map((doc) =>
               doc.id === id ? updatedDocument : doc
            ),
            currentDocument:
               state.currentDocument?.id === id
                  ? updatedDocument
                  : state.currentDocument,
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to update document",
            isLoading: false,
         });
         throw error;
      }
   },

   deleteDocument: async (id) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/${id}`, {
            method: "DELETE",
         });

         if (!response.ok) throw new Error("Failed to delete document");

         set((state) => ({
            documents: state.documents.filter((doc) => doc.id !== id),
            selectedDocuments: state.selectedDocuments.filter(
               (docId) => docId !== id
            ),
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to delete document",
            isLoading: false,
         });
         throw error;
      }
   },

   deleteMultiple: async (ids) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch("/api/documents/bulk-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
         });

         if (!response.ok) throw new Error("Failed to delete documents");

         set((state) => ({
            documents: state.documents.filter((doc) => !ids.includes(doc.id)),
            selectedDocuments: [],
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to delete documents",
            isLoading: false,
         });
         throw error;
      }
   },

   verifyBlockchain: async (id) => {
      set({ isVerifying: true, error: null });
      try {
         const response = await fetch(`/api/documents/${id}/verify`, {
            method: "POST",
         });

         if (!response.ok) throw new Error("Verification failed");

         const verification = await response.json();
         set({ isVerifying: false });

         // Update document with verification status
         set((state) => ({
            currentDocument: state.currentDocument
               ? {
                    ...state.currentDocument,
                    blockchainVerified: verification.verified,
                 }
               : null,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error ? error.message : "Verification failed",
            isVerifying: false,
         });
         throw error;
      }
   },

   generateAISummary: async (id) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/${id}/summary`);
         if (!response.ok) throw new Error("Failed to generate summary");

         const { summary } = await response.json();
         set({ aiSummary: summary, isLoading: false });
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to generate summary",
            isLoading: false,
         });
      }
   },

   addComment: async (documentId, text) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/${documentId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
         });

         if (!response.ok) throw new Error("Failed to add comment");

         const comment = await response.json();
         set((state) => ({
            comments: [...state.comments, comment],
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error ? error.message : "Failed to add comment",
            isLoading: false,
         });
         throw error;
      }
   },

   fetchComments: async (documentId) => {
      try {
         const response = await fetch(`/api/documents/${documentId}/comments`);
         if (!response.ok) throw new Error("Failed to fetch comments");

         const comments = await response.json();
         set({ comments });
      } catch (error) {
         console.error("Failed to fetch comments:", error);
      }
   },

   fetchVersions: async (documentId) => {
      try {
         const response = await fetch(`/api/documents/${documentId}/versions`);
         if (!response.ok) throw new Error("Failed to fetch versions");

         const versions = await response.json();
         set({ versions });
      } catch (error) {
         console.error("Failed to fetch versions:", error);
      }
   },

   shareDocument: async (documentId, userId, permission) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/${documentId}/share`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, permission }),
         });

         if (!response.ok) throw new Error("Failed to share document");

         const share = await response.json();
         set((state) => ({
            shares: [...state.shares, share],
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to share document",
            isLoading: false,
         });
         throw error;
      }
   },

   removeShare: async (shareId) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(`/api/documents/shares/${shareId}`, {
            method: "DELETE",
         });

         if (!response.ok) throw new Error("Failed to remove share");

         set((state) => ({
            shares: state.shares.filter((share) => share.id !== shareId),
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to remove share",
            isLoading: false,
         });
         throw error;
      }
   },

   generateShareLink: async (documentId, options) => {
      set({ isLoading: true, error: null });
      try {
         const response = await fetch(
            `/api/documents/${documentId}/share-link`,
            {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(options),
            }
         );

         if (!response.ok) throw new Error("Failed to generate share link");

         const shareLink = await response.json();
         set({ isLoading: false });
         return shareLink;
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to generate share link",
            isLoading: false,
         });
         throw error;
      }
   },

   fetchShares: async (documentId) => {
      try {
         const response = await fetch(`/api/documents/${documentId}/shares`);
         if (!response.ok) throw new Error("Failed to fetch shares");

         const shares = await response.json();
         set({ shares });
      } catch (error) {
         console.error("Failed to fetch shares:", error);
      }
   },

   toggleFavorite: async (documentId) => {
      set({ isLoading: true, error: null });
      try {
         const document = get().documents.find((doc) => doc.id === documentId);
         const isFavorite = document?.isFavorite;

         const response = await fetch(`/api/favorites/${documentId}`, {
            method: isFavorite ? "DELETE" : "POST",
         });

         if (!response.ok) throw new Error("Failed to toggle favorite");

         set((state) => ({
            documents: state.documents.map((doc) =>
               doc.id === documentId ? { ...doc, isFavorite: !isFavorite } : doc
            ),
            currentDocument:
               state.currentDocument?.id === documentId
                  ? { ...state.currentDocument, isFavorite: !isFavorite }
                  : state.currentDocument,
            isLoading: false,
         }));
      } catch (error) {
         set({
            error:
               error instanceof Error
                  ? error.message
                  : "Failed to toggle favorite",
            isLoading: false,
         });
         throw error;
      }
   },

   clearError: () => set({ error: null }),

   reset: () =>
      set({
         documents: [],
         currentDocument: null,
         filters: initialFilters,
         sortBy: "recent",
         selectedDocuments: [],
         aiSummary: null,
         comments: [],
         versions: [],
         shares: [],
         error: null,
      }),
}));
