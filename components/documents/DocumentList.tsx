"use client";

import { FC } from "react";
import { Document } from "@/lib/types/document";
import { DocumentCard } from "./DocumentCard";
import { Grid, List as ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DocumentListProps {
   documents: Document[];
   viewMode: "grid" | "list";
   onViewModeChange: (mode: "grid" | "list") => void;
   onView: (id: string) => void;
   onDownload: (id: string) => void;
   onShare: (id: string) => void;
   onDelete: (id: string) => void;
   onVerify?: (id: string) => void;
   onArchiveToggle?: (id: string) => void;
   onFavoriteToggle?: (id: string) => void;
   selectedDocuments?: string[];
   onSelectDocument?: (id: string) => void;
   isLoading?: boolean;
}

/**
 * DocumentList Component
 * Displays a list/grid of documents
 * Follows KISS principle - simple list rendering with view mode toggle
 */
export const DocumentList: FC<DocumentListProps> = ({
   documents,
   viewMode,
   onViewModeChange,
   onView,
   onDownload,
   onShare,
   onDelete,
   onVerify,
   onArchiveToggle,
   onFavoriteToggle,
   selectedDocuments = [],
   onSelectDocument,
   isLoading = false,
}) => {
   if (isLoading) {
      return (
         <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
               <div className='inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
               <p className='text-sm text-muted-foreground mt-2'>
                  Loading documents...
               </p>
            </div>
         </div>
      );
   }

   if (documents.length === 0) {
      return (
         <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
               <p className='text-lg font-medium'>No documents found</p>
               <p className='text-sm text-muted-foreground mt-1'>
                  Upload your first document to get started
               </p>
            </div>
         </div>
      );
   }

   return (
      <div className='space-y-4'>
         {/* View Mode Toggle */}
         <div className='flex justify-end'>
            <div className='inline-flex rounded-lg border p-1'>
               <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => onViewModeChange("grid")}
                  className='px-3'
               >
                  <Grid size={16} />
               </Button>
               <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => onViewModeChange("list")}
                  className='px-3'
               >
                  <ListIcon size={16} />
               </Button>
            </div>
         </div>

         {/* Documents Grid/List */}
         <div
            className={cn(
               viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  : "space-y-2"
            )}
         >
            {documents.map((document) => (
               <DocumentCard
                  key={document.id}
                  document={document}
                  onView={onView}
                  onDownload={onDownload}
                  onShare={onShare}
                  onDelete={onDelete}
                  onVerify={onVerify}
                  onArchiveToggle={onArchiveToggle}
                  onFavoriteToggle={onFavoriteToggle}
                  selected={selectedDocuments.includes(document.id)}
                  onSelect={onSelectDocument}
               />
            ))}
         </div>
      </div>
   );
};
