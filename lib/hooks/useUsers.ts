"use client";

import { useQuery } from "@tanstack/react-query";
import { userService } from "@/lib/services/userService";
import type { User } from "@/lib/types/user";
import { useDebounce } from "./useDebounce";
import type { ApiError } from "@/lib/types";

export const USERS_QUERY_KEY = "users" as const;

export function userSearchKey(query: string) {
   return [USERS_QUERY_KEY, "search", query] as const;
}

export function useUserSearch(query: string, limit = 10) {
   const debounced = useDebounce(query.trim(), 300);
   return useQuery<User[], ApiError>({
      queryKey: userSearchKey(debounced),
      queryFn: () => userService.search(debounced, limit),
      enabled: debounced.length > 0,
      staleTime: 30_000,
   });
}
