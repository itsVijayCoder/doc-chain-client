"use client";

import { useQuery } from "@tanstack/react-query";
import { roleService, type UserPermissionsResponse } from "@/lib/services/roleService";
import { useAuth } from "@/lib/hooks/useAuth";

export const MY_PERMISSIONS_KEY = ["users", "me", "permissions"] as const;

export function useMyPermissions() {
  const { user } = useAuth();

  const query = useQuery<UserPermissionsResponse>({
    queryKey: MY_PERMISSIONS_KEY,
    queryFn: () => roleService.getUserPermissions(),
    enabled: !!user,
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });

  const permissions = query.data?.permissions ?? [];
  const enforcementMode = query.data?.enforcement_mode ?? "off";

  function can(permission: string): boolean {
    // When enforcement is off: always allow (role system is disabled)
    if (enforcementMode === "off") return true;
    return permissions.includes(permission);
  }

  // When enforcement is "audit", actions are allowed but we track violations.
  // UI still shows controls (same as "off"), backend logs the access.
  // When "enforce": hide/disable based on permissions.
  function shouldHide(permission: string): boolean {
    if (enforcementMode !== "enforce") return false;
    return !permissions.includes(permission);
  }

  return {
    permissions,
    enforcementMode,
    can,
    shouldHide,
    isLoading: query.isLoading,
    // isReady is the "authoritative permissions available" flag. Distinct
    // from !isLoading in one important case: after a failed first fetch,
    // isLoading is false (no longer fetching) but data is still undefined
    // — defaults take over and `can()` returns true for everything via the
    // enforcementMode="off" branch. Consumers that want to fail CLOSED on
    // fetch error should gate on !isReady instead of isLoading.
    isReady: query.isSuccess,
  };
}
