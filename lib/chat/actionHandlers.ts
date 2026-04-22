"use client";

import type { QueryClient } from "@tanstack/react-query";
import type {
   ChatAction,
   ChatMessage,
} from "@/lib/services/chatService";
import { documentService } from "@/lib/services/documentService";
import { useHighlightStore } from "@/lib/stores/highlightStore";
import { invalidateDocuments } from "@/lib/hooks/useDocuments";

/**
 * Context object passed to every action handler. Kept small — if a handler
 * needs more, we add a field here rather than plumbing dependencies
 * through each call site.
 */
export interface ActionContext {
   /** The document currently in view (chat scope). May be undefined in global chat. */
   documentId?: string;
   /** The full message the action belongs to. Handlers that need anchors
       pull them from here via params.anchor_index. */
   message: ChatMessage;
   /** TanStack query client for cache invalidation after mutations. */
   queryClient: QueryClient;
}

export type ActionResult =
   | { kind: "done"; toast?: { title: string; message?: string } }
   | { kind: "error"; toast: { title: string; message?: string } }
   | { kind: "unsupported"; toast: { title: string; message?: string } };

export type ActionHandler = (
   ctx: ActionContext,
   action: ChatAction
) => Promise<ActionResult>;

// ─────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────

/**
 * Highlight an anchor in the current document's viewer. Resolves the
 * anchor via params.anchor_index (preferred) or falls back to the first
 * anchor on the message if params are sparse.
 */
const handleHighlight: ActionHandler = async ({ documentId, message }, action) => {
   const targetDocId = documentId;
   if (!targetDocId) {
      return {
         kind: "error",
         toast: {
            title: "Can't highlight",
            message: "Open this document first, then click the action again.",
         },
      };
   }
   const anchorIdx =
      typeof action.params?.anchor_index === "number"
         ? (action.params.anchor_index as number)
         : 0;
   const anchor = message.anchors[anchorIdx] ?? message.anchors[0];
   if (!anchor) {
      return {
         kind: "error",
         toast: {
            title: "No anchor to highlight",
            message: "The AI reply didn't include a quotable sentence.",
         },
      };
   }
   useHighlightStore.getState().request({
      documentId: targetDocId,
      page: anchor.page,
      snippet: anchor.text,
   });
   return { kind: "done" };
};

/**
 * Update document metadata — expiry, title, description, folder, etc.
 * Backend-authoritative via PUT /documents/:id. Params shape mirrors the
 * DTO fields (snake_case from backend, normalized here).
 */
const handleSetMetadata: ActionHandler = async (
   { documentId, queryClient },
   action
) => {
   if (!documentId) {
      return {
         kind: "error",
         toast: {
            title: "Missing document context",
            message: "This action needs a document to act on.",
         },
      };
   }
   const p = action.params ?? {};
   const updates: Parameters<typeof documentService.update>[1] = {};
   if (typeof p.title === "string") updates.title = p.title;
   if (typeof p.description === "string") updates.description = p.description;
   if (typeof p.folder_id === "string" || p.folder_id === null)
      updates.folderId = p.folder_id as string | null;
   if (typeof p.expires_at === "string" || p.expires_at === null)
      updates.expiresAt = p.expires_at as string | null;
   if (Array.isArray(p.reminder_days))
      updates.reminderDays = p.reminder_days as number[];

   if (Object.keys(updates).length === 0) {
      return {
         kind: "error",
         toast: {
            title: "Nothing to update",
            message: "The action didn't include any fields to change.",
         },
      };
   }

   try {
      await documentService.update(documentId, updates);
      invalidateDocuments(queryClient);
      return {
         kind: "done",
         toast: { title: "Updated", message: action.label },
      };
   } catch (err) {
      const msg =
         err instanceof Error ? err.message : "Please try again.";
      return {
         kind: "error",
         toast: { title: "Update failed", message: msg },
      };
   }
};

/**
 * Fallback for intents the frontend hasn't wired yet. Keeps the UI from
 * breaking when the backend rolls out a new action.kind before the
 * frontend ships the handler — we surface a polite message instead of
 * a dead click.
 */
const handleUnsupported: ActionHandler = async (_ctx, action) => {
   return {
      kind: "unsupported",
      toast: {
         title: "Action not supported yet",
         message: `"${action.label}" will be wired up in a follow-up.`,
      },
   };
};

// ─────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────

const HANDLERS: Record<string, ActionHandler> = {
   highlight: handleHighlight,
   // `set_metadata` is the catch-all for title/desc/expiry/folder changes.
   // `set_expiry` is an alias in case backend emits it as a distinct kind.
   set_metadata: handleSetMetadata,
   set_expiry: handleSetMetadata,
   set_title: handleSetMetadata,
   set_description: handleSetMetadata,
   move_to_folder: handleSetMetadata,
};

export function getActionHandler(kind: string): ActionHandler {
   return HANDLERS[kind] ?? handleUnsupported;
}

/** Does this action need user confirmation before executing? */
export function actionNeedsConfirmation(action: ChatAction): boolean {
   return action.needs?.includes("confirmation") ?? false;
}
