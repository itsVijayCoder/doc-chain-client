"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
   ChevronRight,
   Settings as SettingsIcon,
   Shield,
   User,
} from "lucide-react";

interface NavItem {
   id: string;
   label: string;
   href: string;
   icon: ReactNode;
   description: string;
}

const NAV_ITEMS: NavItem[] = [
   {
      id: "profile",
      label: "Profile",
      href: "/settings/profile",
      icon: <User size={16} strokeWidth={1.75} />,
      description: "Manage your personal info",
   },
   {
      id: "security",
      label: "Security",
      href: "/settings/security",
      icon: <Shield size={16} strokeWidth={1.75} />,
      description: "Password and security",
   },
   {
      id: "preferences",
      label: "Preferences",
      href: "/settings/preferences",
      icon: <SettingsIcon size={16} strokeWidth={1.75} />,
      description: "Customize your experience",
   },
];

/**
 * Settings tab list — matches the design's 220px left sidebar.
 * Page title + sub + vertical tabs with active-state border + chevron.
 */
export const SettingsSidebar: FC = () => {
   const pathname = usePathname();

   return (
      <aside className='min-w-0'>
         <h1
            className='text-[22px] font-semibold tracking-[-0.02em] m-0'
            style={{
               color: "var(--dc-text)",
               fontFamily: "var(--dc-font-display)",
            }}
         >
            Settings
         </h1>
         <p
            className='text-[13px] mt-1 mb-5'
            style={{ color: "var(--dc-text-dim)" }}
         >
            Manage your account settings and preferences
         </p>

         <nav className='flex flex-col gap-1'>
            {NAV_ITEMS.map((item) => {
               const active = pathname === item.href;
               return (
                  <Link
                     key={item.id}
                     href={item.href}
                     className='flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors'
                     style={{
                        background: active ? "var(--dc-surface-2)" : "transparent",
                        border: active
                           ? "1px solid var(--dc-border-strong)"
                           : "1px solid transparent",
                     }}
                     onMouseEnter={(e) => {
                        if (!active)
                           e.currentTarget.style.background = "var(--dc-surface-2)";
                     }}
                     onMouseLeave={(e) => {
                        if (!active)
                           e.currentTarget.style.background = "transparent";
                     }}
                  >
                     <span
                        className='shrink-0'
                        style={{
                           color: active
                              ? "var(--dc-text)"
                              : "var(--dc-text-muted)",
                        }}
                     >
                        {item.icon}
                     </span>
                     <div className='flex-1 min-w-0'>
                        <div
                           className='text-[13px] font-semibold'
                           style={{ color: "var(--dc-text)" }}
                        >
                           {item.label}
                        </div>
                        <div
                           className='text-[11px] truncate'
                           style={{ color: "var(--dc-text-dim)" }}
                        >
                           {item.description}
                        </div>
                     </div>
                     {active && (
                        <ChevronRight
                           size={12}
                           strokeWidth={2}
                           style={{ color: "var(--dc-text-muted)" }}
                        />
                     )}
                  </Link>
               );
            })}
         </nav>
      </aside>
   );
};
