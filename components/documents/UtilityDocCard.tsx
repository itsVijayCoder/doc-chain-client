"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import type { Document } from "@/lib/types/document";
import { AuthenticatedImage } from "@/components/shared/AuthenticatedImage";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import {
   ConfidentialIndicator,
   DotSep,
   VerifiedBadge,
} from "@/components/design/primitives";
import { FileText } from "lucide-react";

interface UtilityDocCardProps {
   doc: Document;
   /** Optional badge in top-right (e.g. permission pill for Shared). */
   rightBadge?: ReactNode;
   /** Small meta line under the main sub (e.g. "Shared by Jane"). */
   extraMeta?: ReactNode;
   /** Actions row at the bottom of the card (1+ buttons). */
   actions: ReactNode;
   /** If true, navigate to /documents/:id on body click. Actions area stops propagation. */
   onOpen?: () => void;
}

/**
 * Shared doc card for the utility pages (Favorites / Archive / Trash /
 * Shared with Me). Lighter than the Documents grid card: title + meta +
 * an actions row. Thumbnails render with AuthenticatedImage when the
 * backend ships a URL; otherwise we just show a file-icon tile.
 */
export const UtilityDocCard: FC<UtilityDocCardProps> = ({
   doc,
   rightBadge,
   extraMeta,
   actions,
   onOpen,
}) => {
   const body = (
      <div
         role={onOpen ? "button" : undefined}
         onClick={onOpen}
         className='flex flex-col gap-2.5 p-3.5 rounded-xl cursor-pointer transition-all duration-[160ms] ease-[cubic-bezier(.4,0,.2,1)]'
         style={{
            background: "var(--dc-surface)",
            border: "1px solid var(--dc-border)",
         }}
         onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--dc-border-bright)";
            e.currentTarget.style.boxShadow = "var(--dc-shadow-md)";
            e.currentTarget.style.transform = "translateY(-1px)";
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--dc-border)";
            e.currentTarget.style.boxShadow = "none";
            e.currentTarget.style.transform = "translateY(0)";
         }}
      >
         {/* Thumbnail + right badge */}
         <div
            className='h-[120px] rounded-lg relative overflow-hidden flex items-center justify-center'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
            }}
         >
            {doc.thumbnailUrl ? (
               <AuthenticatedImage
                  src={doc.thumbnailUrl}
                  alt={doc.title}
                  className='w-full h-full object-cover'
                  fallback={<DocIconPlaceholder />}
               />
            ) : (
               <DocIconPlaceholder />
            )}
            {rightBadge && (
               <div
                  className='absolute top-2 right-2'
                  onClick={(e) => e.stopPropagation()}
               >
                  {rightBadge}
               </div>
            )}
         </div>

         {/* Meta */}
         <div className='flex flex-col gap-1 min-w-0'>
            <div className='flex items-center gap-1.5 min-w-0'>
               {doc.isConfidential && (
                  <ConfidentialIndicator variant='icon' />
               )}
               <div
                  className='text-[13.5px] font-semibold truncate tracking-[-0.005em]'
                  style={{ color: "var(--dc-text)" }}
                  title={doc.title}
               >
                  {doc.title}
               </div>
            </div>
            <div
               className='text-[11.5px] flex items-center gap-1.5 tabular-nums'
               style={{ color: "var(--dc-text-dim)" }}
            >
               <span>{formatBytes(doc.fileSize ?? 0)}</span>
               <DotSep />
               <span>
                  {formatRelativeTime(
                     doc.updatedAt?.toISOString() ??
                        doc.createdAt?.toISOString() ??
                        ""
                  )}
               </span>
            </div>
            {extraMeta && (
               <div
                  className='text-[11.5px] truncate'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {extraMeta}
               </div>
            )}
         </div>

         {/* Footer: verified badge + actions */}
         <div className='flex items-center justify-between gap-2 mt-0.5'>
            <VerifiedBadge status='verified' />
         </div>

         {/* Actions — stop propagation so clicking a button doesn't also open doc */}
         <div
            className='flex items-center gap-1.5 pt-1'
            onClick={(e) => e.stopPropagation()}
         >
            {actions}
         </div>
      </div>
   );

   // Wrap in Link only when no onOpen callback (pure navigation). Otherwise
   // onOpen handles the click so consumers can route with custom logic.
   if (onOpen) return body;
   return <Link href={`/documents/${doc.id}`} className='block no-underline'>{body}</Link>;
};

const DocIconPlaceholder: FC = () => (
   <FileText
      size={36}
      strokeWidth={1.25}
      style={{ color: "var(--dc-text-faint)" }}
   />
);
