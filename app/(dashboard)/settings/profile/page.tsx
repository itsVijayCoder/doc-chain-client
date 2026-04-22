"use client";

import { SettingsLayout } from "@/components/settings/SettingsLayout";
import { ProfileForm } from "@/components/settings/profile/ProfileForm";
import { DeleteAccount } from "@/components/settings/profile/DeleteAccount";

export default function ProfileSettingsPage() {
   return (
      <SettingsLayout>
         <div className='p-7 space-y-6'>
            <div>
               <h2
                  className='text-[18px] font-semibold tracking-[-0.01em] m-0'
                  style={{ color: "var(--dc-text)" }}
               >
                  Profile Settings
               </h2>
               <p
                  className='text-[12.5px] mt-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Manage your profile information and account
               </p>
            </div>

            <ProfileForm />

            <div
               className='pt-6'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            >
               <DeleteAccount />
            </div>
         </div>
      </SettingsLayout>
   );
}
