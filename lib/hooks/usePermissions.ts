"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   permissionService,
   type DocumentPermission,
   type GrantPermissionArgs,
   type PermissionLevel,
} from "@/lib/services/permissionService";
import type { ApiError } from "@/lib/types";

export const PERMISSIONS_QUERY_KEY = "permissions" as const;

export function documentPermissionsKey(documentId: string) {
   return [PERMISSIONS_QUERY_KEY, "document", documentId] as const;
}

export function useDocumentPermissions(documentId: string | undefined) {
   return useQuery<DocumentPermission[], ApiError>({
      queryKey: documentPermissionsKey(documentId ?? ""),
      queryFn: () => permissionService.listByDocument(documentId as string),
      enabled: !!documentId,
      staleTime: 30_000,
   });
}

export function useGrantPermission(documentId: string) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: GrantPermissionArgs) =>
         permissionService.grant(documentId, args),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: documentPermissionsKey(documentId),
         });
      },
   });
}

export function useUpdatePermissionLevel(documentId: string) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (args: {
         permissionId: string;
         permission: PermissionLevel;
      }) =>
         permissionService.updateLevel(
            documentId,
            args.permissionId,
            args.permission
         ),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: documentPermissionsKey(documentId),
         });
      },
   });
}

export function useRevokePermission(documentId: string) {
   const queryClient = useQueryClient();
   return useMutation({
      mutationFn: (permissionId: string) =>
         permissionService.revoke(documentId, permissionId),
      onSuccess: () => {
         queryClient.invalidateQueries({
            queryKey: documentPermissionsKey(documentId),
         });
      },
   });
}
