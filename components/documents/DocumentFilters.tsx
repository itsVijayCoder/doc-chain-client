"use client";

import { FC, useState } from "react";
import {
   DocumentFilters as DocumentFiltersType,
   SortOption,
} from "@/lib/types/document";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
   DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
   Search,
   Filter,
   X,
   SortAsc,
   SortDesc,
   Calendar,
   Tag,
   Shield,
   Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentFiltersProps {
   filters: DocumentFiltersType;
   sortBy: SortOption;
   onFiltersChange: (filters: DocumentFiltersType) => void;
   onSortChange: (sort: SortOption) => void;
   onReset: () => void;
}

const DOCUMENT_TYPES = ["pdf", "doc", "docx", "txt", "image"];

/**
 * DocumentFilters Component
 * Provides filtering and sorting options for documents
 * Follows Single Responsibility Principle - only handles filtering UI
 */
export const DocumentFilters: FC<DocumentFiltersProps> = ({
   filters,
   sortBy,
   onFiltersChange,
   onSortChange,
   onReset,
}) => {
   const [searchQuery, setSearchQuery] = useState(filters.search || "");
   const [tagInput, setTagInput] = useState("");

   const handleSearchChange = (value: string) => {
      setSearchQuery(value);
      onFiltersChange({ ...filters, search: value || undefined });
   };

   const handleAddTag = () => {
      if (tagInput.trim() && !filters.tags?.includes(tagInput.trim())) {
         onFiltersChange({
            ...filters,
            tags: [...(filters.tags || []), tagInput.trim()],
         });
         setTagInput("");
      }
   };

   const handleRemoveTag = (tag: string) => {
      onFiltersChange({
         ...filters,
         tags: filters.tags?.filter((t) => t !== tag),
      });
   };

   const toggleDocumentType = (type: string) => {
      const currentTypes = filters.type || [];
      const newTypes = currentTypes.includes(type)
         ? currentTypes.filter((t) => t !== type)
         : [...currentTypes, type];

      onFiltersChange({
         ...filters,
         type: newTypes.length > 0 ? newTypes : undefined,
      });
   };

   const toggleBlockchainVerified = () => {
      onFiltersChange({
         ...filters,
         blockchainVerified:
            filters.blockchainVerified === undefined
               ? true
               : filters.blockchainVerified
               ? false
               : undefined,
      });
   };

   const toggleEncrypted = () => {
      onFiltersChange({
         ...filters,
         isEncrypted:
            filters.isEncrypted === undefined
               ? true
               : filters.isEncrypted
               ? false
               : undefined,
      });
   };

   const toggleFavorite = () => {
      onFiltersChange({
         ...filters,
         isFavorite:
            filters.isFavorite === undefined
               ? true
               : filters.isFavorite
               ? false
               : undefined,
      });
   };

   const activeFiltersCount = [
      filters.type?.length || 0,
      filters.tags?.length || 0,
      filters.blockchainVerified !== undefined ? 1 : 0,
      filters.isEncrypted !== undefined ? 1 : 0,
      filters.isFavorite !== undefined ? 1 : 0,
      filters.dateFrom ? 1 : 0,
      filters.dateTo ? 1 : 0,
   ].reduce((a, b) => a + b, 0);

   return (
      <div className='space-y-4'>
         {/* Search Bar */}
         <div className='relative'>
            <Search
               size={18}
               className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
            />
            <Input
               type='search'
               placeholder='Search documents...'
               value={searchQuery}
               onChange={(e) => handleSearchChange(e.target.value)}
               className='pl-10 pr-10'
            />
            {searchQuery && (
               <Button
                  variant='ghost'
                  size='icon'
                  className='absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8'
                  onClick={() => handleSearchChange("")}
               >
                  <X size={16} />
               </Button>
            )}
         </div>

         {/* Filter and Sort Controls */}
         <div className='flex items-center gap-2 flex-wrap'>
            {/* Filters Dropdown */}
            <DropdownMenu>
               <DropdownMenuTrigger className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'>
                  <Filter size={16} />
                  Filters
                  {activeFiltersCount > 0 && (
                     <Badge
                        variant='default'
                        className='ml-1 px-1.5 min-w-5 h-5'
                     >
                        {activeFiltersCount}
                     </Badge>
                  )}
               </DropdownMenuTrigger>
               <DropdownMenuContent align='start' className='w-64'>
                  <DropdownMenuLabel>File Types</DropdownMenuLabel>
                  {DOCUMENT_TYPES.map((type) => (
                     <DropdownMenuCheckboxItem
                        key={type}
                        checked={filters.type?.includes(type)}
                        onCheckedChange={() => toggleDocumentType(type)}
                     >
                        {type.toUpperCase()}
                     </DropdownMenuCheckboxItem>
                  ))}

                  <DropdownMenuSeparator />

                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                     checked={filters.blockchainVerified === true}
                     onCheckedChange={toggleBlockchainVerified}
                  >
                     <Shield size={14} className='mr-2' />
                     Blockchain Verified
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                     checked={filters.isEncrypted === true}
                     onCheckedChange={toggleEncrypted}
                  >
                     <Lock size={14} className='mr-2' />
                     Encrypted
                  </DropdownMenuCheckboxItem>
               </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu>
               <DropdownMenuTrigger className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3'>
                  {sortBy.includes("desc") ? (
                     <SortDesc size={16} />
                  ) : (
                     <SortAsc size={16} />
                  )}
                  Sort
               </DropdownMenuTrigger>
               <DropdownMenuContent align='start'>
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onSortChange("recent")}>
                     Date (Newest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange("oldest")}>
                     Date (Oldest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange("name-asc")}>
                     Name (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange("name-desc")}>
                     Name (Z-A)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange("size-desc")}>
                     Size (Largest First)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSortChange("size-asc")}>
                     Size (Smallest First)
                  </DropdownMenuItem>
               </DropdownMenuContent>
            </DropdownMenu>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
               <Button variant='ghost' size='sm' onClick={onReset}>
                  Reset
               </Button>
            )}
         </div>

         {/* Tags Input */}
         <div>
            <Label
               htmlFor='tag-input'
               className='text-xs text-muted-foreground'
            >
               Filter by Tags
            </Label>
            <div className='flex gap-2 mt-1'>
               <Input
                  id='tag-input'
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                     if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                     }
                  }}
                  placeholder='Add tag filter...'
               />
               <Button
                  type='button'
                  variant='secondary'
                  size='sm'
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
               >
                  Add
               </Button>
            </div>
         </div>

         {/* Active Filter Tags */}
         {filters.tags && filters.tags.length > 0 && (
            <div className='flex flex-wrap gap-2'>
               {filters.tags.map((tag) => (
                  <Badge
                     key={tag}
                     variant='secondary'
                     className='cursor-pointer'
                     onClick={() => handleRemoveTag(tag)}
                  >
                     <Tag size={12} className='mr-1' />
                     {tag}
                     <X size={12} className='ml-1' />
                  </Badge>
               ))}
            </div>
         )}
      </div>
   );
};
