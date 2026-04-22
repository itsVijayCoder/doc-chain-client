"use client";

import { FC, useState } from "react";
import { useUserStore } from "@/lib/stores/userStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const DeleteAccount: FC = () => {
   const { profile, deleteAccount, isLoading } = useUserStore();
   const [password, setPassword] = useState("");
   const [showPassword, setShowPassword] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const [error, setError] = useState("");

   const handleDelete = async () => {
      if (!password) {
         setError("Password is required to confirm account deletion");
         return;
      }

      setIsDeleting(true);
      setError("");
      try {
         await deleteAccount(password);
         window.location.href = "/login";
      } catch (err) {
         setError(err instanceof Error ? err.message : "Incorrect password or deletion failed");
         setIsDeleting(false);
      }
   };

   const handleOpenChange = (open: boolean) => {
      if (!open) {
         setPassword("");
         setError("");
         setShowPassword(false);
      }
   };

   return (
      <div className='space-y-4 border border-destructive/50 rounded-lg p-6 bg-destructive/5'>
         <div className='flex items-start gap-3'>
            <AlertTriangle className='text-destructive shrink-0 mt-1' size={24} />
            <div className='flex-1'>
               <h3 className='text-lg font-semibold text-destructive mb-2'>
                  Danger Zone
               </h3>
               <p className='text-sm text-muted-foreground mb-4'>
                  Once you delete your account, there is no going back. All your
                  documents, settings, and data will be permanently deleted.
               </p>

               <AlertDialog onOpenChange={handleOpenChange}>
                  <AlertDialogTrigger>
                     <Button variant='destructive' size='sm'>
                        <Trash2 size={16} className='mr-2' />
                        Delete Account
                     </Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                           This will permanently delete your account{" "}
                           <strong>{profile?.email}</strong> and remove all your
                           data from our servers. This action cannot be undone.
                        </AlertDialogDescription>

                        <div className='space-y-2 pt-2'>
                           <Label htmlFor='delete-password'>
                              Enter your password to confirm
                           </Label>
                           <div className='relative'>
                              <Input
                                 id='delete-password'
                                 type={showPassword ? "text" : "password"}
                                 value={password}
                                 onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError("");
                                 }}
                                 placeholder='Your current password'
                                 autoComplete='current-password'
                              />
                              <button
                                 type='button'
                                 onClick={() => setShowPassword((v) => !v)}
                                 className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                              >
                                 {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                           </div>
                           {error && (
                              <p className='text-xs text-destructive'>{error}</p>
                           )}
                        </div>
                     </AlertDialogHeader>

                     <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                           Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                           onClick={handleDelete}
                           disabled={!password || isDeleting}
                           className='bg-destructive hover:bg-destructive/90'
                        >
                           {isDeleting ? (
                              <>
                                 <Loader2 size={16} className='mr-2 animate-spin' />
                                 Deleting...
                              </>
                           ) : (
                              "Delete Account"
                           )}
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </div>
         </div>
      </div>
   );
};
