"use client";

import { FC, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDocumentStore } from "@/lib/stores/documentStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Share2, Users as UsersIcon } from "lucide-react";
import { User } from "@/lib/types/user";
import { UserSearchCombobox } from "@/components/documents/sharing/UserSearchCombobox";
import {
   PermissionSelector,
   PermissionLevel,
} from "@/components/documents/sharing/PermissionSelector";
import { CurrentShares } from "@/components/documents/sharing/CurrentShares";
import {
   ShareLinkGenerator,
   ShareLinkSettings,
} from "@/components/documents/sharing/ShareLinkGenerator";

// Mock users for demo (will be replaced with real API)
const MOCK_USERS: User[] = [
   {
      id: "user-1",
      email: "john.doe@example.com",
      name: "John Doe",
      role: "editor",
      avatar: undefined,
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
      avatar: undefined,
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
      avatar: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      mfaEnabled: false,
      isActive: true,
   },
];

/**
 * ShareDocumentPage
 * Full-page sharing interface for documents
 * Follows Single Responsibility - orchestrates sharing components
 */
const ShareDocumentPage: FC = () => {
   const router = useRouter();
   const params = useParams();
   const toast = useToast();
   const { user } = useAuth();
   const documentId = params.id as string;

   const {
      currentDocument: document,
      shares,
      isLoading,
      fetchDocument,
      fetchShares,
      shareDocument,
      removeShare,
      generateShareLink,
   } = useDocumentStore();

   const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
   const [permission, setPermission] = useState<PermissionLevel>("view");
   const [isSharing, setIsSharing] = useState(false);

   // Fetch document and shares
   useEffect(() => {
      if (documentId) {
         fetchDocument(documentId);
         fetchShares(documentId);
      }
   }, [documentId, fetchDocument, fetchShares]);

   // Handle user selection
   const handleSelectUser = (user: User) => {
      setSelectedUsers([...selectedUsers, user]);
   };

   const handleDeselectUser = (user: User) => {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
   };

   // Handle share
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
         for (const selectedUser of selectedUsers) {
            await shareDocument(documentId, selectedUser.id, permission);
         }

         toast.success(
            "Document shared",
            `Shared with ${selectedUsers.length} ${
               selectedUsers.length === 1 ? "person" : "people"
            }`
         );

         setSelectedUsers([]);
         setPermission("view");
         fetchShares(documentId);
      } catch (error: any) {
         toast.error("Share failed", error.message);
      } finally {
         setIsSharing(false);
      }
   };

   // Handle remove share
   const handleRemoveShare = async (shareId: string) => {
      try {
         await removeShare(shareId);
         toast.success("Access removed");
         fetchShares(documentId);
      } catch (error: any) {
         toast.error("Failed to remove access", error.message);
      }
   };

   // Handle generate link
   const handleGenerateLink = async (
      settings: ShareLinkSettings
   ): Promise<string> => {
      try {
         // Map PermissionLevel to ShareLinkOptions permission type
         const permission =
            settings.permission === "admin" ? "edit" : settings.permission;

         const link = await generateShareLink(documentId, {
            permission,
            expiresAt: settings.expiresAt,
            password: settings.requirePassword ? settings.password : undefined,
            allowDownload: settings.allowDownload,
            blockchainAudit: settings.blockchainAudit ?? false,
         });
         return link.url;
      } catch (error: any) {
         throw new Error(error.message || "Failed to generate link");
      }
   };

   // Handle revoke link
   const handleRevokeLink = async (linkId: string) => {
      // Implementation would call API to revoke link
      console.log("Revoke link:", linkId);
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

   const canManage = user?.id === document.ownerId || user?.role === "admin";

   return (
      <div className='container mx-auto p-6 max-w-4xl'>
         {/* Header */}
         <div className='mb-6'>
            <Button
               variant='ghost'
               size='sm'
               onClick={() => router.push(`/documents/${documentId}`)}
               className='mb-4'
            >
               <ArrowLeft size={16} className='mr-2' />
               Back to Document
            </Button>

            <div className='flex items-center gap-3'>
               <div className='rounded-lg bg-primary/10 p-3'>
                  <Share2 size={24} className='text-primary' />
               </div>
               <div>
                  <h1 className='text-2xl font-bold'>Share Document</h1>
                  <p className='text-muted-foreground mt-1'>{document.title}</p>
               </div>
            </div>
         </div>

         <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Share with Users */}
            <div className='space-y-6'>
               <div>
                  <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                     <UsersIcon size={18} />
                     Share with Users
                  </h2>

                  <UserSearchCombobox
                     users={MOCK_USERS}
                     selectedUsers={selectedUsers}
                     onSelectUser={handleSelectUser}
                     onDeselectUser={handleDeselectUser}
                  />
               </div>

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

               <Separator />

               <div>
                  <h3 className='text-sm font-semibold mb-3'>Current Access</h3>
                  <CurrentShares
                     shares={shares}
                     onRemove={handleRemoveShare}
                     canManage={canManage}
                  />
               </div>
            </div>

            {/* Share Link */}
            <div className='space-y-6'>
               <div>
                  <h2 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                     <Share2 size={18} />
                     Share via Link
                  </h2>

                  <ShareLinkGenerator
                     documentId={documentId}
                     onGenerate={handleGenerateLink}
                     onRevoke={handleRevokeLink}
                  />
               </div>
            </div>
         </div>
      </div>
   );
};

export default ShareDocumentPage;
