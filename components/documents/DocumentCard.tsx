"use client";

import { FC } from "react";
import { Document } from "@/lib/types/document";
import {
   Archive,
   ArchiveRestore,
   File,
   FileText,
   Image as ImageIcon,
   MoreVertical,
   Download,
   Share2,
   Star,
   Trash2,
   Eye,
   Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthenticatedImage } from "@/components/shared/AuthenticatedImage";
import { cn } from "@/lib/utils";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { useMyPermissions } from "@/lib/hooks/useMyPermissions";

interface DocumentCardProps {
   document: Document;
   onView: (id: string) => void;
   onDownload: (id: string) => void;
   onShare: (id: string) => void;
   onDelete: (id: string) => void;
   onVerify?: (id: string) => void;
   onArchiveToggle?: (id: string) => void;
   onFavoriteToggle?: (id: string) => void;
   selected?: boolean;
   onSelect?: (id: string) => void;
}

/**
 * DocumentCard Component
 * Displays a single document in card format
 * Follows Single Responsibility Principle - only handles document display
 */
export const DocumentCard: FC<DocumentCardProps> = ({
   document,
   onView,
   onDownload,
   onShare,
   onDelete,
   onVerify,
   onArchiveToggle,
   onFavoriteToggle,
   selected = false,
   onSelect,
}) => {
   const { shouldHide } = useMyPermissions();

   // Render the icon directly as JSX to avoid React 19's
   // "components-created-during-render" rule triggered by capturing the
   // component type in a render-scoped variable.
   const renderFileIcon = (size: number) => {
      const className = "text-muted-foreground";
      if (document.mimeType.startsWith("image/"))
         return <ImageIcon size={size} className={className} />;
      if (document.mimeType === "application/pdf")
         return <FileText size={size} className={className} />;
      return <File size={size} className={className} />;
   };

   return (
      <div
         className={cn(
            "group relative bg-card border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer",
            selected && "ring-2 ring-primary border-primary"
         )}
         onClick={() => onView(document.id)}
      >
         {/* Selection Checkbox */}
         {onSelect && (
            <div
               className='absolute top-2 left-2 z-10'
               onClick={(e) => e.stopPropagation()}
            >
               <input
                  type='checkbox'
                  checked={selected}
                  onChange={() => onSelect(document.id)}
                  className='w-4 h-4 rounded border-gray-300 cursor-pointer'
               />
            </div>
         )}

         {/* Star / Favorite button — sits left of the 3-dot menu to avoid checkbox overlap */}
         {onFavoriteToggle && (
            <div
               className='absolute top-2 right-10 z-10'
               onClick={(e) => e.stopPropagation()}
            >
               <button
                  onClick={() => onFavoriteToggle(document.id)}
                  className={cn(
                     "flex items-center justify-center w-7 h-7 rounded-full transition-opacity",
                     document.isFavorite
                        ? "opacity-100 text-yellow-500"
                        : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-yellow-500"
                  )}
                  title={document.isFavorite ? "Remove from favorites" : "Add to favorites"}
               >
                  <Star
                     size={16}
                     className={document.isFavorite ? "fill-yellow-500" : ""}
                  />
               </button>
            </div>
         )}

         {/* Actions Menu */}
         <div
            className='absolute top-2 right-2 z-10'
            onClick={(e) => e.stopPropagation()}
         >
            <DropdownMenu>
               <DropdownMenuTrigger className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 opacity-0 group-hover:opacity-100'>
                  <MoreVertical size={16} />
               </DropdownMenuTrigger>
               <DropdownMenuContent align='end'>
                  <DropdownMenuItem onClick={() => onView(document.id)}>
                     <Eye size={16} className='mr-2' />
                     View
                  </DropdownMenuItem>
                  {!shouldHide("can_download") && (
                     <DropdownMenuItem onClick={() => onDownload(document.id)}>
                        <Download size={16} className='mr-2' />
                        Download
                     </DropdownMenuItem>
                  )}
                  {!shouldHide("can_share") && (
                     <DropdownMenuItem onClick={() => onShare(document.id)}>
                        <Share2 size={16} className='mr-2' />
                        Share
                     </DropdownMenuItem>
                  )}
                  {onFavoriteToggle && (
                     <DropdownMenuItem onClick={() => onFavoriteToggle(document.id)}>
                        <Star
                           size={16}
                           className={cn("mr-2", document.isFavorite && "fill-yellow-500 text-yellow-500")}
                        />
                        {document.isFavorite ? "Remove from favorites" : "Add to favorites"}
                     </DropdownMenuItem>
                  )}
                  {onVerify && !document.blockchainVerified && (
                     <DropdownMenuItem onClick={() => onVerify(document.id)}>
                        <Shield size={16} className='mr-2' />
                        Verify on Blockchain
                     </DropdownMenuItem>
                  )}
                  {onArchiveToggle && (
                     <DropdownMenuItem
                        onClick={() => onArchiveToggle(document.id)}
                     >
                        {document.isArchived ? (
                           <>
                              <ArchiveRestore size={16} className='mr-2' />
                              Unarchive
                           </>
                        ) : (
                           <>
                              <Archive size={16} className='mr-2' />
                              Archive
                           </>
                        )}
                     </DropdownMenuItem>
                  )}
                  {!shouldHide("can_delete") && (
                     <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                           onClick={() => onDelete(document.id)}
                           className='text-destructive'
                        >
                           <Trash2 size={16} className='mr-2' />
                           Delete
                        </DropdownMenuItem>
                     </>
                  )}
               </DropdownMenuContent>
            </DropdownMenu>
         </div>

         {/* Thumbnail — mt-6 ensures it clears the absolutely-positioned
             buttons (checkbox / star / 3-dot) which sit at top-2 + h-7 */}
         <div className='flex items-center justify-center h-32 bg-muted rounded-lg mt-6 mb-3 overflow-hidden'>
            {document.thumbnailUrl ? (
               <AuthenticatedImage
                  src={document.thumbnailUrl}
                  alt={document.title}
                  className='w-full h-full object-cover rounded-lg'
                  fallback={renderFileIcon(48)}
               />
            ) : (
               renderFileIcon(48)
            )}
         </div>

         {/* Document Info */}
         <div className='space-y-2'>
            <h3 className='font-medium truncate' title={document.title}>
               {document.title}
            </h3>

            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
               <span>{formatBytes(document.fileSize ?? 0)}</span>
               <span>•</span>
               <span>{formatRelativeTime(document.updatedAt)}</span>
            </div>

            {/* Tags */}
            {document.tags.length > 0 && (
               <div className='flex flex-wrap gap-1'>
                  {document.tags.slice(0, 2).map((tag) => (
                     <Badge key={tag} variant='secondary' className='text-xs'>
                        {tag}
                     </Badge>
                  ))}
                  {document.tags.length > 2 && (
                     <Badge variant='secondary' className='text-xs'>
                        +{document.tags.length - 2}
                     </Badge>
                  )}
               </div>
            )}

            {/* Status Badges */}
            <div className='flex items-center gap-2 flex-wrap'>
               {document.blockchainVerified && (
                  <Badge variant='default' className='text-xs'>
                     <Shield size={10} className='mr-1' />
                     Verified
                  </Badge>
               )}
               {document.isEncrypted && (
                  <Badge variant='secondary' className='text-xs'>
                     Encrypted
                  </Badge>
               )}
               {(document.shareCount ?? 0) > 0 && (
                  <Badge variant='outline' className='text-xs'>
                     <Share2 size={10} className='mr-1' />
                     {document.shareCount}
                  </Badge>
               )}
            </div>
         </div>
      </div>
   );
};
