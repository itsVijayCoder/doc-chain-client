import api, { apiClient } from "./api";

// ─────────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror docchain-backend/internal/dto/share_link.go
// ─────────────────────────────────────────────────────────────────────────

interface BackendShareLink {
   id: string;
   document_id: string;
   token: string;
   expires_at: string;
   max_views?: number;
   view_count: number;
   is_active: boolean;
   created_at: string;
}

interface BackendShareLinkAccess {
   access_token: string;
   document: {
      id: string;
      title: string;
   };
}

// ─────────────────────────────────────────────────────────────────────────
// Frontend shapes
// ─────────────────────────────────────────────────────────────────────────

export interface ShareLink {
   id: string;
   documentId: string;
   token: string;
   url: string;
   expiresAt: Date;
   maxViews?: number;
   viewCount: number;
   isActive: boolean;
   createdAt: Date;
}

export interface ShareLinkAccess {
   accessToken: string;
   documentId: string;
   documentTitle: string;
}

function publicUrlForToken(token: string): string {
   // Construct the URL users share externally. In production this points at
   // the marketing/app origin; in dev at localhost:3001 (or whatever PORT).
   if (typeof window !== "undefined") {
      return `${window.location.origin}/s/${token}`;
   }
   const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
   return `${appUrl}/s/${token}`;
}

function adaptShareLink(raw: BackendShareLink): ShareLink {
   return {
      id: raw.id,
      documentId: raw.document_id,
      token: raw.token,
      url: publicUrlForToken(raw.token),
      expiresAt: new Date(raw.expires_at),
      maxViews: raw.max_views,
      viewCount: raw.view_count,
      isActive: raw.is_active,
      createdAt: new Date(raw.created_at),
   };
}

function adaptAccess(raw: BackendShareLinkAccess): ShareLinkAccess {
   return {
      accessToken: raw.access_token,
      documentId: raw.document.id,
      documentTitle: raw.document.title,
   };
}

// ─────────────────────────────────────────────────────────────────────────
// Request shapes
// ─────────────────────────────────────────────────────────────────────────

export interface CreateShareLinkArgs {
   password: string;
   /**
    * Duration string the backend understands: "1d", "7d", "30d", "12h", etc.
    * Backend validates presence via `binding:"required"`.
    */
   expiresIn: string;
   maxViews?: number;
}

export interface UpdateShareLinkArgs {
   maxViews?: number;
   isActive?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────
// shareLinkService
// ─────────────────────────────────────────────────────────────────────────

export const shareLinkService = {
   listByDocument: async (documentId: string): Promise<ShareLink[]> => {
      const raw = await apiClient.get<BackendShareLink[]>(
         `/documents/${documentId}/share-links`
      );
      return (raw ?? []).map(adaptShareLink);
   },

   create: async (
      documentId: string,
      args: CreateShareLinkArgs
   ): Promise<ShareLink> => {
      const body: Record<string, unknown> = {
         password: args.password,
         expires_in: args.expiresIn,
      };
      if (args.maxViews !== undefined) body.max_views = args.maxViews;
      const raw = await apiClient.post<BackendShareLink>(
         `/documents/${documentId}/share-links`,
         body
      );
      return adaptShareLink(raw);
   },

   update: async (
      documentId: string,
      linkId: string,
      args: UpdateShareLinkArgs
   ): Promise<ShareLink> => {
      const body: Record<string, unknown> = {};
      if (args.maxViews !== undefined) body.max_views = args.maxViews;
      if (args.isActive !== undefined) body.is_active = args.isActive;
      const raw = await apiClient.put<BackendShareLink>(
         `/documents/${documentId}/share-links/${linkId}`,
         body
      );
      return adaptShareLink(raw);
   },

   revoke: async (documentId: string, linkId: string): Promise<void> => {
      await apiClient.delete(
         `/documents/${documentId}/share-links/${linkId}`
      );
   },

   /**
    * PUBLIC endpoint — does not require an authenticated user. Verifies the
    * password and returns a short-lived access token scoped to the document.
    * Uses a fresh axios call (bypassing the normal auth interceptor) so we
    * don't send the viewer's user JWT to a public endpoint.
    */
   verify: async (
      token: string,
      password: string
   ): Promise<ShareLinkAccess> => {
      const res = await api.post<{ success: boolean; data?: BackendShareLinkAccess; error?: { code: string; message: string } }>(
         `/share/${encodeURIComponent(token)}/verify`,
         { password },
         {
            headers: { Authorization: "" }, // override any attached token
         }
      );
      const envelope = res.data;
      if (!envelope?.success || !envelope.data) {
         throw new Error(envelope?.error?.message ?? "Verification failed");
      }
      return adaptAccess(envelope.data);
   },
};
