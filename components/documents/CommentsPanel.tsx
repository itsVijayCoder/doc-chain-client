"use client";

import { FC, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentService, type Comment } from "@/lib/services/commentService";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Reply, Pencil, Trash2, CornerDownRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Props {
  documentId: string;
}

// ─── Single comment bubble ────────────────────────────────────────────────

interface CommentItemProps {
  comment: Comment;
  documentId: string;
  currentUserId?: string;
  depth?: number;
}

const CommentItem: FC<CommentItemProps> = ({
  comment,
  documentId,
  currentUserId,
  depth = 0,
}) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState("");

  const updateMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.update(documentId, comment.id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => commentService.delete(documentId, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
    },
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.create(documentId, content, comment.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setReplying(false);
      setReplyText("");
    },
  });

  const isOwn = currentUserId === comment.user_id;

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-6 pl-4 border-l")}>
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">
                {comment.author_name?.charAt(0)?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium">{comment.author_name}</span>
              {comment.is_edited && (
                <span className="text-xs text-muted-foreground ml-1">(edited)</span>
              )}
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeTime(new Date(comment.created_at))}
          </span>
        </div>

        {/* Body */}
        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="text-sm min-h-16 resize-none"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setEditing(false); setEditText(comment.content); }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!editText.trim() || updateMutation.isPending}
                onClick={() => updateMutation.mutate(editText.trim())}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{comment.content}</p>
        )}

        {/* Actions */}
        {!editing && (
          <div className="flex items-center gap-1 pt-1">
            {depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setReplying((r) => !r)}
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
            {isOwn && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Inline reply composer */}
      {replying && (
        <div className="ml-6 pl-4 border-l space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <CornerDownRight className="h-3 w-3" />
            Replying to {comment.author_name}
          </div>
          <Textarea
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="text-sm min-h-14 resize-none"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setReplying(false); setReplyText(""); }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() => replyMutation.mutate(replyText.trim())}
            >
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              documentId={documentId}
              currentUserId={currentUserId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main panel ──────────────────────────────────────────────────────────

const CommentsPanel: FC<Props> = ({ documentId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", documentId],
    queryFn: () => commentService.list(documentId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const addMutation = useMutation({
    mutationFn: (content: string) =>
      commentService.create(documentId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", documentId] });
      setNewComment("");
    },
  });

  const topLevel = comments.filter((c) => !c.parent_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare size={18} />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </h3>
      </div>

      {/* New comment composer */}
      <div className="space-y-2">
        <Textarea
          placeholder="Add a comment…"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="text-sm min-h-20 resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!newComment.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate(newComment.trim())}
          >
            Post Comment
          </Button>
        </div>
      </div>

      {/* Comment list */}
      {isLoading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Loading comments…
        </div>
      ) : topLevel.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to comment.
        </div>
      ) : (
        <div className="space-y-3">
          {topLevel.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              documentId={documentId}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsPanel;
