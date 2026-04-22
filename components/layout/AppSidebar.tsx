"use client";

import { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { NAVIGATION } from "@/lib/constants";
import { hasRole } from "@/lib/utils/permissions";
import { useMyPermissions } from "@/lib/hooks/useMyPermissions";
import { useEnabledModules } from "@/lib/hooks/useEnabledModules";
import type { NavItem } from "@/modules/types";
import {
   Archive,
   Home,
   FileText,
   Search,
   Share2,
   Heart,
   Trash2,
   Users,
   Lock,
   Shield,
   BrainCircuit,
   Settings,
   User,
   Sliders,
   LayoutDashboard,
   ShieldCheck,
   KeyRound,
   LogOut,
   Box,
   Activity,
   Droplet,
   Bookmark,
   FolderHeart,
} from "lucide-react";

const iconMap = {
   Archive,
   Home,
   FileText,
   Search,
   Share2,
   Heart,
   Trash2,
   Users,
   Lock,
   Shield,
   ShieldCheck,
   KeyRound,
   BrainCircuit,
   Settings,
   User,
   Sliders,
   LayoutDashboard,
   Box,
   Activity,
   Droplet,
   Bookmark,
   FolderHeart,
};

// NavItem comes from @/modules/types so core and module-contributed nav
// items share one shape and flow through the same filter/sort pipeline.

// Module-scope set of icon names we've already warned about. Keeps the
// sidebar's per-render missing-icon warning from spamming the console on
// every pathname change — one warning per unique missing name per session.
const warnedIcons = new Set<string>();

// Collapsed rail is 56px (w-14); expands to 232px on hover. Using group-hover
// (not React state) keeps the interaction on the GPU-accelerated path — no
// re-renders as the pointer moves in and out.
export const AppSidebar: FC = () => {
   const pathname = usePathname();
   const { user, logout } = useAuth();
   const { can, isReady: permsReady } = useMyPermissions();

   const getIcon = (name: string, size = 16) => {
      const Icon = iconMap[name as keyof typeof iconMap];
      if (Icon) return <Icon size={size} strokeWidth={1.75} />;
      // Silent null-return used to eat a full class of plugin-authoring
      // mistakes. Warn in dev, but only once per unique name — sidebar
      // re-renders on every pathname change and a missing icon would
      // otherwise log dozens of duplicates per session.
      if (
         process.env.NODE_ENV !== "production" &&
         !warnedIcons.has(name)
      ) {
         warnedIcons.add(name);
         console.warn(
            `[plugins] Unknown icon "${name}" in sidebar. ` +
            `Add it to iconMap in components/layout/AppSidebar.tsx.`
         );
      }
      return null;
   };

   const filterNav = (items: readonly NavItem[]) => {
      if (!user) return [];
      return items.filter((item) => {
         // Role check — "all" means anyone authenticated. Items without
         // `roles` also pass this stage.
         const rolesOk =
            !item.roles ||
            item.roles[0] === "all" ||
            hasRole(user.role, [...item.roles]);
         if (!rolesOk) return false;
         // Permission check applies independently of roles. Previous
         // implementation skipped this when roles=["all"], which meant
         // module items with `roles: ["all"] + permission: "x.y"` never
         // had their permission consulted. The new flow runs both gates
         // in sequence.
         //
         // Permission-gated items wait until /users/me/permissions has
         // succeeded. Gating on !isReady (rather than isLoading) also
         // covers the fetch-error case — after a failed first fetch,
         // enforcementMode defaults to "off" and can() returns true
         // for everything, which would let items silently show to
         // users we can't verify. Fail closed until we have data.
         if (item.permission) {
            if (!permsReady) return false;
            if (!can(item.permission)) return false;
         }
         return true;
      });
   };

   // Gather nav items contributed by active plugins. `useEnabledModules`
   // already filters against /system/modules, so anything here is both
   // bundled AND backend-active. Sorted by optional `order` for deterministic
   // position in the section; ties break to declaration order.
   const enabledModules = useEnabledModules();
   const moduleMain: NavItem[] = [];
   const moduleAdmin: NavItem[] = [];
   for (const mod of enabledModules) {
      for (const item of mod.navItems ?? []) moduleMain.push(item);
      for (const item of mod.adminNavItems ?? []) moduleAdmin.push(item);
   }
   const byOrder = (a: NavItem, b: NavItem) =>
      (a.order ?? 0) - (b.order ?? 0);

   const mainNav = [
      ...filterNav(NAVIGATION.main),
      ...filterNav(moduleMain).sort(byOrder),
   ];
   const adminNav = [
      ...filterNav(NAVIGATION.admin),
      ...filterNav(moduleAdmin).sort(byOrder),
   ];
   const settingsNav = filterNav(NAVIGATION.settings);

   const initials = user
      ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase() ||
        user.email?.[0]?.toUpperCase() ||
        "?"
      : "?";
   const displayName = user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email
      : "";

   // All nav hrefs across the three sections, used by isActive to decide
   // whether a prefix match is actually the "best" match for the current
   // pathname. Without this, "/admin" (Overview) would prefix-match every
   // /admin/* sub-route and highlight alongside the real active item.
   const allHrefs = [
      ...mainNav.map((i) => i.href),
      ...adminNav.map((i) => i.href),
      ...settingsNav.map((i) => i.href),
   ];

   const isActive = (href: string) => {
      if (!pathname) return false;
      // Exact match always wins.
      if (pathname === href) return true;
      // Prefix match (/documents/:id highlights /documents) — but only if
      // no other nav item has a more specific href that also matches. This
      // makes "Overview" (/admin) defer to "Users" (/admin/users) when on
      // a user page, while still letting "Documents" stay active on detail pages.
      if (!pathname.startsWith(href + "/")) return false;
      const moreSpecific = allHrefs.some(
         (h) =>
            h !== href &&
            h.startsWith(href + "/") &&
            (pathname === h || pathname.startsWith(h + "/"))
      );
      return !moreSpecific;
   };

   return (
      <aside
         className="group fixed top-0 left-0 z-50 h-screen w-14 hover:w-[232px] overflow-hidden
                    flex flex-col
                    transition-[width] duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]"
         style={{
            background: "var(--dc-surface)",
            borderRight: "1px solid var(--dc-border)",
         }}
      >
         {/* ── Brand head ─────────────────────────────────────────── */}
         <div
            className="flex items-center gap-2.5 h-14 px-3.5 shrink-0"
            style={{ borderBottom: "1px solid var(--dc-border)" }}
         >
            <Link href="/dashboard" className="flex items-center gap-2.5">
               <div
                  className="w-7 h-7 rounded-[7px] flex items-center justify-center shrink-0 text-white"
                  style={{
                     background:
                        "linear-gradient(135deg, var(--dc-accent), var(--dc-info))",
                     boxShadow:
                        "0 0 0 1px var(--dc-accent-border), 0 4px 12px #10b98126",
                  }}
               >
                  <Box size={14} strokeWidth={2} />
               </div>
               <span
                  className="font-semibold text-[14px] tracking-tight whitespace-nowrap
                             opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms]"
                  style={{ color: "var(--dc-text)" }}
               >
                  DocChain
               </span>
            </Link>
         </div>

         {/* ── Scrollable nav area ────────────────────────────────── */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden py-2.5 px-2">
            <NavSection items={mainNav} getIcon={getIcon} isActive={isActive} />

            {adminNav.length > 0 && (
               <NavSection
                  label="Admin"
                  items={adminNav}
                  getIcon={getIcon}
                  isActive={isActive}
               />
            )}

            {settingsNav.length > 0 && (
               <NavSection
                  label="Settings"
                  items={settingsNav}
                  getIcon={getIcon}
                  isActive={isActive}
               />
            )}
         </div>

         {/* ── Chain status ticker ────────────────────────────────── */}
         <div
            className="mx-2 mb-2 px-2.5 py-2 rounded-md flex items-center gap-2 whitespace-nowrap overflow-hidden
                       opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms]"
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
               fontSize: 11,
               color: "var(--dc-text-muted)",
            }}
         >
            <span className="pulse-dot-dc shrink-0" />
            <span>
               Chain synced ·{" "}
               <span
                  style={{
                     fontFamily: "var(--dc-font-mono)",
                     color: "var(--dc-text)",
                  }}
               >
                  #184,927
               </span>
            </span>
         </div>

         {/* ── Avatar footer ──────────────────────────────────────── */}
         <Link
            href="/settings/profile"
            className="flex items-center gap-2.5 px-2.5 py-2.5 shrink-0 transition-colors hover:bg-[var(--dc-surface-2)]"
            style={{ borderTop: "1px solid var(--dc-border)" }}
         >
            <div
               className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0"
               style={{
                  background: "linear-gradient(135deg, #6366f1, #ec4899)",
               }}
            >
               {initials}
            </div>
            <div
               className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms]"
            >
               <div
                  className="text-[12px] font-semibold truncate"
                  style={{ color: "var(--dc-text)" }}
               >
                  {displayName || "Account"}
               </div>
               <div
                  className="text-[11px] truncate"
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {user?.email ?? ""}
               </div>
            </div>
            <button
               type="button"
               onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  logout();
               }}
               aria-label="Log out"
               title="Log out"
               className="w-7 h-7 rounded-md flex items-center justify-center shrink-0
                          opacity-0 group-hover:opacity-100 transition-all duration-[180ms]
                          hover:bg-[var(--dc-danger-soft)]"
               style={{ color: "var(--dc-text-dim)" }}
            >
               <LogOut size={14} strokeWidth={1.75} />
            </button>
         </Link>
      </aside>
   );
};

