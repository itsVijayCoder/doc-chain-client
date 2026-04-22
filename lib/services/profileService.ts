import { apiClient } from "./api";
import type { MyActivity } from "./userStatsService";

// ─── Backend DTOs ─────────────────────────────────────────────────────────

interface BackendProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  bio?: string;
  avatar_url?: string;
  status: string;
  roles: string[];
  created_at?: string;
  updated_at?: string;
}

interface BackendSession {
  id: string;
  device_name?: string;
  device_type?: "desktop" | "mobile" | "tablet";
  browser?: string;
  ip_address?: string;
  location?: string;
  last_active_at: string;
  is_current: boolean;
}

// ─── Adapted types (match userStore interfaces) ───────────────────────────

export interface AdaptedProfile {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatar?: string;
  role: "admin" | "editor" | "viewer";
  createdAt: Date;
  updatedAt: Date;
}

export interface AdaptedSession {
  id: string;
  deviceName: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
}

export interface AdaptedSecurityEvent {
  id: string;
  type: "login" | "logout" | "password_change" | "mfa_enabled" | "mfa_disabled" | "session_revoked";
  timestamp: Date;
  ipAddress: string;
  location: string;
  deviceName: string;
  success: boolean;
}

// ─── Adapters ─────────────────────────────────────────────────────────────

function adaptProfile(raw: BackendProfile): AdaptedProfile {
  const firstName = raw.first_name ?? "";
  const lastName = raw.last_name ?? "";
  return {
    id: raw.id,
    email: raw.email,
    name: `${firstName} ${lastName}`.trim() || raw.email,
    bio: raw.bio,
    avatar: raw.avatar_url,
    role: (raw.roles?.[0] ?? "viewer") as "admin" | "editor" | "viewer",
    createdAt: raw.created_at ? new Date(raw.created_at) : new Date(0),
    updatedAt: raw.updated_at ? new Date(raw.updated_at) : new Date(),
  };
}

function adaptSession(raw: BackendSession): AdaptedSession {
  return {
    id: raw.id,
    deviceName: raw.device_name ?? "Unknown Device",
    deviceType: raw.device_type ?? "desktop",
    browser: raw.browser ?? "Unknown Browser",
    ipAddress: raw.ip_address ?? "—",
    location: raw.location ?? "Unknown",
    lastActive: new Date(raw.last_active_at),
    isCurrent: raw.is_current,
  };
}

function activityToSecurityEvent(a: MyActivity): AdaptedSecurityEvent | null {
  const action = a.action.toLowerCase();
  let type: AdaptedSecurityEvent["type"] | null = null;

  if (action.includes("login"))    type = "login";
  else if (action.includes("logout"))   type = "logout";
  else if (action.includes("password")) type = "password_change";
  else if (action.includes("session"))  type = "session_revoked";
  else if (action.includes("mfa_enabled"))  type = "mfa_enabled";
  else if (action.includes("mfa_disabled")) type = "mfa_disabled";

  if (!type) return null;

  return {
    id: a.id,
    type,
    timestamp: new Date(a.created_at),
    ipAddress: "—",
    location: "—",
    deviceName: "—",
    success: a.severity !== "high",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function splitName(name: string): { first_name: string; last_name: string } {
  const trimmed = name.trim().replace(/\s+/g, " ");
  const space = trimmed.indexOf(" ");
  if (space === -1) return { first_name: trimmed, last_name: "" };
  return { first_name: trimmed.slice(0, space), last_name: trimmed.slice(space + 1) };
}

// ─── Service ──────────────────────────────────────────────────────────────

export const profileService = {
  getMe(): Promise<AdaptedProfile> {
    return apiClient.get<BackendProfile>("/users/me").then(adaptProfile);
  },

  updateMe(data: { name?: string; bio?: string }): Promise<AdaptedProfile> {
    const payload: Record<string, string> = {};
    if (data.name) {
      const { first_name, last_name } = splitName(data.name);
      payload.first_name = first_name;
      payload.last_name = last_name;
    }
    if (data.bio !== undefined) payload.bio = data.bio;
    return apiClient.put<BackendProfile>("/users/me", payload).then(adaptProfile);
  },

  changePassword(oldPassword: string, newPassword: string): Promise<void> {
    return apiClient.put<void>("/users/me/password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  async getSessions(): Promise<AdaptedSession[]> {
    try {
      const list = await apiClient.get<BackendSession[]>("/users/me/sessions");
      return (list ?? []).map(adaptSession);
    } catch {
      return [];
    }
  },

  revokeSession(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/me/sessions/${id}`);
  },

  revokeAllSessions(): Promise<void> {
    return apiClient.delete<void>("/users/me/sessions");
  },

  deleteAccount(password: string): Promise<void> {
    return apiClient.delete<void>("/users/me", { data: { password } });
  },

  async getSecurityEvents(): Promise<AdaptedSecurityEvent[]> {
    try {
      const { data } = await apiClient.getPaginated<MyActivity>("/users/me/activity?page_size=20");
      return data.flatMap((a) => {
        const ev = activityToSecurityEvent(a);
        return ev ? [ev] : [];
      });
    } catch {
      return [];
    }
  },

  uploadAvatar(file: File): Promise<AdaptedProfile> {
    const form = new FormData();
    form.append("avatar", file);
    return apiClient
      .post<BackendProfile>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then(adaptProfile);
  },
};
