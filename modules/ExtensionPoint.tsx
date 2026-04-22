"use client";

import { Suspense, type ComponentType, type LazyExoticComponent } from "react";
import { registry } from "./registry.generated";
import { ModuleErrorBoundary } from "./ErrorBoundary";
import { useEnabledModules } from "@/lib/hooks/useEnabledModules";

// Module-load-once registry: each bundled module's extension-point components
// are collected at import time into a single Map keyed by extension point name.
// No runtime mutation — disabled-module filtering happens at render time via
// useEnabledModules() so bundled-but-server-inactive modules stay silent.

interface RegisteredExtension {
   moduleId: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   Component: LazyExoticComponent<ComponentType<any>>;
}

const pointRegistry = new Map<string, RegisteredExtension[]>();

for (const mod of registry) {
   if (!mod.extensionPoints) continue;
   for (const [point, Component] of Object.entries(mod.extensionPoints)) {
      const existing = pointRegistry.get(point) ?? [];
      existing.push({ moduleId: mod.id, Component });
      pointRegistry.set(point, existing);
   }
}

interface ExtensionPointProps {
   name: string;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   [key: string]: any;
}

// Core pages call <ExtensionPoint name="document.actions" documentId={id} />
// to render whatever modules have registered into that point. Each rendered
// component gets its own Suspense + ErrorBoundary so one failure doesn't
// cascade. Filtered to only modules that are also present in the live
// /system/modules response.
export function ExtensionPoint({ name, ...props }: ExtensionPointProps) {
   const enabled = useEnabledModules();
   const entries = pointRegistry.get(name);
   if (!entries || entries.length === 0) return null;

   const enabledIds = new Set(enabled.map((m) => m.id));
   const live = entries.filter((e) => enabledIds.has(e.moduleId));
   if (live.length === 0) return null;

   return (
      <>
         {live.map(({ moduleId, Component }) => (
            <ModuleErrorBoundary key={moduleId} moduleId={moduleId}>
               <Suspense fallback={null}>
                  <Component {...props} />
               </Suspense>
            </ModuleErrorBoundary>
         ))}
      </>
   );
}