// ── Subcomponent: grouped nav section ─────────────────────────────
interface NavSectionProps {
   label?: string;
   items: NavItem[];
   getIcon: (name: string, size?: number) => React.ReactNode;
   isActive: (href: string) => boolean;
}

const NavSection: FC<NavSectionProps> = ({ label, items, getIcon, isActive }) => (
   <div className="mb-3.5">
      {label && (
         <>
            {/* Label when expanded — fades in */}
            <div
               className="text-[10px] font-semibold uppercase tracking-[0.08em] px-2.5 pt-2 pb-1
                          whitespace-nowrap opacity-0 group-hover:opacity-100
                          transition-opacity duration-[180ms] h-[22px]"
               style={{ color: "var(--dc-text-faint)" }}
            >
               {label}
            </div>
            {/* Hairline divider when collapsed — fades out on hover */}
            <div
               className="mx-2.5 my-2 h-px opacity-100 group-hover:opacity-0 transition-opacity duration-[180ms]"
               style={{ background: "var(--dc-border)" }}
               aria-hidden
            />
         </>
      )}
      {items.map((it) => {
         const active = isActive(it.href);
         return (
            <Link
               key={it.href}
               href={it.href}
               className="relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-md whitespace-nowrap text-[13px] font-medium select-none transition-colors duration-[120ms]"
               style={{
                  color: active ? "var(--dc-text)" : "var(--dc-text-muted)",
                  background: active ? "var(--dc-surface-2)" : "transparent",
               }}
               onMouseEnter={(e) => {
                  if (!active) {
                     e.currentTarget.style.background = "var(--dc-surface-2)";
                     e.currentTarget.style.color = "var(--dc-text)";
                  }
               }}
               onMouseLeave={(e) => {
                  if (!active) {
                     e.currentTarget.style.background = "transparent";
                     e.currentTarget.style.color = "var(--dc-text-muted)";
                  }
               }}
            >
               {/* Active indicator — 2px accent bar on the left */}
               {active && (
                  <span
                     aria-hidden
                     className="absolute left-[-8px] top-[7px] bottom-[7px] w-[2px] rounded-sm"
                     style={{ background: "var(--dc-accent)" }}
                  />
               )}
               <span className="shrink-0 inline-flex items-center justify-center w-4 h-4">
                  {getIcon(it.icon)}
               </span>
               <span
                  className="flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[180ms]"
               >
                  {it.label}
               </span>
            </Link>
         );
      })}
   </div>
);
