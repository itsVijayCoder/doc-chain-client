"use client";

import { FC, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChatStore } from "@/lib/stores/chatStore";
import { useSendInScope } from "@/lib/hooks/useChat";
import { useUIStore } from "@/lib/stores/uiStore";
import { useKeywordSearch } from "@/lib/hooks/useSearch";
import { useUserSearch } from "@/lib/hooks/useUsers";
import { useRootFolders } from "@/lib/hooks/useFolders";
import { useRecentDocuments } from "@/lib/hooks/useRecentDocuments";
import { hasRole } from "@/lib/utils/permissions";
import { useTheme } from "next-themes";
import {
   Activity,
   Archive,
   ArrowRight,
   Bell,
   BrainCircuit,
   Clock,
   FileText,
   Folder as FolderIcon,
   FolderPlus,
   Heart,
   Home as HomeIcon,
   Keyboard,
   KeyRound,
   LayoutDashboard,
   Lock,
   LogOut,
   Moon,
   Plus,
   Search,
   Settings,
   Share2,
   Shield,
   Sparkles,
   Sun,
   Trash2,
   Upload,
   User as UserIcon,
   Users,
} from "lucide-react";
import type { SearchResult } from "@/lib/services/searchService";

// ═══════════════════════════════════════════════════════════════════
// Mode parser — derives the palette's behaviour from the input prefix.
// Single source of truth: all decisions flow from this.
// ═══════════════════════════════════════════════════════════════════
type Mode = "home" | "search" | "actions" | "ai" | "shortcuts";

interface ParsedInput {
   mode: Mode;
   /** The "search term" portion — prefix stripped, trimmed. */
   term: string;
}

function parseInput(raw: string): ParsedInput {
   const trimmed = raw.trim();
   if (!trimmed) return { mode: "home", term: "" };
   if (trimmed === "??" || /^shortcuts?$/i.test(trimmed))
      return { mode: "shortcuts", term: "" };
   if (trimmed.startsWith(">")) return { mode: "actions", term: trimmed.slice(1).trim() };
   if (trimmed.startsWith("?")) return { mode: "ai", term: trimmed.slice(1).trim() };
   return { mode: "search", term: trimmed };
}

// ═══════════════════════════════════════════════════════════════════
// Item shape — the palette is ultimately a flat list of these
// ═══════════════════════════════════════════════════════════════════
interface PaletteItem {
   id: string;
   label: string;
   sub?: string;
   rightHint?: string;
   Icon: typeof Search;
   iconColor?: string;
   iconBg?: string;
   adminOnly?: boolean;
   /** Action to run when the user picks this item. */
   onSelect: () => void;
}

interface PaletteGroup {
   label: string;
   items: PaletteItem[];
}

// ═══════════════════════════════════════════════════════════════════
// Action registry — hardcoded list of executable commands.
// Filtered by user permissions at render time.
// ═══════════════════════════════════════════════════════════════════
interface ActionEntry {
   id: string;
   label: string;
   keywords?: string[]; // extra search terms
   hint?: string;
   Icon: typeof Search;
   adminOnly?: boolean;
   build: (ctx: PaletteContext) => () => void;
}

interface PaletteContext {
   router: ReturnType<typeof useRouter>;
   toggleChat: () => void;
   openChatWithMessage: (msg: string) => void;
   setTheme: (t: "dark" | "light") => void;
   logout: () => Promise<void> | void;
}

