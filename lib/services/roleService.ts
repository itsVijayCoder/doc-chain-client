import { apiClient } from "@/lib/services/api";

export interface UserPermissionsResponse {
  permissions: string[];
  folder_access: FolderAccess[];
  enforcement_mode: "off" | "audit" | "enforce";
}

export interface FolderAccess {
  folder_id: string;
  folder_name: string;
  access_level: "read" | "write" | "admin";
}

// Folder-access entry as shipped by the Role endpoint.
// Slightly different shape than the per-user FolderAccess above — the role's
// level comes back as "view"/"edit", and there's no `read`/`write`/`admin`.
export interface RoleFolderAccessItem {
  folder_id: string;
  folder_name: string;
  access_level: "view" | "edit" | string;
}

// Mirrors dto.RoleResponse (docchain-backend). Fields to note:
//   - `is_system: boolean` (not `type`) — drives the System/Custom badge
//   - `member_count` (singular) — number of users assigned this role
//   - `folder_access[]` — scoped folder access; empty array = all folders
//   - `slug` — lowercase kebab form of the name, used for display hints
export interface Role {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  color?: string;
  is_system?: boolean;
  permissions: string[];
  member_count?: number;
  max_members?: number;
  folder_access?: RoleFolderAccessItem[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  color?: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  color?: string;
  permissions?: string[];
}

export interface FolderAccessRequest {
  folder_id: string;
  access_level: "read" | "write" | "admin";
}

export interface EnforcementModeRequest {
  enforcement_mode: "off" | "audit" | "enforce";
}

export const PERMISSION_LABELS: Record<string, string> = {
  can_upload: "Upload documents",
  can_edit: "Edit documents",
  can_delete: "Delete documents",
  can_share: "Share documents & create links",
  can_download: "Download files",
  can_comment: "Add comments",
  can_admin: "Access admin panel",
  can_manage_users: "Manage users",
  can_manage_roles: "Manage roles",
  can_view_audit: "View audit logs",
  can_manage_settings: "Manage system settings",
};

export const PERMISSION_GROUPS: { label: string; permissions: string[] }[] = [
  {
    label: "Documents",
    permissions: ["can_upload", "can_edit", "can_delete", "can_share", "can_download", "can_comment"],
  },
  {
    label: "Administration",
    permissions: ["can_admin", "can_manage_users", "can_manage_roles", "can_view_audit", "can_manage_settings"],
  },
];

export const roleService = {
  getUserPermissions(): Promise<UserPermissionsResponse> {
    return apiClient.get<UserPermissionsResponse>("/users/me/permissions");
  },

  listRoles(): Promise<Role[]> {
    return apiClient.get<Role[]>("/admin/roles");
  },

  createRole(req: CreateRoleRequest): Promise<Role> {
    return apiClient.post<Role>("/admin/roles", req);
  },

  updateRole(id: string, req: UpdateRoleRequest): Promise<Role> {
    return apiClient.put<Role>(`/admin/roles/${id}`, req);
  },

  deleteRole(id: string): Promise<void> {
    return apiClient.delete(`/admin/roles/${id}`);
  },

  assignFolderAccess(roleId: string, req: FolderAccessRequest): Promise<void> {
    return apiClient.post(`/admin/roles/${roleId}/folder-access`, req);
  },

  removeFolderAccess(roleId: string, folderId: string): Promise<void> {
    return apiClient.delete(`/admin/roles/${roleId}/folder-access/${folderId}`);
  },

  setEnforcementMode(req: EnforcementModeRequest): Promise<void> {
    return apiClient.put("/admin/roles/enforcement-mode", req);
  },

  getEnforcementMode(): Promise<EnforcementModeRequest> {
    return apiClient.get<EnforcementModeRequest>("/admin/roles/enforcement-mode");
  },
};
