"use client";

import { FC, ReactNode, useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Chip, DcButton } from "@/components/design/primitives";

// ─────────────────────────────────────────────────────────────────────
// Filter values (shared shape with the documents page URL state).
// `undefined` means "no filter"; for the tri-state booleans
// (confidential / expired), `true` and `false` are distinct filters.
// ─────────────────────────────────────────────────────────────────────
export interface DocumentFilterValues {
   mimeType?: string;
   isConfidential?: boolean;
   isExpired?: boolean;
   updatedAfter?: string;
   updatedBefore?: string;
}

// null means "clear". undefined means "don't change".
export type DocumentFilterPatch = {
   [K in keyof DocumentFilterValues]?:
      | NonNullable<DocumentFilterValues[K]>
      | null;
};

const MIME_OPTIONS: { label: string; value?: string }[] = [
   { label: "All", value: undefined },
   { label: "PDF", value: "pdf" },
   { label: "Images", value: "image" },
   { label: "Word", value: "word" },
   { label: "Sheets", value: "sheet" },
   { label: "Slides", value: "slides" },
   { label: "Archive", value: "archive" },
   { label: "Video", value: "video" },
   { label: "Audio", value: "audio" },
];

// Tri-state helper — converts the boolean filter to the chip-group value
// and back. "any" is represented as undefined on the wire.
type TriState = "any" | "only" | "exclude";
function triFromBool(v?: boolean): TriState {
   if (v === true) return "only";
   if (v === false) return "exclude";
   return "any";
}
function boolFromTri(t: TriState): boolean | null {
   if (t === "only") return true;
   if (t === "exclude") return false;
   return null;
}

// Convert the YYYY-MM-DD from a date input to RFC3339 at start/end of day,
// mirroring the helper in audit-logs. Kept local — the dates here don't
// leak past this component.
function toRFC3339Start(yyyyMmDd: string): string {
   return `${yyyyMmDd}T00:00:00Z`;
}
function toRFC3339End(yyyyMmDd: string): string {
   return `${yyyyMmDd}T23:59:59Z`;
}
function fromRFC3339ToDateInput(v?: string): string {
   if (!v) return "";
   return v.slice(0, 10);
}

export const DocumentFilterPopover: FC<{
   values: DocumentFilterValues;
   onChange: (patch: DocumentFilterPatch) => void;
   onClear: () => void;
}> = ({ values, onChange, onClear }) => {
   // How many filters are applied — drives the count badge on the trigger.
   const activeCount = useMemo(() => {
      let n = 0;
      if (values.mimeType) n += 1;
      if (values.isConfidential !== undefined) n += 1;
      if (values.isExpired !== undefined) n += 1;
      if (values.updatedAfter) n += 1;
      if (values.updatedBefore) n += 1;
      return n;
   }, [values]);

   const confidentialTri = triFromBool(values.isConfidential);
   const expiredTri = triFromBool(values.isExpired);

   return (
      <Popover>
         <PopoverTrigger
            render={
               <DcButton
                  icon={<Filter size={14} strokeWidth={2} />}
                  title='Filter by type, confidentiality, expiry, or update date'
               >
                  Filters
                  {activeCount > 0 && (
                     <span
                        className='inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-semibold tabular-nums'
                        style={{
                           background: "var(--dc-accent)",
                           color: "#061f15",
                        }}
                     >
                        {activeCount}
                     </span>
                  )}
               </DcButton>
            }
         />
         <PopoverContent
            align='start'
            sideOffset={6}
            className='w-[340px] !gap-3'
         >
            <Section label='Type'>
               <div className='flex flex-wrap gap-1.5'>
                  {MIME_OPTIONS.map((m) => {
                     const active =
                        (m.value ?? null) === (values.mimeType ?? null);
                     return (
                        <Chip
                           key={m.label}
                           active={active}
                           onClick={() =>
                              onChange({
                                 mimeType: m.value ?? null,
                              })
                           }
                        >
                           {m.label}
                        </Chip>
                     );
                  })}
               </div>
            </Section>

            <Section label='Confidential'>
               <TriChipGroup
                  value={confidentialTri}
                  onChange={(next) =>
                     onChange({ isConfidential: boolFromTri(next) })
                  }
                  labels={{
                     any: "Any",
                     only: "Only confidential",
                     exclude: "Exclude",
                  }}
               />
            </Section>

            <Section label='Expired'>
               <TriChipGroup
                  value={expiredTri}
                  onChange={(next) =>
                     onChange({ isExpired: boolFromTri(next) })
                  }
                  labels={{
                     any: "Any",
                     only: "Only expired",
                     exclude: "Exclude",
                  }}
               />
            </Section>

            <Section label='Updated'>
               <div className='flex items-center gap-2'>
                  <DateInput
                     label='From'
                     value={fromRFC3339ToDateInput(values.updatedAfter)}
                     onChange={(v) =>
                        onChange({
                           updatedAfter: v ? toRFC3339Start(v) : null,
                        })
                     }
                  />
                  <DateInput
                     label='To'
                     value={fromRFC3339ToDateInput(values.updatedBefore)}
                     onChange={(v) =>
                        onChange({
                           updatedBefore: v ? toRFC3339End(v) : null,
                        })
                     }
                  />
               </div>
            </Section>

            {activeCount > 0 && (
               <div
                  className='flex items-center justify-between pt-2'
                  style={{ borderTop: "1px solid var(--dc-border)" }}
               >
                  <span
                     className='text-[11px]'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     {activeCount} filter{activeCount === 1 ? "" : "s"} active
                  </span>
                  <button
                     type='button'
                     onClick={onClear}
                     className='inline-flex items-center gap-1 text-[12px] font-medium transition-colors'
                     style={{ color: "var(--dc-accent)" }}
                  >
                     <X size={11} strokeWidth={2.5} />
                     Clear all
                  </button>
               </div>
            )}
         </PopoverContent>
      </Popover>
   );
};

const Section: FC<{ label: string; children: ReactNode }> = ({
   label,
   children,
}) => (
   <div>
      <div
         className='text-[10.5px] font-semibold uppercase tracking-[0.06em] mb-1.5'
         style={{ color: "var(--dc-text-dim)" }}
      >
         {label}
      </div>
      {children}
   </div>
);

const TriChipGroup: FC<{
   value: TriState;
   onChange: (next: TriState) => void;
   labels: Record<TriState, string>;
}> = ({ value, onChange, labels }) => (
   <div className='flex flex-wrap gap-1.5'>
      {(["any", "only", "exclude"] as TriState[]).map((t) => (
         <Chip key={t} active={value === t} onClick={() => onChange(t)}>
            {labels[t]}
         </Chip>
      ))}
   </div>
);

// Compact themed date input. No label row above — label lives inline so
// both date inputs fit on one row inside the popover.
const DateInput: FC<{
   label: string;
   value: string;
   onChange: (v: string) => void;
}> = ({ label, value, onChange }) => (
   <label
      className='flex items-center gap-1.5 flex-1 min-w-0 h-8 px-2 rounded-md transition-all focus-within:shadow-[0_0_0_3px_var(--dc-accent-soft)] focus-within:border-[color:var(--dc-accent-border)]'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
      }}
   >
      <span
         className='text-[10.5px] uppercase tracking-[0.06em] whitespace-nowrap'
         style={{ color: "var(--dc-text-dim)" }}
      >
         {label}
      </span>
      <input
         type='date'
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className='flex-1 min-w-0 bg-transparent border-none outline-none text-[12px] tabular-nums'
         style={{ color: "var(--dc-text)" }}
      />
   </label>
);