const ACTIONS: ActionEntry[] = [
   {
      id: "upload",
      label: "Upload document",
      keywords: ["file", "add", "new"],
      hint: "⌘U",
      Icon: Upload,
      build: ({ router }) => () => router.push("/documents?action=upload"),
   },
   {
      id: "new-folder",
      label: "Create folder",
      keywords: ["new", "folder", "directory"],
      hint: "⌘N",
      Icon: FolderPlus,
      build: ({ router }) => () => router.push("/documents?action=new-folder"),
   },
   {
      id: "search-docs",
      label: "Search documents",
      Icon: Search,
      build: ({ router }) => () => router.push("/search"),
   },
   {
      id: "theme-dark",
      label: "Switch to dark theme",
      keywords: ["theme", "dark", "night"],
      Icon: Moon,
      build: ({ setTheme }) => () => setTheme("dark"),
   },
   {
      id: "theme-light",
      label: "Switch to light theme",
      keywords: ["theme", "light", "day"],
      Icon: Sun,
      build: ({ setTheme }) => () => setTheme("light"),
   },
   {
      id: "settings-profile",
      label: "Open settings",
      keywords: ["preferences", "profile"],
      Icon: Settings,
      build: ({ router }) => () => router.push("/settings/profile"),
   },
   {
      id: "settings-security",
      label: "Security settings",
      keywords: ["password", "2fa"],
      Icon: Lock,
      build: ({ router }) => () => router.push("/settings/security"),
   },
   {
      id: "export-audit",
      label: "Export audit log (CSV)",
      keywords: ["audit", "download", "csv", "export"],
      Icon: Activity,
      adminOnly: true,
      build: ({ router }) => () => router.push("/admin/audit-logs?action=export"),
   },
   {
      id: "create-role",
      label: "Create role",
      keywords: ["role", "permission"],
      Icon: KeyRound,
      adminOnly: true,
      build: ({ router }) => () => router.push("/admin/roles?action=new"),
   },
   {
      id: "add-user",
      label: "Add user",
      keywords: ["user", "new", "invite"],
      Icon: Users,
      adminOnly: true,
      build: ({ router }) => () => router.push("/admin/users?action=new"),
   },
   {
      id: "logout",
      label: "Log out",
      keywords: ["signout", "exit"],
      Icon: LogOut,
      build: ({ logout }) => () => void logout(),
   },
];

// ═══════════════════════════════════════════════════════════════════
// Jump-to navigation — identical to the original palette
// ═══════════════════════════════════════════════════════════════════
const JUMP_ITEMS: {
   id: string;
   label: string;
   Icon: typeof Search;
   href: string;
   hint?: string;
   adminOnly?: boolean;
}[] = [
   { id: "nav:dashboard", label: "Dashboard", Icon: HomeIcon, href: "/dashboard" },
   { id: "nav:documents", label: "My Documents", Icon: FileText, href: "/documents", hint: "G D" },
   { id: "nav:shared", label: "Shared with Me", Icon: Share2, href: "/shared", hint: "G S" },
   { id: "nav:favorites", label: "Favorites", Icon: Heart, href: "/favorites", hint: "G F" },
   { id: "nav:archive", label: "Archive", Icon: Archive, href: "/archived" },
   { id: "nav:trash", label: "Trash", Icon: Trash2, href: "/trash" },
   { id: "nav:admin", label: "Admin Overview", Icon: LayoutDashboard, href: "/admin", hint: "G A", adminOnly: true },
   { id: "nav:admin-users", label: "User Management", Icon: Users, href: "/admin/users", adminOnly: true },
   { id: "nav:admin-roles", label: "Role Management", Icon: KeyRound, href: "/admin/roles", adminOnly: true },
   { id: "nav:admin-security", label: "Security Center", Icon: Shield, href: "/admin/security", adminOnly: true },
   { id: "nav:admin-audit", label: "Audit Logs", Icon: Activity, href: "/admin/audit-logs", adminOnly: true },
];

// ═══════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════
function formatRelativeTime(ts: number): string {
   const diff = Date.now() - ts;
   const m = Math.floor(diff / 60000);
   const h = Math.floor(diff / 3600000);
   const d = Math.floor(diff / 86400000);
   if (m < 1) return "just now";
   if (m < 60) return `${m}m ago`;
   if (h < 24) return `${h}h ago`;
   return `${d}d ago`;
}

