"use client";

import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { TwoFactorAuth } from "@/components/settings/security/TwoFactorAuth";
import { ChangePassword } from "@/components/settings/security/ChangePassword";
import { SessionsList } from "@/components/settings/security/SessionsList";
import { SecurityLog } from "@/components/settings/security/SecurityLog";

export default function SecuritySettingsPage() {
   return (
      <SettingsLayout>
         <div className='p-7 space-y-6'>
            <div>
               <h2
                  className='text-[18px] font-semibold tracking-[-0.01em] m-0'
                  style={{ color: "var(--dc-text)" }}
               >
                  Security Settings
               </h2>
               <p
                  className='text-[12.5px] mt-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Manage your account security and active sessions
               </p>
            </div>

            <TwoFactorAuth />

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <ChangePassword />
            </div>

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <SessionsList />
            </div>

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <SecurityLog />
            </div>
         </div>
      </SettingsLayout>
   );
}
