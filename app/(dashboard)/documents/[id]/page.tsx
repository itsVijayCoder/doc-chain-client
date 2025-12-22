"use client";

import { FC, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useDocumentStore } from "@/lib/stores/documentStore";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
   ArrowLeft,
   Download,
   Share2,
   Trash2,
   Shield,
   Lock,
   File,
   Clock,
   User,
   Tag,
   MessageSquare,
   History,
} from "lucide-react";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { ShareDocument } from "@/components/documents/sharing/ShareDocument";
import { User as UserType } from "@/lib/types/user";
import { PermissionLevel } from "@/components/documents/sharing/PermissionSelector";
import { ShareLinkSettings } from "@/components/documents/sharing/ShareLinkGenerator";

// Mock users for sharing (will be replaced with real API)
const MOCK_USERS: UserType[] = [
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
 * DocumentDetailPage Component
 * Displays detailed information about a single document
 * Follows Single Responsibility Principle - focuses on document detail display
 */
const DocumentDetailPage: FC = () => {
   const router = useRouter();
   const params = useParams();
   const searchParams = useSearchParams();
   const toast = useToast();
   const documentId = params.id as string;
   const activeTab = searchParams.get("tab") || "details";

   const {
      currentDocument: document,
      versions,
      comments,
      shares,
      isLoading,
      fetchDocument,
      fetchVersions,
      fetchComments,
      fetchShares,
      deleteDocument,
      verifyBlockchain,
      shareDocument,
      removeShare,
      generateShareLink,
   } = useDocumentStore();

   const [isDeleting, setIsDeleting] = useState(false);

   // Fetch document data
   useEffect(() => {
      if (documentId) {
         fetchDocument(documentId);
         fetchVersions(documentId);
         fetchComments(documentId);
         fetchShares(documentId);
      }
   }, [documentId, fetchDocument, fetchVersions, fetchComments, fetchShares]);

   // Handle document download
   const handleDownload = () => {
      if (document?.downloadUrl) {
         window.open(document.downloadUrl, "_blank");
         toast.success("Download started");
      } else {
         toast.error("Download failed", "Download URL not available");
      }
   };

   // Handle document share
   const handleShare = () => {
      // Navigate to share tab
      router.push(`/documents/${documentId}?tab=share`);
   };

   // Handle document delete
   const handleDelete = async () => {
      if (!document) return;

      if (confirm("Are you sure you want to delete this document?")) {
         setIsDeleting(true);
         try {
            await deleteDocument(document.id);
            toast.success("Document deleted");
            router.push("/documents");
         } catch (error: any) {
            toast.error("Delete failed", error.message);
            setIsDeleting(false);
         }
      }
   };

   // Handle blockchain verification
   const handleVerify = async () => {
      if (!document) return;

      try {
         await verifyBlockchain(document.id);
         toast.success(
            "Verification started",
            "Document is being verified on blockchain"
         );
      } catch (error: any) {
         toast.error("Verification failed", error.message);
      }
   };

   if (isLoading) {
      return (
         <div className='container mx-auto p-6'>
            <div className='flex items-center justify-center h-64'>
               <div className='text-center'>
                  <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
                  <p className='text-sm text-muted-foreground mt-2'>
                     Loading document...
                  </p>
               </div>
            </div>
         </div>
      );
   }

   if (!document) {
      return (
         <div className='container mx-auto p-6'>
            <div className='flex items-center justify-center h-64'>
               <div className='text-center'>
                  <p className='text-lg font-medium'>Document not found</p>
                  <Button
                     variant='outline'
                     onClick={() => router.push("/documents")}
                     className='mt-4'
                  >
                     Back to Documents
                  </Button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className='container mx-auto p-6 space-y-6'>
         {/* Header */}
         <div className='flex items-start justify-between gap-4'>
            <div className='flex-1'>
               <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => router.push("/documents")}
                  className='mb-2'
               >
                  <ArrowLeft size={16} className='mr-2' />
                  Back to Documents
               </Button>
               <h1 className='text-3xl font-bold'>{document.title}</h1>
               {document.description && (
                  <p className='text-muted-foreground mt-2'>
                     {document.description}
                  </p>
               )}
            </div>

            {/* Action Buttons */}
            <div className='flex items-center gap-2'>
               <Button variant='outline' onClick={handleDownload}>
                  <Download size={16} className='mr-2' />
                  Download
               </Button>
               <Button variant='outline' onClick={handleShare}>
                  <Share2 size={16} className='mr-2' />
                  Share
               </Button>
               {!document.blockchainVerified && (
                  <Button variant='outline' onClick={handleVerify}>
                     <Shield size={16} className='mr-2' />
                     Verify
                  </Button>
               )}
               <Button
                  variant='destructive'
                  onClick={handleDelete}
                  disabled={isDeleting}
               >
                  <Trash2 size={16} className='mr-2' />
                  Delete
               </Button>
            </div>
         </div>

         {/* Status Badges */}
         <div className='flex items-center gap-2 flex-wrap'>
            <Badge variant='secondary'>
               <File size={12} className='mr-1' />
               {document.mimeType}
            </Badge>
            <Badge variant='secondary'>{formatBytes(document.fileSize)}</Badge>
            {document.blockchainVerified && (
               <Badge variant='default'>
                  <Shield size={12} className='mr-1' />
                  Blockchain Verified
               </Badge>
            )}
            {document.isEncrypted && (
               <Badge variant='secondary'>
                  <Lock size={12} className='mr-1' />
                  Encrypted
               </Badge>
            )}
            <Badge variant='outline'>
               <Share2 size={12} className='mr-1' />
               {document.shareCount} Share{document.shareCount !== 1 ? "s" : ""}
            </Badge>
         </div>

         {/* Tabs */}
         <Tabs
            value={activeTab}
            onValueChange={(v) =>
               router.push(`/documents/${documentId}?tab=${v}`)
            }
         >
            <TabsList>
               <TabsTrigger value='details'>Details</TabsTrigger>
               <TabsTrigger value='versions'>
                  Versions ({versions.length})
               </TabsTrigger>
               <TabsTrigger value='comments'>
                  Comments ({comments.length})
               </TabsTrigger>
               <TabsTrigger value='share'>
                  Sharing ({shares.length})
               </TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value='details' className='space-y-6'>
               <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Metadata */}
                  <div className='space-y-4'>
                     <h3 className='font-semibold text-lg'>Metadata</h3>
                     <div className='space-y-3 text-sm'>
                        <div className='flex items-start gap-3'>
                           <User
                              size={16}
                              className='text-muted-foreground mt-0.5'
                           />
                           <div>
                              <p className='text-muted-foreground'>Owner</p>
                              <p className='font-medium'>
                                 {document.owner.name}
                              </p>
                           </div>
                        </div>
                        <div className='flex items-start gap-3'>
                           <Clock
                              size={16}
                              className='text-muted-foreground mt-0.5'
                           />
                           <div>
                              <p className='text-muted-foreground'>Created</p>
                              <p className='font-medium'>
                                 {formatRelativeTime(document.createdAt)}
                              </p>
                           </div>
                        </div>
                        <div className='flex items-start gap-3'>
                           <Clock
                              size={16}
                              className='text-muted-foreground mt-0.5'
                           />
                           <div>
                              <p className='text-muted-foreground'>
                                 Last Modified
                              </p>
                              <p className='font-medium'>
                                 {formatRelativeTime(document.updatedAt)}
                              </p>
                           </div>
                        </div>
                        <div className='flex items-start gap-3'>
                           <Tag
                              size={16}
                              className='text-muted-foreground mt-0.5'
                           />
                           <div className='flex-1'>
                              <p className='text-muted-foreground mb-1'>Tags</p>
                              {document.tags.length > 0 ? (
                                 <div className='flex flex-wrap gap-1'>
                                    {document.tags.map((tag) => (
                                       <Badge key={tag} variant='secondary'>
                                          {tag}
                                       </Badge>
                                    ))}
                                 </div>
                              ) : (
                                 <p className='text-sm text-muted-foreground'>
                                    No tags
                                 </p>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Blockchain Info */}
                  {document.blockchainVerified && document.blockchainHash && (
                     <div className='space-y-4'>
                        <h3 className='font-semibold text-lg'>
                           Blockchain Info
                        </h3>
                        <div className='space-y-3 text-sm'>
                           <div>
                              <p className='text-muted-foreground'>Hash</p>
                              <p className='font-mono text-xs break-all mt-1'>
                                 {document.blockchainHash}
                              </p>
                           </div>
                           <div>
                              <p className='text-muted-foreground'>Status</p>
                              <Badge variant='default' className='mt-1'>
                                 <Shield size={12} className='mr-1' />
                                 Verified
                              </Badge>
                           </div>
                        </div>
                     </div>
                  )}
               </div>

               {/* Preview Section */}
               {document.thumbnailUrl && (
                  <div>
                     <h3 className='font-semibold text-lg mb-4'>Preview</h3>
                     <div className='border rounded-lg p-4 bg-muted/50'>
                        <img
                           src={document.thumbnailUrl}
                           alt={document.title}
                           className='max-w-full h-auto rounded'
                        />
                     </div>
                  </div>
               )}
            </TabsContent>

            {/* Versions Tab */}
            <TabsContent value='versions'>
               <div className='space-y-4'>
                  <h3 className='font-semibold text-lg'>Version History</h3>
                  {versions.length === 0 ? (
                     <p className='text-muted-foreground'>
                        No version history available
                     </p>
                  ) : (
                     <div className='space-y-2'>
                        {versions.map((version) => (
                           <div
                              key={version.id}
                              className='border rounded-lg p-4 hover:bg-muted/50 transition-colors'
                           >
                              <div className='flex items-center justify-between'>
                                 <div className='flex items-center gap-3'>
                                    <History
                                       size={16}
                                       className='text-muted-foreground'
                                    />
                                    <div>
                                       <p className='font-medium'>
                                          Version {version.version}
                                       </p>
                                       <p className='text-sm text-muted-foreground'>
                                          {formatRelativeTime(
                                             version.createdAt
                                          )}{" "}
                                          by {version.createdBy.name}
                                       </p>
                                    </div>
                                 </div>
                                 <Badge variant='secondary'>
                                    {formatBytes(version.fileSize)}
                                 </Badge>
                              </div>
                              {version.changes && (
                                 <p className='text-sm text-muted-foreground mt-2'>
                                    {version.changes}
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value='comments'>
               <div className='space-y-4'>
                  <h3 className='font-semibold text-lg'>Comments</h3>
                  {comments.length === 0 ? (
                     <p className='text-muted-foreground'>No comments yet</p>
                  ) : (
                     <div className='space-y-4'>
                        {comments.map((comment) => (
                           <div
                              key={comment.id}
                              className='border rounded-lg p-4'
                           >
                              <div className='flex items-start gap-3'>
                                 <MessageSquare
                                    size={16}
                                    className='text-muted-foreground mt-1'
                                 />
                                 <div className='flex-1'>
                                    <div className='flex items-center justify-between'>
                                       <p className='font-medium'>
                                          {comment.user.name}
                                       </p>
                                       <p className='text-xs text-muted-foreground'>
                                          {formatRelativeTime(
                                             comment.createdAt
                                          )}
                                       </p>
                                    </div>
                                    <p className='text-sm mt-1'>
                                       {comment.text}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value='share'>
               {document && (
                  <ShareDocument
                     document={document}
                     shares={shares}
                     availableUsers={MOCK_USERS}
                     onShare={async (
                        userId: string,
                        permission: PermissionLevel
                     ) => {
                        try {
                           await shareDocument(documentId, userId, permission);
                           toast.success("Document shared successfully");
                           fetchShares(documentId);
                        } catch (error: any) {
                           toast.error(
                              "Failed to share document",
                              error.message
                           );
                        }
                     }}
                     onRemoveShare={async (shareId: string) => {
                        try {
                           await removeShare(shareId);
                           toast.success("Share removed successfully");
                           fetchShares(documentId);
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
                           const link = await generateShareLink(documentId, {
                              permission,
                              expiresAt: settings.expiresAt,
                              password: settings.requirePassword
                                 ? settings.password
                                 : undefined,
                              allowDownload: settings.allowDownload,
                              blockchainAudit:
                                 settings.blockchainAudit ?? false,
                           });
                           toast.success("Share link generated");
                           return { id: link.id, url: link.url };
                        } catch (error: any) {
                           toast.error(
                              "Failed to generate link",
                              error.message
                           );
                           throw error;
                        }
                     }}
                     onRevokeLink={async (linkId: string) => {
                        try {
                           // TODO: Implement revoke link API
                           console.log("Revoke link:", linkId);
                           toast.success("Share link revoked");
                        } catch (error: any) {
                           toast.error("Failed to revoke link", error.message);
                        }
                     }}
                  />
               )}
            </TabsContent>
         </Tabs>
      </div>
   );
};

export default DocumentDetailPage;
