"use client";

import { FC, useEffect, useState } from "react";
import { useDocumentStore } from "@/lib/stores/documentStore";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
   Share2,
   Users,
   Eye,
   Edit,
   Download,
   Globe,
   Link,
   Copy,
   Grid3X3,
   List,
   Search,
   UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * SharedPage Component
 * Display documents shared with the current user
 * Follows Single Responsibility Principle - focused on shared document management
 */
const SharedPage: FC = () => {
   const { user } = useAuth();
   const { documents, isLoading, fetchDocuments } = useDocumentStore();

   const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
   const [sortBy, setSortBy] = useState<"recent" | "name" | "permission">(
      "recent"
   );
   const [permissionFilter, setPermissionFilter] = useState<
      "all" | "view" | "edit"
   >("all");

   // Filter documents shared with current user
   // For demo purposes, show docs that:
   // 1. User is not the owner
   // 2. Has been shared (shareCount > 0)
   const sharedDocuments = documents.filter((doc) => {
      return doc.ownerId !== user?.id && doc.shareCount > 0;
   });

   // Apply permission filter
   const filteredDocuments = sharedDocuments.filter((doc) => {
      if (permissionFilter === "all") return true;

      // For demo, assume view permission for docs with shareCount <= 2, edit for others
      const hasEditPermission = doc.shareCount > 2;
      return permissionFilter === "edit"
         ? hasEditPermission
         : !hasEditPermission;
   });

   // Sort shared documents
   const sortedDocuments = [...filteredDocuments].sort((a, b) => {
      switch (sortBy) {
         case "recent":
            return (
               new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
         case "name":
            return a.title.localeCompare(b.title);
         case "permission":
            // For demo, use shareCount as proxy for permission level
            const aPermission = a.shareCount > 2 ? "edit" : "view";
            const bPermission = b.shareCount > 2 ? "edit" : "view";
            return bPermission.localeCompare(aPermission);
         default:
            return 0;
      }
   });

   // Fetch documents on mount
   useEffect(() => {
      fetchDocuments();
   }, [fetchDocuments]);

   // Handle document actions based on permissions
   const handleView = (id: string) => {
      window.location.href = `/documents/${id}`;
   };

   const handleDownload = (id: string) => {
      console.log("Download shared document:", id);
   };

   const handleShare = (id: string) => {
      console.log("Share document:", id);
   };

   const handleEdit = (id: string) => {
      window.location.href = `/documents/${id}/edit`;
   };

   const handleCopyLink = async (id: string) => {
      const shareUrl = `${window.location.origin}/share/${id}`;
      try {
         await navigator.clipboard.writeText(shareUrl);
         console.log("Share link copied");
      } catch (error) {
         console.error("Failed to copy share link:", error);
      }
   };

   // Get user's permission for a document
   const getUserPermission = (documentId: string): "view" | "edit" | null => {
      const document = documents.find((d) => d.id === documentId);
      if (!document) return null;
      // For demo, assume edit permission for docs with shareCount > 2
      return document.shareCount > 2 ? "edit" : "view";
   };

   // Loading state
   if (isLoading) {
      return (
         <div className='container mx-auto p-6'>
            <div className='flex items-center justify-center h-64'>
               <div className='text-center'>
                  <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4' />
                  <p className='text-sm text-muted-foreground'>
                     Loading shared documents...
                  </p>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className='container mx-auto p-6 space-y-6'>
         {/* Header */}
         <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex items-center gap-4'>
               <div className='p-3 bg-primary/10 rounded-xl'>
                  <Share2 size={28} className='text-primary' />
               </div>
               <div>
                  <h1 className='text-3xl font-bold tracking-tight'>
                     Shared with Me
                  </h1>
                  <p className='text-sm text-muted-foreground mt-1'>
                     {filteredDocuments.length} document
                     {filteredDocuments.length !== 1 ? "s" : ""} shared with you
                  </p>
               </div>
            </div>

            {filteredDocuments.length > 0 && (
               <div className='flex items-center gap-2 flex-wrap'>
                  {/* Permission filter */}
                  <select
                     value={permissionFilter}
                     onChange={(e) =>
                        setPermissionFilter(e.target.value as any)
                     }
                     className='px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                  >
                     <option value='all'>All Permissions</option>
                     <option value='view'>View Only</option>
                     <option value='edit'>Can Edit</option>
                  </select>

                  {/* Sort dropdown */}
                  <select
                     value={sortBy}
                     onChange={(e) => setSortBy(e.target.value as any)}
                     className='px-3 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'
                  >
                     <option value='recent'>Recently Shared</option>
                     <option value='name'>Name</option>
                     <option value='permission'>Permission Level</option>
                  </select>

                  {/* View mode toggle */}
                  <div className='flex border rounded-lg overflow-hidden'>
                     <Button
                        variant={viewMode === "grid" ? "default" : "ghost"}
                        size='sm'
                        onClick={() => setViewMode("grid")}
                        className='rounded-none border-none'
                     >
                        <Grid3X3 size={16} />
                     </Button>
                     <Button
                        variant={viewMode === "list" ? "default" : "ghost"}
                        size='sm'
                        onClick={() => setViewMode("list")}
                        className='rounded-none border-l'
                     >
                        <List size={16} />
                     </Button>
                  </div>
               </div>
            )}
         </div>

         {/* Empty state */}
         {filteredDocuments.length === 0 && (
            <div className='flex items-center justify-center py-20'>
               <div className='text-center max-w-md'>
                  <div className='inline-flex items-center justify-center w-20 h-20 bg-muted rounded-full mb-6'>
                     <Share2 size={40} className='text-muted-foreground' />
                  </div>
                  <h3 className='text-2xl font-semibold mb-3'>
                     No Shared Documents
                  </h3>
                  <p className='text-muted-foreground mb-8 leading-relaxed'>
                     You don't have any documents shared with you yet. When
                     someone shares a document with you, it will appear here.
                  </p>
                  <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                     <Button
                        variant='default'
                        onClick={() => (window.location.href = "/documents")}
                     >
                        <Search size={16} className='mr-2' />
                        Browse Your Documents
                     </Button>
                     <Button
                        variant='outline'
                        onClick={() => (window.location.href = "/search")}
                     >
                        <Search size={16} className='mr-2' />
                        Search All Documents
                     </Button>
                  </div>
               </div>
            </div>
         )}

         {/* Shared Documents */}
         {filteredDocuments.length > 0 && (
            <div className='space-y-6'>
               {/* Quick stats */}
               <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                  <div className='bg-card border rounded-xl p-5 hover:shadow-md transition-shadow'>
                     <div className='flex items-start justify-between mb-3'>
                        <div className='p-2.5 bg-blue-500/10 rounded-lg'>
                           <Share2 size={20} className='text-blue-500' />
                        </div>
                     </div>
                     <p className='text-3xl font-bold mb-1'>
                        {sharedDocuments.length}
                     </p>
                     <p className='text-sm text-muted-foreground'>
                        Total Shared
                     </p>
                  </div>

                  <div className='bg-card border rounded-xl p-5 hover:shadow-md transition-shadow'>
                     <div className='flex items-start justify-between mb-3'>
                        <div className='p-2.5 bg-green-500/10 rounded-lg'>
                           <Eye size={20} className='text-green-500' />
                        </div>
                     </div>
                     <p className='text-3xl font-bold mb-1'>
                        {
                           sharedDocuments.filter((d) => d.shareCount <= 2)
                              .length
                        }
                     </p>
                     <p className='text-sm text-muted-foreground'>View Only</p>
                  </div>

                  <div className='bg-card border rounded-xl p-5 hover:shadow-md transition-shadow'>
                     <div className='flex items-start justify-between mb-3'>
                        <div className='p-2.5 bg-purple-500/10 rounded-lg'>
                           <Edit size={20} className='text-purple-500' />
                        </div>
                     </div>
                     <p className='text-3xl font-bold mb-1'>
                        {sharedDocuments.filter((d) => d.shareCount > 2).length}
                     </p>
                     <p className='text-sm text-muted-foreground'>Can Edit</p>
                  </div>

                  <div className='bg-card border rounded-xl p-5 hover:shadow-md transition-shadow'>
                     <div className='flex items-start justify-between mb-3'>
                        <div className='p-2.5 bg-orange-500/10 rounded-lg'>
                           <UserCheck size={20} className='text-orange-500' />
                        </div>
                     </div>
                     <p className='text-3xl font-bold mb-1'>
                        {new Set(sharedDocuments.map((d) => d.ownerId)).size}
                     </p>
                     <p className='text-sm text-muted-foreground'>Sharers</p>
                  </div>
               </div>

               {/* Documents Grid/List */}
               <div
                  className={cn(
                     "grid gap-6",
                     viewMode === "grid"
                        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1 max-w-4xl mx-auto"
                  )}
               >
                  {sortedDocuments.map((document) => {
                     const userPermission = getUserPermission(document.id);

                     return (
                        <div key={document.id} className='relative group'>
                           {/* Permission badge - positioned outside card */}
                           <div className='absolute -top-2 -left-2 z-20'>
                              <Badge
                                 variant={
                                    userPermission === "edit"
                                       ? "default"
                                       : "secondary"
                                 }
                                 className='shadow-md'
                              >
                                 {userPermission === "edit" ? (
                                    <>
                                       <Edit size={12} className='mr-1' /> Edit
                                    </>
                                 ) : (
                                    <>
                                       <Eye size={12} className='mr-1' /> View
                                    </>
                                 )}
                              </Badge>
                           </div>

                           <DocumentCard
                              document={document}
                              onView={handleView}
                              onDownload={handleDownload}
                              onShare={handleShare}
                              onDelete={() => {}} // Shared docs can't be deleted by viewers
                              onVerify={() => {}}
                           />

                           {/* Quick actions */}
                           <div className='absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1.5'>
                              <Button
                                 variant='secondary'
                                 size='sm'
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLink(document.id);
                                 }}
                                 className='h-8 w-8 p-0 shadow-md'
                                 title='Copy link'
                              >
                                 <Copy size={14} />
                              </Button>

                              {userPermission === "edit" && (
                                 <Button
                                    variant='default'
                                    size='sm'
                                    onClick={(e) => {
                                       e.stopPropagation();
                                       handleEdit(document.id);
                                    }}
                                    className='h-8 w-8 p-0 shadow-md'
                                    title='Edit document'
                                 >
                                    <Edit size={14} />
                                 </Button>
                              )}
                           </div>

                           {/* Owner info */}
                           <div className='absolute bottom-2 left-2 right-2 z-10'>
                              <div className='bg-background/95 backdrop-blur-sm border text-xs px-3 py-1.5 rounded-lg flex items-center gap-2'>
                                 <Users
                                    size={12}
                                    className='text-muted-foreground'
                                 />
                                 <span className='text-muted-foreground truncate'>
                                    Shared by{" "}
                                    <span className='font-medium text-foreground'>
                                       {document.owner.name}
                                    </span>
                                 </span>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* Bottom actions */}
               <div className='flex justify-center pt-8 border-t'>
                  <div className='flex flex-wrap gap-3 justify-center'>
                     <Button
                        variant='outline'
                        onClick={() => (window.location.href = "/documents")}
                     >
                        Your Documents
                     </Button>
                     <Button
                        variant='outline'
                        onClick={() => (window.location.href = "/search")}
                     >
                        <Search size={16} className='mr-2' />
                        Search
                     </Button>
                     <Button
                        variant='default'
                        onClick={() => (window.location.href = "/share/create")}
                     >
                        <Share2 size={16} className='mr-2' />
                        Share Documents
                     </Button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default SharedPage;
