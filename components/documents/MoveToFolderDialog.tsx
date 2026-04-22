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
import {
   useFolderBreadcrumb,
   useFolderDetail,
   useRootFolders,
} from "@/lib/hooks/useFolders";
import {
   ChevronRight,
   Folder as FolderIcon,
   Home,
   Loader2,
} from "lucide-react";
import type { Folder } from "@/lib/services/folderService";

interface MoveToFolderDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   /** Label for the things being moved — used in the title (e.g. "3 documents"). */
   itemsLabel: string;
   /**
    * ID of the folder the items currently sit in (if known). Rendered in
    * the subtitle so users have context, and disabled in the picker as a
    * destination (can't "move" into the current location).
    */
   currentLocationId?: string | null;
   /** Optional display name for the current location. */
   currentLocationName?: string;
   /**
    * Called when the user clicks "Move here". Receives the picker's current
    * folder id — `null` means root. Returns a promise so the dialog can
    * show a loading state.
    */
   onMove: (destinationId: string | null) => Promise<void>;
}

/**
 * Folder picker. Drills down from root using the same breadcrumb +
 * folder-card visual language as the Documents page. The "current location
 * in the picker" is where the items will land if the user confirms — this
 * matches the Finder / Dropbox pattern of "navigate in, then 'Move here'".
 */
