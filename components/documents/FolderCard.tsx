"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { Folder as FolderIcon } from "lucide-react";
import type { Folder } from "@/lib/services/folderService";

interface FolderCardProps {
   folder: Folder;
   /** Optional document+subfolder count shown as a subtitle (e.g. "12 items"). */
   itemCount?: number;
   /** Footer slot — typically the ⋮ menu for rename/move/delete. */
   actions?: ReactNode;
   /** Selected state (for bulk operations). */
   selected?: boolean;
   /** Override the default "navigate into folder" behaviour. */
   onOpen?: () => void;
}

/**
 * Folder tile rendered in the Documents grid alongside DocCard instances.
 * Matches the card pattern used elsewhere: hover lifts 1px, soft shadow,
 * border switches to border-bright. A colored folder icon dominates the
 * preview area — different enough from a doc thumbnail that scanning
 * users can tell them apart without reading labels.
 */
export const FolderCard: FC<FolderCardProps> = ({
   folder,
   itemCount,
   actions,
   selected,
   onOpen,
}) => {
   const inner = (
      <div
         className='relative p-3.5 flex flex-col gap-2.5 rounded-xl cursor-pointer transition-all duration-[160ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden'
         style={{
            background: "var(--dc-surface)",
            border: selected
               ? "1px solid var(--dc-accent-border)"
               : "1px solid var(--dc-border)",
            boxShadow: selected
               ? "0 0 0 1px var(--dc-accent-border), var(--dc-shadow-md)"
               : "none",
         }}
         onMouseEnter={(e) => {
            if (!selected) {
               e.currentTarget.style.borderColor = "var(--dc-border-bright)";
               e.currentTarget.style.boxShadow = "var(--dc-shadow-md)";
               e.currentTarget.style.transform = "translateY(-1px)";
            }
         }}
         onMouseLeave={(e) => {
            if (!selected) {
               e.currentTarget.style.borderColor = "var(--dc-border)";
               e.currentTarget.style.boxShadow = "none";
               e.currentTarget.style.transform = "translateY(0)";
            }
         }}
      >
         {/* Preview — big folder icon against a warm surface wash */}
         <div
            className='h-[120px] rounded-lg relative overflow-hidden flex items-center justify-center'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
            }}
         >
            <FolderIcon
               size={56}
               strokeWidth={1.25}
               style={{
                  color: "var(--dc-warn)",
                  fill: "var(--dc-warn-soft)",
               }}
            />
         </div>

         {/* Meta — name + item count */}
         <div className='flex flex-col gap-1 min-w-0'>
            <div
               className='text-[13.5px] font-semibold truncate tracking-[-0.005em]'
               style={{ color: "var(--dc-text)" }}
               title={folder.name}
            >
               {folder.name}
            </div>
            <div
               className='text-[11.5px] tabular-nums'
               style={{ color: "var(--dc-text-dim)" }}
            >
               {itemCount == null
                  ? "Folder"
                  : itemCount === 0
                  ? "Empty"
                  : `${itemCount} item${itemCount === 1 ? "" : "s"}`}
            </div>
         </div>

         {/* Actions row (⋮ menu etc.) — stop propagation so clicking a
             button doesn't also open the folder */}
         {actions && (
            <div
               className='flex items-center justify-end gap-1.5 pt-0.5'
               onClick={(e) => e.stopPropagation()}
            >
               {actions}
            </div>
         )}
      </div>
   );

   // Use Link for SEO + middle-click "open in new tab" semantics, but let
   // consumers override with onOpen for programmatic nav (e.g. setting a
   // URL query param instead of a route change).
   if (onOpen) {
      return (
         <div
            role='button'
            onClick={onOpen}
            tabIndex={0}
            onKeyDown={(e) => {
               if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpen();
               }
            }}
         >
            {inner}
         </div>
      );
   }
   return (
      <Link href={`/documents?folder=${folder.id}`} className='block no-underline'>
         {inner}
      </Link>
   );
};
