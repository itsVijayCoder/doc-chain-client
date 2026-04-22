"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Plus, X } from "lucide-react";
import {
   useChatSession,
   useSendInScope,
} from "@/lib/hooks/useChat";
import { useChatStore, type ChatScopeKey } from "@/lib/stores/chatStore";
import { useHighlightStore } from "@/lib/stores/highlightStore";
import { useDocument } from "@/lib/hooks/useDocuments";
import { ChatInput } from "./ChatInput";
import { ChatMessage, ChatTypingIndicator } from "./ChatMessage";
import { ChatSuggestions } from "./ChatSuggestions";
import type { ApiError } from "@/lib/types";
import type {
   ChatAction,
   ChatMessage as ChatMessageType,
   ChatSource,
   StreamStep,
} from "@/lib/services/chatService";
import { TIER1_INTENTS } from "@/lib/services/chatService";
import {
   actionNeedsConfirmation,
   getActionHandler,
} from "@/lib/chat/actionHandlers";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/useToast";

// Messages matching these patterns route to tier 1 (instant DB lookup) —
// skip the typing indicator so there's no perceived lag on an already-fast path.
const TIER1_PATTERNS = [
   /\bmy permissions?\b/i,
   /\bwho (can|has) access\b/i,
   /\bdocument (size|info|metadata)\b/i,
   /\bwhen was (this|it)\b/i,
   /\bwho (created|uploaded|last modified|shared)\b/i,
   /\bwho (viewed|downloaded|accessed)\b/i,
   /\brecent activity\b/i,
   /\bfile (size|info|type)\b/i,
   /\bcheck (metadata|activity|permissions?)\b/i,
];

function isPredictedTier1(content: string): boolean {
   return TIER1_PATTERNS.some((p) => p.test(content));
}

// Pathname matcher: /documents/:id (not /documents/:id/share or sub-routes)
function extractDocumentScope(pathname: string): {
   scopeKey: ChatScopeKey;
   documentId?: string;
} {
   const match = pathname.match(/^\/documents\/([^/]+)$/);
   if (match) {
      return { scopeKey: match[1], documentId: match[1] };
   }
   return { scopeKey: "global" };
}

// Map known backend error codes to user-facing messages. Unknown codes fall
// back to the raw message or a generic retry prompt.
function describeChatError(err: ApiError): {
   title: string;
   message: string;
   shouldClearSession: boolean;
} {
   const code = err?.code;
   switch (code) {
      case "CHAT_SESSION_NOT_FOUND":
         return {
            title: "Session no longer exists",
            message:
               "This conversation was deleted or expired. Starting a fresh session.",
            shouldClearSession: true,
         };
      case "AI_PROVIDER_UNAVAILABLE":
         return {
            title: "AI is temporarily unavailable",
            message:
               "The AI provider isn't responding right now. Please try again in a minute.",
            shouldClearSession: false,
         };
      case "EMBEDDING_NOT_READY":
         return {
            title: "Document is still being indexed",
            message:
               "This document is still being prepared for AI. Try again in a minute.",
            shouldClearSession: false,
         };
      case "PERMISSION_DENIED":
         return {
            title: "Access denied",
            message:
               "You no longer have access to this document. Refresh the page.",
            shouldClearSession: false,
         };
      default:
         return {
            title: "Message failed",
            message:
               err?.details?.[0] ?? err?.message ?? "Try again in a moment.",
            shouldClearSession: false,
         };
   }
}

