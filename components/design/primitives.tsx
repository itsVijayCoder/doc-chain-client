"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Clock, Lock, Shield, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ═══════════════════════════════════════════════════════════════════
// Shared design-system primitives
// Used across Dashboard, Documents, Admin pages — import from here
// instead of duplicating inline definitions.
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────
// Chain status badge — three states matching the backend's tx lifecycle
// ─────────────────────────────────────────────────────────────────────
export type ChainStatus = "verified" | "pending" | "failed";

const CHAIN_STATUS_STYLE: Record<
   ChainStatus,
   { color: string; bg: string; border: string; label: string; Icon: typeof Shield }
> = {
   verified: {
      color: "var(--dc-info)",
      bg: "var(--dc-info-soft)",
      border: "var(--dc-info-border)",
      label: "verified",
      Icon: Shield,
   },
   pending: {
      color: "var(--dc-warn)",
      bg: "var(--dc-warn-soft)",
      border: "var(--dc-warn-border)",
      label: "pending",
      Icon: Clock,
   },
   failed: {
      color: "var(--dc-danger)",
      bg: "var(--dc-danger-soft)",
      border: "var(--dc-danger-border)",
      label: "failed",
      Icon: XCircle,
   },
};

export const VerifiedBadge: FC<{ status?: ChainStatus; className?: string }> = ({
   status = "verified",
   className,
}) => {
   const s = CHAIN_STATUS_STYLE[status];
   return (
      <div
         className={cn(
            "inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded",
            className
         )}
         style={{
            color: s.color,
            background: s.bg,
            border: `1px solid ${s.border}`,
         }}
      >
         <s.Icon size={10} strokeWidth={2.25} />
         {s.label}
      </div>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Confidential indicator — three variants sharing the same amber/warn
// palette. `icon` is for card titles/table rows where space is tight;
// `chip` is for denser meta rows; `banner` is the full-width callout
// that sits above the viewer on a confidential document's detail page.
// Backend transparently watermarks every download of a confidential
// document — this component only marks the posture in the UI.
// ─────────────────────────────────────────────────────────────────────
export type ConfidentialVariant = "icon" | "chip" | "banner";

export const ConfidentialIndicator: FC<{
   variant?: ConfidentialVariant;
   /** Override default label. Icon variant ignores this. */
   label?: string;
   className?: string;
}> = ({ variant = "icon", label, className }) => {
   if (variant === "icon") {
      return (
         <Lock
            aria-label='Confidential'
            size={11}
            strokeWidth={2.25}
            className={cn("shrink-0", className)}
            style={{ color: "var(--dc-warn)" }}
         />
      );
   }

   if (variant === "chip") {
      return (
         <span
            className={cn(
               "inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded",
               className
            )}
            style={{
               color: "var(--dc-warn)",
               background: "var(--dc-warn-soft)",
               border: "1px solid var(--dc-warn-border)",
            }}
         >
            <Lock size={10} strokeWidth={2.25} />
            {label ?? "Confidential"}
         </span>
      );
   }

   // banner
   return (
      <div
         className={cn(
            "flex items-start gap-3 p-3.5 rounded-xl",
            className
         )}
         style={{
            background: "var(--dc-warn-soft)",
            border: "1px solid var(--dc-warn-border)",
         }}
      >
         <div
            className='w-9 h-9 rounded-lg flex items-center justify-center shrink-0'
            style={{
               background: "var(--dc-warn-border)",
               color: "var(--dc-warn)",
            }}
         >
            <Lock size={16} strokeWidth={2} />
         </div>
         <div className='min-w-0 flex-1'>
            <div
               className='text-[13.5px] font-semibold'
               style={{ color: "var(--dc-text)" }}
            >
               {label ?? "Confidential Document"}
            </div>
            <div
               className='text-[12px] mt-0.5 leading-relaxed'
               style={{ color: "var(--dc-text-muted)" }}
            >
               Downloads are forensically watermarked and tracked. Every
               download is logged with the viewer&rsquo;s identity.
            </div>
         </div>
      </div>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Priority badge — high/medium/low for AI insights, suggestions
// ─────────────────────────────────────────────────────────────────────
export type Priority = "high" | "medium" | "low";

export const PriorityBadge: FC<{ priority: Priority | string; className?: string }> = ({
   priority,
   className,
}) => {
   const cfg =
      priority === "high"
         ? {
              color: "var(--dc-danger)",
              bg: "var(--dc-danger-soft)",
              border: "var(--dc-danger-border)",
           }
         : priority === "medium"
         ? {
              color: "var(--dc-warn)",
              bg: "var(--dc-warn-soft)",
              border: "var(--dc-warn-border)",
           }
         : {
              color: "var(--dc-info)",
              bg: "var(--dc-info-soft)",
              border: "var(--dc-info-border)",
           };
   return (
      <span
         className={cn(
            "inline-flex items-center text-[10.5px] font-medium px-1.5 py-0.5 rounded uppercase tracking-[0.04em]",
            className
         )}
         style={{
            color: cfg.color,
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
         }}
      >
         {priority}
      </span>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Stats strip — 4-column grid joined by 1px gaps
// ─────────────────────────────────────────────────────────────────────
export const StatsStrip: FC<{ children: ReactNode; cols?: 2 | 3 | 4 | 5 }> = ({
   children,
   cols = 4,
}) => (
   <div
      className={cn(
         "grid gap-px rounded-xl overflow-hidden mb-6",
         cols === 5 && "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
         cols === 4 && "grid-cols-2 lg:grid-cols-4",
         cols === 3 && "grid-cols-1 md:grid-cols-3",
         cols === 2 && "grid-cols-1 md:grid-cols-2"
      )}
      style={{
         background: "var(--dc-border)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {children}
   </div>
);

export interface StatProps {
   label: string;
   labelIcon?: ReactNode;
   /** Override the label color (defaults to text-dim). */
   labelColor?: string;
   value: string;
   trend?: string;
   /** When true, tints the big number in the accent color. */
   valueAccent?: boolean;
   /** Custom value color override (takes precedence over valueAccent). */
   valueColor?: string;
}

export const Stat: FC<StatProps> = ({
   label,
   labelIcon,
   labelColor,
   value,
   trend,
   valueAccent,
   valueColor,
}) => (
   <div
      className='px-[18px] py-3.5 flex flex-col gap-1 transition-colors'
      style={{ background: "var(--dc-surface)" }}
   >
      <div
         className='flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.06em]'
         style={{ color: labelColor ?? "var(--dc-text-dim)" }}
      >
         {labelIcon}
         {label}
      </div>
      <div
         className='text-[22px] font-semibold tracking-[-0.02em] tabular-nums'
         style={{
            color: valueColor ?? (valueAccent ? "var(--dc-accent)" : "var(--dc-text)"),
            fontFamily: "var(--dc-font-display)",
         }}
      >
         {value}
      </div>
      {trend && (
         <div
            className='text-[11px] tabular-nums'
            style={{ color: "var(--dc-text-dim)" }}
         >
            {trend}
         </div>
      )}
   </div>
);

// ─────────────────────────────────────────────────────────────────────
// Panel — bordered card with header + body
// ─────────────────────────────────────────────────────────────────────
export interface PanelProps {
   title?: ReactNode;
   titleIcon?: ReactNode;
   subtitle?: ReactNode;
   action?: ReactNode;
   children: ReactNode;
   className?: string;
   bodyClassName?: string;
   /** Omits padding on the body so tables/lists render edge-to-edge. */
   flushBody?: boolean;
}

export const Panel: FC<PanelProps> = ({
   title,
   titleIcon,
   subtitle,
   action,
   children,
   className,
   bodyClassName,
   flushBody,
}) => (
   <section
      className={cn("rounded-xl overflow-hidden", className)}
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {(title || action) && (
         <header
            className='flex items-center justify-between px-4 py-3 gap-4'
            style={{
               borderBottom: "1px solid var(--dc-border)",
               background: "var(--dc-surface-2)",
            }}
         >
            <div className='min-w-0'>
               <div
                  className='text-[13px] font-semibold flex items-center gap-1.5'
                  style={{ color: "var(--dc-text)" }}
               >
                  {titleIcon}
                  {title}
               </div>
               {subtitle && (
                  <div
                     className='text-[11.5px] mt-0.5'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     {subtitle}
                  </div>
               )}
            </div>
            {action}
         </header>
      )}
      <div className={cn(flushBody ? "" : "p-1.5", bodyClassName)}>{children}</div>
   </section>
);

export const ViewAllLink: FC<{ href: string; label?: string }> = ({
   href,
   label = "View all",
}) => (
   <Link
      href={href}
      className='text-[12px] flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors'
      style={{ color: "var(--dc-text-muted)" }}
   >
      {label} <ChevronRight size={12} strokeWidth={2} />
   </Link>
);

// ─────────────────────────────────────────────────────────────────────
// ListRow — the .list-row primitive (icon + title/sub + optional right)
// ─────────────────────────────────────────────────────────────────────
export interface ListRowProps {
   icon: ReactNode;
   title: ReactNode;
   sub?: ReactNode;
   right?: ReactNode;
   href?: string;
   onClick?: () => void;
}

export const ListRow: FC<ListRowProps> = ({ icon, title, sub, right, href, onClick }) => {
   const inner = (
      <div
         className='flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors'
         onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--dc-surface-2)";
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
         }}
         onClick={onClick}
      >
         <div
            className='w-7 h-7 rounded-md flex items-center justify-center shrink-0'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
               color: "var(--dc-text-muted)",
            }}
         >
            {icon}
         </div>
         <div className='flex-1 min-w-0'>
            <div
               className='text-[13px] font-medium truncate'
               style={{ color: "var(--dc-text)" }}
            >
               {title}
            </div>
            {sub && (
               <div
                  className='text-[11.5px] truncate'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {sub}
               </div>
            )}
         </div>
         {right}
      </div>
   );

   if (href) return <Link href={href}>{inner}</Link>;
   return inner;
};

// ─────────────────────────────────────────────────────────────────────
// PageHead — title + subtitle + right-side actions
// ─────────────────────────────────────────────────────────────────────
export const PageHead: FC<{
   title: ReactNode;
   titleIcon?: ReactNode;
   subtitle?: ReactNode;
   actions?: ReactNode;
   className?: string;
}> = ({ title, titleIcon, subtitle, actions, className }) => (
   <div
      className={cn(
         "flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-[22px]",
         className
      )}
   >
      <div className='min-w-0'>
         <h1
            className='text-[26px] font-semibold tracking-[-0.02em] m-0 flex items-center gap-2'
            style={{
               color: "var(--dc-text)",
               fontFamily: "var(--dc-font-display)",
            }}
         >
            {titleIcon && (
               <span style={{ color: "var(--dc-text-muted)" }}>{titleIcon}</span>
            )}
            {title}
         </h1>
         {subtitle && (
            <div
               className='text-[13px] mt-1 flex items-center gap-2.5 flex-wrap'
               style={{ color: "var(--dc-text-dim)" }}
            >
               {subtitle}
            </div>
         )}
      </div>
      {actions && <div className='flex gap-2 shrink-0'>{actions}</div>}
   </div>
);

// ─────────────────────────────────────────────────────────────────────
// Dot separator — used in page subtitles to separate facts
// ─────────────────────────────────────────────────────────────────────
export const DotSep: FC = () => (
   <span
      aria-hidden
      className='inline-block w-[3px] h-[3px] rounded-full'
      style={{ background: "var(--dc-text-faint)" }}
   />
);

// ─────────────────────────────────────────────────────────────────────
// Design-system button (matches .btn, .btn-primary, .btn-ghost, .btn-sm)
// ─────────────────────────────────────────────────────────────────────
export interface DcButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   variant?: "default" | "primary" | "ghost" | "danger";
   size?: "md" | "sm";
   icon?: ReactNode;
}

export const DcButton: FC<DcButtonProps> = ({
   variant = "default",
   size = "md",
   icon,
   children,
   className,
   ...rest
}) => {
   const sz = size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-8 px-3 text-[13px]";
   const baseStyle: React.CSSProperties =
      variant === "primary"
         ? {
              background: "var(--dc-accent)",
              border: "1px solid var(--dc-accent)",
              color: "#061f15",
              fontWeight: 600,
           }
         : variant === "ghost"
         ? {
              background: "transparent",
              border: "1px solid transparent",
              color: "var(--dc-text-muted)",
           }
         : variant === "danger"
         ? {
              background: "var(--dc-surface)",
              border: "1px solid var(--dc-border)",
              color: "var(--dc-danger)",
           }
         : {
              background: "var(--dc-surface)",
              border: "1px solid var(--dc-border)",
              color: "var(--dc-text)",
           };
   return (
      <button
         type='button'
         {...rest}
         className={cn(
            "inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors duration-[120ms] disabled:opacity-50 disabled:cursor-not-allowed",
            sz,
            className
         )}
         style={{ ...baseStyle, ...rest.style }}
         onMouseEnter={(e) => {
            if (rest.disabled) return;
            if (variant === "primary") {
               e.currentTarget.style.background = "var(--dc-accent-hover)";
               e.currentTarget.style.borderColor = "var(--dc-accent-hover)";
            } else if (variant === "ghost") {
               e.currentTarget.style.background = "var(--dc-surface-2)";
               e.currentTarget.style.color = "var(--dc-text)";
            } else if (variant === "danger") {
               e.currentTarget.style.background = "var(--dc-danger-soft)";
            } else {
               e.currentTarget.style.background = "var(--dc-surface-2)";
               e.currentTarget.style.borderColor = "var(--dc-border-strong)";
            }
         }}
         onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, baseStyle);
         }}
      >
         {icon}
         {children}
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Chip — filter chip with active state
// ─────────────────────────────────────────────────────────────────────
export interface ChipProps {
   children: ReactNode;
   active?: boolean;
   onClick?: () => void;
   onRemove?: () => void;
   variant?: "default" | "dashed";
   className?: string;
}

export const Chip: FC<ChipProps> = ({
   children,
   active,
   onClick,
   onRemove,
   variant = "default",
   className,
}) => {
   const base: React.CSSProperties = active
      ? {
           background: "var(--dc-accent-soft)",
           color: "var(--dc-accent)",
           border: "1px solid var(--dc-accent-border)",
        }
      : variant === "dashed"
      ? {
           background: "transparent",
           color: "var(--dc-text-dim)",
           border: "1px dashed var(--dc-border-strong)",
        }
      : {
           background: "var(--dc-surface-2)",
           color: "var(--dc-text-muted)",
           border: "1px solid var(--dc-border)",
        };

   return (
      <button
         type='button'
         onClick={onClick}
         className={cn(
            "inline-flex items-center gap-1.5 h-6 pl-2.5 pr-2 rounded-full text-[12px] font-medium transition-colors",
            className
         )}
         style={base}
      >
         {children}
         {onRemove && (
            <span
               role='button'
               aria-label='Remove filter'
               onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
               }}
               className='w-3 h-3 flex items-center justify-center rounded-full opacity-70 hover:opacity-100'
            >
               ×
            </span>
         )}
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Themed form primitives — Field (label wrapper), DcInput, DcTextarea.
// Co-located with DcButton so every form across the app speaks the same
// focus-ring / border / radius vocabulary. Callers compose:
//   <Field label="Title" required htmlFor="x">
//     <DcInput id="x" value={...} onChange={...} />
//   </Field>
// ─────────────────────────────────────────────────────────────────────
export const Field: FC<{
   label: string;
   required?: boolean;
   htmlFor?: string;
   hint?: ReactNode;
   children: ReactNode;
}> = ({ label, required, htmlFor, hint, children }) => (
   <div>
      <label
         htmlFor={htmlFor}
         className='block text-[12px] font-semibold mb-1.5'
         style={{ color: "var(--dc-text)" }}
      >
         {label}
         {required && (
            <span style={{ color: "var(--dc-danger)", marginLeft: 4 }}>*</span>
         )}
      </label>
      {children}
      {hint && (
         <p
            className='text-[11px] mt-1 leading-snug'
            style={{ color: "var(--dc-text-dim)" }}
         >
            {hint}
         </p>
      )}
   </div>
);

export const DcInput: FC<{
   id?: string;
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
   disabled?: boolean;
   onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
   className?: string;
}> = ({ id, value, onChange, placeholder, disabled, onKeyDown, className }) => (
   <input
      id={id}
      type='text'
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onKeyDown={onKeyDown}
      className={cn(
         "w-full h-[34px] px-2.5 rounded-md text-[13px] outline-none transition-all disabled:opacity-60",
         className
      )}
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
);

export const DcTextarea: FC<{
   id?: string;
   value: string;
   onChange: (v: string) => void;
   placeholder?: string;
   rows?: number;
   disabled?: boolean;
   className?: string;
}> = ({ id, value, onChange, placeholder, rows = 3, disabled, className }) => (
   <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={cn(
         "w-full px-2.5 py-2 rounded-md text-[13px] outline-none transition-all resize-none disabled:opacity-60",
         className
      )}
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
);

// ─────────────────────────────────────────────────────────────────────
// IconButton — 32×32 ghost button (matches .icon-btn)
// ─────────────────────────────────────────────────────────────────────
export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   ariaLabel: string;
   dotColor?: string;
}

export const IconButton: FC<IconButtonProps> = ({
   ariaLabel,
   dotColor,
   children,
   className,
   ...rest
}) => (
   <button
      type='button'
      aria-label={ariaLabel}
      title={rest.title ?? ariaLabel}
      {...rest}
      className={cn(
         "relative w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-[120ms] disabled:opacity-50",
         className
      )}
      style={{ color: "var(--dc-text-muted)", ...rest.style }}
      onMouseEnter={(e) => {
         if (rest.disabled) return;
         e.currentTarget.style.background = "var(--dc-surface-2)";
         e.currentTarget.style.color = "var(--dc-text)";
      }}
      onMouseLeave={(e) => {
         e.currentTarget.style.background = "transparent";
         e.currentTarget.style.color = "var(--dc-text-muted)";
      }}
   >
      {children}
      {dotColor && (
         <span
            aria-hidden
            className='absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full'
            style={{ background: dotColor, border: "2px solid var(--dc-bg)" }}
         />
      )}
   </button>
);
