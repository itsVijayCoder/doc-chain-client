"use client";

import { FC, useEffect, useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogFooter,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { DcButton } from "@/components/design/primitives";
import { useCreateFolder, useRenameFolder, useDeleteFolder } from "@/lib/hooks/useFolders";
import { useToast } from "@/lib/hooks/useToast";
import type { Folder } from "@/lib/services/folderService";
import type { ApiError } from "@/lib/types";

// ─────────────────────────────────────────────────────────────────────
// Create folder dialog
// ─────────────────────────────────────────────────────────────────────
interface CreateFolderDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   /** Parent folder id. Omit/null for root-level. */
   parentId?: string | null;
   /** Parent display name — shown in the dialog title so users know where this will land. */
   parentName?: string;
}

export const CreateFolderDialog: FC<CreateFolderDialogProps> = ({
   open,
   onOpenChange,
   parentId,
   parentName,
}) => {
   const toast = useToast();
   const [name, setName] = useState("");
   const [error, setError] = useState<string | null>(null);
   const createMutation = useCreateFolder();

   useEffect(() => {
      if (open) {
         setName("");
         setError(null);
      }
   }, [open]);

   const handleCreate = () => {
      const trimmed = name.trim();
      if (!trimmed) {
         setError("Folder name is required");
         return;
      }
      createMutation.mutate(
         { name: trimmed, parentId: parentId ?? undefined },
         {
            onSuccess: () => {
               onOpenChange(false);
               toast.success("Folder created", `"${trimmed}" is ready`);
            },
            onError: (err: unknown) => {
               const e = err as ApiError;
               setError(e?.details?.[0] ?? e?.message ?? "Failed to create folder");
            },
         }
      );
   };

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='max-w-md'>
            <DialogHeader>
               <DialogTitle>New folder</DialogTitle>
            </DialogHeader>
            <div className='py-2'>
               <FolderField
                  label={parentName ? `Inside "${parentName}"` : "At root level"}
                  value={name}
                  onChange={setName}
                  placeholder='e.g. Contracts 2026'
                  autoFocus
                  onEnter={handleCreate}
               />
               {error && (
                  <p
                     className='text-[13px] mt-2'
                     style={{ color: "var(--dc-danger)" }}
                  >
                     {error}
                  </p>
               )}
            </div>
            <DialogFooter>
               <DcButton onClick={() => onOpenChange(false)} disabled={createMutation.isPending}>
                  Cancel
               </DcButton>
               <DcButton
                  variant='primary'
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
               >
                  {createMutation.isPending ? "Creating…" : "Create folder"}
               </DcButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Rename folder dialog
// ─────────────────────────────────────────────────────────────────────
interface RenameFolderDialogProps {
   folder: Folder | null;
   onClose: () => void;
}

export const RenameFolderDialog: FC<RenameFolderDialogProps> = ({
   folder,
   onClose,
}) => {
   const toast = useToast();
   const [name, setName] = useState("");
   const [error, setError] = useState<string | null>(null);
   const renameMutation = useRenameFolder();

   useEffect(() => {
      if (folder) {
         setName(folder.name);
         setError(null);
      }
   }, [folder]);

   const handleRename = () => {
      if (!folder) return;
      const trimmed = name.trim();
      if (!trimmed) {
         setError("Folder name is required");
         return;
      }
      if (trimmed === folder.name) {
         onClose();
         return;
      }
      renameMutation.mutate(
         { id: folder.id, name: trimmed },
         {
            onSuccess: () => {
               onClose();
               toast.success("Folder renamed");
            },
            onError: (err: unknown) => {
               const e = err as ApiError;
               setError(e?.details?.[0] ?? e?.message ?? "Failed to rename folder");
            },
         }
      );
   };

   return (
      <Dialog open={!!folder} onOpenChange={(o) => !o && onClose()}>
         <DialogContent className='max-w-md'>
            <DialogHeader>
               <DialogTitle>Rename folder</DialogTitle>
            </DialogHeader>
            <div className='py-2'>
               <FolderField
                  label='New name'
                  value={name}
                  onChange={setName}
                  placeholder='Folder name'
                  autoFocus
                  onEnter={handleRename}
               />
               {error && (
                  <p
                     className='text-[13px] mt-2'
                     style={{ color: "var(--dc-danger)" }}
                  >
                     {error}
                  </p>
               )}
            </div>
            <DialogFooter>
               <DcButton onClick={onClose} disabled={renameMutation.isPending}>
                  Cancel
               </DcButton>
               <DcButton
                  variant='primary'
                  onClick={handleRename}
                  disabled={renameMutation.isPending}
               >
                  {renameMutation.isPending ? "Saving…" : "Save"}
               </DcButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Delete folder confirmation
// ─────────────────────────────────────────────────────────────────────
interface DeleteFolderDialogProps {
   folder: Folder | null;
   onClose: () => void;
}

export const DeleteFolderDialog: FC<DeleteFolderDialogProps> = ({
   folder,
   onClose,
}) => {
   const toast = useToast();
   const deleteMutation = useDeleteFolder();

   const handleDelete = () => {
      if (!folder) return;
      deleteMutation.mutate(folder.id, {
         onSuccess: () => {
            onClose();
            toast.success("Folder deleted");
         },
         onError: (err: unknown) => {
            const e = err as ApiError;
            toast.error(
               "Delete failed",
               e?.details?.[0] ?? e?.message ?? "Try again"
            );
         },
      });
   };

   return (
      <Dialog open={!!folder} onOpenChange={(o) => !o && onClose()}>
         <DialogContent className='max-w-sm'>
            <DialogHeader>
               <DialogTitle>Delete folder</DialogTitle>
            </DialogHeader>
            <p className='text-[13px]' style={{ color: "var(--dc-text-muted)" }}>
               Delete{" "}
               <span className='font-semibold' style={{ color: "var(--dc-text)" }}>
                  {folder?.name}
               </span>
               ? All subfolders and their documents will be deleted too. This
               cannot be undone.
            </p>
            <DialogFooter>
               <DcButton onClick={onClose} disabled={deleteMutation.isPending}>
                  Cancel
               </DcButton>
               <DcButton
                  variant='danger'
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
               >
                  {deleteMutation.isPending ? "Deleting…" : "Delete folder"}
               </DcButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Shared input field — minimal wrapper that handles Enter-to-submit
// ─────────────────────────────────────────────────────────────────────
const FolderField: FC<{
   label: string;
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
   autoFocus?: boolean;
   onEnter?: () => void;
}> = ({ label, value, onChange, placeholder, autoFocus, onEnter }) => (
   <div>
      <label
         className='block text-[12px] font-semibold mb-1.5'
         style={{ color: "var(--dc-text)" }}
      >
         {label}
      </label>
      <input
         type='text'
         value={value}
         onChange={(e) => onChange(e.target.value)}
         onKeyDown={(e) => {
            if (e.key === "Enter" && onEnter) {
               e.preventDefault();
               onEnter();
            }
         }}
         placeholder={placeholder}
         autoFocus={autoFocus}
         className='w-full h-[34px] px-2.5 rounded-md text-[13px] outline-none transition-all'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text)",
         }}
         onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--dc-accent-border)";
            e.currentTarget.style.boxShadow = "0 0 0 3px var(--dc-accent-soft)";
         }}
         onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--dc-border)";
            e.currentTarget.style.boxShadow = "none";
         }}
      />
   </div>
);
