"use client";

import { FC, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDocumentStore } from "@/lib/stores/documentStore";
import {
   useAddFavorite,
   useArchiveDocument,
   useDocuments,
   useRemoveFavorite,
   useSoftDeleteDocument,
   useUnarchiveDocument,
   useUploadDocument,
} from "@/lib/hooks/useDocuments";
import type { ApiError } from "@/lib/types";
import { useToast } from "@/lib/hooks/useToast";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { DocumentList } from "@/components/documents/DocumentList";
import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { DocumentActions } from "@/components/documents/DocumentActions";
import { ShareModal } from "@/components/documents/sharing/ShareModal";
import { ShareDocument } from "@/components/documents/sharing/ShareDocument";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import type {
   DocumentSortBy,
   DocumentSortDir,
} from "@/lib/services/documentService";
import type { SortOption } from "@/lib/types/document";
import { PermissionLevel } from "@/components/documents/sharing/PermissionSelector";
import { ShareLinkSettings } from "@/components/documents/sharing/ShareLinkGenerator";

// Map frontend SortOption (UI control) → backend sort_by + sort_dir.
// Options the backend can't express (size-asc, ai-suggested) fall back to
// created_at desc; the UI will still render the chosen radio state.
function mapSort(sort: SortOption): {
   sortBy: DocumentSortBy;
   sortDir: DocumentSortDir;
} {
   switch (sort) {
      case "oldest":
         return { sortBy: "created_at", sortDir: "asc" };
      case "name-asc":
         return { sortBy: "title", sortDir: "asc" };
      case "name-desc":
         return { sortBy: "title", sortDir: "desc" };
      case "recent":
      default:
         return { sortBy: "created_at", sortDir: "desc" };
   }
}

