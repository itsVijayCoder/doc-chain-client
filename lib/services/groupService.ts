import { apiClient } from "./api";

interface BackendGroupResponse {
   id: string;
   name: string;
   description: string;
   created_by: string;
   member_count: number;
   created_at: string;
   updated_at: string;
}

export interface Group {
   id: string;
   name: string;
   description: string;
   createdBy: string;
   memberCount: number;
   createdAt: Date;
   updatedAt: Date;
}

function adaptGroup(raw: BackendGroupResponse): Group {
   return {
      id: raw.id,
      name: raw.name,
      description: raw.description,
      createdBy: raw.created_by,
      memberCount: raw.member_count,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
   };
}

export const groupService = {
   /** Groups the current user is a member of + groups they created. */
   list: async (): Promise<Group[]> => {
      const raw = await apiClient.get<BackendGroupResponse[]>("/groups");
      return (raw ?? []).map(adaptGroup);
   },
};
