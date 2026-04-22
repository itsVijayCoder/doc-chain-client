"use client";

import { FC, ReactNode } from "react";
import { SettingsSidebar } from "./SettingsSidebar";

interface SettingsLayoutProps {
   children: ReactNode;
}

/**
 * Settings shell — 220px left-column tab list + content panel.
 * Matches the design's two-column layout (max-w 1020px). The right panel
 * uses `--dc-surface` with a 14px radius to feel like a contained card.
 */
export const SettingsLayout: FC<SettingsLayoutProps> = ({ children }) => {
   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)] grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-7 max-w-[1020px]'>
         <SettingsSidebar />
         <section
            className='rounded-[14px] overflow-hidden'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
            }}
         >
            {children}
         </section>
      </div>
   );
};
