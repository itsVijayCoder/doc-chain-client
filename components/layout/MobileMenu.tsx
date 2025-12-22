"use client";

import { FC, useEffect } from "react";
import { useUIStore } from "@/lib/stores/uiStore";
import { SearchBar } from "./SearchBar";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export const MobileMenu: FC = () => {
   const { mobileMenuOpen, setMobileMenuOpen } = useUIStore();

   // Close mobile menu on route change
   useEffect(() => {
      const handleRouteChange = () => setMobileMenuOpen(false);
      window.addEventListener("popstate", handleRouteChange);
      return () => window.removeEventListener("popstate", handleRouteChange);
   }, [setMobileMenuOpen]);

   return (
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
         <SheetContent side='top' className='h-auto'>
            <div className='py-4'>
               <SearchBar placeholder='Search documents...' />
            </div>
         </SheetContent>
      </Sheet>
   );
};
