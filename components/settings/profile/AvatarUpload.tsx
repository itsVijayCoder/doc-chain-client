"use client";

import { FC, useState, useRef, ChangeEvent } from "react";
import { useUserStore } from "@/lib/stores/userStore";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
   currentAvatar?: string;
   userName: string;
}

/**
 * AvatarUpload Component
 * Handles user avatar upload and preview
 * Follows Single Responsibility Principle - only handles avatar management
 */
export const AvatarUpload: FC<AvatarUploadProps> = ({
   currentAvatar,
   userName,
}) => {
   const { uploadAvatar, isUploadingAvatar } = useUserStore();
   const [preview, setPreview] = useState<string | null>(null);
   const [isDragging, setIsDragging] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);

   const handleFileSelect = (file: File | null) => {
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
         alert("Please select an image file");
         return;
      }

      // Validate file size (max 2MB — backend enforced)
      if (file.size > 2 * 1024 * 1024) {
         alert("File size must be less than 2MB");
         return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
         setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload
      uploadAvatar(file).catch((error) => {
         console.error("Failed to upload avatar:", error);
         setPreview(null);
      });
   };

   const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileSelect(file);
   };

   const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
         handleFileSelect(file);
      }
   };

   const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
   };

   const handleDragLeave = () => {
      setIsDragging(false);
   };

   const handleRemove = () => {
      setPreview(null);
      if (fileInputRef.current) {
         fileInputRef.current.value = "";
      }
   };

   const displayAvatar = preview || currentAvatar;

   return (
      <div className='space-y-4'>
         <div className='flex items-center gap-6'>
            {/* Avatar preview */}
            <div className='relative'>
               <div
                  className={cn(
                     "w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center",
                     isUploadingAvatar && "opacity-50"
                  )}
               >
                  {displayAvatar ? (
                     <img
                        src={displayAvatar}
                        alt={userName}
                        className='w-full h-full object-cover'
                     />
                  ) : (
                     <User size={48} className='text-muted-foreground' />
                  )}
               </div>

               {isUploadingAvatar && (
                  <div className='absolute inset-0 flex items-center justify-center'>
                     <Loader2 size={24} className='animate-spin text-primary' />
                  </div>
               )}

               {preview && !isUploadingAvatar && (
                  <button
                     onClick={handleRemove}
                     className='absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors'
                  >
                     <X size={16} />
                  </button>
               )}
            </div>

            {/* Upload controls */}
            <div className='flex-1'>
               <h3 className='font-semibold mb-2'>Profile Photo</h3>
               <p className='text-sm text-muted-foreground mb-4'>
                  Upload a new avatar. Max size 2MB.
               </p>

               <div className='flex gap-2'>
                  <Button
                     variant='outline'
                     size='sm'
                     onClick={() => fileInputRef.current?.click()}
                     disabled={isUploadingAvatar}
                  >
                     <Upload size={16} className='mr-2' />
                     Upload
                  </Button>

                  {displayAvatar && (
                     <Button
                        variant='outline'
                        size='sm'
                        onClick={handleRemove}
                        disabled={isUploadingAvatar}
                     >
                        Remove
                     </Button>
                  )}
               </div>

               <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleInputChange}
                  className='hidden'
               />
            </div>
         </div>

         {/* Drag and drop area */}
         <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
               "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
               isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50",
               isUploadingAvatar && "opacity-50 pointer-events-none"
            )}
         >
            <Camera size={48} className='mx-auto mb-4 text-muted-foreground' />
            <p className='text-sm font-medium mb-1'>
               Drag and drop your photo here
            </p>
            <p className='text-xs text-muted-foreground'>
               or click the Upload button above
            </p>
         </div>
      </div>
   );
};
