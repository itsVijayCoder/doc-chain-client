"use client";

import { FC } from "react";
import { ChevronRight, Home } from "lucide-react";
import type { BreadcrumbItem } from "@/lib/services/folderService";

interface FolderBreadcrumbProps {
   /**
    * Ordered root→target. Empty = "Home" only. The last item is the
    * currently-viewed folder (rendered bold and non-clickable).
    */
   items: BreadcrumbItem[];
   /** Called with folderId=null for Home, else the folder id. */
   onNavigate: (folderId: string | null) => void;
   isLoading?: boolean;
}

/**
 * Breadcrumb trail for folder navigation. Home > Parent > Current.
 * - Home is always present and always navigable (clears the folder filter).
 * - Middle segments are clickable, render as muted links.
 * - The last segment (current folder) reads in full text with no hover.
 * - Truncates middle segments with "..." when the path has > 4 levels.
 */
export const FolderBreadcrumb: FC<FolderBreadcrumbProps> = ({
   items,
   onNavigate,
   isLoading,
}) => {
   if (isLoading) {
      return (
         <div className='flex items-center gap-2 mb-4 h-8'>
            <div
               className='w-4 h-4 rounded animate-pulse'
               style={{ background: "var(--dc-surface-2)" }}
            />
            <div
               className='w-20 h-3 rounded animate-pulse'
               style={{ background: "var(--dc-surface-2)" }}
            />
         </div>
      );
   }

   // Collapse middle segments when the path is deep (keeps breadcrumb
   // single-line). First and last-two are always visible.
   const collapsedItems = collapseMiddle(items, 4);

   return (
      <nav
         aria-label='Folder breadcrumb'
         className='flex items-center gap-1 mb-4 flex-wrap text-[13px] min-h-8'
      >
         {/* Home — always first */}
         <BreadcrumbHome onClick={() => onNavigate(null)} isLast={items.length === 0} />

         {collapsedItems.map((item, i) => {
            const isLast = i === collapsedItems.length - 1;
            if (item.collapsed) {
               return (
                  <span key={`ellipsis-${i}`} className='flex items-center gap-1'>
                     <Separator />
                     <span
                        className='px-1.5 py-0.5 rounded'
                        style={{
                           color: "var(--dc-text-faint)",
                        }}
                        title={item.hiddenLabels.join(" / ")}
                     >
                        …
                     </span>
                  </span>
               );
            }

            return (
               <span key={item.id} className='flex items-center gap-1'>
                  <Separator />
                  {isLast ? (
                     <span
                        className='px-1.5 py-0.5 font-semibold truncate max-w-[200px]'
                        style={{ color: "var(--dc-text)" }}
                        title={item.name}
                        aria-current='page'
                     >
                        {item.name}
                     </span>
                  ) : (
                     <button
                        type='button'
                        onClick={() => onNavigate(item.id)}
                        className='px-1.5 py-0.5 rounded transition-colors truncate max-w-[180px]'
                        style={{ color: "var(--dc-text-muted)" }}
                        onMouseEnter={(e) => {
                           e.currentTarget.style.background = "var(--dc-surface-2)";
                           e.currentTarget.style.color = "var(--dc-text)";
                        }}
                        onMouseLeave={(e) => {
                           e.currentTarget.style.background = "transparent";
                           e.currentTarget.style.color = "var(--dc-text-muted)";
                        }}
                        title={item.name}
                     >
                        {item.name}
                     </button>
                  )}
               </span>
            );
         })}
      </nav>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const Separator: FC = () => (
   <ChevronRight
      size={12}
      strokeWidth={2}
      style={{ color: "var(--dc-text-faint)" }}
      aria-hidden
   />
);

interface BreadcrumbHomeProps {
   onClick: () => void;
   isLast: boolean;
}

const BreadcrumbHome: FC<BreadcrumbHomeProps> = ({ onClick, isLast }) => {
   if (isLast) {
      return (
         <span
            className='flex items-center gap-1 px-1.5 py-0.5 font-semibold'
            style={{ color: "var(--dc-text)" }}
            aria-current='page'
         >
            <Home size={12} strokeWidth={1.75} />
            Home
         </span>
      );
   }
   return (
      <button
         type='button'
         onClick={onClick}
         className='flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors'
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
         <Home size={12} strokeWidth={1.75} />
         Home
      </button>
   );
};

// Path compressor — returns items with a "…" stand-in when the path
// exceeds `maxVisible`. Keeps the first segment + the last two always
// visible; middle segments get tucked behind the ellipsis (tooltip
// reveals them on hover).
type DisplayItem =
   | (BreadcrumbItem & { collapsed?: false })
   | { collapsed: true; hiddenLabels: string[]; id: string; name: string };

function collapseMiddle(items: BreadcrumbItem[], maxVisible: number): DisplayItem[] {
   if (items.length <= maxVisible) return items.map((i) => ({ ...i, collapsed: false }));

   const first = items[0];
   const lastTwo = items.slice(-2);
   const hidden = items.slice(1, -2);

   return [
      { ...first, collapsed: false },
      {
         collapsed: true,
         id: `__ellipsis_${hidden.map((h) => h.id).join("_")}`,
         name: "…",
         hiddenLabels: hidden.map((h) => h.name),
      },
      ...lastTwo.map((i) => ({ ...i, collapsed: false as const })),
   ];
}
