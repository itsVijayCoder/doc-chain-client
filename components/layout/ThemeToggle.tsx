"use client";

import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
   collapsed?: boolean;
   iconOnly?: boolean;
}

type Theme = "light" | "dark";

/**
 * ThemeToggle Component
 * Quick access theme switcher for sidebar/header
 * Toggle between light and dark modes, initially uses system preference
 */
export const ThemeToggle: FC<ThemeToggleProps> = ({
   collapsed = false,
   iconOnly = false,
}) => {
   const { theme, setTheme, systemTheme } = useTheme();
   const [mounted, setMounted] = useState(false);

   // Avoid hydration mismatch
   useEffect(() => {
      setMounted(true);
   }, []);

   if (!mounted) {
      return null;
   }

   const currentTheme = theme === "system" ? systemTheme : theme;
   const isDark = currentTheme === "dark";

   const toggleTheme = () => {
      setTheme(isDark ? "light" : "dark");
   };

   // Icon-only mode for header
   if (iconOnly) {
      return (
         <Button
            variant='ghost'
            size='icon'
            onClick={toggleTheme}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            className='transition-transform hover:scale-110'
         >
            {isDark ? (
               <Moon size={18} className='text-blue-400' />
            ) : (
               <Sun size={18} className='text-yellow-500' />
            )}
         </Button>
      );
   }

   // Sidebar mode
   return (
      <Button
         variant='ghost'
         size='sm'
         onClick={toggleTheme}
         className={cn(
            "w-full justify-start gap-2 transition-all",
            collapsed && "justify-center px-2"
         )}
         title={
            collapsed
               ? `Switch to ${isDark ? "light" : "dark"} mode`
               : undefined
         }
      >
         {isDark ? (
            <Moon size={18} className='text-blue-400' />
         ) : (
            <Sun size={18} className='text-yellow-500' />
         )}
         {!collapsed && (
            <span className='text-sm'>{isDark ? "Dark" : "Light"} Mode</span>
         )}
      </Button>
   );
};
