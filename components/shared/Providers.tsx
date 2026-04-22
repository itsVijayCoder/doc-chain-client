"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
   // Per-client QueryClient — instantiated once per browser session. Defaults
   // chosen for an authenticated dashboard: aggressive-enough revalidation
   // without hammering the backend on every focus.
   const [queryClient] = useState(
      () =>
         new QueryClient({
            defaultOptions: {
               queries: {
                  staleTime: 30_000, // 30s: data considered fresh, no refetch
                  gcTime: 5 * 60_000, // 5m: cache retained after last observer
                  retry: (failureCount, error) => {
                     // Don't retry on 4xx — they're not flakes, they're bugs
                     const e = error as { statusCode?: number; response?: { status?: number } };
                     const status = e?.statusCode ?? e?.response?.status;
                     if (status !== undefined && status >= 400 && status < 500) {
                        return false;
                     }
                     return failureCount < 2;
                  },
                  refetchOnWindowFocus: true,
                  refetchOnReconnect: true,
               },
               mutations: {
                  retry: false,
               },
            },
         })
   );

   return (
      <QueryClientProvider client={queryClient}>
         <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
         >
            {children}
            <Toaster position='top-right' richColors />
         </ThemeProvider>
         {process.env.NODE_ENV === "development" && (
            <ReactQueryDevtools initialIsOpen={false} buttonPosition='bottom-left' />
         )}
      </QueryClientProvider>
   );
}
