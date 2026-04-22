"use client";

import { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ModuleErrorBoundary } from "@/modules/ErrorBoundary";
import { useEnabledModules } from "@/lib/hooks/useEnabledModules";
import { useMyPermissions } from "@/lib/hooks/useMyPermissions";
import type { ModuleManifest, ModuleRoute } from "@/modules/types";

// Converts a manifest path like /bookmarks/:id into a pathname-matching regex.
// Param segments become ([^/]+) (no slashes). Anchored ^...$ so /bookmarks/:id
// does not also match /bookmarks/123/edit.
function pathToRegex(path: string): RegExp {
   const normalized = path.replace(/:(\w+)/g, "([^/]+)");
   return new RegExp(`^${normalized}$`);
}

interface Match {
   module: ModuleManifest;
   route: ModuleRoute;
}

// Walks all routes of all enabled modules. First URL match wins, but a
// route whose declared permission the user lacks is skipped — keeps
// scanning for a different module's matching route, or falls through to
// NotFound. This prevents a viewer from deep-linking to /bookmarks and
// getting a mounted page whose API calls all 403.
function findMatch(
   pathname: string,
   modules: ModuleManifest[],
   can: (permission: string) => boolean
): Match | null {
   for (const mod of modules) {
      const all = [...mod.routes, ...(mod.adminRoutes ?? [])];
      for (const route of all) {
         if (!pathToRegex(route.path).test(pathname)) continue;
         if (route.permission && !can(route.permission)) continue;
         return { module: mod, route };
      }
   }
   return null;
}

// Catch-all for any dashboard path not served by a specific folder under
// app/(dashboard)/. Matches against the live intersection of bundled modules
// (registry.generated.ts) and backend-active modules (/system/modules), so
// a module that's bundled but removed from ACTIVE_MODULES never mounts here.
export default function ModuleCatchAll() {
   const pathname = usePathname();
   const enabledModules = useEnabledModules();
   const { can } = useMyPermissions();

   const match = useMemo(
      () => findMatch(pathname ?? "", enabledModules, can),
      [pathname, enabledModules, can]
   );

   if (!match) return <NotFound pathname={pathname ?? ""} />;

   const Component = match.route.component;
   return (
      <ModuleErrorBoundary moduleId={match.module.id}>
         <Suspense fallback={<PageSkeleton />}>
            <Component />
         </Suspense>
      </ModuleErrorBoundary>
   );
}

function NotFound({ pathname }: { pathname: string }) {
   return (
      <div className='p-8 text-center'>
         <h1
            className='text-[18px] font-semibold'
            style={{ color: "var(--dc-text)" }}
         >
            Not found
         </h1>
         <p
            className='mt-2 text-[13px]'
            style={{ color: "var(--dc-text-muted)" }}
         >
            No page matches <code>{pathname}</code>.
         </p>
      </div>
   );
}

function PageSkeleton() {
   return (
      <div className='p-8'>
         <div
            className='h-6 w-40 animate-pulse rounded'
            style={{ background: "var(--dc-surface-2)" }}
         />
         <div className='mt-4 space-y-2'>
            <div
               className='h-4 w-full animate-pulse rounded'
               style={{ background: "var(--dc-surface-2)" }}
            />
            <div
               className='h-4 w-3/4 animate-pulse rounded'
               style={{ background: "var(--dc-surface-2)" }}
            />
         </div>
      </div>
   );
}
