"use client";

import { FC } from "react";
import { useUIStore } from "@/lib/stores/uiStore";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { ProfileDropdown } from "./ProfileDropdown";
import { Menu, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const AppHeader: FC = () => {
   const { sidebarCollapsed, toggleSidebar } = useUIStore();

   return (
      <header
         className={cn(
            "fixed top-0 right-0 z-30 h-16 bg-card border-b transition-all duration-300",
            sidebarCollapsed ? "left-16" : "left-64",
            "lg:left-auto lg:right-0"
         )}
         style={{
            left: "var(--sidebar-width, 16rem)",
         }}
      >
         <div className='flex items-center justify-between h-full px-4 lg:px-6'>
            {/* Mobile Menu Button */}
            <Button
               variant='ghost'
               size='icon'
               onClick={toggleSidebar}
               className='lg:hidden'
            >
               <Menu size={20} />
            </Button>

            {/* Search Bar */}
            <div className='flex-1 max-w-xl mx-4 hidden md:block'>
               <SearchBar />
            </div>

            {/* Right Actions */}
            <div className='flex items-center gap-2'>
               {/* Mobile Search Button */}
               <Button variant='ghost' size='icon' className='md:hidden'>
                  <SearchIcon size={20} />
               </Button>

               {/* Notifications */}
               <NotificationBell />

               {/* Profile */}
               <ProfileDropdown />
            </div>
         </div>
      </header>
   );
};
