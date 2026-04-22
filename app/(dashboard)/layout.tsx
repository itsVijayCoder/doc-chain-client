// Client component — reads auth state via AuthGuard. Do not convert to a
// server component; tokens live in browser memory/localStorage and the
// guard depends on client-side TanStack Query.
"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatWindow } from "@/components/chat/ChatWindow";

export default function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   return (
      <AuthGuard>
         {/* Sidebar is always 56px in its resting state and expands on hover
             as an overlay. Content uses a fixed pl-14 offset so the hover
             expansion doesn't shift the page. */}
         <div
            className='min-h-screen'
            style={{ background: "var(--dc-bg)" }}
         >
            <AppSidebar />
            <div className='lg:pl-14'>
               <AppHeader />
               <main
                  className='pt-[52px] min-h-screen'
                  style={{ background: "var(--dc-bg)" }}
               >
                  <div className='container mx-auto p-4 lg:p-6'>
                     {children}
                  </div>
               </main>
            </div>
            <MobileMenu />
            {/* Command palette — ⌘K / Ctrl+K. State lives in uiStore so the
                AppHeader trigger and the global keyboard shortcut both feed
                the same switch. */}
            <CommandPalette />
            {/* AI chat — available on every dashboard page, scope auto-detects */}
            <ChatWindow />
            <ChatBubble />
         </div>
      </AuthGuard>
   );
}
