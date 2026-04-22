"use client";

import { FC, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
   DcButton,
   DcInput,
   DcTextarea,
   Field,
} from "@/components/design/primitives";
import { useUpdateDocument } from "@/lib/hooks/useDocuments";
import { useToast } from "@/lib/hooks/useToast";
import type { Document } from "@/lib/types/document";
import type { ApiError } from "@/lib/types";

interface DocumentSettingsDialogProps {
   document: Document | null;
   open: boolean;
   onOpenChange: (open: boolean) => void;
}

/**
 * Minimal document edit surface — title, description, confidential toggle.
 * Trigger from the document detail page's action row. Uses PUT /documents/:id
 * via useUpdateDocument, which already handles cache invalidation on success.
 *
 * Scope is deliberately narrow: folder move, expiry, reminders, and tag
 * edits each have their own surfaces elsewhere. Anything broader would
 * sprawl into the detail page's tab model.
 */
export const DocumentSettingsDialog: FC<DocumentSettingsDialogProps> = ({
   document,
   open,
   onOpenChange,
}) => {
   const toast = useToast();
   const updateMutation = useUpdateDocument();

   const [title, setTitle] = useState("");
   const [description, setDescription] = useState("");
   const [isConfidential, setIsConfidential] = useState(false);

   // Sync form state whenever the dialog opens for a new document. Keeping
   // this as a plain effect (not memoized initial state) means re-opening
   // after a save reflects the latest backend truth, not stale form state.
   useEffect(() => {
      if (open && document) {
         setTitle(document.title);
         setDescription(document.description ?? "");
         setIsConfidential(!!document.isConfidential);
      }
   }, [open, document]);

   if (!document) return null;

   const dirty =
      title.trim() !== document.title ||
      (description.trim() || "") !== (document.description ?? "") ||
      isConfidential !== !!document.isConfidential;

   const handleSave = async () => {
      if (!title.trim()) {
         toast.error("Title required", "Title cannot be empty");
         return;
      }
      try {
         await updateMutation.mutateAsync({
            id: document.id,
            updates: {
               title: title.trim(),
               description: description.trim() || undefined,
               isConfidential,
            },
         });
         toast.success("Document updated");
         onOpenChange(false);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Update failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='sm:max-w-md'>
            <DialogHeader>
               <DialogTitle>Document Settings</DialogTitle>
               <DialogDescription>
                  Update metadata and confidentiality for this document.
               </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
               <Field label='Title' required htmlFor='settings-title'>
                  <DcInput
                     id='settings-title'
                     value={title}
                     onChange={setTitle}
                     placeholder='Enter document title'
                     disabled={updateMutation.isPending}
                  />
               </Field>

               <Field label='Description' htmlFor='settings-desc'>
                  <DcTextarea
                     id='settings-desc'
                     value={description}
                     onChange={setDescription}
                     placeholder='What is this document about?'
                     rows={3}
                     disabled={updateMutation.isPending}
                  />
               </Field>

               {/* Confidential toggle — identical palette pattern to the
                   uploader so the mental model carries across both flows.
                   Only document owner or admin can reach this dialog, so
                   no permission branch needed here. */}
               <label
                  htmlFor='settings-confidential'
                  className='flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors'
                  style={{
                     background: isConfidential
                        ? "var(--dc-warn-soft)"
                        : "var(--dc-surface-2)",
                     border: `1px solid ${
                        isConfidential
                           ? "var(--dc-warn-border)"
                           : "var(--dc-border)"
                     }`,
                  }}
               >
                  <div
                     className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
                     style={{
                        background: isConfidential
                           ? "var(--dc-warn-border)"
                           : "var(--dc-surface)",
                        border: `1px solid ${
                           isConfidential
                              ? "var(--dc-warn-border)"
                              : "var(--dc-border)"
                        }`,
                        color: isConfidential
                           ? "var(--dc-warn)"
                           : "var(--dc-text-muted)",
                     }}
                  >
                     <Lock size={15} strokeWidth={2} />
                  </div>
                  <div className='flex-1 min-w-0'>
                     <div
                        className='text-[13px] font-semibold'
                        style={{ color: "var(--dc-text)" }}
                     >
                        Confidential
                     </div>
                     <div
                        className='text-[11.5px] mt-0.5 leading-snug'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        All downloads are forensically watermarked. Viewers
                        cannot disable this.
                     </div>
                  </div>
                  <Switch
                     id='settings-confidential'
                     checked={isConfidential}
                     onCheckedChange={setIsConfidential}
                     disabled={updateMutation.isPending}
                  />
               </label>
            </div>

            <DialogFooter>
               <DcButton
                  onClick={() => onOpenChange(false)}
                  disabled={updateMutation.isPending}
               >
                  Cancel
               </DcButton>
               <DcButton
                  variant='primary'
                  onClick={handleSave}
                  disabled={
                     updateMutation.isPending || !dirty || !title.trim()
                  }
               >
                  {updateMutation.isPending ? "Saving…" : "Save"}
               </DcButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};
