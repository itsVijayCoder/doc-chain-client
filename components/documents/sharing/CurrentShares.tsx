"use client";

import { FC } from "react";
import { Share } from "@/lib/types/document";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getInitials, formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface CurrentSharesProps {
   shares: Share[];
   onRemove: (shareId: string) => void;
   canManage?: boolean;
   isLoading?: boolean;
}

/**
 * CurrentShares Component
 * Displays list of users who currently have access
 * Follows Single Responsibility Principle - only displays share list
 */
export const CurrentShares: FC<CurrentSharesProps> = ({
   shares,
   onRemove,
   canManage = true,
   isLoading = false,
}) => {
   if (shares.length === 0) {
      return (
         <div className='text-center py-8 text-muted-foreground'>
            <p className='text-sm'>This document hasn't been shared yet</p>
         </div>
      );
   }

   return (
      <div className='space-y-2'>
         <p className='text-sm font-medium mb-3'>
            Shared with {shares.length}{" "}
            {shares.length === 1 ? "person" : "people"}
         </p>

         {shares.map((share) => (
            <div
               key={share.id}
               className='flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors'
            >
               <div className='flex items-center gap-3 flex-1 min-w-0'>
                  <Avatar className='h-10 w-10 shrink-0'>
                     <AvatarImage
                        src={share.sharedWith.avatar}
                        alt={share.sharedWith.name}
                     />
                     <AvatarFallback>
                        {getInitials(share.sharedWith.name)}
                     </AvatarFallback>
                  </Avatar>

                  <div className='flex-1 min-w-0'>
                     <p className='font-medium truncate'>
                        {share.sharedWith.name}
                     </p>
                     <p className='text-xs text-muted-foreground truncate'>
                        {share.sharedWith.email}
                     </p>
                     <p className='text-xs text-muted-foreground mt-1'>
                        Shared {formatRelativeTime(share.createdAt)}
                        {share.expiresAt && (
                           <span className='ml-1'>
                              • Expires {formatRelativeTime(share.expiresAt)}
                           </span>
                        )}
                     </p>
                  </div>
               </div>

               <div className='flex items-center gap-2 shrink-0'>
                  <Badge
                     variant={
                        share.permission === "edit" ? "default" : "secondary"
                     }
                     className='capitalize'
                  >
                     {share.permission}
                  </Badge>

                  {canManage && (
                     <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => {
                           if (
                              confirm(
                                 `Remove ${share.sharedWith.name}'s access?`
                              )
                           ) {
                              onRemove(share.id);
                           }
                        }}
                        disabled={isLoading}
                        className='h-8 w-8 text-destructive hover:text-destructive'
                     >
                        <X size={16} />
                     </Button>
                  )}
               </div>
            </div>
         ))}
      </div>
   );
};
