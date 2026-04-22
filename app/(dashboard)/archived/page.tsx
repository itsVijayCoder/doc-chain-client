"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
   useArchivedDocuments,
   useUnarchiveDocument,
} from "@/lib/hooks/useDocuments";
import { useToast } from "@/lib/hooks/useToast";
import type { ApiError } from "@/lib/types";
import type {
   DocumentSortBy,
   DocumentSortDir,
} from "@/lib/services/documentService";
import {
   Archive,
   ArchiveRestore,
   ArrowDownUp,
   FileX,
} from "lucide-react";
import { DcButton, PageHead } from "@/components/design/primitives";
import { UtilityDocCard } from "@/components/documents/UtilityDocCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState, ErrorBanner, LoadingState, Paginator } from "../favorites/page";

type ArchiveSortKey = "recent" | "oldest" | "name";

const SORT_CYCLE: { value: ArchiveSortKey; label: string }[] = [
   { value: "recent", label: "Recently archived" },
   { value: "oldest", label: "Oldest first" },
   { value: "name", label: "Name A–Z" },
];

function mapSort(sort: ArchiveSortKey): { sortBy: DocumentSortBy; sortDir: DocumentSortDir } {
   switch (sort) {
      case "oldest": return { sortBy: "updated_at", sortDir: "asc" };
      case "name":   return { sortBy: "title",      sortDir: "asc" };
      case "recent":
      default:       return { sortBy: "updated_at", sortDir: "desc" };
   }
}

export default function ArchivedPage() {
   const router = useRouter();
   const toast = useToast();
   const [sortKey, setSortKey] = useState<ArchiveSortKey>("recent");
   const [page, setPage] = useState(1);
   const [pendingUnarchive, setPendingUnarchive] = useState<
      { id: string; title: string } | null
   >(null);

   const params = useMemo(() => {
      const sort = mapSort(sortKey);
      return { page, pageSize: 24, sortBy: sort.sortBy, sortDir: sort.sortDir };
   }, [page, sortKey]);

   const { data, isLoading, isError, error, isFetching } = useArchivedDocuments(params);
   const unarchiveMutation = useUnarchiveDocument();

   const items = data?.documents ?? [];
   const meta = data?.meta;

   const handleUnarchive = async (id: string, title: string) => {
      try {
         await unarchiveMutation.mutateAsync(id);
         toast.success("Unarchived", `"${title}" is back in Documents`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Unarchive failed",
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
      SORT_CYCLE.find((s) => s.value === sortKey)?.label ?? "Recently archived";

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Archive'
            titleIcon={<Archive size={22} strokeWidth={1.75} />}
            subtitle={
               <span>
                  {meta?.total ?? 0} archived document
                  {(meta?.total ?? 0) === 1 ? "" : "s"} · unarchive any item to
                  put it back in your main library
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

         {isError && <ErrorBanner title='Failed to load archive' message={error?.message} />}
         {isLoading && <LoadingState label='Loading archive…' />}

         {!isLoading && !isError && items.length === 0 && (
            <EmptyState
               icon={<FileX size={32} strokeWidth={1.25} />}
               title='Archive is empty'
               message='Documents you archive will appear here, out of the way of your main library.'
            />
         )}

         {items.length > 0 && (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
               {items.map((doc) => (
                  <UtilityDocCard
                     key={doc.id}
                     doc={doc}
                     onOpen={() => router.push(`/documents/${doc.id}`)}
                     actions={
                        <DcButton
                           variant='ghost'
                           size='sm'
                           icon={<ArchiveRestore size={13} strokeWidth={1.75} />}
                           onClick={() =>
                              setPendingUnarchive({
                                 id: doc.id,
                                 title: doc.title,
                              })
                           }
                           disabled={unarchiveMutation.isPending}
                        >
                           Unarchive
                        </DcButton>
                     }
                  />
               ))}
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
            open={pendingUnarchive !== null}
            onOpenChange={(o) => !o && setPendingUnarchive(null)}
            title='Unarchive document?'
            description={
               pendingUnarchive
                  ? `"${pendingUnarchive.title}" will move back into your main library.`
                  : ""
            }
            confirmText='Unarchive'
            onConfirm={() => {
               const item = pendingUnarchive;
               setPendingUnarchive(null);
               if (item) handleUnarchive(item.id, item.title);
            }}
         />
      </div>
   );
}
