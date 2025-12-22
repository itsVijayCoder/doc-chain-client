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
import { User } from "@/lib/types/user";

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

// Mock Users
const mockUsers: User[] = [
   {
      id: "user-1",
      email: "admin@docchain.com",
      name: "Admin User",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
      bio: "System Administrator",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      mfaEnabled: true,
      isActive: true,
   },
   {
      id: "user-2",
      email: "john@docchain.com",
      name: "John Doe",
      role: "editor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      bio: "Senior Editor",
      createdAt: new Date("2024-02-01"),
      updatedAt: new Date("2024-02-01"),
      mfaEnabled: false,
      isActive: true,
   },
   {
      id: "user-3",
      email: "jane@docchain.com",
      name: "Jane Smith",
      role: "viewer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
      bio: "Document Viewer",
      createdAt: new Date("2024-03-01"),
      updatedAt: new Date("2024-03-01"),
      mfaEnabled: false,
      isActive: true,
   },
];

// Mock Documents
const mockDocuments: Document[] = [
   {
      id: "doc-1",
      title: "Project Proposal 2025",
      description:
         "Comprehensive project proposal for Q1 2025 blockchain integration initiative",
      fileName: "project-proposal-2025.pdf",
      fileSize: 2457600, // 2.4 MB
      mimeType: "application/pdf",
      ownerId: "user-1",
      owner: mockUsers[0],
      tags: ["proposal", "blockchain", "Q1-2025"],
      blockchainHash: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1",
      blockchainVerified: true,
      isEncrypted: true,
      isFavorite: true,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-15"),
      version: 3,
      shareCount: 5,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/4f46e5/ffffff?text=Project+Proposal",
   },
   {
      id: "doc-2",
      title: "Smart Contract Specifications",
      description:
         "Technical specifications for document verification smart contracts",
      fileName: "smart-contract-specs.docx",
      fileSize: 1048576, // 1 MB
      mimeType:
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ownerId: "user-2",
      owner: mockUsers[1],
      tags: ["smart-contract", "technical", "blockchain"],
      blockchainHash: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
      blockchainVerified: true,
      isEncrypted: false,
      isFavorite: false,
      createdAt: new Date("2024-11-15"),
      updatedAt: new Date("2024-12-10"),
      version: 5,
      shareCount: 8,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/10b981/ffffff?text=Smart+Contracts",
   },
   {
      id: "doc-3",
      title: "User Guide - Document Chain",
      description: "Complete user guide for the Document Chain platform",
      fileName: "user-guide.pdf",
      fileSize: 5242880, // 5 MB
      mimeType: "application/pdf",
      ownerId: "user-1",
      owner: mockUsers[0],
      tags: ["documentation", "user-guide", "help"],
      blockchainVerified: false,
      isEncrypted: false,
      isFavorite: true,
      createdAt: new Date("2024-10-20"),
      updatedAt: new Date("2024-12-18"),
      version: 12,
      shareCount: 25,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/f59e0b/ffffff?text=User+Guide",
   },
   {
      id: "doc-4",
      title: "Q4 Financial Report",
      description: "Financial performance report for Q4 2024",
      fileName: "q4-financial-report.xlsx",
      fileSize: 3145728, // 3 MB
      mimeType:
         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ownerId: "user-2",
      owner: mockUsers[1],
      tags: ["finance", "report", "Q4-2024"],
      blockchainHash: "0x4e83362442B8d1beC281594CEA3050c8EB01311C",
      blockchainVerified: true,
      isEncrypted: true,
      isFavorite: false,
      createdAt: new Date("2024-12-20"),
      updatedAt: new Date("2024-12-20"),
      version: 1,
      shareCount: 3,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/06b6d4/ffffff?text=Financial+Report",
   },
   {
      id: "doc-5",
      title: "API Documentation v2.0",
      description:
         "REST API documentation for Document Chain platform version 2.0",
      fileName: "api-docs-v2.pdf",
      fileSize: 1572864, // 1.5 MB
      mimeType: "application/pdf",
      ownerId: "user-3",
      owner: mockUsers[2],
      tags: ["api", "documentation", "technical"],
      blockchainHash: "0x2546BcD3c84621e976D8185a91A922aE77ECEc30",
      blockchainVerified: true,
      isEncrypted: false,
      isFavorite: true,
      createdAt: new Date("2024-11-01"),
      updatedAt: new Date("2024-12-05"),
      version: 7,
      shareCount: 15,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/8b5cf6/ffffff?text=API+Docs",
   },
   {
      id: "doc-6",
      title: "Security Audit Report",
      description: "Comprehensive security audit findings and recommendations",
      fileName: "security-audit-2024.pdf",
      fileSize: 4194304, // 4 MB
      mimeType: "application/pdf",
      ownerId: "user-1",
      owner: mockUsers[0],
      tags: ["security", "audit", "confidential"],
      blockchainHash: "0xeC1D6163E05b0Cc4f4e8a0c97c76c4e0f7EE4b51",
      blockchainVerified: true,
      isEncrypted: true,
      isFavorite: false,
      createdAt: new Date("2024-12-10"),
      updatedAt: new Date("2024-12-12"),
      version: 2,
      shareCount: 2,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/ef4444/ffffff?text=Security+Audit",
   },
   {
      id: "doc-7",
      title: "Marketing Strategy 2025",
      description: "Marketing and growth strategy for 2025",
      fileName: "marketing-strategy-2025.pptx",
      fileSize: 8388608, // 8 MB
      mimeType:
         "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ownerId: "user-2",
      owner: mockUsers[1],
      tags: ["marketing", "strategy", "2025"],
      blockchainVerified: false,
      isEncrypted: false,
      isFavorite: false,
      createdAt: new Date("2024-12-05"),
      updatedAt: new Date("2024-12-19"),
      version: 4,
      shareCount: 6,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/ec4899/ffffff?text=Marketing+Strategy",
   },
   {
      id: "doc-8",
      title: "Team Meeting Notes - Dec 2024",
      description: "Consolidated meeting notes from December 2024",
      fileName: "meeting-notes-dec-2024.txt",
      fileSize: 524288, // 512 KB
      mimeType: "text/plain",
      ownerId: "user-3",
      owner: mockUsers[2],
      tags: ["meeting-notes", "december", "team"],
      blockchainVerified: false,
      isEncrypted: false,
      isFavorite: true,
      createdAt: new Date("2024-12-01"),
      updatedAt: new Date("2024-12-22"),
      version: 8,
      shareCount: 12,
      thumbnailUrl:
         "https://via.placeholder.com/400x300/64748b/ffffff?text=Meeting+Notes",
   },
];

export const useDocumentStore = create<DocumentState>((set, get) => ({
   documents: mockDocuments,
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
