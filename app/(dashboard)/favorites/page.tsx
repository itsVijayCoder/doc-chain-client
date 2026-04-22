"use client";

import { FC, ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
   useFavoritedDocuments,
   useRemoveFavorite,
} from "@/lib/hooks/useDocuments";
import { useToast } from "@/lib/hooks/useToast";
import type { ApiError } from "@/lib/types";
import type {
   DocumentSortBy,
   DocumentSortDir,
} from "@/lib/services/documentService";
import {
   ArrowDownUp,
   ChevronLeft,
   ChevronRight,
   FileX,
   Heart,
   HeartOff,
   Star,
} from "lucide-react";
import {
   DcButton,
   PageHead,
} from "@/components/design/primitives";
import { UtilityDocCard } from "@/components/documents/UtilityDocCard";

const SORT_CYCLE: { value: FavoriteSortKey; label: string }[] = [
   { value: "recent", label: "Recently modified" },
   { value: "oldest", label: "Oldest first" },
   { value: "name", label: "Name A–Z" },
];

type FavoriteSortKey = "recent" | "oldest" | "name";

function mapSort(sort: FavoriteSortKey): { sortBy: DocumentSortBy; sortDir: DocumentSortDir } {
   switch (sort) {
      case "oldest": return { sortBy: "updated_at", sortDir: "asc" };
      case "name":   return { sortBy: "title",      sortDir: "asc" };
      case "recent":
      default:       return { sortBy: "updated_at", sortDir: "desc" };
   }
}

export default function FavoritesPage() {
   const router = useRouter();
   const toast = useToast();
   const [sortKey, setSortKey] = useState<FavoriteSortKey>("recent");
   const [page, setPage] = useState(1);

   const params = useMemo(() => {
      const sort = mapSort(sortKey);
      return { page, pageSize: 24, sortBy: sort.sortBy, sortDir: sort.sortDir };
   }, [page, sortKey]);

   const { data, isLoading, isError, error, isFetching } = useFavoritedDocuments(params);
   const removeFavorite = useRemoveFavorite();

   const items = data?.documents ?? [];
   const meta = data?.meta;

   const handleRemove = async (id: string, title: string) => {
      try {
         await removeFavorite.mutateAsync(id);
         toast.success("Removed", `"${title}" removed from favorites`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error("Failed", apiErr?.message ?? "Could not remove favorite");
      }
   };

   const cycleSort = () => {
      const idx = SORT_CYCLE.findIndex((s) => s.value === sortKey);
      setSortKey(SORT_CYCLE[(idx + 1) % SORT_CYCLE.length].value);
      setPage(1);
   };
   const currentSortLabel =
      SORT_CYCLE.find((s) => s.value === sortKey)?.label ?? "Recently modified";

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Favorites'
            titleIcon={<Star size={22} strokeWidth={1.75} />}
            subtitle={
               <>
                  <span>
                     {meta?.total ?? 0} document
                     {(meta?.total ?? 0) === 1 ? "" : "s"} marked as favorite
                  </span>
               </>
            }
            actions={
               items.length > 0 ? (
                  <DcButton
                     icon={<ArrowDownUp size={14} strokeWidth={2} />}
                     onClick={cycleSort}
                     title='Cycle sort'
                  >
                     {currentSortLabel}
                  </DcButton>
               ) : undefined
            }
         />

         {isError && <ErrorBanner title='Failed to load favorites' message={error?.message} />}
         {isLoading && <LoadingState label='Loading favorites…' />}

         {!isLoading && !isError && items.length === 0 && (
            <EmptyState
               icon={<Heart size={32} strokeWidth={1.25} />}
               title='No favorites yet'
               message='Star any document to find it here quickly.'
               cta={{ label: "Browse Documents", href: "/documents" }}
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
                           icon={<HeartOff size={13} strokeWidth={1.75} />}
                           onClick={() => handleRemove(doc.id, doc.title)}
                           disabled={removeFavorite.isPending}
                        >
                           Remove
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
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Shared helpers (also used by archived/trash/shared pages)
// ─────────────────────────────────────────────────────────────────────

export const ErrorBanner: FC<{ title: string; message?: string }> = ({
   title,
   message,
}) => (
   <div
      className='rounded-md p-4 text-[13px] mb-4'
      style={{
         background: "var(--dc-danger-soft)",
         border: "1px solid var(--dc-danger-border)",
         color: "var(--dc-danger)",
      }}
   >
      <p className='font-medium'>{title}</p>
      {message && <p className='opacity-80 mt-1'>{message}</p>}
   </div>
);

export const LoadingState: FC<{ label: string }> = ({ label }) => (
   <div className='flex items-center justify-center py-20'>
      <div className='text-center'>
         <div
            className='inline-block w-8 h-8 rounded-full border-b-2 animate-spin'
            style={{ borderColor: "var(--dc-accent)" }}
         />
         <p
            className='text-[13px] mt-3'
            style={{ color: "var(--dc-text-dim)" }}
         >
            {label}
         </p>
      </div>
   </div>
);

export const EmptyState: FC<{
   icon: ReactNode;
   title: string;
   message: string;
   cta?: { label: string; href: string };
}> = ({ icon, title, message, cta }) => (
   <div
      className='py-20 text-center rounded-xl'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
      }}
   >
      <div
         className='mx-auto mb-4 w-14 h-14 rounded-full flex items-center justify-center'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text-muted)",
         }}
      >
         {icon}
      </div>
      <p
         className='text-[15px] font-semibold'
         style={{ color: "var(--dc-text)" }}
      >
         {title}
      </p>
      <p
         className='text-[13px] mt-1 max-w-sm mx-auto'
         style={{ color: "var(--dc-text-dim)" }}
      >
         {message}
      </p>
      {cta && (
         <Link
            href={cta.href}
            className='inline-flex items-center gap-1.5 h-8 px-3 mt-4 rounded-md text-[13px] font-medium transition-colors'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
               color: "var(--dc-text)",
            }}
         >
            {cta.label}
         </Link>
      )}
   </div>
);

export const Paginator: FC<{
   page: number;
   meta?: { page: number; total_pages: number };
   isFetching?: boolean;
   onPrev: () => void;
   onNext: () => void;
}> = ({ page, meta, isFetching, onPrev, onNext }) => {
   if (!meta || meta.total_pages <= 1) return null;
   return (
      <div className='flex items-center justify-between pt-4 mt-2'>
         <p className='text-[12px]' style={{ color: "var(--dc-text-dim)" }}>
            Page {meta.page} of {meta.total_pages}
         </p>
         <div className='flex gap-2'>
            <DcButton
               size='sm'
               icon={<ChevronLeft size={12} strokeWidth={2} />}
               onClick={onPrev}
               disabled={page <= 1 || isFetching}
            >
               Previous
            </DcButton>
            <DcButton
               size='sm'
               onClick={onNext}
               disabled={page >= meta.total_pages || isFetching}
            >
               Next
               <ChevronRight size={12} strokeWidth={2} />
            </DcButton>
         </div>
      </div>
   );
};
