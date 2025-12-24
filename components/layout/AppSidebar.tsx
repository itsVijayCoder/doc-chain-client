"use client";

import { FC } from "react";
import Link from "next/link";
import { useUIStore } from "@/lib/stores/uiStore";
import { useAuth } from "@/lib/hooks/useAuth";
import { NAVIGATION } from "@/lib/constants";
import { hasRole } from "@/lib/utils/permissions";
import { SidebarLink } from "./SidebarLink";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
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
   ChevronLeft,
   ChevronRight,
} from "lucide-react";

const iconMap = {
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
};

export const AppSidebar: FC = () => {
   const {
      sidebarOpen,
      sidebarCollapsed,
      toggleSidebarCollapse,
      setSidebarOpen,
   } = useUIStore();
   const { user } = useAuth();

   const getIcon = (iconName: string) => {
      const IconComponent = iconMap[iconName as keyof typeof iconMap];
      return IconComponent ? <IconComponent size={20} /> : null;
   };

   const filterNavItems = (items: readonly any[]) => {
      if (!user) return [];
      return items.filter((item: any) => {
         if (!item.roles || item.roles[0] === "all") return true;
         return hasRole(user.role, item.roles);
      });
   };

   const mainNav = filterNavItems(NAVIGATION.main);
   const adminNav = filterNavItems(NAVIGATION.admin);
   const settingsNav = filterNavItems(NAVIGATION.settings);

   return (
      <>
         {/* Mobile Overlay */}
         {sidebarOpen && (
            <div
               className='fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden'
               onClick={() => setSidebarOpen(false)}
            />
         )}

         {/* Sidebar */}
         <aside
            className={cn(
               "fixed top-0 left-0 z-50 h-screen bg-card border-r transition-all duration-300",
               sidebarCollapsed ? "w-16" : "w-64",
               sidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full lg:translate-x-0"
            )}
         >
            <div className='flex flex-col h-full'>
               {/* Logo */}
               <div className='flex items-center justify-between h-16 px-4 border-b'>
                  {!sidebarCollapsed ? (
                     <Link
                        href='/dashboard'
                        className='flex items-center gap-2'
                     >
                        <div className='w-8 h-8 rounded-lg bg-linear-to-br from-blockchain-primary to-blockchain-secondary flex items-center justify-center'>
                           <svg
                              className='w-5 h-5 text-white'
                              fill='none'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                           >
                              <path d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                           </svg>
                        </div>
                        <span className='font-bold text-lg'>DocChain</span>
                     </Link>
                  ) : (
                     <Link
                        href='/dashboard'
                        className='flex items-center justify-center w-full'
                     >
                        <div className='w-8 h-8 rounded-lg bg-linear-to-br from-blockchain-primary to-blockchain-secondary flex items-center justify-center'>
                           <svg
                              className='w-5 h-5 text-white'
                              fill='none'
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth='2'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                           >
                              <path d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                           </svg>
                        </div>
                     </Link>
                  )}
               </div>

               {/* Navigation */}
               <nav className='flex-1 overflow-y-auto py-4 px-2 space-y-1'>
                  {/* Main Navigation */}
                  {mainNav.map((item) => (
                     <SidebarLink
                        key={item.href}
                        href={item.href}
                        icon={getIcon(item.icon)}
                        label={item.label}
                        collapsed={sidebarCollapsed}
                     />
                  ))}

                  {/* Admin Section */}
                  {adminNav.length > 0 && (
                     <>
                        <div
                           className={cn(
                              "px-3 py-2",
                              sidebarCollapsed && "px-0"
                           )}
                        >
                           {!sidebarCollapsed && (
                              <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                                 Admin
                              </p>
                           )}
                           {sidebarCollapsed && (
                              <div className='h-px bg-border' />
                           )}
                        </div>
                        {adminNav.map((item) => (
                           <SidebarLink
                              key={item.href}
                              href={item.href}
                              icon={getIcon(item.icon)}
                              label={item.label}
                              collapsed={sidebarCollapsed}
                           />
                        ))}
                     </>
                  )}

                  {/* Settings Section */}
                  <div className={cn("px-3 py-2", sidebarCollapsed && "px-0")}>
                     {!sidebarCollapsed && (
                        <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                           Settings
                        </p>
                     )}
                     {sidebarCollapsed && <div className='h-px bg-border' />}
                  </div>
                  {settingsNav.map((item) => (
                     <SidebarLink
                        key={item.href}
                        href={item.href}
                        icon={getIcon(item.icon)}
                        label={item.label}
                        collapsed={sidebarCollapsed}
                     />
                  ))}
               </nav>

               {/* Theme Toggle & Collapse Button */}
               <div className='p-2 border-t space-y-1'>
                  <ThemeToggle collapsed={sidebarCollapsed} />
                  <Button
                     variant='ghost'
                     size='sm'
                     onClick={toggleSidebarCollapse}
                     className={cn("w-full", sidebarCollapsed && "px-2")}
                  >
                     {sidebarCollapsed ? (
                        <ChevronRight size={20} />
                     ) : (
                        <>
                           <ChevronLeft size={20} />
                           <span className='ml-2'>Collapse</span>
                        </>
                     )}
                  </Button>
               </div>
            </div>
         </aside>
      </>
   );
};
