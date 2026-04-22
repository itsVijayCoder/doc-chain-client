"use client";

import { FC } from "react";
import { useSearchStore } from "@/lib/stores/searchStore";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   Grid3X3,
   List,
   Search,
   SortAsc,
   Sparkles,
   AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SearchResults Component
 * Displays search results in grid or list view with sorting
 * Follows Single Responsibility Principle - focused on results display
 */
export const SearchResults: FC = () => {
   const {
      query,
      results,
      isSearching,
      searchError,
      viewMode,
      sortBy,
      setViewMode,
      setSortBy,
   } = useSearchStore();

   // Handle document actions (these would integrate with document store)
   const handleView = (id: string) => {
      // Navigate to document detail page
      window.location.href = `/documents/${id}`;
   };

   const handleDownload = (id: string) => {
      console.log("Download document:", id);
   };

   const handleShare = (id: string) => {
      console.log("Share document:", id);
   };

   const handleDelete = (id: string) => {
      console.log("Delete document:", id);
   };

   const handleVerify = (id: string) => {
      console.log("Verify document:", id);
   };

   // Sort results based on current sort option
   const sortedResults = [...results].sort((a, b) => {
      switch (sortBy) {
         case "relevance":
            return b.score - a.score;
         case "date":
            return (
               new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );
         case "name":
            return a.title.localeCompare(b.title);
         case "size":
            return (b.fileSize ?? 0) - (a.fileSize ?? 0);
         default:
            return 0;
      }
   });

   // Loading state
   if (isSearching) {
      return (
         <div className='space-y-6'>
            {/* Search status */}
            <div className='flex items-center justify-between'>
               <div className='flex items-center gap-3'>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-primary' />
                  <p className='text-muted-foreground'>
                     Searching for "{query}"...
                  </p>
               </div>
            </div>

            {/* Loading skeleton */}
            <div
               className={cn(
                  "grid gap-4",
                  viewMode === "grid"
                     ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                     : "grid-cols-1"
               )}
            >
               {Array.from({ length: 8 }).map((_, i) => (
                  <div
                     key={i}
                     className='bg-card border rounded-lg p-4 animate-pulse'
                  >
                     <div className='h-4 bg-muted rounded mb-2' />
                     <div className='h-3 bg-muted rounded w-2/3 mb-4' />
                     <div className='flex gap-2'>
                        <div className='h-6 w-16 bg-muted rounded' />
                        <div className='h-6 w-12 bg-muted rounded' />
                     </div>
                  </div>
               ))}
            </div>
         </div>
      );
   }

   // Error state
   if (searchError) {
      return (
         <div className='text-center py-12'>
            <AlertCircle
               size={48}
               className='mx-auto mb-4 text-destructive opacity-50'
            />
            <h3 className='text-lg font-semibold mb-2'>Search Error</h3>
            <p className='text-muted-foreground mb-4'>{searchError}</p>
            <Button variant='outline' onClick={() => window.location.reload()}>
               Try Again
            </Button>
         </div>
      );
   }

   // No query state
   if (!query) {
      return (
         <div className='text-center py-12'>
            <Search
               size={48}
               className='mx-auto mb-4 text-muted-foreground opacity-50'
            />
            <h3 className='text-lg font-semibold mb-2'>Start Your Search</h3>
            <p className='text-muted-foreground'>
               Enter keywords to find your documents quickly
            </p>
         </div>
      );
   }

   // No results state
   if (results.length === 0) {
      return (
         <div className='text-center py-12'>
            <Search
               size={48}
               className='mx-auto mb-4 text-muted-foreground opacity-50'
            />
            <h3 className='text-lg font-semibold mb-2'>No Results Found</h3>
            <p className='text-muted-foreground mb-4'>
               No documents found for "{query}"
            </p>
            <div className='space-y-2 text-sm text-muted-foreground'>
               <p>Try:</p>
               <ul className='list-disc list-inside space-y-1'>
                  <li>Different keywords or phrases</li>
                  <li>Removing some filters</li>
                  <li>Checking spelling</li>
                  <li>Using broader search terms</li>
               </ul>
            </div>
         </div>
      );
   }

   // Results view
   return (
      <div className='space-y-6'>
         {/* Results header */}
         <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
               <div className='flex items-center gap-2'>
                  <Sparkles size={16} className='text-primary' />
                  <span className='font-medium'>
                     {results.length} result{results.length !== 1 ? "s" : ""}{" "}
                     for "{query}"
                  </span>
               </div>
               {results.some((r) => r.score > 0.8) && (
                  <Badge variant='secondary' className='ml-2'>
                     High relevance
                  </Badge>
               )}
            </div>

            <div className='flex items-center gap-2'>
               {/* Sort options */}
               <Select
                  value={sortBy}
                  onValueChange={(value) => value && setSortBy(value as any)}
               >
                  <SelectTrigger className='w-40'>
                     <SortAsc size={16} className='mr-2' />
                     <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value='relevance'>Relevance</SelectItem>
                     <SelectItem value='date'>Date Modified</SelectItem>
                     <SelectItem value='name'>Name</SelectItem>
                     <SelectItem value='size'>File Size</SelectItem>
                  </SelectContent>
               </Select>

               {/* View mode toggle */}
               <div className='flex border rounded-lg'>
                  <Button
                     variant={viewMode === "grid" ? "default" : "ghost"}
                     size='sm'
                     onClick={() => setViewMode("grid")}
                     className='rounded-r-none'
                  >
                     <Grid3X3 size={16} />
                  </Button>
                  <Button
                     variant={viewMode === "list" ? "default" : "ghost"}
                     size='sm'
                     onClick={() => setViewMode("list")}
                     className='rounded-l-none border-l'
                  >
                     <List size={16} />
                  </Button>
               </div>
            </div>
         </div>

         {/* Results grid/list */}
         <div
            className={cn(
               "grid gap-4",
               viewMode === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 max-w-4xl"
            )}
         >
            {sortedResults.map((document) => (
               <div key={document.id} className='relative'>
                  <DocumentCard
                     document={document}
                     onView={handleView}
                     onDownload={handleDownload}
                     onShare={handleShare}
                     onDelete={handleDelete}
                     onVerify={handleVerify}
                  />

                  {/* Search score indicator */}
                  {document.score > 0.8 && (
                     <Badge
                        className='absolute top-2 right-12 z-10'
                        variant='default'
                     >
                        <Sparkles size={10} className='mr-1' />
                        {Math.round(document.score * 100)}%
                     </Badge>
                  )}

                  {/* Highlight overlay for high-relevance results */}
                  {document.score > 0.9 && (
                     <div className='absolute inset-0 border-2 border-primary rounded-lg pointer-events-none opacity-20' />
                  )}
               </div>
            ))}
         </div>

         {/* Results summary */}
         <div className='text-center text-sm text-muted-foreground border-t pt-4'>
            Showing {results.length} result{results.length !== 1 ? "s" : ""}
            {results.length > 0 && (
               <>
                  {" • "}
                  Avg relevance:{" "}
                  {Math.round(
                     (results.reduce((sum, r) => sum + r.score, 0) /
                        results.length) *
                        100
                  )}
                  %
               </>
            )}
         </div>
      </div>
   );
};
