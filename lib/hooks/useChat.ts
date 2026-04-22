"use client";

import {
   useMutation,
   useQuery,
   useQueryClient,
} from "@tanstack/react-query";
import {
   chatService,
   type ChatMessage,
   type ChatSession,
   type ChatSessionDetail,
   type CreateSessionArgs,
   type StreamStep,
} from "@/lib/services/chatService";
import { useChatStore, type ChatScopeKey } from "@/lib/stores/chatStore";
import type { ApiError } from "@/lib/types";

export const CHAT_QUERY_KEY = "chat" as const;

export function chatSessionKey(sessionId: string) {
   return [CHAT_QUERY_KEY, "session", sessionId] as const;
}

export function chatSessionsListKey() {
   return [CHAT_QUERY_KEY, "sessions"] as const;
}

export function useChatSession(sessionId: string | undefined) {
   return useQuery<ChatSessionDetail, ApiError>({
      queryKey: chatSessionKey(sessionId ?? ""),
      queryFn: () => chatService.getSession(sessionId as string),
      enabled: !!sessionId,
      staleTime: 30_000,
   });
}

export function useCreateChatSession() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: CreateSessionArgs) => chatService.createSession(args),
      onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: chatSessionsListKey() });
      },
   });
}

export function useDeleteChatSession() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (sessionId: string) => chatService.deleteSession(sessionId),
      onSuccess: (_data, sessionId) => {
         queryClient.removeQueries({ queryKey: chatSessionKey(sessionId) });
         queryClient.invalidateQueries({ queryKey: chatSessionsListKey() });
      },
   });
}

interface SendMessageArgs {
   sessionId: string;
   content: string;
   onStep?: (step: StreamStep) => void;
}

/**
 * Send a user message. Optimistically appends the user's bubble to the
 * cached session so the input clears instantly; the backend's assistant
 * reply is appended when the request resolves. Rolls back on error.
 */
export function useSendChatMessage() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: ({ sessionId, content, onStep }: SendMessageArgs) =>
         chatService.sendMessage(sessionId, content, onStep),
      onMutate: async ({ sessionId, content }) => {
         const key = chatSessionKey(sessionId);
         await queryClient.cancelQueries({ queryKey: key });

         const previous = queryClient.getQueryData<ChatSessionDetail>(key);
         if (!previous) return { previous };

         const optimisticUserMessage: ChatMessage = {
            id: `optimistic-${Date.now()}`,
            sessionId,
            role: "user",
            content,
            sources: [],
            anchors: [],
            actions: [],
            followups: [],
            processingSteps: [],
            tokenCount: 0,
            createdAt: new Date(),
         };

         queryClient.setQueryData<ChatSessionDetail>(key, {
            ...previous,
            messages: [...previous.messages, optimisticUserMessage],
         });

         return { previous };
      },
      onError: (_err, { sessionId }, context) => {
         if (context?.previous) {
            queryClient.setQueryData(chatSessionKey(sessionId), context.previous);
         }
      },
      onSuccess: (assistantMessage, { sessionId }) => {
         const key = chatSessionKey(sessionId);
         const snapshot = queryClient.getQueryData<ChatSessionDetail>(key);
         if (!snapshot) {
            // No cache to update (shouldn't happen since onMutate seeded it),
            // but be defensive.
            queryClient.invalidateQueries({ queryKey: key });
            return;
         }
         // Replace the optimistic user message's id with a real one if we
         // can match by content, and append the assistant reply.
         queryClient.setQueryData<ChatSessionDetail>(key, {
            ...snapshot,
            messages: [...snapshot.messages, assistantMessage],
            updatedAt: new Date(),
         });
      },
   });
}

/**
 * High-level helper that turns "send this message in this scope" into a
 * single call — creates the session on first use, sends the message, and
 * tracks the active session in the chat store.
 */
export function useSendInScope() {
   const setActiveSession = useChatStore((s) => s.setActiveSession);
   const createMutation = useCreateChatSession();
   const sendMutation = useSendChatMessage();
   const queryClient = useQueryClient();

   const sendInScope = async (
      scope: ChatScopeKey,
      content: string,
      existingSessionId: string | undefined,
      documentId: string | undefined,
      onStep?: (step: StreamStep) => void
   ): Promise<ChatMessage> => {
      let sessionId = existingSessionId;
      if (!sessionId) {
         const session = await createMutation.mutateAsync({
            documentId,
            title: documentId ? undefined : "Chat",
         });
         sessionId = session.id;
         setActiveSession(scope, sessionId);
         // Seed the query cache so optimistic append in useSendChatMessage
         // has something to attach to.
         queryClient.setQueryData<ChatSessionDetail>(chatSessionKey(sessionId), {
            ...session,
            messages: [],
         });
      }
      return sendMutation.mutateAsync({ sessionId, content, onStep });
   };

   return {
      sendInScope,
      isCreating: createMutation.isPending,
      isSending: sendMutation.isPending,
   };
}

// Convenience re-exports
export type { ChatMessage, ChatSession, ChatSessionDetail };
