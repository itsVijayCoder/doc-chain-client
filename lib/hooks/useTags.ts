"use client";

import {
   useMutation,
   useQuery,
   useQueryClient,
} from "@tanstack/react-query";
import {
   tagService,
   type CreateTagArgs,
   type Tag,
   type UpdateTagArgs,
} from "@/lib/services/tagService";

const TAGS_KEY = ["tags"] as const;

/**
 * Full tag catalog. Cache aggressively — tags rarely change, and the chip
 * row on the documents page would otherwise refetch on every mount.
 */
export function useTags() {
   return useQuery<Tag[]>({
      queryKey: TAGS_KEY,
      queryFn: () => tagService.list(),
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
   });
}

export function useCreateTag() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: (args: CreateTagArgs) => tagService.create(args),
      onSuccess: (created) => {
         qc.setQueryData<Tag[]>(TAGS_KEY, (prev) =>
            prev ? [...prev, created] : [created]
         );
      },
   });
}

export function useUpdateTag() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: UpdateTagArgs }) =>
         tagService.update(id, updates),
      onSuccess: (updated) => {
         qc.setQueryData<Tag[]>(TAGS_KEY, (prev) =>
            prev?.map((t) => (t.id === updated.id ? updated : t))
         );
      },
   });
}

export function useDeleteTag() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: (id: string) => tagService.delete(id),
      onSuccess: (_, id) => {
         qc.setQueryData<Tag[]>(TAGS_KEY, (prev) =>
            prev?.filter((t) => t.id !== id)
         );
         // Document lists may change when a tag disappears.
         qc.invalidateQueries({ queryKey: ["documents"] });
      },
   });
}

export function useAttachTagsToDocument() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: ({
         documentId,
         tagIds,
      }: {
         documentId: string;
         tagIds: string[];
      }) => tagService.attachToDocument(documentId, tagIds),
      onSuccess: (_, { documentId }) => {
         qc.invalidateQueries({ queryKey: ["document", documentId] });
         qc.invalidateQueries({ queryKey: ["documents"] });
      },
   });
}

export function useDetachTagFromDocument() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: ({
         documentId,
         tagId,
      }: {
         documentId: string;
         tagId: string;
      }) => tagService.detachFromDocument(documentId, tagId),
      onSuccess: (_, { documentId }) => {
         qc.invalidateQueries({ queryKey: ["document", documentId] });
         qc.invalidateQueries({ queryKey: ["documents"] });
      },
   });
}