export const ChatWindow: FC = () => {
   const pathname = usePathname();
   const router = useRouter();
   const toast = useToast();
   const queryClient = useQueryClient();

   const { scopeKey, documentId } = useMemo(
      () => extractDocumentScope(pathname ?? ""),
      [pathname]
   );

   const isOpen = useChatStore((s) => s.isOpen);
   const close = useChatStore((s) => s.close);
   const activeSessions = useChatStore((s) => s.activeSessions);
   const clearActiveSession = useChatStore((s) => s.clearActiveSession);
   const requestHighlight = useHighlightStore((s) => s.request);

   const sessionId = activeSessions[scopeKey];
   const sessionQuery = useChatSession(sessionId);
   const messages = sessionQuery.data?.messages ?? [];

   const docQuery = useDocument(documentId);
   const docTitle = docQuery.data?.document?.title;
   const docMimeType = docQuery.data?.document?.mimeType;

   const { sendInScope, isCreating, isSending } = useSendInScope();

   const [draft, setDraft] = useState("");
   const [lastSentTier1, setLastSentTier1] = useState(false);
   const [liveStepMessage, setLiveStepMessage] = useState("");
   const scrollRef = useRef<HTMLDivElement>(null);

   // Auto-scroll to bottom on new messages / typing indicator.
   useEffect(() => {
      if (!isOpen) return;
      const el = scrollRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
   }, [isOpen, messages.length, isSending]);

   const handleSend = async (overrideContent?: string) => {
      const content = (overrideContent ?? draft).trim();
      if (!content) return;
      setLastSentTier1(isPredictedTier1(content));
      setLiveStepMessage("");
      setDraft("");
      try {
         await sendInScope(
            scopeKey,
            content,
            sessionId,
            documentId,
            (step: StreamStep) => setLiveStepMessage(step.message)
         );
      } catch (err) {
         const apiErr = err as ApiError;
         const { title, message, shouldClearSession } = describeChatError(apiErr);
         toast.error(title, message);
         if (shouldClearSession) {
            clearActiveSession(scopeKey);
         }
         if (!overrideContent) setDraft(content);
      } finally {
         setLiveStepMessage("");
      }
   };

   const handleNewChat = () => {
      clearActiveSession(scopeKey);
      setDraft("");
   };

   const handleSourceClick = (source: ChatSource) => {
      const targetDocId = source.documentId ?? documentId;
      if (!targetDocId) return;

      // Push the highlight BEFORE (potentially) navigating — the store
      // state is observable when the target viewer mounts, so cross-doc
      // navigation lands on the right page with the snippet highlighted.
      if (source.snippet) {
         requestHighlight({
            documentId: targetDocId,
            page: source.page,
            snippet: source.snippet,
         });
      }

      // Cross-document source — navigate and close the chat so the user
      // can read the new document without the panel covering it.
      if (targetDocId !== documentId) {
         router.push(`/documents/${targetDocId}`);
         close();
         return;
      }
      // Same-doc: highlight already pushed above; nothing else to do.
   };

   const runAction = async (
      message: ChatMessageType,
      action: ChatAction
   ) => {
      // Confirmation gate — destructive/consequential actions get a browser
      // prompt. Upgrade to a styled dialog later; semantics stay identical.
      if (actionNeedsConfirmation(action)) {
         const ok = window.confirm(`${action.label}\n\nProceed?`);
         if (!ok) return;
      }
      const handler = getActionHandler(action.kind);
      const result = await handler(
         { documentId, message, queryClient },
         action
      );
      if (!result.toast) return;
      if (result.kind === "error") {
         toast.error(result.toast.title, result.toast.message);
      } else if (result.kind === "unsupported") {
         toast.info(result.toast.title, result.toast.message);
      } else {
         toast.success(result.toast.title, result.toast.message);
      }
   };

   const handleFollowup = (question: string) => {
      // Drop into the input so the user sees what's sending, then fire.
      setDraft(question);
      handleSend(question);
   };

   const scopeLabel = documentId
      ? docTitle
         ? `About "${docTitle}"`
         : "About this document"
      : "Ask anything about your documents";

   const isBusy = isCreating || isSending;
   // Suppress the typing indicator for instant tier-1 responses (no LLM call).
   // We also check the last assistant message's intent as a reactive fallback.
   const lastAssistantIntent = messages.findLast?.((m) => m.role === "assistant")?.intent;
   const showTypingIndicator =
      isBusy && !lastSentTier1 && !(lastAssistantIntent && TIER1_INTENTS.has(lastAssistantIntent));

   return (
      <div
         className='fixed z-50 flex flex-col overflow-hidden
                    bottom-20 right-4 w-[22rem] h-[32rem]
                    sm:bottom-24 sm:right-6 sm:w-[26rem] sm:h-[36rem]
                    transition-all duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]'
         role='dialog'
         aria-label='AI chat'
         aria-hidden={!isOpen}
         // Mount-always pattern: we keep the window in the DOM so open/close
         // can animate the opacity + transform. When closed, pointerEvents go
         // off so clicks fall through to the bubble underneath.
         style={{
            background: "var(--dc-elevated)",
            border: "1px solid var(--dc-border-strong)",
            borderRadius: 14,
            boxShadow: isOpen ? "var(--dc-shadow-lg)" : "none",
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transform: isOpen
               ? "translateY(0) scale(1)"
               : "translateY(12px) scale(0.96)",
            transformOrigin: "bottom right",
         }}
      >
         {/* Header */}
         <div
            className='flex items-center justify-between gap-2 px-3 py-2.5 shrink-0'
            style={{
               borderBottom: "1px solid var(--dc-border)",
               background: "var(--dc-surface-2)",
            }}
         >
            <div className='flex items-center gap-2 min-w-0'>
               <div
                  className='flex h-7 w-7 items-center justify-center rounded-full shrink-0'
                  style={{
                     background: "var(--dc-accent-soft)",
                     color: "var(--dc-accent)",
                     border: "1px solid var(--dc-accent-border)",
                  }}
               >
                  <Bot size={14} strokeWidth={1.75} />
               </div>
               <div className='min-w-0'>
                  <p
                     className='text-[13px] font-semibold truncate'
                     style={{ color: "var(--dc-text)" }}
                  >
                     DocChain AI
                  </p>
                  <p
                     className='text-[11px] truncate'
                     style={{ color: "var(--dc-text-dim)" }}
                     title={scopeLabel}
                  >
                     {scopeLabel}
                  </p>
               </div>
            </div>
            <div className='flex items-center gap-0.5'>
               <HeaderIconBtn
                  onClick={handleNewChat}
                  disabled={isBusy}
                  title='Start a new conversation'
                  ariaLabel='New conversation'
               >
                  <Plus size={15} strokeWidth={1.75} />
               </HeaderIconBtn>
               <HeaderIconBtn onClick={close} ariaLabel='Close chat'>
                  <X size={15} strokeWidth={1.75} />
               </HeaderIconBtn>
            </div>
         </div>

         {/* Messages */}
         <div
            ref={scrollRef}
            className='flex-1 overflow-y-auto p-4 space-y-4'
            style={{ background: "var(--dc-elevated)" }}
         >
            {sessionQuery.isLoading && sessionId && (
               <p
                  className='text-[12px] text-center'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Loading conversation…
               </p>
            )}

            {!sessionId && messages.length === 0 && !isBusy && (
               <div className='flex flex-col items-center justify-center h-full text-center gap-4'>
                  <div
                     className='w-12 h-12 rounded-full flex items-center justify-center'
                     style={{
                        background: "var(--dc-accent-soft)",
                        border: "1px solid var(--dc-accent-border)",
                        color: "var(--dc-accent)",
                     }}
                  >
                     <Bot size={22} strokeWidth={1.75} />
                  </div>
                  <p
                     className='text-[13px]'
                     style={{ color: "var(--dc-text)" }}
                  >
                     {documentId
                        ? "Ask anything about this document."
                        : "Ask anything about your documents."}
                  </p>
                  <ChatSuggestions
                     mimeType={docMimeType}
                     isDocumentScoped={!!documentId}
                     onPick={(prompt) => {
                        setDraft(prompt);
                        handleSend(prompt);
                     }}
                  />
                  <p
                     className='text-[11px]'
                     style={{ color: "var(--dc-text-faint)" }}
                  >
                     Replies include source citations when available.
                  </p>
               </div>
            )}

            {messages.map((msg) => (
               <ChatMessage
                  key={msg.id}
                  message={msg}
                  currentDocumentId={documentId}
                  onSourceClick={handleSourceClick}
                  onActionClick={(action) => runAction(msg, action)}
                  onFollowupClick={handleFollowup}
               />
            ))}

            {showTypingIndicator && (
               <ChatTypingIndicator stepMessage={liveStepMessage || undefined} />
            )}

            {sessionQuery.isError && (
               <p
                  className='text-[12px] text-center'
                  style={{ color: "var(--dc-danger)" }}
               >
                  Couldn&apos;t load the conversation.
               </p>
            )}
         </div>

         {/* Input */}
         <ChatInput
            value={draft}
            onChange={setDraft}
            onSend={() => handleSend()}
            disabled={isBusy}
            placeholder={
               documentId
                  ? "Ask about this document…"
                  : "Ask a question…"
            }
         />
      </div>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Header icon button — small, ghost, matches the design's .icon-btn
// ─────────────────────────────────────────────────────────────────────
const HeaderIconBtn: React.FC<{
   onClick?: () => void;
   disabled?: boolean;
   title?: string;
   ariaLabel: string;
   children: React.ReactNode;
}> = ({ onClick, disabled, title, ariaLabel, children }) => (
   <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className='w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
      style={{ color: "var(--dc-text-muted)" }}
      onMouseEnter={(e) => {
         if (!disabled) {
            e.currentTarget.style.background = "var(--dc-surface-3)";
            e.currentTarget.style.color = "var(--dc-text)";
         }
      }}
      onMouseLeave={(e) => {
         e.currentTarget.style.background = "transparent";
         e.currentTarget.style.color = "var(--dc-text-muted)";
      }}
   >
      {children}
   </button>
);
