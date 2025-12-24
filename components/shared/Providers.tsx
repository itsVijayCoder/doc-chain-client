"use client";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
   return (
      <ThemeProvider
         attribute='class'
         defaultTheme='system'
         enableSystem
         disableTransitionOnChange
      >
         {children}
         <Toaster position='top-right' richColors />
      </ThemeProvider>
   );
}