function mimeShort(mimeType?: string): string {
   if (!mimeType) return "FILE";
   if (mimeType === "application/pdf") return "PDF";
   if (mimeType.includes("wordprocessingml") || mimeType === "application/msword") return "DOCX";
   if (mimeType.includes("spreadsheetml") || mimeType === "application/vnd.ms-excel") return "XLSX";
   if (mimeType.includes("presentationml")) return "PPTX";
   if (mimeType === "text/csv") return "CSV";
   if (mimeType === "text/markdown") return "MD";
   if (mimeType.startsWith("image/")) return mimeType.split("/")[1].toUpperCase().slice(0, 4);
   const sub = mimeType.split("/")[1] ?? mimeType;
   return sub.slice(0, 5).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════
export const CommandPalette: FC = () => {
   const router = useRouter();
   const pathname = usePathname();
   const open = useUIStore((s) => s.commandPaletteOpen);
   const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
   const toggle = useUIStore((s) => s.toggleCommandPalette);
   const { user, logout } = useAuth();
   const chatToggle = useChatStore((s) => s.toggle);
   const chatOpenFn = useChatStore((s) => s.open);
   const { sendInScope } = useSendInScope();
   const { setTheme } = useTheme();

   const [query, setQuery] = useState("");
   const [active, setActive] = useState(0);
   const inputRef = useRef<HTMLInputElement>(null);

   const { mode, term } = parseInput(query);
   const isAdmin = !!user && hasRole(user.role, ["admin"]);

   // ── Global ⌘K / Ctrl+K shortcut ──────────────────────────────────
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
         const t = window.setTimeout(() => inputRef.current?.focus(), 50);
         return () => window.clearTimeout(t);
      }
   }, [open]);

   // ── Data sources ─────────────────────────────────────────────────
   // Document search — reuse the existing debounced keyword hook.
   const searchQuery = useKeywordSearch({
      query: mode === "search" ? term : "",
      pageSize: 6,
   });
   // User search — debounced inside the hook.
   const userSearchQuery = useUserSearch(mode === "search" ? term : "", 5);
   // Folders — filtered client-side.
   const rootFolders = useRootFolders();
   // Recent docs (localStorage).
   const recentDocs = useRecentDocuments();

   // ── Build the palette context for action handlers ────────────────
   const ctx: PaletteContext = useMemo(
      () => ({
         router,
         toggleChat: chatToggle,
         openChatWithMessage: (msg) => {
            chatOpenFn();
            // Fire into the global chat scope — same entry point the chat
            // window uses. Session is auto-created on first send.
            sendInScope("global", msg, undefined, undefined).catch(() => {});
         },
         setTheme: (t) => setTheme(t),
         logout,
      }),
      [router, chatToggle, chatOpenFn, sendInScope, setTheme, logout]
   );

   // ── Groups — one per mode ────────────────────────────────────────
   const groups = useMemo((): PaletteGroup[] => {
      const gs: PaletteGroup[] = [];

      switch (mode) {
         case "home": {
            // 1. Context actions — only when on a document detail page.
            const docId = pathname?.match(/^\/documents\/([^/]+)$/)?.[1];
            if (docId) {
               gs.push({
                  label: "This document",
                  items: buildContextItems(docId, ctx),
               });
            }

            // 2. Recent
            if (recentDocs.length > 0) {
               gs.push({
                  label: "Recent",
                  items: recentDocs.map((d) => ({
                     id: `recent:${d.id}`,
                     label: d.title,
                     sub: `${d.verb ?? "viewed"} ${formatRelativeTime(d.openedAt)}`,
                     Icon: FileText,
                     iconColor: "var(--dc-text-muted)",
                     onSelect: () => router.push(`/documents/${d.id}`),
                  })),
               });
            }

            // 3. Jump to
            gs.push({
               label: "Jump to",
               items: JUMP_ITEMS.filter((i) => !i.adminOnly || isAdmin).map(
                  (i) => ({
                     id: i.id,
                     label: i.label,
                     rightHint: i.hint,
                     Icon: i.Icon,
                     onSelect: () => router.push(i.href),
                  })
               ),
            });
            break;
         }

         case "search": {
            const docs: SearchResult[] = searchQuery.data ?? [];
            if (docs.length > 0) {
               gs.push({
                  label: "Documents",
                  items: docs.slice(0, 6).map((d) => ({
                     id: `doc:${d.documentId}-${d.chunkIndex ?? 0}`,
                     label: d.title,
                     sub: d.snippet
                        ? truncate(d.snippet.replace(/\s+/g, " "), 80)
                        : mimeShort(d.mimeType),
                     rightHint: mimeShort(d.mimeType),
                     Icon: FileText,
                     iconColor: "var(--dc-text-muted)",
                     onSelect: () => router.push(`/documents/${d.documentId}`),
                  })),
               });
            }

            const matchedFolders = filterFolders(
               rootFolders.data ?? [],
               term
            ).slice(0, 5);
            if (matchedFolders.length > 0) {
               gs.push({
                  label: "Folders",
                  items: matchedFolders.map((f) => ({
                     id: `folder:${f.id}`,
                     label: f.name,
                     Icon: FolderIcon,
                     iconColor: "var(--dc-warn)",
                     onSelect: () =>
                        router.push(`/documents?folder=${f.id}`),
                  })),
               });
            }

            const users = userSearchQuery.data ?? [];
            if (users.length > 0 && isAdmin) {
               gs.push({
                  label: "Users",
                  items: users.slice(0, 5).map((u) => ({
                     id: `user:${u.id}`,
                     label: u.name || u.email,
                     sub: u.email,
                     Icon: UserIcon,
                     iconColor: "var(--dc-text-muted)",
                     onSelect: () => router.push(`/admin/users`),
                  })),
               });
            }

            // "Ask AI" escape hatch always shown in search mode
            gs.push({
               label: "AI",
               items: [
                  {
                     id: "ai:ask",
                     label: `Ask AI: "${term}"`,
                     sub: "Send this as a question to DocChain AI",
                     rightHint: "⌘↵",
                     Icon: Sparkles,
                     iconColor: "var(--dc-accent)",
                     onSelect: () => {
                        ctx.openChatWithMessage(term);
                     },
                  },
               ],
            });
            break;
         }

         case "actions": {
            const filtered = ACTIONS.filter((a) => !a.adminOnly || isAdmin)
               .filter((a) => matchesAction(a, term));
            gs.push({
               label: "Actions",
               items: filtered.map((a) => ({
                  id: `action:${a.id}`,
                  label: a.label,
                  rightHint: a.hint,
                  Icon: a.Icon,
                  iconColor: "var(--dc-text-muted)",
                  onSelect: a.build(ctx),
               })),
            });
            break;
         }

         case "ai": {
            gs.push({
               label: "AI Quick Ask",
               items: [
                  {
                     id: "ai:send",
                     label: term ? `Ask: "${term}"` : "Type a question…",
                     sub: term
                        ? "Press Enter to open DocChain AI with this message"
                        : "Example: ? what contracts expire this month",
                     Icon: Sparkles,
                     iconColor: "var(--dc-accent)",
                     onSelect: () => {
                        if (!term) return;
                        ctx.openChatWithMessage(term);
                     },
                  },
               ],
            });
            break;
         }

         case "shortcuts":
            // Shortcuts mode is rendered as its own non-list view, no groups.
            break;
      }

      return gs;
   }, [
      mode,
      term,
      pathname,
      recentDocs,
      searchQuery.data,
      userSearchQuery.data,
      rootFolders.data,
      isAdmin,
      router,
      ctx,
   ]);

   const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

   // Clamp active index when the list shrinks.
   useEffect(() => {
      if (active >= flat.length) setActive(Math.max(0, flat.length - 1));
   }, [active, flat.length]);

   const runItem = (item: PaletteItem) => {
      setOpen(false);
      item.onSelect();
   };

   const onInputKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
         e.preventDefault();
         setOpen(false);
         return;
      }
      // ⌘Enter / Ctrl+Enter in search mode → shortcut to "ask AI"
      if (
         (e.metaKey || e.ctrlKey) &&
         e.key === "Enter" &&
         mode === "search" &&
         term
      ) {
         e.preventDefault();
         setOpen(false);
         ctx.openChatWithMessage(term);
         return;
      }
      if (e.key === "ArrowDown") {
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

   // Placeholder string reflects the current mode so the user knows what to type
   const placeholder =
      mode === "actions"
         ? "Type an action…"
         : mode === "ai"
         ? "Ask AI anything…"
         : "Search, type > for actions, ? to ask AI…";

   // For flat-index → group header lookup during render
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
            background: open ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0)",
            backdropFilter: open ? "blur(6px)" : "blur(0px)",
            WebkitBackdropFilter: open ? "blur(6px)" : "blur(0px)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
         }}
      >
         <div
            onClick={(e) => e.stopPropagation()}
            className='w-[620px] max-w-[calc(100vw-40px)] overflow-hidden transition-all duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
            style={{
               background: "var(--dc-elevated)",
               border: "1px solid var(--dc-border-strong)",
               borderRadius: 14,
               boxShadow: open ? "var(--dc-shadow-lg)" : "none",
               transform: open
                  ? "translateY(0) scale(1)"
                  : "translateY(-16px) scale(0.94)",
               transformOrigin: "top center",
               opacity: open ? 1 : 0,
            }}
         >
            {/* ── Input ─────────────────────────────────────────── */}
            <div
               className='flex items-center gap-2.5 px-[18px] py-3.5'
               style={{ borderBottom: "1px solid var(--dc-border)" }}
            >
               <ModeIcon mode={mode} />
               <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                     setQuery(e.target.value);
                     setActive(0);
                  }}
                  onKeyDown={onInputKey}
                  placeholder={placeholder}
                  className='flex-1 bg-transparent border-none outline-none text-[15px]'
                  style={{
                     color: "var(--dc-text)",
                     fontFamily: "var(--dc-font-sans)",
                  }}
               />
               {/* Mode indicator + esc hint */}
               {mode !== "home" && mode !== "search" && (
                  <ModeBadge mode={mode} />
               )}
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

            {/* ── Content ──────────────────────────────────────── */}
            <div className='max-h-[440px] overflow-y-auto p-1.5'>
               {mode === "shortcuts" ? (
                  <ShortcutsReference />
               ) : flat.length === 0 ? (
                  <EmptyResults mode={mode} term={term} />
               ) : (
                  groups.map((g) => {
                     const groupStart = runningOffset;
                     runningOffset += g.items.length;
                     return (
                        <div key={g.label}>
                           <GroupHeader label={g.label} />
                           {g.items.map((it, i) => {
                              const idx = groupStart + i;
                              const isActive = idx === active;
                              return (
                                 <ItemRow
                                    key={it.id}
                                    item={it}
                                    active={isActive}
                                    onHover={() => setActive(idx)}
                                    onClick={() => runItem(it)}
                                 />
                              );
                           })}
                        </div>
                     );
                  })
               )}
            </div>

            {/* ── Footer hints ─────────────────────────────────── */}
            <PaletteFooter mode={mode} />
         </div>
      </div>
   );
};

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

