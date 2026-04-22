import { apiClient, BASE_URL } from "./api";
import { getAccessToken } from "@/lib/auth/tokens";

// ─────────────────────────────────────────────────────────────────────────
// Backend DTOs — mirror docchain-backend/internal/dto/chat.go
// ─────────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant" | "system";

interface BackendMessageAnchor {
   text: string;
   page?: number;
   chunk_index?: number;
}

interface BackendMessageAction {
   kind: string;
   label: string;
   params?: Record<string, unknown>;
   needs?: string[];
}

interface BackendProcessingStep {
   step: string;
   message: string;
   duration_ms: number;
   token_count?: number;
}

interface BackendChatMessage {
   id: string;
   session_id: string;
   role: string;
   content: string;
   // Backend sends `json.RawMessage` — arbitrary JSON. Documented shape is
   // an array of { chunk_index, snippet, ... } but we keep it loose to
   // tolerate future changes without a schema break.
   sources: unknown;
   anchors?: BackendMessageAnchor[];
   actions?: BackendMessageAction[];
   intent?: string;
   followups?: string[];
   confidence?: string;
   token_count: number;
   processing_steps?: BackendProcessingStep[];
   created_at: string;
}

interface BackendChatSession {
   id: string;
   user_id: string;
   document_id?: string;
   title: string;
   created_at: string;
   updated_at: string;
}

interface BackendChatSessionDetail extends BackendChatSession {
   messages: BackendChatMessage[];
}

// ─────────────────────────────────────────────────────────────────────────
// Frontend shapes
// ─────────────────────────────────────────────────────────────────────────

export interface ChatSource {
   chunkIndex?: number;
   snippet?: string;
   page?: number;
   // Present in global-chat responses so source chips can link to the
   // originating document. Omitted for document-scoped sessions where the
   // scope is implicit.
   documentId?: string;
   documentTitle?: string;
   [key: string]: unknown;
}

/**
 * The exact sentence from the document the AI cited when answering.
 * Preferred over regex-extracted claims because the AI knows which part
 * of a retrieved chunk was actually relevant.
 */
export interface ChatAnchor {
   text: string;
   page?: number;
   chunkIndex?: number;
}

/**
 * Executable command the frontend can run. Kinds are strings (not a closed
 * enum) so the backend can add new intents without the frontend breaking;
 * unknown kinds render a graceful "not yet supported" message.
 */
export interface ChatAction {
   kind: string;
   label: string;
   params?: Record<string, unknown>;
   /** Gates — e.g. ["confirmation"] → show confirm UI before executing. */
   needs?: string[];
}

/**
 * Intent label from the backend's closed enum. Stored as a plain string
 * so new values roll out without a type update.
 *
 * Tier 1 (no AI, instant): check_metadata, check_activity, my_permissions
 * Tier 2 (AI-powered):     extract, explain, translate, compliance_check
 * Other:                   find_similar, summarize, answer_question, etc.
 */
export type ChatIntent =
   | "answer_question"
   | "set_metadata"
   | "move_document"
   | "add_tags"
   | "share_document"
   | "compare_versions"
   | "summarize"
   | "check_metadata"
   | "check_activity"
   | "my_permissions"
   | "extract"
   | "explain"
   | "translate"
   | "compliance_check"
   | "find_similar"
   | string;

/** The intents resolved server-side without AI — show no typing indicator. */
export const TIER1_INTENTS = new Set<string>([
   "check_metadata",
   "check_activity",
   "my_permissions",
]);

/**
 * One step in the server-side reasoning pipeline, returned in
 * `processing_steps[]` on assistant messages.
 */
export interface ProcessingStep {
   step: string;
   message: string;
   durationMs: number;
   tokenCount?: number;
}

/**
 * How sure the AI is of the answer:
 *   high   — explicitly stated in the document
 *   medium — inferred from context
 *   low    — partially answered or uncertain
 *
 * Stored as a plain string so backend can add new levels without the
 * frontend breaking; unknown values skip the badge.
 */
export type ChatConfidence = "high" | "medium" | "low" | string;

export interface ChatMessage {
   id: string;
   sessionId: string;
   role: ChatRole;
   content: string;
   sources: ChatSource[];
   anchors: ChatAnchor[];
   actions: ChatAction[];
   intent?: ChatIntent;
   followups: string[];
   confidence?: ChatConfidence;
   tokenCount: number;
   processingSteps: ProcessingStep[];
   createdAt: Date;
}

export interface ChatSession {
   id: string;
   userId: string;
   documentId?: string;
   title: string;
   createdAt: Date;
   updatedAt: Date;
}

export interface ChatSessionDetail extends ChatSession {
   messages: ChatMessage[];
}

// ─────────────────────────────────────────────────────────────────────────
// Adapters
// ─────────────────────────────────────────────────────────────────────────

function normalizeSources(raw: unknown): ChatSource[] {
   if (!raw) return [];
   const list = Array.isArray(raw)
      ? raw
      : (() => {
           // Some backends wrap the array in a container; be permissive.
           if (typeof raw === "object" && raw !== null) {
              const obj = raw as Record<string, unknown>;
              if (Array.isArray(obj.sources)) return obj.sources;
              if (Array.isArray(obj.chunks)) return obj.chunks;
           }
           return [];
        })();

   // Backend uses snake_case (document_id, document_title, chunk_index);
   // flatten to camelCase here so the UI stays consistent.
   return (list as Record<string, unknown>[]).map((item) => ({
      chunkIndex: (item.chunk_index ?? item.chunkIndex) as number | undefined,
      snippet: item.snippet as string | undefined,
      page: item.page as number | undefined,
      documentId: (item.document_id ?? item.documentId) as string | undefined,
      documentTitle: (item.document_title ?? item.documentTitle) as
         | string
         | undefined,
      ...item,
   }));
}

