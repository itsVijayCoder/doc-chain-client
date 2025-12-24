"use client";

import { FC, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocumentStore } from "@/lib/stores/documentStore";
import { useToast } from "@/lib/hooks/useToast";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { DocumentActions } from "@/components/documents/DocumentActions";
import { ShareModal } from "@/components/documents/sharing/ShareModal";
import { ShareDocument } from "@/components/documents/sharing/ShareDocument";
import { Button } from "@/components/ui/button";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { User } from "@/lib/types/user";
import { PermissionLevel } from "@/components/documents/sharing/PermissionSelector";
import { ShareLinkSettings } from "@/components/documents/sharing/ShareLinkGenerator";

// Mock users for sharing (will be replaced with real API)
const MOCK_USERS: User[] = [
   {
      id: "user-1",
      email: "john.doe@example.com",
      name: "John Doe",
      role: "editor",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      isActive: true,
   },
   {
      id: "user-2",
      email: "jane.smith@example.com",
      name: "Jane Smith",
      role: "viewer",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      isActive: true,
   },
   {
      id: "user-3",
      email: "bob.johnson@example.com",
      name: "Bob Johnson",
      role: "admin",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      isActive: true,
   },
];

/**
 * DocumentsPage Component
 * Main documents management page
 * Follows Single Responsibility Principle - orchestrates document components
 * Follows DRY Principle - reuses components, no duplicated logic
 */