const ModeIcon: FC<{ mode: Mode }> = ({ mode }) => {
   if (mode === "actions")
      return (
         <span
            className='text-[15px] font-bold leading-none'
            style={{ color: "var(--dc-accent)", fontFamily: "var(--dc-font-mono)" }}
         >
            &gt;
         </span>
      );
   if (mode === "ai")
      return (
         <Sparkles
            size={16}
            strokeWidth={1.75}
            style={{ color: "var(--dc-accent)" }}
         />
      );
   if (mode === "shortcuts")
      return (
         <Keyboard
            size={16}
            strokeWidth={1.75}
            style={{ color: "var(--dc-text-dim)" }}
         />
      );
   return (
      <Search
         size={16}
         strokeWidth={1.75}
         style={{ color: "var(--dc-text-dim)" }}
      />
   );
};

const ModeBadge: FC<{ mode: Mode }> = ({ mode }) => {
   const label = mode === "actions" ? "actions" : mode === "ai" ? "ai" : "";
   if (!label) return null;
   return (
      <span
         className='inline-flex items-center h-[18px] px-1.5 rounded text-[10px] font-semibold uppercase tracking-[0.06em]'
         style={{
            background: "var(--dc-accent-soft)",
            color: "var(--dc-accent)",
            border: "1px solid var(--dc-accent-border)",
         }}
      >
         {label}
      </span>
   );
};

