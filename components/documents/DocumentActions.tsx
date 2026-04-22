"use client";

import { FC } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Trash2, Upload, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMyPermissions } from "@/lib/hooks/useMyPermissions";

interface DocumentActionsProps {
   selectedCount: number;
   onUpload?: () => void;
   onDownloadSelected?: () => void;
   onShareSelected?: () => void;
   onDeleteSelected?: () => void;
   onVerifySelected?: () => void;
   className?: string;
}

/**
 * DocumentActions Component
 * Bulk actions toolbar for documents
 * Follows Interface Segregation Principle - optional action handlers
 */
export const DocumentActions: FC<DocumentActionsProps> = ({
   selectedCount,
   onUpload,
   onDownloadSelected,
   onShareSelected,
   onDeleteSelected,
   onVerifySelected,
   className,
}) => {
   const { shouldHide } = useMyPermissions();

   return (
      <div
         className={cn(
            "flex items-center justify-between gap-4 flex-wrap",
            className
         )}
      >
         {/* Selection Info */}
         <div className='text-sm text-muted-foreground'>
            {selectedCount > 0 ? (
               <span className='font-medium'>
                  {selectedCount} document{selectedCount !== 1 ? "s" : ""}{" "}
                  selected
               </span>
            ) : (
               <span>No documents selected</span>
            )}
         </div>

         {/* Action Buttons */}
         <div className='flex items-center gap-2'>
            {selectedCount > 0 ? (
               <>
                  {onDownloadSelected && (
                     <Button
                        variant='outline'
                        size='sm'
                        onClick={onDownloadSelected}
                        className='gap-2'
                     >
                        <Download size={16} />
                        Download
                     </Button>
                  )}

                  {onShareSelected && (
                     <Button
                        variant='outline'
                        size='sm'
                        onClick={onShareSelected}
                        className='gap-2'
                     >
                        <Share2 size={16} />
                        Share
                     </Button>
                  )}

                  {onVerifySelected && (
                     <Button
                        variant='outline'
                        size='sm'
                        onClick={onVerifySelected}
                        className='gap-2'
                     >
                        <Shield size={16} />
                        Verify
                     </Button>
                  )}

                  {onDeleteSelected && (
                     <Button
                        variant='destructive'
                        size='sm'
                        onClick={onDeleteSelected}
                        className='gap-2'
                     >
                        <Trash2 size={16} />
                        Delete
                     </Button>
                  )}
               </>
            ) : (
               <>
                  {onUpload && !shouldHide("can_upload") && (
                     <Button onClick={onUpload} className='gap-2'>
                        <Upload size={16} />
                        Upload Document
                     </Button>
                  )}
               </>
            )}
         </div>
      </div>
   );
};