const DocumentsPage: FC = () => {
   const router = useRouter();
   const toast = useToast();
   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
   const [shareModalOpen, setShareModalOpen] = useState(false);
   const [documentToShare, setDocumentToShare] = useState<string | null>(null);
   const [page, setPage] = useState(1);

   // Client-side UI state still lives in the store: filters, sort, view mode,
   // selection, legacy mutation actions. Real server data comes from TanStack
   // (see useDocuments below). Store's mock `documents` array is ignored here.
   const {
      filters,
      sortBy,
      viewMode,
      selectedDocuments,
      shares,
      setFilters,
      setSortBy,
      setViewMode,
      toggleSelectDocument,
      clearSelection,
      fetchShares,
      shareDocument,
      removeShare,
      generateShareLink,
   } = useDocumentStore();

   // Translate store's filter shape → backend query params.
   const documentsParams = useMemo(() => {
      const sort = mapSort(sortBy);
      return {
         page,
         pageSize: 20,
         sortBy: sort.sortBy,
         sortDir: sort.sortDir,
         search: filters.search || undefined,
         tag: filters.tags?.[0] || undefined,
      };
   }, [page, sortBy, filters.search, filters.tags]);

   const documentsQuery = useDocuments(documentsParams);
   const documents = documentsQuery.data?.documents ?? [];
   const meta = documentsQuery.data?.meta;
   const isLoading = documentsQuery.isLoading;

   const uploadMutation = useUploadDocument();
   const deleteMutation = useSoftDeleteDocument();
   const archiveMutation = useArchiveDocument();
   const unarchiveMutation = useUnarchiveDocument();
   const addFavoriteMutation = useAddFavorite();
   const removeFavoriteMutation = useRemoveFavorite();

   const handleView = (id: string) => {
      router.push(`/documents/${id}`);
   };

   const handleDownload = () => {
      toast.info("Download", "Not wired yet — coming in a later phase");
   };

   const handleShare = (id: string) => {
      setDocumentToShare(id);
      fetchShares(id);
      setShareModalOpen(true);
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm("Move this document to trash?")) return;
      try {
         await deleteMutation.mutateAsync(id);
         toast.success("Moved to trash");
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Delete failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleVerify = () => {
      toast.info("Verify", "Not wired yet — coming in the blockchain phase");
   };

   const handleFavoriteToggle = async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      try {
         if (doc.isFavorite) {
            await removeFavoriteMutation.mutateAsync(id);
            toast.success("Removed from favorites", `"${doc.title}"`);
         } else {
            await addFavoriteMutation.mutateAsync(id);
            toast.success("Added to favorites", `"${doc.title}"`);
         }
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error("Failed", apiErr?.message ?? "Try again");
      }
   };

   const handleArchiveToggle = async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const mutation = doc.isArchived ? unarchiveMutation : archiveMutation;
      const verb = doc.isArchived ? "Unarchived" : "Archived";
      try {
         await mutation.mutateAsync(id);
         toast.success(verb, `"${doc.title}"`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            `${doc.isArchived ? "Unarchive" : "Archive"} failed`,
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleBulkDownload = () => handleDownload();
   const handleBulkShare = () => toast.info("Bulk share", "Coming soon");
   const handleBulkVerify = () => handleVerify();

   const handleBulkDelete = async () => {
      const count = selectedDocuments.length;
      if (count === 0) return;
      if (
         !window.confirm(
            `Move ${count} document${count === 1 ? "" : "s"} to trash?`
         )
      ) {
         return;
      }
      const results = await Promise.allSettled(
         selectedDocuments.map((id) => deleteMutation.mutateAsync(id))
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - ok;
      clearSelection();
      if (failed === 0) {
         toast.success(`${ok} moved to trash`);
      } else if (ok === 0) {
         toast.error(`Failed to delete ${failed}`);
      } else {
         toast.error(`${ok} deleted, ${failed} failed`);
      }
   };

   const handleResetFilters = () => {
      setFilters({});
      setSortBy("recent");
      setPage(1);
   };

   return (
      <div className='container mx-auto p-6 space-y-6'>
         <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div>
               <h1 className='text-3xl font-bold tracking-tight'>Documents</h1>
               <p className='text-sm text-muted-foreground mt-1'>
                  Manage and organize your documents
                  {meta && meta.total > 0 && (
                     <span className='ml-2'>
                        · {meta.total} total
                     </span>
                  )}
               </p>
            </div>
         </div>

         <DocumentFilters
            filters={filters}
            sortBy={sortBy}
            onFiltersChange={(next) => {
               setFilters(next);
               setPage(1);
            }}
            onSortChange={(next) => {
               setSortBy(next);
               setPage(1);
            }}
            onReset={handleResetFilters}
         />

         <DocumentActions
            selectedCount={selectedDocuments.length}
            onUpload={() => setUploadDialogOpen(true)}
            onDownloadSelected={handleBulkDownload}
            onShareSelected={handleBulkShare}
            onDeleteSelected={handleBulkDelete}
            onVerifySelected={handleBulkVerify}
         />

         {documentsQuery.isError && (
            <div className='rounded-md border border-(--error)/40 bg-(--error)/5 p-4 text-sm'>
               <p className='font-medium'>Failed to load documents</p>
               <p className='text-muted-foreground'>
                  {documentsQuery.error?.message ?? "Unknown error"}
               </p>
            </div>
         )}

         <DocumentList
            documents={documents}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onView={handleView}
            onDownload={handleDownload}
            onShare={handleShare}
            onDelete={handleDelete}
            onVerify={handleVerify}
            onArchiveToggle={handleArchiveToggle}
            onFavoriteToggle={handleFavoriteToggle}
            selectedDocuments={selectedDocuments}
            onSelectDocument={toggleSelectDocument}
            isLoading={isLoading}
         />

         {meta && meta.total_pages > 1 && (
            <div className='flex items-center justify-between pt-2'>
               <p className='text-sm text-muted-foreground'>
                  Page {meta.page} of {meta.total_pages}
               </p>
               <div className='flex gap-2'>
                  <button
                     type='button'
                     className='px-3 py-1 text-sm rounded border hover:bg-accent disabled:opacity-50'
                     onClick={() => setPage((p) => Math.max(1, p - 1))}
                     disabled={page <= 1 || documentsQuery.isFetching}
                  >
                     Previous
                  </button>
                  <button
                     type='button'
                     className='px-3 py-1 text-sm rounded border hover:bg-accent disabled:opacity-50'
                     onClick={() =>
                        setPage((p) => Math.min(meta.total_pages, p + 1))
                     }
                     disabled={
                        page >= meta.total_pages || documentsQuery.isFetching
                     }
                  >
                     Next
                  </button>
               </div>
            </div>
         )}

         <Dialog
            open={uploadDialogOpen}
            onOpenChange={(open) => {
               // Prevent closing mid-upload so progress state stays coherent.
               if (!open && uploadMutation.isPending) return;
               setUploadDialogOpen(open);
            }}
         >
            <DialogContent className='max-w-2xl'>
               <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                     Add a new file to your library. Tags typed here are
                     ignored for now — tag picker comes in the next phase.
                  </DialogDescription>
               </DialogHeader>
               <DocumentUploader
                  onUpload={async (file, metadata) => {
                     try {
                        await uploadMutation.mutateAsync({
                           file,
                           metadata: {
                              title: metadata.title,
                              description: metadata.description,
                              // tagIds intentionally omitted — DocumentUploader
                              // collects free-text names; backend wants UUIDs.
                              // Wire when tag CRUD lands.
                           },
                        });
                        toast.success(
                           "Upload successful",
                           `"${metadata.title}" added`
                        );
                        setUploadDialogOpen(false);
                     } catch (err) {
                        const apiErr = err as ApiError;
                        toast.error(
                           "Upload failed",
                           apiErr?.details?.[0] ??
                              apiErr?.message ??
                              "Something went wrong"
                        );
                        throw err; // let DocumentUploader keep the file selected
                     }
                  }}
                  isUploading={uploadMutation.isPending}
                  progress={uploadMutation.progress}
               />
            </DialogContent>
         </Dialog>

         {documentToShare && (
            <ShareModal
               open={shareModalOpen}
               onOpenChange={setShareModalOpen}
               document={documents.find((d) => d.id === documentToShare)!}
            >
               <ShareDocument
                  document={documents.find((d) => d.id === documentToShare)!}
                  shares={shares}
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
                     } catch (error) {
                        toast.error(
                           "Failed to share document",
                           (error as Error).message
                        );
                     }
                  }}
                  onRemoveShare={async (shareId: string) => {
                     try {
                        await removeShare(shareId);
                        toast.success("Share removed successfully");
                        fetchShares(documentToShare);
                     } catch (error) {
                        toast.error(
                           "Failed to remove share",
                           (error as Error).message
                        );
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
                     } catch (error) {
                        toast.error(
                           "Failed to generate link",
                           (error as Error).message
                        );
                        throw error;
                     }
                  }}
                  onRevokeLink={async (linkId: string) => {
                     toast.success(`Share link ${linkId} revoked`);
                  }}
               />
            </ShareModal>
         )}
      </div>
   );
};

export default DocumentsPage;