const GroupHeader: FC<{ label: string }> = ({ label }) => (
   <div
      className='px-2.5 pt-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]'
      style={{ color: "var(--dc-text-faint)" }}
   >
      {label}
   </div>
);

const ItemRow: FC<{
   item: PaletteItem;
   active: boolean;
   onHover: () => void;
   onClick: () => void;
}> = ({ item, active, onHover, onClick }) => (
   <div
      role='option'
      aria-selected={active}
      onMouseEnter={onHover}
      onClick={onClick}
      className='flex items-center gap-2.5 px-2.5 py-2 rounded-md cursor-pointer text-[13px] transition-colors'
      style={{
         color: active ? "var(--dc-text)" : "var(--dc-text-muted)",
         background: active ? "var(--dc-surface-2)" : "transparent",
      }}
   >
      <item.Icon
         size={14}
         strokeWidth={1.75}
         style={{
            color:
               item.iconColor ??
               (active ? "var(--dc-text)" : "var(--dc-text-muted)"),
         }}
      />
      <div className='flex-1 min-w-0'>
         <div
            className='truncate font-medium'
            style={{
               color: active ? "var(--dc-text)" : "var(--dc-text)",
            }}
         >
            {item.label}
         </div>
         {item.sub && (
            <div
               className='text-[11.5px] truncate'
               style={{ color: "var(--dc-text-dim)" }}
            >
               {item.sub}
            </div>
         )}
      </div>
      {item.rightHint && (
         <span
            className='text-[10.5px] tabular-nums whitespace-nowrap ml-2 px-1.5 py-0.5 rounded'
            style={{
               fontFamily: "var(--dc-font-mono)",
               color: "var(--dc-text-faint)",
               background: active ? "var(--dc-surface)" : "transparent",
            }}
         >
            {item.rightHint}
         </span>
      )}
   </div>
);

