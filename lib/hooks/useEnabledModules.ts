"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { apiClient } from "@/lib/services/api";
import { useAuth } from "@/lib/hooks/useAuth";
import { registry } from "@/modules/registry.generated";
import type { ModuleManifest, ServerModuleInfo } from "@/modules/types";
import { MOCK_SYSTEM_MODULES, USE_MOCK_MODULES } from "@/lib/mocks/systemModules";

export const SYSTEM_MODULES_KEY = ["system", "modules"] as const;

async function fetchSystemModules(): Promise<ServerModuleInfo[]> {
   if (USE_MOCK_MODULES) return MOCK_SYSTEM_MODULES;
   return apiClient.get<ServerModuleInfo[]>("/system/modules");
}

export function useSystemModules() {
   const { user } = useAuth();
   return useQuery<ServerModuleInfo[]>({
      queryKey: SYSTEM_MODULES_KEY,
      queryFn: fetchSystemModules,
      enabled: !!user,
      staleTime: 600_000,
      refetchOnWindowFocus: false,
   });
}

// useEnabledModules is the single source of truth for "which modules are live"
// throughout the UI. Consumers (sidebar, catch-all router, extension points)
// MUST go through this hook rather than reading `registry` directly — the
// intersection of "bundled" and "backend-active" is what's actually live, and
// reading only one side produces broken links or 404s.
export function useEnabledModules(): ModuleManifest[] {
   const { data } = useSystemModules();

   return useMemo(() => {
      if (!data) return [];
      const active = new Set(data.map((m) => m.name));
      return registry.filter((mod) => active.has(mod.id));
   }, [data]);
}
