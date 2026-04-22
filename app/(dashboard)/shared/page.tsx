"use client";

import { FC, ReactNode, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSharedWithMe } from "@/lib/hooks/useDocuments";
import type {
   SharedPermissionFilter,
   SharedWithMeParams,
} from "@/lib/services/documentService";
import {
   ArrowDownUp,
   ChevronDown,
   Edit,
   Eye,
   FileX,
   Lock,
   MessageSquare,
   Share2,
   Shield,
   Users,
} from "lucide-react";
import {
   DcButton,
   DotSep,
   PageHead,
   Stat,
   StatsStrip,
} from "@/components/design/primitives";
import { UtilityDocCard } from "@/components/documents/UtilityDocCard";
import { EmptyState, ErrorBanner, LoadingState, Paginator } from "../favorites/page";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SharedSortKey = "shared_at" | "title" | "permission" | "updated_at";

const SORT_OPTIONS: { value: SharedSortKey; label: string }[] = [
   { value: "shared_at", label: "Recently shared" },
   { value: "updated_at", label: "Recently modified" },
   { value: "title", label: "Name A–Z" },
   { value: "permission", label: "Permission level" },
];

const PERMISSION_FILTERS: { value: "all" | SharedPermissionFilter; label: string }[] = [
   { value: "all", label: "All permissions" },
   { value: "view", label: "View only" },
   { value: "comment", label: "Comment" },
   { value: "edit", label: "Edit" },
   { value: "admin", label: "Admin" },
];

// Per-permission visual style — matches action-pill pattern used elsewhere
const PERMISSION_STYLE: Record<
   string,
   { color: string; bg: string; border: string; Icon: typeof Eye; label: string }
> = {
   view: {
      color: "var(--dc-text-muted)",
      bg: "var(--dc-surface-2)",
      border: "var(--dc-border)",
      Icon: Eye,
      label: "View",
   },
   comment: {
      color: "var(--dc-info)",
      bg: "var(--dc-info-soft)",
      border: "var(--dc-info-border)",
      Icon: MessageSquare,
      label: "Comment",
   },
   edit: {
      color: "#a855f7",
      bg: "#a855f71a",
      border: "#a855f744",
      Icon: Edit,
      label: "Edit",
   },
   admin: {
      color: "var(--dc-danger)",
      bg: "var(--dc-danger-soft)",
      border: "var(--dc-danger-border)",
      Icon: Shield,
      label: "Admin",
   },
};

const PermissionBadge: FC<{ permission?: string }> = ({ permission = "view" }) => {
   const s = PERMISSION_STYLE[permission] ?? PERMISSION_STYLE.view;
   return (
      <span
         className='inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium'
         style={{
            color: s.color,
            background: s.bg,
            border: `1px solid ${s.border}`,
            backdropFilter: "blur(8px)",
         }}
      >
         <s.Icon size={10} strokeWidth={2} />
         {s.label}
      </span>
   );
};

