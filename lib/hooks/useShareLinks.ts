"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   shareLinkService,
   type CreateShareLinkArgs,
   type ShareLink,
   type UpdateShareLinkArgs,
} from "@/lib/services/shareLinkService";
import type { ApiError } from "@/lib/types";

export const SHARE_LINKS_QUERY_KEY = "share-links" as const;

export function documentShareLinksKey(documentId: string) {
   return [SHARE_LINKS_QUERY_KEY, "document", documentId] as const;
}

export function useDocumentShareLinks(documentId: string | undefined) {
   return useQuery<ShareLink[], ApiError>({
      queryKey: documentShareLinksKey(documentId ?? ""),
      queryFn: () => shareLinkService.listByDocument(documentId as string),
      enabled: !!documentId,
      staleTime: 30_000,
   });
}

export function useCreateShareLink(documentId: string) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: CreateShareLinkArgs) =>
         shareLinkService.create(documentId, args),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: documentShareLinksKey(documentId),
         });
      },
   });
}

export function useUpdateShareLink(documentId: string) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: { linkId: string; updates: UpdateShareLinkArgs }) =>
         shareLinkService.update(documentId, args.linkId, args.updates),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: documentShareLinksKey(documentId),
         });
      },
   });
}

export function useRevokeShareLink(documentId: string) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (linkId: string) =>
         shareLinkService.revoke(documentId, linkId),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: documentShareLinksKey(documentId),
         });
      },
   });
}
