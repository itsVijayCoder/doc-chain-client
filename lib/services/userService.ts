import { apiClient } from "./api";
import type { User, UserRoleSlug } from "@/lib/types/user";

// Backend reuses UserResponse (first_name, last_name, email, roles, status).
interface BackendUserResponse {
   id: string;
   email: string;
   first_name: string;
   last_name: string;
   status: string;
   roles: string[];
}

// Legacy alias kept for any existing imports.
export type PublicUser = User;

function adaptUser(raw: BackendUserResponse): User {
   const firstName = raw.first_name ?? "";
   const lastName = raw.last_name ?? "";
   const name = `${firstName} ${lastName}`.trim() || raw.email;
   return {
      id: raw.id,
      email: raw.email,
      firstName,
      lastName,
      name,
      role: (raw.roles?.[0] as UserRoleSlug) ?? "viewer",
      roles: raw.roles as UserRoleSlug[],
      status: (raw.status as User["status"]) ?? "active",
   };
}

export const userService = {
   search: async (q: string, limit = 10): Promise<User[]> => {
      if (!q.trim()) return [];
      const raw = await apiClient.get<BackendUserResponse[]>(
         "/users/search",
         { params: { q, limit } }
      );
      return (raw ?? []).map(adaptUser);
   },
};