const EmptyResults: FC<{ mode: Mode; term: string }> = ({ mode, term }) => (
   <div
      className='py-6 text-center text-[13px]'
      style={{ color: "var(--dc-text-dim)" }}
   >
      {mode === "search"
         ? term
            ? `No results for "${term}"`
            : "Type to search"
         : mode === "actions"
         ? `No actions match "${term}"`
         : "No results"}
   </div>
);

const PaletteFooter: FC<{ mode: Mode }> = ({ mode }) => (
   <div
      className='flex items-center justify-between gap-3 px-4 py-2 text-[11px]'
      style={{
         borderTop: "1px solid var(--dc-border)",
         background: "var(--dc-surface-2)",
         color: "var(--dc-text-dim)",
      }}
   >
      <div className='flex items-center gap-3 flex-wrap'>
         <span>
            <Kbd>↑</Kbd> <Kbd>↓</Kbd> navigate
         </span>
         <span>
            <Kbd>↵</Kbd> select
         </span>
         {mode === "search" && (
            <span>
               <Kbd>⌘</Kbd> <Kbd>↵</Kbd> ask AI
            </span>
         )}
      </div>
      <div className='flex items-center gap-2'>
         <span style={{ color: "var(--dc-text-faint)" }}>Tips:</span>
         <span>
            <Kbd>&gt;</Kbd> actions
         </span>
         <span>
            <Kbd>?</Kbd> AI
         </span>
         <span>
            <Kbd>??</Kbd> shortcuts
         </span>
      </div>
   </div>
);

const Kbd: FC<{ children: ReactNode }> = ({ children }) => (
   <span
      className='inline-flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded text-[10px] font-semibold'
      style={{
         fontFamily: "var(--dc-font-mono)",
         background: "var(--dc-surface)",
         color: "var(--dc-text-muted)",
         border: "1px solid var(--dc-border-strong)",
         lineHeight: 1,
      }}
   >
      {children}
   </span>
);

