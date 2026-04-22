"use client";

import { FC } from "react";
import { Lock, Search, Tag as TagIcon, X } from "lucide-react";
import type { DocumentFilterValues } from "./DocumentFilterPopover";

export interface ActiveFiltersValues extends DocumentFilterValues {
   search?: string;
   tags?: string[];
}

interface Props {
   values: ActiveFiltersValues;
   /** Map tag slug → display name (from the tag catalog). Falls back to slug. */
   tagLabel?: (slug: string) => string;
   onRemove: (key: keyof ActiveFiltersValues, value?: string) => void;
   onClear: () => void;
}

// ─────────────────────────────────────────────────────────────────────
// Removable chips summarizing currently-applied filters. Hidden when
// no filters are active — avoids an empty strip eating vertical space.
// Tag slugs render with their display name where possible so users
// aren't reading URL-encoded strings.
// ─────────────────────────────────────────────────────────────────────
export const ActiveFiltersStrip: FC<Props> = ({
   values,
   tagLabel,
   onRemove,
   onClear,
}) => {
   const hasAny =
      Boolean(values.search) ||
      (values.tags && values.tags.length > 0) ||
      Boolean(values.mimeType) ||
      values.isConfidential !== undefined ||
      values.isExpired !== undefined ||
      Boolean(values.updatedAfter) ||
      Boolean(values.updatedBefore);

   if (!hasAny) return null;

   return (
      <div
         className='flex items-center gap-1.5 flex-wrap mb-3.5 px-2.5 py-2 rounded-md'
         style={{
            background: "var(--dc-surface)",
            border: "1px solid var(--dc-border)",
         }}
      >
         <span
            className='text-[10.5px] uppercase tracking-[0.06em] mr-1'
            style={{ color: "var(--dc-text-dim)" }}
         >
            Filters
         </span>

         {values.search && (
            <RemovableChip
               icon={<Search size={10} strokeWidth={2.25} />}
               onRemove={() => onRemove("search")}
            >
               &ldquo;{values.search}&rdquo;
            </RemovableChip>
         )}

         {values.tags?.map((slug) => (
            <RemovableChip
               key={slug}
               icon={<TagIcon size={10} strokeWidth={2.25} />}
               onRemove={() => onRemove("tags", slug)}
            >
               {tagLabel ? tagLabel(slug) : slug}
            </RemovableChip>
         ))}

         {values.mimeType && (
            <RemovableChip onRemove={() => onRemove("mimeType")}>
               Type: {prettyMime(values.mimeType)}
            </RemovableChip>
         )}

         {values.isConfidential !== undefined && (
            <RemovableChip
               icon={<Lock size={10} strokeWidth={2.25} />}
               tone='warn'
               onRemove={() => onRemove("isConfidential")}
            >
               {values.isConfidential ? "Confidential only" : "Non-confidential"}
            </RemovableChip>
         )}

         {values.isExpired !== undefined && (
            <RemovableChip onRemove={() => onRemove("isExpired")}>
               {values.isExpired ? "Expired only" : "Not expired"}
            </RemovableChip>
         )}

         {values.updatedAfter && (
            <RemovableChip onRemove={() => onRemove("updatedAfter")}>
               After {prettyDate(values.updatedAfter)}
            </RemovableChip>
         )}

         {values.updatedBefore && (
            <RemovableChip onRemove={() => onRemove("updatedBefore")}>
               Before {prettyDate(values.updatedBefore)}
            </RemovableChip>
         )}

         <button
            type='button'
            onClick={onClear}
            className='ml-auto inline-flex items-center gap-1 text-[12px] font-medium transition-colors h-6 px-2 rounded-md'
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
            <X size={11} strokeWidth={2.5} />
            Clear all
         </button>
      </div>
   );
};

function prettyMime(value: string): string {
   // Human-label for the convenience strings sent to the backend.
   const map: Record<string, string> = {
      pdf: "PDF",
      image: "Images",
      word: "Word",
      sheet: "Sheets",
      slides: "Slides",
      archive: "Archive",
      video: "Video",
      audio: "Audio",
   };
   return map[value] ?? value;
}

function prettyDate(iso: string): string {
   const d = new Date(iso);
   if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
   return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
   });
}

const RemovableChip: FC<{
   children: React.ReactNode;
   icon?: React.ReactNode;
   onRemove: () => void;
   tone?: "default" | "warn";
}> = ({ children, icon, onRemove, tone = "default" }) => {
   const palette =
      tone === "warn"
         ? {
              background: "var(--dc-warn-soft)",
              color: "var(--dc-warn)",
              border: "var(--dc-warn-border)",
           }
         : {
              background: "var(--dc-accent-soft)",
              color: "var(--dc-accent)",
              border: "var(--dc-accent-border)",
           };
   return (
      <span
         className='inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-full text-[11.5px] font-medium'
         style={{
            background: palette.background,
            color: palette.color,
            border: `1px solid ${palette.border}`,
         }}
      >
         {icon}
         {children}
         <button
            type='button'
            aria-label='Remove filter'
            onClick={onRemove}
            className='w-4 h-4 inline-flex items-center justify-center rounded-full transition-colors'
            style={{ color: palette.color, opacity: 0.7 }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
         >
            <X size={11} strokeWidth={2.5} />
         </button>
      </span>
   );
};
