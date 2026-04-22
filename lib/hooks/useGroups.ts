"use client";

import { useQuery } from "@tanstack/react-query";
import { groupService, type Group } from "@/lib/services/groupService";
import type { ApiError } from "@/lib/types";

export const GROUPS_QUERY_KEY = "groups" as const;

export function groupsListKey() {
   return [GROUPS_QUERY_KEY, "list"] as const;
}

/**
 * Groups the current user belongs to or created. Small list typically
 * (dozens at most), so we fetch once and filter client-side for pickers.
 */
export function useMyGroups() {
   return useQuery<Group[], ApiError>({
      queryKey: groupsListKey(),
      queryFn: () => groupService.list(),
      staleTime: 60_000,
   });
}
