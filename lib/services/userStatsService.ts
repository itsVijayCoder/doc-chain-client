import { apiClient, type PaginationMeta } from "@/lib/services/api";

// ─── Stats ────────────────────────────────────────────────────────────────

export interface MyStats {
  total_documents: number;
  shared_with_me: number;
  confidential_documents: number;
  chat_sessions: number;
  favorited_documents: number;
  unread_notifications: number;
  blockchain_confirmed: number;
}

// ─── Activity ────────────────────────────────────────────────────────────

export interface MyActivity {
  id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  severity: "info" | "low" | "medium" | "high";
  created_at: string;
}

export interface MyActivityParams {
  page?: number;
  page_size?: number;
}

// ─── Suggestions ──────────────────────────────────────────────────────────

export type SuggestionType =
  | "expiring"
  | "blockchain_failed"
  | "unverified_confidential"
  | "recently_shared";

export type SuggestionPriority = "high" | "medium" | "low";

export interface MySuggestion {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  document_id?: string;
  document_title?: string;
  count?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────

export const userStatsService = {
  getMyStats(): Promise<MyStats> {
    return apiClient.get<MyStats>("/users/me/stats");
  },

  getMyActivity(params: MyActivityParams = {}): Promise<{ data: MyActivity[]; meta: PaginationMeta }> {
    const p = new URLSearchParams();
    if (params.page) p.set("page", String(params.page));
    if (params.page_size) p.set("page_size", String(params.page_size));
    const qs = p.toString();
    return apiClient.getPaginated<MyActivity>(`/users/me/activity${qs ? `?${qs}` : ""}`);
  },

  getMySuggestions(): Promise<MySuggestion[]> {
    return apiClient.get<MySuggestion[]>("/users/me/suggestions");
  },
};
