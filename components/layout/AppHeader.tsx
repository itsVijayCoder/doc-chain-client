"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUIStore } from "@/lib/stores/uiStore";
import { useTheme } from "next-themes";
import { ChevronRight, Menu, Moon, Search, Sun } from "lucide-react";
import { NotificationDropdown } from "./NotificationDropdown";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// Breadcrumb builder — maps path segments to human labels.
// Unknown segments get title-cased as a safe fallback; hash-shaped
// segments (UUIDs, long hex) collapse to a generic placeholder so we
// don't leak IDs into the topbar.
// ─────────────────────────────────────────────────────────────────────
const SEGMENT_LABELS: Record<string, string> = {
   dashboard: "Dashboard",
   documents: "My Documents",
   shared: "Shared with Me",
   search: "Search",
   favorites: "Favorites",
   archive: "Archive",
   archived: "Archived",
   trash: "Trash",
   settings: "Settings",
   profile: "Profile",
   security: "Security",
   preferences: "Preferences",
   admin: "Admin",
   users: "Users",
   roles: "Roles",
   blockchain: "Blockchain",
   records: "Transaction",
   "watermark-trace": "Watermark Trace",
   "audit-logs": "Audit Logs",
   s: "Share",
};

function looksLikeId(seg: string): boolean {
   // UUID or long hex — treat as an ID and swap to a placeholder label.
   if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return true;
   if (/^[0-9a-f]{16,}$/i.test(seg)) return true;
   return false;
}

function buildCrumbs(pathname: string | null): string[] {
   if (!pathname || pathname === "/") return ["Home"];
   const parts = pathname.split("/").filter(Boolean);
   if (parts.length === 0) return ["Home"];
   return parts.map((seg) => {
      if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
      if (looksLikeId(seg)) return "Item";
      // Title-case fallback: "some-thing" → "Some Thing"
      return seg
         .split("-")
         .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
         .join(" ");
   });
}

// ─────────────────────────────────────────────────────────────────────
// Design-system icon button (matches .icon-btn: 32×32, hover surface-2)
// ─────────────────────────────────────────────────────────────────────
interface IconBtnProps {
   onClick?: () => void;
   ariaLabel: string;
   title?: string;
   children: React.ReactNode;
   showDot?: boolean;
}

const IconBtn: FC<IconBtnProps> = ({ onClick, ariaLabel, title, children, showDot }) => (
   <button
      type='button'
      onClick={onClick}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className='relative w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-[120ms]
                 hover:bg-[var(--dc-surface-2)]'
      style={{ color: "var(--dc-text-muted)" }}
   >
      {children}
      {showDot && (
         <span
            aria-hidden
            className='absolute top-[7px] right-[7px] w-[6px] h-[6px] rounded-full'
            style={{
               background: "var(--dc-accent)",
               border: "2px solid var(--dc-bg)",
            }}
         />
      )}
   </button>
);