// ═══════════════════════════════════════════════════════════════════
// Shortcuts reference page — static content, no flat list
// ═══════════════════════════════════════════════════════════════════
const ShortcutsReference: FC = () => (
   <div className='p-3 space-y-5'>
      <ShortcutGroup label='Navigation'>
         <ShortcutLine keys={["⌘", "K"]} description='Open command palette' />
         <ShortcutLine keys={["G", "D"]} description='Go to Documents' />
         <ShortcutLine keys={["G", "S"]} description='Go to Shared' />
         <ShortcutLine keys={["G", "F"]} description='Go to Favorites' />
         <ShortcutLine keys={["G", "A"]} description='Go to Admin' />
      </ShortcutGroup>

      <ShortcutGroup label='Documents'>
         <ShortcutLine keys={["⌘", "U"]} description='Upload document' />
         <ShortcutLine keys={["⌘", "N"]} description='New folder' />
         <ShortcutLine keys={["⌘", "D"]} description='Download (on doc page)' />
         <ShortcutLine keys={["⌘", "S"]} description='Share (on doc page)' />
         <ShortcutLine keys={["⌘", "J"]} description='Ask AI about this document' />
      </ShortcutGroup>

      <ShortcutGroup label='Command bar modes'>
         <ShortcutLine keys={[">"]} description='Switch to actions' />
         <ShortcutLine keys={["?"]} description='Ask AI directly' />
         <ShortcutLine keys={["??"]} description='Show this reference' />
      </ShortcutGroup>

      <ShortcutGroup label='General'>
         <ShortcutLine keys={["Esc"]} description='Close modal / cancel' />
      </ShortcutGroup>
   </div>
);

const ShortcutGroup: FC<{ label: string; children: ReactNode }> = ({
   label,
   children,
}) => (
   <div>
      <div
         className='text-[10.5px] font-semibold uppercase tracking-[0.08em] mb-1.5 px-1'
         style={{ color: "var(--dc-text-faint)" }}
      >
         {label}
      </div>
      <div className='space-y-1'>{children}</div>
   </div>
);

const ShortcutLine: FC<{ keys: string[]; description: string }> = ({
   keys,
   description,
}) => (
   <div className='flex items-center gap-3 px-2 py-1 text-[13px]'>
      <div className='flex items-center gap-1 min-w-[70px]'>
         {keys.map((k, i) => (
            <Kbd key={i}>{k}</Kbd>
         ))}
      </div>
      <span style={{ color: "var(--dc-text-muted)" }}>{description}</span>
   </div>
);

// ═══════════════════════════════════════════════════════════════════
// Context actions — when viewing a document detail page
// ═══════════════════════════════════════════════════════════════════
function buildContextItems(docId: string, ctx: PaletteContext): PaletteItem[] {
   return [
      {
         id: `ctx:doc:ask`,
         label: "Ask AI about this document",
         rightHint: "⌘J",
         Icon: BrainCircuit,
         iconColor: "var(--dc-accent)",
         onSelect: () => ctx.toggleChat(),
      },
      {
         id: `ctx:doc:share`,
         label: "Share this document",
         rightHint: "⌘S",
         Icon: Share2,
         iconColor: "var(--dc-info)",
         onSelect: () => ctx.router.push(`/documents/${docId}/share`),
      },
      {
         id: `ctx:doc:activity`,
         label: "View activity",
         Icon: Activity,
         iconColor: "var(--dc-text-muted)",
         onSelect: () =>
            ctx.router.push(`/admin/audit-logs?entity_id=${docId}`),
      },
   ];
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════
function truncate(s: string, n: number): string {
   if (s.length <= n) return s;
   return s.slice(0, n - 1).trimEnd() + "…";
}

function filterFolders<T extends { name: string }>(folders: T[], term: string): T[] {
   if (!term) return [];
   const q = term.toLowerCase();
   return folders.filter((f) => f.name.toLowerCase().includes(q));
}

function matchesAction(a: ActionEntry, term: string): boolean {
   if (!term) return true;
   const haystack = `${a.label} ${(a.keywords ?? []).join(" ")}`.toLowerCase();
   return haystack.includes(term.toLowerCase());
}