export const MoveToFolderDialog: FC<MoveToFolderDialogProps> = ({
   open,
   onOpenChange,
   itemsLabel,
   currentLocationId,
   currentLocationName,
   onMove,
}) => {
   // Picker's current location — separate from the Documents page's folder.
   // Starts at root each time the dialog opens.
   const [pickerFolderId, setPickerFolderId] = useState<string | null>(null);
   const [moving, setMoving] = useState(false);

   useEffect(() => {
      if (open) {
         setPickerFolderId(null);
         setMoving(false);
      }
   }, [open]);

   const rootFolders = useRootFolders();
   const folderDetail = useFolderDetail(pickerFolderId ?? undefined);
   const breadcrumb = useFolderBreadcrumb(pickerFolderId ?? undefined);

   const isAtRoot = pickerFolderId === null;
   const foldersHere: Folder[] = isAtRoot
      ? rootFolders.data ?? []
      : folderDetail.data?.children ?? [];
   const isLoading = isAtRoot
      ? rootFolders.isLoading
      : folderDetail.isLoading;

   // Users can't "move here" if they're already in the source folder.
   const atSourceFolder =
      (currentLocationId ?? null) === pickerFolderId;

   const destinationLabel = isAtRoot
      ? "Home"
      : folderDetail.data?.name ?? "…";

   const handleConfirm = async () => {
      setMoving(true);
      try {
         await onMove(pickerFolderId);
         onOpenChange(false);
      } finally {
         setMoving(false);
      }
   };

   return (
      <Dialog open={open} onOpenChange={(o) => !moving && onOpenChange(o)}>
         <DialogContent className='sm:max-w-[520px]'>
            <DialogHeader>
               <DialogTitle>Move {itemsLabel}</DialogTitle>
            </DialogHeader>

            {currentLocationName && (
               <p
                  className='text-[12px] -mt-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  From{" "}
                  <span
                     className='font-medium'
                     style={{ color: "var(--dc-text-muted)" }}
                  >
                     {currentLocationName}
                  </span>
               </p>
            )}

            {/* Picker breadcrumb — clickable path */}
            <div className='flex items-center gap-1 flex-wrap text-[12px] min-h-7'>
               <BreadcrumbStep
                  label='Home'
                  icon={<Home size={12} strokeWidth={1.75} />}
                  active={isAtRoot}
                  onClick={() => setPickerFolderId(null)}
               />
               {(breadcrumb.data ?? []).map((item, i, arr) => {
                  const isLast = i === arr.length - 1;
                  return (
                     <div key={item.id} className='flex items-center gap-1'>
                        <ChevronRight
                           size={11}
                           strokeWidth={2}
                           style={{ color: "var(--dc-text-faint)" }}
                        />
                        <BreadcrumbStep
                           label={item.name}
                           active={isLast}
                           onClick={() => setPickerFolderId(item.id)}
                        />
                     </div>
                  );
               })}
            </div>

            {/* Folder list — clickable rows */}
            <div
               className='rounded-lg overflow-hidden'
               style={{
                  background: "var(--dc-surface-2)",
                  border: "1px solid var(--dc-border)",
                  minHeight: 180,
                  maxHeight: 260,
                  overflowY: "auto",
               }}
            >
               {isLoading ? (
                  <div className='flex items-center justify-center py-12'>
                     <Loader2
                        size={16}
                        className='animate-spin'
                        style={{ color: "var(--dc-text-dim)" }}
                     />
                  </div>
               ) : foldersHere.length === 0 ? (
                  <div
                     className='py-12 text-center text-[12.5px]'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     No subfolders here. Use <strong>Move here</strong> to drop{" "}
                     {itemsLabel} into{" "}
                     <span style={{ color: "var(--dc-text)" }}>
                        {destinationLabel}
                     </span>
                     .
                  </div>
               ) : (
                  foldersHere.map((folder, i) => (
                     <FolderPickerRow
                        key={folder.id}
                        folder={folder}
                        onClick={() => setPickerFolderId(folder.id)}
                        isLast={i === foldersHere.length - 1}
                     />
                  ))
               )}
            </div>

            <DialogFooter>
               <DcButton
                  onClick={() => onOpenChange(false)}
                  disabled={moving}
               >
                  Cancel
               </DcButton>
               <DcButton
                  variant='primary'
                  onClick={handleConfirm}
                  disabled={moving || atSourceFolder}
                  title={
                     atSourceFolder
                        ? "Already in this folder"
                        : `Move to ${destinationLabel}`
                  }
               >
                  {moving
                     ? "Moving…"
                     : atSourceFolder
                     ? "Already here"
                     : `Move to ${destinationLabel}`}
               </DcButton>
            </DialogFooter>
         </DialogContent>
      </Dialog>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Breadcrumb step inside the picker. Compact — not the full header crumb.
// ─────────────────────────────────────────────────────────────────────
const BreadcrumbStep: FC<{
   label: string;
   icon?: React.ReactNode;
   active: boolean;
   onClick: () => void;
}> = ({ label, icon, active, onClick }) => {
   if (active) {
      return (
         <span
            className='inline-flex items-center gap-1 px-1.5 py-0.5 font-semibold'
            style={{ color: "var(--dc-text)" }}
         >
            {icon}
            {label}
         </span>
      );
   }
   return (
      <button
         type='button'
         onClick={onClick}
         className='inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors'
         style={{ color: "var(--dc-text-muted)" }}
         onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--dc-surface-2)";
            e.currentTarget.style.color = "var(--dc-text)";
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--dc-text-muted)";
         }}
      >
         {icon}
         {label}
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────
// One folder row in the picker list.
// ─────────────────────────────────────────────────────────────────────
const FolderPickerRow: FC<{
   folder: Folder;
   onClick: () => void;
   isLast: boolean;
}> = ({ folder, onClick, isLast }) => (
   <button
      type='button'
      onClick={onClick}
      className='w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors'
      style={{
         borderBottom: isLast ? "none" : "1px solid var(--dc-border)",
         background: "transparent",
      }}
      onMouseEnter={(e) =>
         (e.currentTarget.style.background = "var(--dc-surface-3)")
      }
      onMouseLeave={(e) =>
         (e.currentTarget.style.background = "transparent")
      }
   >
      <FolderIcon
         size={15}
         strokeWidth={1.5}
         style={{
            color: "var(--dc-warn)",
            fill: "var(--dc-warn-soft)",
         }}
      />
      <span
         className='flex-1 text-[13px] font-medium truncate'
         style={{ color: "var(--dc-text)" }}
      >
         {folder.name}
      </span>
      <ChevronRight
         size={13}
         strokeWidth={1.75}
         style={{ color: "var(--dc-text-dim)" }}
      />
   </button>
);
