"use client";

import { FC, useState } from "react";
import { Document, Share } from "@/lib/types/document";
import { User } from "@/lib/types/user";
import { useToast } from "@/lib/hooks/useToast";
import { useUserSearch } from "@/lib/hooks/useUsers";
import { UserSearchCombobox } from "./UserSearchCombobox";
import { PermissionSelector, PermissionLevel } from "./PermissionSelector";
import { CurrentShares } from "./CurrentShares";
import { ShareLinkGenerator, ShareLinkSettings } from "./ShareLinkGenerator";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Share2 } from "lucide-react";

interface ShareDocumentProps {
   document: Document;
   shares: Share[];
   onShare: (userId: string, permission: PermissionLevel) => Promise<void>;
   onRemoveShare: (shareId: string) => Promise<void>;
   onGenerateLink: (
      settings: ShareLinkSettings
   ) => Promise<{ id: string; url: string }>;
   onRevokeLink: (linkId: string) => Promise<void>;
}

export const ShareDocument: FC<ShareDocumentProps> = ({
   document,
   shares,
   onShare,
   onRemoveShare,
   onGenerateLink,
   onRevokeLink,
}) => {
   const toast = useToast();
   const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
   const [permission, setPermission] = useState<PermissionLevel>("view");
   const [isSharing, setIsSharing] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");

   const searchResult = useUserSearch(searchQuery, 20);
   const searchUsers = searchResult.data ?? [];

   const handleShare = async () => {
      if (selectedUsers.length === 0) {
         toast.error(
            "Select users",
            "Please select at least one user to share with"
         );
         return;
      }

      setIsSharing(true);
      try {
         for (const user of selectedUsers) {
            await onShare(user.id, permission);
         }

         toast.success(
            "Document shared",
            `Shared with ${selectedUsers.length} ${
               selectedUsers.length === 1 ? "person" : "people"
            }`
         );

         setSelectedUsers([]);
         setPermission("view");
      } catch (error: any) {
         toast.error("Share failed", error.message);
      } finally {
         setIsSharing(false);
      }
   };

   const handleGenerateLink = async (
      settings: ShareLinkSettings
   ): Promise<string> => {
      const result = await onGenerateLink(settings);
      return result.url;
   };

   return (
      <div className='space-y-6'>
         {/* Share with Users Section */}
         <div className='space-y-4'>
            <h3 className='font-semibold'>Share with Users</h3>

            <UserSearchCombobox
               users={searchUsers}
               selectedUsers={selectedUsers}
               onSearchChange={setSearchQuery}
               onSelectUser={(user) =>
                  setSelectedUsers((prev) => [...prev, user])
               }
               onDeselectUser={(user) =>
                  setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id))
               }
               isLoading={searchResult.isFetching}
            />

            {selectedUsers.length > 0 && (
               <>
                  <PermissionSelector
                     value={permission}
                     onChange={setPermission}
                     disabled={isSharing}
                  />

                  <Button
                     onClick={handleShare}
                     disabled={isSharing}
                     className='w-full gap-2'
                  >
                     <Share2 size={16} />
                     Share with {selectedUsers.length}{" "}
                     {selectedUsers.length === 1 ? "person" : "people"}
                  </Button>
               </>
            )}
         </div>

         <Separator />

         {/* Current Shares */}
         <div className='space-y-4'>
            <h3 className='font-semibold'>People with Access</h3>
            <CurrentShares
               shares={shares}
               onRemove={onRemoveShare}
               canManage={true}
            />
         </div>

         <Separator />

         {/* Share Link */}
         <div className='space-y-4'>
            <h3 className='font-semibold'>Share via Link</h3>
            <ShareLinkGenerator
               documentId={document.id}
               onGenerate={handleGenerateLink}
               onRevoke={onRevokeLink}
            />
         </div>
      </div>
   );
};