const DocumentsPage: FC = () => {
   const router = useRouter();
   const toast = useToast();
   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
   const [shareModalOpen, setShareModalOpen] = useState(false);
   const [documentToShare, setDocumentToShare] = useState<string | null>(null);

   const {
      documents,
      filters,
      sortBy,
      viewMode,
      selectedDocuments,
      shares,
      isLoading,
      isUploading,
      uploadProgress,
      fetchDocuments,
      fetchShares,
      uploadDocument,
      setFilters,
      setSortBy,
      setViewMode,
      toggleSelectDocument,
      selectAll,
      clearSelection,
      deleteDocument,
      deleteMultiple,
      verifyBlockchain,
      shareDocument,
      removeShare,
      generateShareLink,
   } = useDocumentStore();

   // Fetch documents on mount and when filters/sort change
   useEffect(() => {
      fetchDocuments(filters);
   }, [filters, sortBy, fetchDocuments]);

   // Handle document upload
   const handleUpload = async (file: File, metadata: any) => {
      try {
         await uploadDocument(file, metadata);
         setUploadDialogOpen(false);
         toast.success("Upload successful", "Document uploaded successfully");
      } catch (error: any) {
         toast.error(
            "Upload failed",
            error.message || "Failed to upload document"
         );
      }
   };

   // Handle document view
   const handleView = (id: string) => {
      router.push(`/documents/${id}`);
   };

   // Handle document download
   const handleDownload = async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (doc?.downloadUrl) {
         window.open(doc.downloadUrl, "_blank");
         toast.success("Download started");
      } else {
         toast.error("Download failed", "Download URL not available");
      }
   };

   // Handle document share
   const handleShare = (id: string) => {
      setDocumentToShare(id);
      fetchShares(id);
      setShareModalOpen(true);
   };

   // Handle document delete
   const handleDelete = async (id: string) => {
      if (confirm("Are you sure you want to delete this document?")) {
         try {
            await deleteDocument(id);
            toast.success("Document deleted");
         } catch (error: any) {
            toast.error("Delete failed", error.message);
         }
      }
   };

   // Handle blockchain verification
   const handleVerify = async (id: string) => {
      try {
         await verifyBlockchain(id);
         toast.success(
            "Verification started",
            "Document is being verified on blockchain"
         );
      } catch (error: any) {
         toast.error("Verification failed", error.message);
      }
   };

   // Handle bulk actions
   const handleBulkDownload = () => {
      selectedDocuments.forEach((id) => handleDownload(id));
   };

   const handleBulkShare = () => {
      // Navigate to bulk share interface (to be implemented)
      toast.info("Bulk share", "Feature coming soon");
   };

   const handleBulkDelete = async () => {
      if (
         confirm(
            `Are you sure you want to delete ${selectedDocuments.length} document(s)?`
         )
      ) {
         try {
            await deleteMultiple(selectedDocuments);
            toast.success(`${selectedDocuments.length} document(s) deleted`);
         } catch (error: any) {
            toast.error("Delete failed", error.message);
         }
      }
   };

   const handleBulkVerify = async () => {
      try {
         for (const id of selectedDocuments) {
            await verifyBlockchain(id);
         }
         toast.success(
            "Verification started",
            `${selectedDocuments.length} document(s) are being verified`
         );
      } catch (error: any) {
         toast.error("Verification failed", error.message);
      }
   };

   // Handle filter reset
   const handleResetFilters = () => {
      setFilters({});
      setSortBy("recent");
   };

   return (
      <div className='container mx-auto p-6 space-y-6'>
         {/* Header */}
         <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
               <h1 className='text-3xl font-bold tracking-tight'>Documents</h1>
               <p className='text-sm text-muted-foreground mt-1'>
                  Manage and organize your documents
               </p>
            </div>
         </div>

         {/* Filters */}
         <DocumentFilters
            filters={filters}
            sortBy={sortBy}
            onFiltersChange={setFilters}
            onSortChange={setSortBy}
            onReset={handleResetFilters}
         />

         {/* Actions Bar */}
         <DocumentActions
            selectedCount={selectedDocuments.length}
            onUpload={() => setUploadDialogOpen(true)}
            onDownloadSelected={handleBulkDownload}
            onShareSelected={handleBulkShare}
            onDeleteSelected={handleBulkDelete}
            onVerifySelected={handleBulkVerify}
         />

         {/* Documents List */}
         <DocumentList
            documents={documents}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onView={handleView}
            onDownload={handleDownload}
            onShare={handleShare}
            onDelete={handleDelete}
            onVerify={handleVerify}
            selectedDocuments={selectedDocuments}
            onSelectDocument={toggleSelectDocument}
            isLoading={isLoading}
         />

         {/* Upload Dialog */}
         <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogContent className='max-w-2xl'>
               <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                     Upload a new document to your DocChain storage
                  </DialogDescription>
               </DialogHeader>
               <DocumentUploader
                  onUpload={handleUpload}
                  isUploading={isUploading}
                  progress={uploadProgress}
               />
            </DialogContent>
         </Dialog>

         {/* Share Modal */}
         {documentToShare && (
            <ShareModal
               open={shareModalOpen}
               onOpenChange={setShareModalOpen}
               document={documents.find((d) => d.id === documentToShare)!}
            >
               <ShareDocument
                  document={documents.find((d) => d.id === documentToShare)!}
                  shares={shares}
                  availableUsers={MOCK_USERS}
                  onShare={async (
                     userId: string,
                     permission: PermissionLevel
                  ) => {
                     try {
                        await shareDocument(
                           documentToShare,
                           userId,
                           permission
                        );
                        toast.success("Document shared successfully");
                        fetchShares(documentToShare);
                     } catch (error: any) {
                        toast.error("Failed to share document", error.message);
                     }
                  }}
                  onRemoveShare={async (shareId: string) => {
                     try {
                        await removeShare(shareId);
                        toast.success("Share removed successfully");
                        fetchShares(documentToShare);
                     } catch (error: any) {
                        toast.error("Failed to remove share", error.message);
                     }
                  }}
                  onGenerateLink={async (settings: ShareLinkSettings) => {
                     try {
                        const permission =
                           settings.permission === "admin"
                              ? "edit"
                              : settings.permission;
                        const link = await generateShareLink(documentToShare, {
                           permission,
                           expiresAt: settings.expiresAt,
                           password: settings.requirePassword
                              ? settings.password
                              : undefined,
                           allowDownload: settings.allowDownload,
                           blockchainAudit: settings.blockchainAudit ?? false,
                        });
                        toast.success("Share link generated");
                        return { id: link.id, url: link.url };
                     } catch (error: any) {
                        toast.error("Failed to generate link", error.message);
                        throw error;
                     }
                  }}
                  onRevokeLink={async (linkId: string) => {
                     try {
                        console.log("Revoke link:", linkId);
                        toast.success("Share link revoked");
                     } catch (error: any) {
                        toast.error("Failed to revoke link", error.message);
                     }
                  }}
               />
            </ShareModal>
         )}
      </div>
   );
};

export default DocumentsPage;
