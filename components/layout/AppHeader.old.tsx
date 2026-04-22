"use client";

import { FC } from "react";
import { useUIStore } from "@/lib/stores/uiStore";
import { Button } from "@/components/ui/button";
import { SearchBar } from "./SearchBar";
import { NotificationBell } from "./NotificationBell";
import { ProfileDropdown } from "./ProfileDropdown";
import { ThemeToggle } from "./ThemeToggle";
import { Menu, Search as SearchIcon } from "lucide-react";

// NOTE: This is the legacy header content positioned against the new 56px
// sidebar. The full design-system header (Task 5) replaces this.
export const AppHeader: FC = () => {
   const { toggleSidebar } = useUIStore();

   return (
      <header className='fixed top-0 right-0 left-0 lg:left-14 z-30 h-16 bg-card border-b'>
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

               {/* Theme Toggle */}
               <div className='hidden sm:block'>
                  <ThemeToggle iconOnly />
               </div>

               {/* Notifications */}
               <NotificationBell />

               {/* Profile */}
               <ProfileDropdown />
            </div>
         </div>
      </header>
   );
};