export default function SharedPage() {
   const router = useRouter();
   const [sortKey, setSortKey] = useState<SharedSortKey>("shared_at");
   const [permissionFilter, setPermissionFilter] = useState<"all" | SharedPermissionFilter>("all");
   const [page, setPage] = useState(1);

   const params = useMemo(
      (): SharedWithMeParams => ({
         page,
         pageSize: 24,
         sortBy: sortKey,
         sortDir: "desc",
         ...(permissionFilter !== "all" ? { permission: permissionFilter } : {}),
      }),
      [page, sortKey, permissionFilter]
   );

   const { data, isLoading, isError, error, isFetching } = useSharedWithMe(params);

   const items = data?.documents ?? [];
   const meta = data?.meta;

   const viewCount = items.filter((d) => d.myPermission === "view").length;
   const editAdminCount = items.filter(
      (d) => d.myPermission === "edit" || d.myPermission === "admin"
   ).length;
   const uniqueSharers = new Set(items.map((d) => d.ownerId)).size;

   const sortLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label ?? "Recently shared";
   const permissionLabel =
      PERMISSION_FILTERS.find((o) => o.value === permissionFilter)?.label ?? "All permissions";

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Shared with Me'
            titleIcon={<Share2 size={22} strokeWidth={1.75} />}
            subtitle={
               <span>
                  {meta?.total ?? 0} document
                  {(meta?.total ?? 0) === 1 ? "" : "s"} shared with you
               </span>
            }
         />

         {/* ── Stats strip (only when there are results) ───────── */}
         {items.length > 0 && (
            <StatsStrip>
               <Stat
                  label='Total shared'
                  labelIcon={
                     <Share2
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: "var(--dc-info)" }}
                     />
                  }
                  value={(meta?.total ?? items.length).toString()}
                  trend='All permissions'
               />
               <Stat
                  label='View only'
                  labelIcon={
                     <Eye
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: "var(--dc-text-muted)" }}
                     />
                  }
                  value={viewCount.toString()}
                  trend='Read-only access'
               />
               <Stat
                  label='Edit / Admin'
                  labelIcon={
                     <Edit
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: "#a855f7" }}
                     />
                  }
                  value={editAdminCount.toString()}
                  trend='You can modify'
               />
               <Stat
                  label='Unique sharers'
                  labelIcon={
                     <Users
                        size={12}
                        strokeWidth={1.75}
                        style={{ color: "var(--dc-warn)" }}
                     />
                  }
                  value={uniqueSharers.toString()}
                  trend='People who shared'
               />
            </StatsStrip>
         )}

         {/* ── Toolbar ──────────────────────────────────────────── */}
         {items.length > 0 && (
            <div className='flex items-center gap-2 mb-4 flex-wrap'>
               <Dropdown
                  label={permissionLabel}
                  icon={<Shield size={12} strokeWidth={1.75} style={{ color: "var(--dc-text-dim)" }} />}
                  items={PERMISSION_FILTERS.map((o) => ({
                     label: o.label,
                     active: permissionFilter === o.value,
                     onClick: () => {
                        setPermissionFilter(o.value);
                        setPage(1);
                     },
                  }))}
               />
               <Dropdown
                  label={sortLabel}
                  icon={<ArrowDownUp size={12} strokeWidth={1.75} style={{ color: "var(--dc-text-dim)" }} />}
                  items={SORT_OPTIONS.map((o) => ({
                     label: o.label,
                     active: sortKey === o.value,
                     onClick: () => {
                        setSortKey(o.value);
                        setPage(1);
                     },
                  }))}
               />
            </div>
         )}

         {isError && (
            <ErrorBanner title='Failed to load shared documents' message={error?.message} />
         )}
         {isLoading && <LoadingState label='Loading shared documents…' />}

         {!isLoading && !isError && items.length === 0 && (
            <EmptyState
               icon={<FileX size={32} strokeWidth={1.25} />}
               title='No documents shared with you'
               message='When someone shares a document with you, it will appear here.'
               cta={{ label: "Browse your Documents", href: "/documents" }}
            />
         )}

         {items.length > 0 && (
            <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
               {items.map((doc) => (
                  <UtilityDocCard
                     key={doc.id}
                     doc={doc}
                     rightBadge={<PermissionBadge permission={doc.myPermission} />}
                     extraMeta={
                        <span className='flex flex-col gap-0.5'>
                           {doc.isConfidential && (
                              <span
                                 className='inline-flex items-center gap-1 text-[11px]'
                                 style={{ color: "var(--dc-warn)" }}
                              >
                                 <Lock size={10} strokeWidth={2.25} />
                                 Confidential — downloads are tracked
                              </span>
                           )}
                           {doc.owner && (
                              <span className='flex items-center gap-1.5'>
                                 <Users size={11} strokeWidth={1.75} />
                                 <span>
                                    Shared by{" "}
                                    <span style={{ color: "var(--dc-text)" }}>
                                       {doc.owner.name ?? doc.owner.email}
                                    </span>
                                 </span>
                                 {doc.sharedAt && (
                                    <>
                                       <DotSep />
                                       <span>
                                          {new Date(
                                             doc.sharedAt
                                          ).toLocaleDateString()}
                                       </span>
                                    </>
                                 )}
                              </span>
                           )}
                        </span>
                     }
                     onOpen={() => router.push(`/documents/${doc.id}`)}
                     actions={
                        <DcButton
                           variant='ghost'
                           size='sm'
                           icon={<Eye size={13} strokeWidth={1.75} />}
                           onClick={() => router.push(`/documents/${doc.id}`)}
                        >
                           Open
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
// Themed dropdown button (shared pattern for toolbar pickers)
// ─────────────────────────────────────────────────────────────────────
const Dropdown: FC<{
   label: string;
   icon: ReactNode;
   items: { label: string; active: boolean; onClick: () => void }[];
}> = ({ label, icon, items }) => (
   <DropdownMenu>
      <DropdownMenuTrigger
         className='inline-flex items-center gap-2 h-8 px-2.5 rounded-md text-[13px] transition-colors'
         style={{
            background: "var(--dc-surface)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text)",
         }}
      >
         {icon}
         {label}
         <ChevronDown size={12} strokeWidth={1.75} style={{ color: "var(--dc-text-dim)" }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start'>
         {items.map((item, i) => (
            <div key={i}>
               {i === 1 && items.length > 2 && <DropdownMenuSeparator />}
               <DropdownMenuItem onClick={item.onClick}>
                  <span className='flex-1'>{item.label}</span>
                  {item.active && (
                     <span
                        className='ml-2 w-1.5 h-1.5 rounded-full'
                        style={{ background: "var(--dc-accent)" }}
                     />
                  )}
               </DropdownMenuItem>
            </div>
         ))}
      </DropdownMenuContent>
   </DropdownMenu>
);
