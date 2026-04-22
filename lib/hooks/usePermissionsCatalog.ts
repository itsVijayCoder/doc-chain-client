"use client";

import { useMemo, type ReactNode } from "react";
import { useSystemModules } from "@/lib/hooks/useEnabledModules";
import { PERMISSION_LABELS } from "@/lib/services/roleService";

// A single permission-picker group: one header + one or more assignable
// checkboxes. Core groups (hardcoded in admin/roles/page.tsx) use full
// ReactNode icons; module groups don't supply an icon and the consumer
// falls back to a generic module glyph.
export interface PermissionGroup {
   label: string;
   icon?: ReactNode;
   permissions: string[];
}

// Converts a module id into a group-header display name: "invoice-manager"
// becomes "Invoice Manager". Only used when the backend didn't supply a
// display_name (currently it never does for ServerModuleInfo — module
// display_name is in plugin.json but not yet surfaced via /system/modules).
function titleCase(id: string): string {
   return id
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
}

// Single source of truth for permission labels and picker groups. Merges
// the hardcoded core data with whatever each active module declared in its
// /system/modules response. Admin role editor uses this so module
// permissions are both displayed correctly AND assignable via the picker.
export function usePermissionsCatalog() {
   const { data: serverModules } = useSystemModules();

   const labels = useMemo<Record<string, string>>(() => {
      // Core labels win over module labels on key collision, which is the
      // safer default — collisions should never happen, but if they do it's
      // a module trying to shadow a core permission name and the core label
      // is the trusted one.
      const merged: Record<string, string> = {};
      for (const mod of serverModules ?? []) {
         Object.assign(merged, mod.permission_labels ?? {});
      }
      Object.assign(merged, PERMISSION_LABELS);
      return merged;
   }, [serverModules]);

   const moduleGroups = useMemo<PermissionGroup[]>(() => {
      return (serverModules ?? [])
         .filter((mod) => (mod.permissions?.length ?? 0) > 0)
         .map((mod) => ({
            label: titleCase(mod.name),
            permissions: mod.permissions ?? [],
         }));
   }, [serverModules]);

   return { labels, moduleGroups };
}
