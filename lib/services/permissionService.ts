import { apiClient } from "./api";

export type PermissionLevel = "view" | "comment" | "edit" | "admin";

interface BackendPermission {
   id: string;
   document_id: string;
   user_id?: string;
   group_id?: string;
   permission: PermissionLevel;
   granted_by: string;
   user_email?: string;
   group_name?: string;
   created_at: string;
}

export interface DocumentPermission {
   id: string;
   documentId: string;
   subjectKind: "user" | "group";
   subjectId: string; // user_id or group_id
   subjectLabel: string; // email (for user) or group name
   permission: PermissionLevel;
   grantedBy: string;
   createdAt: Date;
}

function adaptPermission(raw: BackendPermission): DocumentPermission {
   const isUser = !!raw.user_id;
   return {
      id: raw.id,
      documentId: raw.document_id,
      subjectKind: isUser ? "user" : "group",
      subjectId: (isUser ? raw.user_id : raw.group_id) as string,
      subjectLabel:
         (isUser ? raw.user_email : raw.group_name) ??
         (isUser ? "Unknown user" : "Unknown group"),
      permission: raw.permission,
      grantedBy: raw.granted_by,
      createdAt: new Date(raw.created_at),
   };
}

export interface GrantPermissionArgs {
   /** Either userId OR groupId — not both. */
   userId?: string;
   groupId?: string;
   permission: PermissionLevel;
}

export const permissionService = {
   listByDocument: async (documentId: string): Promise<DocumentPermission[]> => {
      const raw = await apiClient.get<BackendPermission[]>(
         `/documents/${documentId}/permissions`
      );
      return (raw ?? []).map(adaptPermission);
   },

   grant: async (
      documentId: string,
      args: GrantPermissionArgs
   ): Promise<DocumentPermission> => {
      const body: Record<string, unknown> = { permission: args.permission };
      if (args.userId) body.user_id = args.userId;
      if (args.groupId) body.group_id = args.groupId;
      const raw = await apiClient.post<BackendPermission>(
         `/documents/${documentId}/permissions`,
         body
      );
      return adaptPermission(raw);
   },

   updateLevel: async (
      documentId: string,
      permissionId: string,
      permission: PermissionLevel
   ): Promise<DocumentPermission> => {
      const raw = await apiClient.put<BackendPermission>(
         `/documents/${documentId}/permissions/${permissionId}`,
         { permission }
      );
      return adaptPermission(raw);
   },

   revoke: async (documentId: string, permissionId: string): Promise<void> => {
      await apiClient.delete(
         `/documents/${documentId}/permissions/${permissionId}`
      );
   },
};
