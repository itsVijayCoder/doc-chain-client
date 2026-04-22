import { apiClient, type PaginationMeta } from "@/lib/services/api";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCountResponse {
  count: number;
}

export const notificationService = {
  list(params?: { page?: number; page_size?: number }): Promise<{ data: Notification[]; meta: PaginationMeta }> {
    return apiClient.getPaginated<Notification>("/notifications", { params });
  },

  unreadCount(): Promise<UnreadCountResponse> {
    return apiClient.get<UnreadCountResponse>("/notifications/unread-count");
  },

  markRead(id: string): Promise<void> {
    return apiClient.put(`/notifications/${id}/read`);
  },

  markAllRead(): Promise<void> {
    return apiClient.put("/notifications/read-all");
  },

  delete(id: string): Promise<void> {
    return apiClient.delete(`/notifications/${id}`);
  },
};
