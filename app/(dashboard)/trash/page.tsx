"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
   usePermanentDeleteDocument,
   useRestoreDocument,
   useTrashDocuments,
} from "@/lib/hooks/useDocuments";
import { useToast } from "@/lib/hooks/useToast";
import type { ApiError } from "@/lib/types";
import type {
   DocumentSortBy,
   DocumentSortDir,
} from "@/lib/services/documentService";
import {
   AlertTriangle,
   ArrowDownUp,
   FileX,
   RotateCcw,
   Trash2,
} from "lucide-react";
import { DcButton, PageHead } from "@/components/design/primitives";
import { UtilityDocCard } from "@/components/documents/UtilityDocCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState, Paginator } from "../favorites/page";

// A pending action captures the row the user clicked so the confirm dialog
// can reference its title and the confirm handler can run the mutation.
type PendingAction = { id: string; title: string } | null;

type TrashSortKey = "recent" | "oldest" | "name";

const SORT_CYCLE: { value: TrashSortKey; label: string }[] = [
   { value: "recent", label: "Recently trashed" },
   { value: "oldest", label: "Oldest first" },
   { value: "name", label: "Name A–Z" },
];

function mapSort(sort: TrashSortKey): { sortBy: DocumentSortBy; sortDir: DocumentSortDir } {
   switch (sort) {
      case "oldest": return { sortBy: "updated_at", sortDir: "asc" };
      case "name":   return { sortBy: "title",      sortDir: "asc" };
      case "recent":
      default:       return { sortBy: "updated_at", sortDir: "desc" };
   }
}

export default function TrashPage() {
   const router = useRouter();
   const toast = useToast();
   const [sortKey, setSortKey] = useState<TrashSortKey>("recent");
   const [page, setPage] = useState(1);
   const [pendingRestore, setPendingRestore] = useState<PendingAction>(null);
   const [pendingPurge, setPendingPurge] = useState<PendingAction>(null);

   const params = useMemo(() => {
      const sort = mapSort(sortKey);
      return { page, pageSize: 24, sortBy: sort.sortBy, sortDir: sort.sortDir };
   }, [page, sortKey]);

   const { data, isLoading, isError, error, isFetching } = useTrashDocuments(params);
   const restoreMutation = useRestoreDocument();
   const purgeMutation = usePermanentDeleteDocument();

   const items = data?.documents ?? [];
   const meta = data?.meta;

   const handleRestore = async (id: string, title: string) => {
      try {
         await restoreMutation.mutateAsync(id);
         toast.success("Restored", `"${title}" is back in Documents`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Restore failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handlePurge = async (id: string, title: string) => {
      try {
         await purgeMutation.mutateAsync(id);
         toast.success("Permanently deleted", `"${title}" is gone forever`);
      } catch (err) {
         const apiErr = err as ApiError;
         if (apiErr?.statusCode === 403) {
            toast.error(
               "Admin permission required",
               "Only users with admin access on this document can permanently delete it"
            );
            return;
         }
         toast.error(
            "Delete failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const cycleSort = () => {
      const idx = SORT_CYCLE.findIndex((s) => s.value === sortKey);
      setSortKey(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length].value);
      setPage(1);
   };
   const currentSortLabel =
      SORT_CYCLE.find((s) => s.value === sortKey)?.label ?? "Recently trashed";

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Trash'
            titleIcon={<Trash2 size={22} strokeWidth={1.75} />}
            subtitle={
               <span>
                  {meta?.total ?? 0} trashed document
                  {(meta?.total ?? 0) === 1 ? "" : "s"} · restore any item to
                  put it back in your library
               </span>
            }
            actions={
               items.length > 0 ? (
                  <DcButton
                     icon={<ArrowDownUp size={14} strokeWidth={2} />}
                     onClick={cycleSort}
                  >
                     {currentSortLabel}
                  </DcButton>
               ) : undefined
            }
         />

         {/* Warning callout about permanent delete */}
         {items.length > 0 && (
            <div
               className='mb-4 p-3.5 rounded-xl flex items-start gap-3'
               style={{
                  background: "var(--dc-warn-soft)",
                  border: "1px solid var(--dc-warn-border)",
               }}
            >
               <AlertTriangle
                  size={16}
                  strokeWidth={1.75}
                  style={{ color: "var(--dc-warn)", flexShrink: 0, marginTop: 2 }}
               />
               <div>
                  <p
                     className='text-[13px] font-semibold'
                     style={{ color: "var(--dc-text)" }}
                  >
                     Permanent deletion is irreversible
                  </p>
                  <p
                     className='text-[12px] mt-1'
                     style={{ color: "var(--dc-text-muted)" }}
                  >
                     Using <strong>Delete forever</strong> removes the file and
                     all its versions from storage. Requires admin permission
                     on the document.
                  </p>
               </div>
            </div>
         )}

         {isError && <ErrorBanner title='Failed to load trash' message={error?.message} />}
         {isLoading && <LoadingState label='Loading trash…' />}

         {!isLoading && !isError && items.length === 0 && (
            <EmptyState
               icon={<Trash2 size={32} strokeWidth={1.25} />}
               title='Trash is empty'
               message='Deleted documents will appear here — you can restore them for 30 days.'
            />
         )}

         {items.length > 0 && (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
               {items.map((doc) => {
                  const busy = restoreMutation.isPending || purgeMutation.isPending;
                  return (
                     <UtilityDocCard
                        key={doc.id}
                        doc={doc}
                        onOpen={() => router.push(`/documents/${doc.id}`)}
                        actions={
                           <>
                              <DcButton
                                 variant='ghost'
                                 size='sm'
                                 icon={<RotateCcw size={13} strokeWidth={1.75} />}
                                 onClick={() =>
                                    setPendingRestore({
                                       id: doc.id,
                                       title: doc.title,
                                    })
                                 }
                                 disabled={busy}
                              >
                                 Restore
                              </DcButton>
                              <DcButton
                                 variant='danger'
                                 size='sm'
                                 icon={<Trash2 size={13} strokeWidth={1.75} />}
                                 onClick={() =>
                                    setPendingPurge({
                                       id: doc.id,
                                       title: doc.title,
                                    })
                                 }
                                 disabled={busy}
                                 title='Delete permanently (admin only)'
                              >
                                 Delete forever
                              </DcButton>
                           </>
                        }
                     />
                  );
               })}
            </div>
         )}

         <Paginator
            page={page}
            meta={meta}
            isFetching={isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(meta?.total_pages ?? 1, p + 1))}
         />

         <ConfirmDialog
            open={pendingRestore !== null}
            onOpenChange={(o) => !o && setPendingRestore(null)}
            title='Restore document?'
            description={
               pendingRestore
                  ? `"${pendingRestore.title}" will move back into Documents.`
                  : ""
            }
            confirmText='Restore'
            onConfirm={() => {
               const item = pendingRestore;
               setPendingRestore(null);
               if (item) handleRestore(item.id, item.title);
            }}
         />

         <ConfirmDialog
            open={pendingPurge !== null}
            onOpenChange={(o) => !o && setPendingPurge(null)}
            title='Permanently delete?'
            description={
               pendingPurge
                  ? `"${pendingPurge.title}" and all its versions will be erased from blockchain-anchored storage. This cannot be undone.`
                  : ""
            }
            confirmText='Delete forever'
            variant='destructive'
            onConfirm={() => {
               const item = pendingPurge;
               setPendingPurge(null);
               if (item) handlePurge(item.id, item.title);
            }}
         />
      </div>
   );
}