function adaptAnchor(raw: BackendMessageAnchor): ChatAnchor {
   return {
      text: raw.text,
      // Backend sends page: 0 when unknown; treat that as "no page info".
      page:
         typeof raw.page === "number" && raw.page > 0 ? raw.page : undefined,
      chunkIndex: raw.chunk_index,
   };
}

function adaptAction(raw: BackendMessageAction): ChatAction {
   return {
      kind: raw.kind,
      label: raw.label,
      params: raw.params,
      needs: raw.needs,
   };
}

function adaptMessage(raw: BackendChatMessage): ChatMessage {
   return {
      id: raw.id,
      sessionId: raw.session_id,
      role: (raw.role as ChatRole) ?? "assistant",
      content: raw.content,
      sources: normalizeSources(raw.sources),
      anchors: (raw.anchors ?? []).map(adaptAnchor),
      actions: (raw.actions ?? []).map(adaptAction),
      intent: raw.intent,
      followups: raw.followups ?? [],
      confidence: raw.confidence,
      tokenCount: raw.token_count,
      processingSteps: (raw.processing_steps ?? []).map((s) => ({
         step: s.step,
         message: s.message,
         durationMs: s.duration_ms,
         tokenCount: s.token_count,
      })),
      createdAt: new Date(raw.created_at),
   };
}

function adaptSession(raw: BackendChatSession): ChatSession {
   return {
      id: raw.id,
      userId: raw.user_id,
      documentId: raw.document_id,
      title: raw.title,
      createdAt: new Date(raw.created_at),
      updatedAt: new Date(raw.updated_at),
   };
}

function adaptSessionDetail(raw: BackendChatSessionDetail): ChatSessionDetail {
   return {
      ...adaptSession(raw),
      messages: (raw.messages ?? []).map(adaptMessage),
   };
}

// ─────────────────────────────────────────────────────────────────────────
// chatService
// ─────────────────────────────────────────────────────────────────────────

export interface CreateSessionArgs {
   documentId?: string;
   title?: string;
}

/**
 * Live step emitted by the SSE stream while the backend is processing.
 * Distinct from ProcessingStep (which lives on the final message) because
 * StreamStep arrives in real-time before the response is complete.
 */
export interface StreamStep {
   step: string;
   message: string;
   durationMs: number;
}

/**
 * Parse the SSE stream from `POST /chat/sessions/:id/messages`.
 * Calls `onStep` for each `event: step` frame, then resolves with the
 * adapted ChatMessage from the terminal `event: done` frame.
 */
async function sendMessageSSE(
   sessionId: string,
   content: string,
   onStep?: (step: StreamStep) => void
): Promise<ChatMessage> {
   const token = getAccessToken();
   const res = await fetch(`${BASE_URL}/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
         "Content-Type": "application/json",
         Accept: "text/event-stream",
         ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ content }),
   });

   if (!res.ok) {
      let code: string | undefined;
      let msg = `HTTP ${res.status}`;
      try {
         const body = await res.json();
         code = body?.error?.code;
         msg = body?.error?.message ?? msg;
      } catch { /* ignore parse error */ }
      throw Object.assign(new Error(msg), { code });
   }

   if (!res.body) throw new Error("No response body for SSE stream");

   const reader = res.body.getReader();
   const decoder = new TextDecoder();
   let buffer = "";

   try {
      while (true) {
         const { done, value } = await reader.read();
         if (done) break;

         buffer += decoder.decode(value, { stream: true });
         const blocks = buffer.split("\n\n");
         buffer = blocks.pop() ?? "";

         for (const block of blocks) {
            const m = block.match(/^event:\s*(\w+)\ndata:\s*([\s\S]+)$/);
            if (!m) continue;
            const [, event, data] = m;

            if (event === "step") {
               const s = JSON.parse(data) as { step: string; message: string; duration_ms?: number };
               onStep?.({ step: s.step, message: s.message, durationMs: s.duration_ms ?? 0 });
            } else if (event === "done") {
               reader.cancel();
               return adaptMessage(JSON.parse(data) as BackendChatMessage);
            } else if (event === "error") {
               const e = JSON.parse(data) as { error?: string; code?: string };
               throw Object.assign(new Error(e.error ?? "Stream error"), { code: e.code });
            }
         }
      }
   } finally {
      reader.releaseLock();
   }

   throw new Error("SSE stream ended without a done event");
}

export const chatService = {
   createSession: async (args: CreateSessionArgs): Promise<ChatSession> => {
      const body: Record<string, unknown> = {};
      if (args.documentId) body.document_id = args.documentId;
      if (args.title) body.title = args.title;
      const raw = await apiClient.post<BackendChatSession>(
         "/chat/sessions",
         body
      );
      return adaptSession(raw);
   },

   listSessions: async (): Promise<ChatSession[]> => {
      const raw = await apiClient.get<BackendChatSession[]>("/chat/sessions");
      return (raw ?? []).map(adaptSession);
   },

   getSession: async (sessionId: string): Promise<ChatSessionDetail> => {
      const raw = await apiClient.get<BackendChatSessionDetail>(
         `/chat/sessions/${sessionId}`
      );
      return adaptSessionDetail(raw);
   },

   sendMessage: (
      sessionId: string,
      content: string,
      onStep?: (step: StreamStep) => void
   ): Promise<ChatMessage> => sendMessageSSE(sessionId, content, onStep),

   deleteSession: async (sessionId: string): Promise<void> => {
      await apiClient.delete(`/chat/sessions/${sessionId}`);
   },
};
