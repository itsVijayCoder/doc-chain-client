"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   blockchainService,
   type BlockchainRecord,
   type VerificationResult,
} from "@/lib/services/blockchainService";
import type { ApiError } from "@/lib/types";

export const BLOCKCHAIN_QUERY_KEY = "blockchain" as const;

export function blockchainRecordsKey(documentId: string) {
   return [BLOCKCHAIN_QUERY_KEY, "records", documentId] as const;
}

export function blockchainVerifyKey(documentId: string) {
   return [BLOCKCHAIN_QUERY_KEY, "verify", documentId] as const;
}

/** All blockchain records (pending + confirmed + failed) for a document. */
export function useBlockchainRecords(documentId: string | undefined) {
   return useQuery<BlockchainRecord[], ApiError>({
      queryKey: blockchainRecordsKey(documentId ?? ""),
      queryFn: () => blockchainService.listByDocument(documentId as string),
      enabled: !!documentId,
      staleTime: 60_000,
   });
}

/**
 * Run a live verify. Verification is a point-in-time check — we cache the
 * result in the TanStack store keyed by document so subsequent reads (e.g.
 * after closing a modal) don't re-trigger the request; pass invalidate=true
 * to force a fresh run.
 */
export function useVerifyDocument() {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (documentId: string) =>
         blockchainService.verifyDocument(documentId),
      onSuccess: (result, documentId) => {
         queryClient.setQueryData<VerificationResult>(
            blockchainVerifyKey(documentId),
            result
         );
         // Records list may have picked up a new "confirmed" row after verify.
         queryClient.invalidateQueries({
            queryKey: blockchainRecordsKey(documentId),
         });
      },
   });
}

/** Read the cached verification result for a document without re-running it. */
export function useCachedVerification(documentId: string | undefined) {
   const queryClient = useQueryClient();
   if (!documentId) return undefined;
   return queryClient.getQueryData<VerificationResult>(
      blockchainVerifyKey(documentId)
   );
}
