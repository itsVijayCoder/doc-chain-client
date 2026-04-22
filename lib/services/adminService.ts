import api, { apiClient, PaginationMeta } from "@/lib/services/api";

// ─────────────────────────────────────────────────────────────────────────
// Types matching backend DTOs
// ─────────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: "active" | "inactive";
  roles: string[];
  totp_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
  last_active_at?: string;
  documents_count?: number;
  /** Avatar image URL. Render when present, else use initials + deterministic color. */
  avatar_url?: string;
  bio?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  metadata: Record<string, unknown> | null;
  ip_address: string;
  user_agent: string;
  severity?: "info" | "low" | "medium" | "high";
  created_at: string;
}

export interface AuditLogListParams {
  page?: number;
  page_size?: number;
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  date_from?: string;
  date_to?: string;
}

export interface BlockchainTransaction {
  id: string;
  document_id: string;
  document_title?: string;
  record_type: string;
  file_hash: string;
  tx_id: string;
  block_number?: number;
  status: "confirmed" | "pending" | "failed";
  created_at: string;
  confirmed_at?: string;
}

export interface BlockchainRecordOwner {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface BlockchainRecordDetail {
  id: string;
  document_id: string;
  document_title: string;
  version_id: string;
  version_number: number;
  record_type: string;
  file_hash: string;
  tx_id: string;
  block_number: number;
  status: "confirmed" | "pending" | "failed";
  owner: BlockchainRecordOwner;
  created_at: string;
  submitted_at?: string;
  confirmed_at?: string;
}

export interface BlockchainStats {
  pending: number;
  confirmed: number;
  failed: number;
}

export interface AdminStats {
  total_users: number;
  active_users: number;
  recent_active_users: number;
  new_users_this_month: number;
  suspended_users: number;
  /** Number of accounts with 2FA enabled — surfaced in the Users stats strip. */
  totp_enabled_count?: number;
  total_documents: number;
  protected_documents: number;
  storage_used_bytes: number;
  storage_display: string;
  chat_sessions: number;
  uptime_seconds: number;
  uptime_display: string;
}

export interface BlockchainNetworkStatus {
  available: boolean;
  peer_status: string;
  channel: string;
  chaincode: string;
}

export interface ReadyzDependency {
  status: "up" | "down";
  latency_ms: number;
}

export interface ReadyzResponse {
  status: "healthy" | "unhealthy";
  dependencies: {
    postgres: ReadyzDependency;
    redis: ReadyzDependency;
  };
}

export interface TraceWatermarkResponse {
  found: boolean;
  user_id?: string;
  email?: string;
  name?: string;
  timestamp?: string;
  method: "lsb" | "pdf_metadata" | "not_found";
}

// ─────────────────────────────────────────────────────────────────────────
// Service methods
// ─────────────────────────────────────────────────────────────────────────

export const adminService = {
  // Users
  listUsers(params: { page?: number; page_size?: number } = {}): Promise<{
    data: AdminUser[];
    meta: PaginationMeta;
  }> {
    const p = new URLSearchParams();
    if (params.page) p.set("page", String(params.page));
    if (params.page_size) p.set("page_size", String(params.page_size));
    return apiClient.getPaginated<AdminUser>(`/admin/users?${p}`);
  },

  // Audit logs
  listAuditLogs(params: AuditLogListParams = {}): Promise<{
    data: AuditLog[];
    meta: PaginationMeta;
  }> {
    const p = new URLSearchParams();
    if (params.page) p.set("page", String(params.page));
    if (params.page_size) p.set("page_size", String(params.page_size));
    if (params.user_id) p.set("user_id", params.user_id);
    if (params.action) p.set("action", params.action);
    if (params.entity_type) p.set("entity_type", params.entity_type);
    if (params.entity_id) p.set("entity_id", params.entity_id);
    if (params.date_from) p.set("date_from", params.date_from);
    if (params.date_to) p.set("date_to", params.date_to);
    return apiClient.getPaginated<AuditLog>(`/admin/audit-logs?${p}`);
  },

  // Blockchain — paginated list of transactions. Backend switched from
  // ?limit=N to ?page=N&page_size=N in 2026-04; the old signature is gone.
  listTransactions(
    params: { page?: number; page_size?: number } = {}
  ): Promise<{ data: BlockchainTransaction[]; meta: PaginationMeta }> {
    const p = new URLSearchParams();
    if (params.page) p.set("page", String(params.page));
    if (params.page_size) p.set("page_size", String(params.page_size));
    const qs = p.toString();
    return apiClient.getPaginated<BlockchainTransaction>(
      `/admin/blockchain/transactions${qs ? `?${qs}` : ""}`
    );
  },

  getBlockchainStats(): Promise<BlockchainStats> {
    return apiClient.get<BlockchainStats>("/admin/blockchain/stats");
  },

  getBlockchainRecord(id: string): Promise<BlockchainRecordDetail> {
    return apiClient.get<BlockchainRecordDetail>(`/admin/blockchain/records/${id}`);
  },

  getStats(): Promise<AdminStats> {
    return apiClient.get<AdminStats>("/admin/stats");
  },

  getBlockchainNetwork(): Promise<BlockchainNetworkStatus> {
    return apiClient.get<BlockchainNetworkStatus>("/admin/blockchain/network");
  },

  // Audit log CSV export — returns a Blob so the caller can trigger a download.
  async exportAuditLogs(params: Omit<AuditLogListParams, "page" | "page_size"> = {}): Promise<Blob> {
    const p = new URLSearchParams();
    if (params.user_id)     p.set("user_id", params.user_id);
    if (params.action)      p.set("action", params.action);
    if (params.entity_type) p.set("entity_type", params.entity_type);
    if (params.entity_id)   p.set("entity_id", params.entity_id);
    if (params.date_from)   p.set("date_from", params.date_from);
    if (params.date_to)     p.set("date_to", params.date_to);
    const res = await api.get(`/admin/audit-logs/export?${p}`, { responseType: "blob" });
    return res.data as Blob;
  },

  // /readyz returns plain JSON (not the standard envelope) and may return 503
  // when unhealthy — use raw axios with validateStatus to always resolve.
  async getReadyz(): Promise<ReadyzResponse> {
    const res = await api.get<ReadyzResponse>("/readyz", { validateStatus: () => true });
    return res.data;
  },

  // Force-disable 2FA for a locked-out user (admin-only, no password needed).
  forceDisable2fa(userId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/admin/users/${userId}/2fa`);
  },

  // Users
  createUser(req: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    roles: string[];
  }): Promise<AdminUser> {
    return apiClient.post<AdminUser>("/admin/users", req);
  },

  // Update user roles. Takes an array of role slugs — replaces all current
  // roles, so callers must send the full desired set (existing + new).
  updateUserRoles(userId: string, roles: string[]): Promise<AdminUser> {
    return apiClient.put<AdminUser>(`/admin/users/${userId}`, { roles });
  },

  // Flip user status — `active` | `inactive`. "Suspend" means inactive.
  updateUserStatus(userId: string, status: "active" | "inactive"): Promise<AdminUser> {
    return apiClient.put<AdminUser>(`/admin/users/${userId}`, { status });
  },

  // Patch arbitrary user fields (first/last name, email, bio, roles, status).
  updateUser(userId: string, patch: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    bio: string;
    roles: string[];
    status: "active" | "inactive";
  }>): Promise<AdminUser> {
    return apiClient.put<AdminUser>(`/admin/users/${userId}`, patch);
  },

  // Permanently delete an account. Irreversible — confirm with the user first.
  deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`/admin/users/${userId}`);
  },

  // Watermark trace
  traceWatermark(file: File): Promise<TraceWatermarkResponse> {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<TraceWatermarkResponse>(
      "/admin/watermark/trace",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },
};