// ─────────────────────────────────────────────────────────────────────
// AppHeader — 52px topbar with breadcrumbs, ⌘K trigger, theme & bell
// ─────────────────────────────────────────────────────────────────────
export const AppHeader: FC = () => {
   const pathname = usePathname();
   const router = useRouter();
   const { setMobileMenuOpen, toggleCommandPalette } = useUIStore();
   const { theme, resolvedTheme, setTheme } = useTheme();

   const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);

   // Detect platform for the keyboard hint. SSR-safe: starts false (⌃K),
   // updates after mount so macOS users see ⌘K. next-themes does the same
   // dance for theme, so this is consistent with existing patterns.
   const [isMac, setIsMac] = useState(false);
   useEffect(() => {
      setIsMac(
         typeof navigator !== "undefined" &&
            /Mac|iPhone|iPad/.test(navigator.platform)
      );
   }, []);

   const currentTheme = theme === "system" ? resolvedTheme : theme;
   const toggleTheme = () => {
      // Flip the next-themes class, AND briefly add `.dc-theme-animate` to
      // <html> so the CSS rule in globals.css animates background/text/border
      // colors for one frame. Removed after the transition window so it
      // doesn't slow down everyday hover/focus interactions.
      if (typeof document !== "undefined") {
         const html = document.documentElement;
         html.classList.add("dc-theme-animate");
         window.setTimeout(() => html.classList.remove("dc-theme-animate"), 320);
      }
      setTheme(currentTheme === "dark" ? "light" : "dark");
   };

   return (
      <header
         className='fixed top-0 right-0 left-0 lg:left-14 z-30 h-[52px] flex items-center gap-4 px-5'
         style={{
            background: "var(--dc-bg)",
            borderBottom: "1px solid var(--dc-border)",
         }}
      >
         {/* Mobile menu — keeps the existing mobile drawer functional */}
         <button
            type='button'
            onClick={() => setMobileMenuOpen(true)}
            aria-label='Open menu'
            className='lg:hidden w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--dc-surface-2)]'
            style={{ color: "var(--dc-text-muted)" }}
         >
            <Menu size={18} strokeWidth={1.75} />
         </button>

         {/* Breadcrumbs */}
         <nav
            aria-label='Breadcrumb'
            className='flex items-center gap-2 text-[13px] min-w-0'
            style={{ color: "var(--dc-text-muted)" }}
         >
            {crumbs.map((c, i) => {
               const isLast = i === crumbs.length - 1;
               return (
                  <span key={i} className='flex items-center gap-2 shrink-0'>
                     {i > 0 && (
                        <span style={{ color: "var(--dc-text-faint)" }} aria-hidden>
                           <ChevronRight size={12} strokeWidth={2} />
                        </span>
                     )}
                     <span
                        className={cn("truncate", isLast && "font-medium")}
                        style={{
                           color: isLast
                              ? "var(--dc-text)"
                              : "var(--dc-text-muted)",
                        }}
                     >
                        {c}
                     </span>
                  </span>
               );
            })}
         </nav>

         {/* Spacer */}
         <div className='flex-1' />

         {/* ⌘K trigger — min-width 260px, search icon + placeholder + kbd */}
         <button
            type='button'
            onClick={toggleCommandPalette}
            className='hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] min-w-[260px]
                       transition-colors duration-[120ms]'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
               color: "var(--dc-text-dim)",
            }}
            onMouseEnter={(e) => {
               e.currentTarget.style.borderColor = "var(--dc-border-strong)";
               e.currentTarget.style.background = "var(--dc-surface-2)";
            }}
            onMouseLeave={(e) => {
               e.currentTarget.style.borderColor = "var(--dc-border)";
               e.currentTarget.style.background = "var(--dc-surface)";
            }}
         >
            <Search size={14} strokeWidth={1.75} />
            <span className='flex-1 text-left'>Search or jump to…</span>
            <span
               className='px-[5px] py-[2px] rounded text-[10.5px] leading-none font-medium'
               style={{
                  fontFamily: "var(--dc-font-mono)",
                  background: "var(--dc-surface-2)",
                  border: "1px solid var(--dc-border-strong)",
                  color: "var(--dc-text-dim)",
               }}
            >
               {isMac ? "⌘K" : "Ctrl K"}
            </span>
         </button>

         {/* Mobile search icon (below sm breakpoint where ⌘K button is hidden) */}
         <button
            type='button'
            onClick={() => router.push("/search")}
            aria-label='Search'
            className='sm:hidden w-8 h-8 rounded-md flex items-center justify-center hover:bg-[var(--dc-surface-2)]'
            style={{ color: "var(--dc-text-muted)" }}
         >
            <Search size={16} strokeWidth={1.75} />
         </button>

         {/* Theme toggle */}
         <IconBtn
            ariaLabel='Toggle theme'
            title={currentTheme === "dark" ? "Switch to light" : "Switch to dark"}
            onClick={toggleTheme}
         >
            {currentTheme === "dark" ? (
               <Sun size={16} strokeWidth={1.75} />
            ) : (
               <Moon size={16} strokeWidth={1.75} />
            )}
         </IconBtn>

         {/* Notifications */}
         <NotificationDropdown />
      </header>
   );
};
