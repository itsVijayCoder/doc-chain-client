import type { ComponentType, LazyExoticComponent } from "react";

// Shape of a single route contributed by a module. The `component` is always
// wrapped with `React.lazy()` so disabled or unreachable modules don't pull
// their page code into the initial bundle. `permission` is optional — when
// set, the catch-all router refuses to mount this route for a user who
// fails the check (degrading to NotFound instead of rendering a page
// whose API calls would all 403).
export interface ModuleRoute {
   path: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   component: LazyExoticComponent<ComponentType<any>>;
   permission?: string;
}

// Compatible superset of the file-local NavItem used in components/layout/AppSidebar.tsx.
// `order` is module-only — core nav items are ordered by their array position
// in `lib/constants/index.ts` NAVIGATION, so they have implicit order 0.
export interface NavItem {
   icon: string;
   label: string;
   href: string;
   roles?: readonly string[];
   permission?: string;
   order?: number;
}

// A manifest is the single public surface a module exposes to the frontend.
// All other module code is internal. The CLI regenerates registry.generated.ts
// with one static import per active module; the generated file is the source
// of truth for what is bundled.
export interface ModuleManifest {
   id: string;
   routes: ModuleRoute[];
   adminRoutes?: ModuleRoute[];
   navItems: NavItem[];
   adminNavItems?: NavItem[];
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   extensionPoints?: Record<string, LazyExoticComponent<ComponentType<any>>>;
}

// Shape of an entry in the GET /api/v1/system/modules response. Kept here
// (not in lib/services) because this is the cross-check contract between the
// bundled frontend registry and the backend's active-module list — its
// consumers all live in modules/.
export interface ServerModuleInfo {
   name: string;
   version: string;
   sidebar?: NavItem[];
   admin_sidebar?: NavItem[];
   permissions?: string[];
   permission_labels?: Record<string, string>;
}
