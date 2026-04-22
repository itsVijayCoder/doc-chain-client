import { apiClient } from "./api";

// ─────────────────────────────────────────────────────────────────────────
// Tag catalog service — GET/POST/PUT/DELETE /tags plus per-document
// attach/detach. The full catalog (GET /tags) is an unpaginated array;
// the backend doesn't wrap it in {data, meta}.
// ─────────────────────────────────────────────────────────────────────────

interface BackendTagResponse {
   id: string;
   name: string;
   slug: string;
   color: string;
   document_count: number;
   created_at: string;
}

export interface Tag {
   id: string;
   name: string;
   slug: string;
   color?: string;
   documentCount: number;
   createdAt: Date;
}

function adaptTag(raw: BackendTagResponse): Tag {
   return {
      id: raw.id,
      name: raw.name,
      slug: raw.slug,
      color: raw.color || undefined,
      documentCount: raw.document_count ?? 0,
      createdAt: new Date(raw.created_at),
   };
}

// Slug generator — lowercase, hyphens, alphanum-only. Matches the kind of
// thing the backend expects when we don't let users pick their own slug.
// Backend still validates on its side; this is just a reasonable default.
export function slugifyTag(name: string): string {
   return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100);
}

export interface CreateTagArgs {
   name: string;
   /** Optional; auto-slugified from name if omitted. */
   slug?: string;
   color?: string;
}

export interface UpdateTagArgs {
   name?: string;
   color?: string;
}

export const tagService = {
   list: async (): Promise<Tag[]> => {
      const raw = await apiClient.get<BackendTagResponse[]>("/tags");
      return (raw ?? []).map(adaptTag);
   },

   create: async (args: CreateTagArgs): Promise<Tag> => {
      const body = {
         name: args.name,
         slug: args.slug ?? slugifyTag(args.name),
         color: args.color ?? undefined,
      };
      const raw = await apiClient.post<BackendTagResponse>("/tags", body);
      return adaptTag(raw);
   },

   update: async (id: string, args: UpdateTagArgs): Promise<Tag> => {
      const body: Record<string, string> = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.color !== undefined) body.color = args.color;
      const raw = await apiClient.put<BackendTagResponse>(`/tags/${id}`, body);
      return adaptTag(raw);
   },

   delete: async (id: string): Promise<void> => {
      await apiClient.delete(`/tags/${id}`);
   },

   // Per-document attach/detach. Backend: POST /documents/:id/tags with
   // { tag_ids: [uuid, ...] } and DELETE /documents/:id/tags/:tagId.
   attachToDocument: async (documentId: string, tagIds: string[]): Promise<void> => {
      if (tagIds.length === 0) return;
      await apiClient.post(`/documents/${documentId}/tags`, { tag_ids: tagIds });
   },

   detachFromDocument: async (
      documentId: string,
      tagId: string
   ): Promise<void> => {
      await apiClient.delete(`/documents/${documentId}/tags/${tagId}`);
   },
};
