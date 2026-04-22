"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/stores/uiStore";
import { hasRole } from "@/lib/utils/permissions";
import { useAuth } from "@/lib/hooks/useAuth";
import {
   Activity,
   Archive,
   FileText,
   FolderPlus,
   Heart,
   Home,
   KeyRound,
   LayoutDashboard,
   Lock,
   LogOut,
   Search,
   Settings,
   Share2,
   Shield,
   Trash2,
   Upload,
   Users,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────
// Items — static placeholder list. Navigation items work (just a
// router.push). Action items log to console for now. Real command
// wiring (upload, new folder, etc.) comes later.
// ─────────────────────────────────────────────────────────────────────
interface PaletteItem {
   id: string;
   label: string;
   Icon: typeof Search;
   /** Keyboard hint shown on the right, e.g. "⌘U". */
   hint?: string;
   /** If present, clicking navigates here. */
   href?: string;
   /** Otherwise, this runs. */
   action?: () => void;
   /** Admin-only item. Gated by role when rendering. */
   adminOnly?: boolean;
}

interface PaletteGroup {
   label: string;
   items: PaletteItem[];
}

function buildGroups(opts: {
   router: ReturnType<typeof useRouter>;
   logout: () => void;
}): PaletteGroup[] {
   const { logout } = opts;
   return [
      {
         label: "Jump to",
         items: [
            { id: "go:dashboard", label: "Dashboard", Icon: Home, href: "/dashboard" },
            { id: "go:documents", label: "My Documents", Icon: FileText, href: "/documents", hint: "G D" },
            { id: "go:shared", label: "Shared with Me", Icon: Share2, href: "/shared", hint: "G S" },
            { id: "go:favorites", label: "Favorites", Icon: Heart, href: "/favorites" },
            { id: "go:archive", label: "Archive", Icon: Archive, href: "/archived" },
            { id: "go:trash", label: "Trash", Icon: Trash2, href: "/trash" },
            { id: "go:search", label: "Search", Icon: Search, href: "/search" },
         ],
      },
      {
         label: "Admin",
         items: [
            { id: "go:admin", label: "Admin Overview", Icon: LayoutDashboard, href: "/admin", adminOnly: true },
            { id: "go:users", label: "User Management", Icon: Users, href: "/admin/users", adminOnly: true },
            { id: "go:roles", label: "Role Management", Icon: KeyRound, href: "/admin/roles", adminOnly: true },
            { id: "go:security", label: "Security Center", Icon: Shield, href: "/admin/security", adminOnly: true },
            { id: "go:audit", label: "Audit Logs", Icon: Activity, href: "/admin/audit-logs", adminOnly: true },
         ],
      },
      {
         label: "Actions",
         items: [
            {
               id: "act:upload",
               label: "Upload document…",
               Icon: Upload,
               hint: "⌘U",
               action: () => console.log("[palette] upload — wire up later"),
            },
            {
               id: "act:new-folder",
               label: "New folder",
               Icon: FolderPlus,
               action: () => console.log("[palette] new folder — wire up later"),
            },
            {
               id: "act:settings",
               label: "Settings",
               Icon: Settings,
               href: "/settings/profile",
            },
            {
               id: "act:security",
               label: "Security settings",
               Icon: Lock,
               href: "/settings/security",
            },
            {
               id: "act:logout",
               label: "Log out",
               Icon: LogOut,
               action: logout,
            },
         ],
      },
   ];
}

export const CommandPalette: FC = () => {
   const router = useRouter();
   const open = useUIStore((s) => s.commandPaletteOpen);
   const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
   const toggle = useUIStore((s) => s.toggleCommandPalette);
   const { user, logout } = useAuth();

   const [query, setQuery] = useState("");
   const [active, setActive] = useState(0);
   const inputRef = useRef<HTMLInputElement>(null);

   // ── Global ⌘K / Ctrl+K shortcut ──────────────────────────────────
   // Lives on this component (not the header) so it works anywhere
   // the palette is mounted, including on pages without a visible
   // trigger button.
   useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
         if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            toggle();
         }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
   }, [toggle]);

   // ── Reset + focus on open ────────────────────────────────────────
   useEffect(() => {
      if (open) {
         setQuery("");
         setActive(0);
         // Defer focus until the panel is rendered + transitioned in.
         const t = window.setTimeout(() => inputRef.current?.focus(), 50);
         return () => window.clearTimeout(t);
      }
   }, [open]);

   // ── Build + filter items ─────────────────────────────────────────
   const allGroups = useMemo(
      () =>
         buildGroups({ router, logout: () => void logout() }).map((g) => ({
            ...g,
            items: g.items.filter(
               (it) => !it.adminOnly || (user && hasRole(user.role, ["admin"]))
            ),
         })).filter((g) => g.items.length > 0),
      [router, logout, user]
   );

   const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return allGroups;
      return allGroups
         .map((g) => ({
            ...g,
            items: g.items.filter((it) => it.label.toLowerCase().includes(q)),
         }))
         .filter((g) => g.items.length > 0);
   }, [allGroups, query]);

   const flat = useMemo(() => filtered.flatMap((g) => g.items), [filtered]);

   // Clamp active index when the filtered list shrinks.
   useEffect(() => {
      if (active >= flat.length) setActive(Math.max(0, flat.length - 1));
   }, [active, flat.length]);

   const runItem = (item: PaletteItem) => {
      setOpen(false);
      if (item.href) router.push(item.href);
      else item.action?.();
   };

   const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
         e.preventDefault();
         setOpen(false);
      } else if (e.key === "ArrowDown") {
         e.preventDefault();
         setActive((a) => Math.min(a + 1, flat.length - 1));
      } else if (e.key === "ArrowUp") {
         e.preventDefault();
         setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
         e.preventDefault();
         const item = flat[active];
         if (item) runItem(item);
      }
   };

   // Flat index → group index mapping so we can highlight the right row.
   let runningOffset = 0;

   return (
      <div
         role='dialog'
         aria-modal='true'
         aria-label='Command palette'
         aria-hidden={!open}
         onClick={() => setOpen(false)}
         className='fixed inset-0 z-[200] flex items-start justify-center pt-[120px] transition-[opacity,backdrop-filter] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
         style={{
            // Backdrop animates from transparent+no-blur to dim+blurred so
            // the page visually "recedes" when the palette opens.
            background: open ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
            backdropFilter: open ? "blur(6px)" : "blur(0px)",
            WebkitBackdropFilter: open ? "blur(6px)" : "blur(0px)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
         }}
      >
         <div
            onClick={(e) => e.stopPropagation()}
            className='w-[560px] max-w-[calc(100vw-40px)] overflow-hidden transition-all duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
            style={{
               background: "var(--dc-elevated)",
               border: "1px solid var(--dc-border-strong)",
               borderRadius: 14,
               boxShadow: open ? "var(--dc-shadow-lg)" : "none",
               // Bigger scale delta + translate so the panel visually "drops in"
               // from above when opening.
               transform: open
                  ? "translateY(0) scale(1)"
                  : "translateY(-16px) scale(0.94)",
               transformOrigin: "top center",
               opacity: open ? 1 : 0,
            }}
         >
            {/* Input */}
            <div
               className='flex items-center gap-2.5 px-[18px] py-3.5'
               style={{ borderBottom: "1px solid var(--dc-border)" }}
            >
               <Search
                  size={16}
                  strokeWidth={1.75}
                  style={{ color: "var(--dc-text-dim)" }}
               />
               <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                     setQuery(e.target.value);
                     setActive(0);
                  }}
                  onKeyDown={onInputKey}
                  placeholder='Search or jump to…'
                  className='flex-1 bg-transparent border-none outline-none text-[15px]'
                  style={{
                     color: "var(--dc-text)",
                     fontFamily: "var(--dc-font-sans)",
                  }}
               />
               <span
                  className='px-[5px] py-[2px] rounded text-[10.5px] leading-none font-medium'
                  style={{
                     fontFamily: "var(--dc-font-mono)",
                     background: "var(--dc-surface-2)",
                     border: "1px solid var(--dc-border-strong)",
                     color: "var(--dc-text-dim)",
                  }}
               >
                  esc
               </span>
            </div>

            {/* List */}
            <div className='max-h-[380px] overflow-y-auto p-1.5'>
               {filtered.map((g) => {
                  const groupStart = runningOffset;
                  runningOffset += g.items.length;
                  return (
                     <div key={g.label}>
                        <div
                           className='px-2.5 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]'
                           style={{ color: "var(--dc-text-faint)" }}
                        >
                           {g.label}
                        </div>
                        {g.items.map((it, i) => {
                           const idx = groupStart + i;
                           const isActive = idx === active;
                           return (
                              <div
                                 key={it.id}
                                 role='option'
                                 aria-selected={isActive}
                                 onMouseEnter={() => setActive(idx)}
                                 onClick={() => runItem(it)}
                                 className='flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer text-[13px] transition-colors'
                                 style={{
                                    color: isActive
                                       ? "var(--dc-text)"
                                       : "var(--dc-text-muted)",
                                    background: isActive
                                       ? "var(--dc-surface-2)"
                                       : "transparent",
                                 }}
                              >
                                 <it.Icon
                                    size={14}
                                    strokeWidth={1.75}
                                    style={{
                                       color: isActive
                                          ? "var(--dc-text)"
                                          : "var(--dc-text-muted)",
                                    }}
                                 />
                                 <span className='flex-1'>{it.label}</span>
                                 {it.hint && (
                                    <span
                                       className='text-[11px]'
                                       style={{
                                          color: "var(--dc-text-faint)",
                                          fontFamily: "var(--dc-font-mono)",
                                       }}
                                    >
                                       {it.hint}
                                    </span>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  );
               })}

               {flat.length === 0 && (
                  <div
                     className='py-5 text-center text-[13px]'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     No results
                  </div>
               )}
            </div>
         </div>
      </div>
   );
};
