"use client";

import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ThemeSelector } from "@/components/settings/preferences/ThemeSelector";
import { LanguageSelector } from "@/components/settings/preferences/LanguageSelector";
import { NotificationSettings } from "@/components/settings/preferences/NotificationSettings";
import { AISettings } from "@/components/settings/preferences/AISettings";

export default function PreferencesSettingsPage() {
   return (
      <SettingsLayout>
         <div className='p-7 space-y-6'>
            <div>
               <h2
                  className='text-[18px] font-semibold tracking-[-0.01em] m-0'
                  style={{ color: "var(--dc-text)" }}
               >
                  Preferences
               </h2>
               <p
                  className='text-[12.5px] mt-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Customize your DocChain experience
               </p>
            </div>

            <ThemeSelector />

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <LanguageSelector />
            </div>

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <NotificationSettings />
            </div>

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <AISettings />
            </div>
         </div>
      </SettingsLayout>
   );
}
