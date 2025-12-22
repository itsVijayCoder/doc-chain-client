"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
   children,
}: {
   children: React.ReactNode;
}) {
   const { sidebarCollapsed } = useUIStore();

   return (
      <div className='min-h-screen bg-background'>
         {/* Sidebar */}
         <AppSidebar />

         {/* Main Content */}
         <div
            className={cn(
               "transition-all duration-300",
               sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
            )}
         >
            {/* Header */}
            <AppHeader />

            {/* Page Content */}
            <main className='pt-16 min-h-screen'>
               <div className='container mx-auto p-4 lg:p-6'>{children}</div>
            </main>
         </div>

         {/* Mobile Menu */}
         <MobileMenu />
      </div>
   );
}
