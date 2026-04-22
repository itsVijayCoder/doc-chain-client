import { apiClient } from "@/lib/services/api";

export interface Comment {
  id: string;
  document_id: string;
  user_id: string;
  parent_id?: string;
  content: string;
  is_edited: boolean;
  author_name: string;
  replies?: Comment[];
  created_at: string;
  updated_at: string;
}

export const commentService = {
  list(documentId: string): Promise<Comment[]> {
    return apiClient.get<Comment[]>(`/documents/${documentId}/comments`);
  },

  create(documentId: string, content: string, parentId?: string): Promise<Comment> {
    return apiClient.post<Comment>(`/documents/${documentId}/comments`, {
      content,
      ...(parentId ? { parent_id: parentId } : {}),
    });
  },

  update(documentId: string, commentId: string, content: string): Promise<Comment> {
    return apiClient.put<Comment>(
      `/documents/${documentId}/comments/${commentId}`,
      { content }
    );
  },

  delete(documentId: string, commentId: string): Promise<void> {
    return apiClient.delete(`/documents/${documentId}/comments/${commentId}`);
  },
};
