"use client";

import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDocumentStore } from "@/lib/stores/documentStore";
import { useTags } from "@/lib/hooks/useTags";
import {
   DocumentFilterPopover,
   type DocumentFilterPatch,
   type DocumentFilterValues,
} from "@/components/documents/DocumentFilterPopover";
import {
   ActiveFiltersStrip,
   type ActiveFiltersValues,
} from "@/components/documents/ActiveFiltersStrip";
import {
   useAddFavorite,
   useArchiveDocument,
   useDocuments,
   useRemoveFavorite,
   useUpdateDocument,
   useSoftDeleteDocument,
   useUnarchiveDocument,
   useUploadDocument,
} from "@/lib/hooks/useDocuments";
import { userStatsService } from "@/lib/services/userStatsService";
import type { ApiError } from "@/lib/types";
import type { Document } from "@/lib/types/document";
import { useToast } from "@/lib/hooks/useToast";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { DocumentUploader } from "@/components/documents/DocumentUploader";
import { ShareModal } from "@/components/documents/sharing/ShareModal";
import { ShareDocument } from "@/components/documents/sharing/ShareDocument";
import { AuthenticatedImage } from "@/components/shared/AuthenticatedImage";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import type {
   DocumentSortBy,
   DocumentSortDir,
} from "@/lib/services/documentService";
import type { SortOption } from "@/lib/types/document";
import { PermissionLevel } from "@/components/documents/sharing/PermissionSelector";
import { ShareLinkSettings } from "@/components/documents/sharing/ShareLinkGenerator";
import {
   Chip,
   ConfidentialIndicator,
   DcButton,
   DotSep,
   PageHead,
   Stat,
   StatsStrip,
   VerifiedBadge,
} from "@/components/design/primitives";
import {
   ArrowDownUp,
   Check,
   ChevronLeft,
   ChevronRight,
   Download,
   Eye,
   FileText,
   Folder,
   FolderInput,
   FolderPlus,
   Grid3x3,
   List,
   Lock,
   MoreHorizontal,
   Pencil,
   Search as SearchIcon,
   Share2,
   Shield,
   Tag as TagIcon,
   Trash2,
   Upload,
   X,
} from "lucide-react";
import { FolderCard } from "@/components/documents/FolderCard";
import { useTrackedDownload } from "@/components/documents/TrackedDownloadDialog";
import { FolderBreadcrumb } from "@/components/documents/FolderBreadcrumb";
import {
   CreateFolderDialog,
   DeleteFolderDialog,
   RenameFolderDialog,
} from "@/components/documents/FolderDialogs";
import { MoveToFolderDialog } from "@/components/documents/MoveToFolderDialog";
import {
   useFolderBreadcrumb,
   useFolderDetail,
   useRootFolders,
} from "@/lib/hooks/useFolders";
import type { Folder as FolderModel } from "@/lib/services/folderService";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// Sort cycle — click the button to cycle through options
// ─────────────────────────────────────────────────────────────────────
const SORT_CYCLE: { value: SortOption; label: string }[] = [
   { value: "recent", label: "Recently updated" },
   { value: "oldest", label: "Oldest first" },
   { value: "name-asc", label: "Name A–Z" },
   { value: "name-desc", label: "Name Z–A" },
];

// Tri-state URL boolean — "true"/"false" become booleans, anything else
// (including "") becomes undefined so the filter is omitted from the query.
function parseBoolParam(v: string | null | undefined): boolean | undefined {
   if (v === "true") return true;
   if (v === "false") return false;
   return undefined;
}

function mapSort(sort: SortOption): {
   sortBy: DocumentSortBy;
   sortDir: DocumentSortDir;
} {
   switch (sort) {
      case "oldest":
         return { sortBy: "created_at", sortDir: "asc" };
      case "name-asc":
         return { sortBy: "title", sortDir: "asc" };
      case "name-desc":
         return { sortBy: "title", sortDir: "desc" };
      case "recent":
      default:
         return { sortBy: "updated_at", sortDir: "desc" };
   }
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
   const router = useRouter();
   const searchParams = useSearchParams();
   const toast = useToast();

   // ── URL-synced filter state ──────────────────────────────────────
   // URL is the single source of truth for anything the backend needs to
   // see. That means bookmarks/screenshots/DMs carry the full filter state
   // and reload to the same view. Non-filter concerns (view mode, current
   // selection, sort) stay in the zustand store where they're ephemeral.
   const currentFolderId = searchParams?.get("folder") ?? null;
   const searchParam = searchParams?.get("search") ?? "";
   const tagsParam = useMemo(() => {
      const raw = searchParams?.get("tags") ?? "";
      return raw ? raw.split(",").filter(Boolean) : [];
   }, [searchParams]);
   const mimeParam = searchParams?.get("mime_type") ?? "";
   const isConfidentialParam = parseBoolParam(
      searchParams?.get("is_confidential")
   );
   const isExpiredParam = parseBoolParam(searchParams?.get("is_expired"));
   const updatedAfterParam = searchParams?.get("updated_after") ?? "";
   const updatedBeforeParam = searchParams?.get("updated_before") ?? "";
   const page = Math.max(1, Number(searchParams?.get("page") ?? "1") || 1);

   // Dialogs
   const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
   const [createFolderOpen, setCreateFolderOpen] = useState(false);
   const [renameFolder, setRenameFolder] = useState<FolderModel | null>(null);
   const [deleteFolder, setDeleteFolder] = useState<FolderModel | null>(null);
   const [moveDialogOpen, setMoveDialogOpen] = useState(false);
   const [shareModalOpen, setShareModalOpen] = useState(false);
   const [documentToShare, setDocumentToShare] = useState<string | null>(null);

   // Local mirror for search input — pushing to URL on every keystroke
   // would thrash history and re-run the query. Commit on blur/Enter.
   const [searchInput, setSearchInput] = useState(searchParam);
   useEffect(() => setSearchInput(searchParam), [searchParam]);

   // Sort / view / selection still live in the store — nothing the
   // backend sees, no reason to pollute the URL with them.
   const {
      sortBy,
      viewMode,
      selectedDocuments,
      shares,
      setSortBy,
      setViewMode,
      toggleSelectDocument,
      clearSelection,
      fetchShares,
      shareDocument,
      removeShare,
      generateShareLink,
   } = useDocumentStore();

   // Tag catalog — feeds the chip row instead of the old "derive tags
   // from the currently-loaded page" trick, which missed any tag not on
   // screen and required a doc-list round trip to populate.
   const tagsQuery = useTags();
   const allTags = tagsQuery.data ?? [];

   // ── URL writer ───────────────────────────────────────────────────
   // Every filter mutation goes through here. Resets page=1 unless the
   // caller is explicitly changing the page itself. Empty strings/null
   // remove the key so the URL stays clean.
   const pushParams = useCallback(
      (updates: Record<string, string | null>) => {
         const next = new URLSearchParams(searchParams?.toString() ?? "");
         if (!("page" in updates)) next.set("page", "1");
         for (const [k, v] of Object.entries(updates)) {
            if (v === null || v === "") next.delete(k);
            else next.set(k, v);
         }
         // Drop page=1 for cleaner URLs.
         if (next.get("page") === "1") next.delete("page");
         const qs = next.toString();
         router.push(qs ? `/documents?${qs}` : "/documents");
      },
      [router, searchParams]
   );

   const setPage = (p: number) => pushParams({ page: String(p) });
   const commitSearch = () => {
      if (searchInput === searchParam) return;
      pushParams({ search: searchInput.trim() || null });
   };
   const toggleTag = (slug: string) => {
      const next = new Set(tagsParam);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      const arr = Array.from(next);
      pushParams({ tags: arr.length > 0 ? arr.join(",") : null });
   };
   const applyFilterPatch = (patch: DocumentFilterPatch) => {
      const out: Record<string, string | null> = {};
      if ("mimeType" in patch)
         out.mime_type = patch.mimeType ? String(patch.mimeType) : null;
      if ("isConfidential" in patch) {
         const v = patch.isConfidential;
         out.is_confidential = v === null || v === undefined ? null : String(v);
      }
      if ("isExpired" in patch) {
         const v = patch.isExpired;
         out.is_expired = v === null || v === undefined ? null : String(v);
      }
      if ("updatedAfter" in patch)
         out.updated_after = patch.updatedAfter
            ? String(patch.updatedAfter)
            : null;
      if ("updatedBefore" in patch)
         out.updated_before = patch.updatedBefore
            ? String(patch.updatedBefore)
            : null;
      pushParams(out);
   };
   const clearAllFilters = () => {
      // Preserve folder context and view mode; wipe everything else.
      const next = new URLSearchParams();
      if (currentFolderId) next.set("folder", currentFolderId);
      const qs = next.toString();
      router.push(qs ? `/documents?${qs}` : "/documents");
   };
   const removeFilter = (
      key: keyof ActiveFiltersValues,
      value?: string
   ) => {
      if (key === "search") {
         pushParams({ search: null });
         setSearchInput("");
      } else if (key === "tags" && value) {
         const next = tagsParam.filter((t) => t !== value);
         pushParams({ tags: next.length > 0 ? next.join(",") : null });
      } else if (key === "mimeType") pushParams({ mime_type: null });
      else if (key === "isConfidential") pushParams({ is_confidential: null });
      else if (key === "isExpired") pushParams({ is_expired: null });
      else if (key === "updatedAfter") pushParams({ updated_after: null });
      else if (key === "updatedBefore") pushParams({ updated_before: null });
   };

   const filterValues: DocumentFilterValues = {
      mimeType: mimeParam || undefined,
      isConfidential: isConfidentialParam,
      isExpired: isExpiredParam,
      updatedAfter: updatedAfterParam || undefined,
      updatedBefore: updatedBeforeParam || undefined,
   };
   const activeValues: ActiveFiltersValues = {
      ...filterValues,
      search: searchParam || undefined,
      tags: tagsParam.length > 0 ? tagsParam : undefined,
   };

   // Stats (same endpoint as dashboard)
   const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ["users", "me", "stats"],
      queryFn: () => userStatsService.getMyStats(),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
   });

   // Documents — scoped to the current folder when set, else all user's docs.
   // Every filter flows through once — no client-side post-filter anywhere.
   const documentsParams = useMemo(() => {
      const sort = mapSort(sortBy);
      return {
         page,
         pageSize: 20,
         sortBy: sort.sortBy,
         sortDir: sort.sortDir,
         search: searchParam || undefined,
         tags: tagsParam.length > 0 ? tagsParam : undefined,
         mimeType: mimeParam || undefined,
         isConfidential: isConfidentialParam,
         isExpired: isExpiredParam,
         updatedAfter: updatedAfterParam || undefined,
         updatedBefore: updatedBeforeParam || undefined,
         folderId: currentFolderId ?? undefined,
      };
   }, [
      page,
      sortBy,
      searchParam,
      tagsParam,
      mimeParam,
      isConfidentialParam,
      isExpiredParam,
      updatedAfterParam,
      updatedBeforeParam,
      currentFolderId,
   ]);

   const documentsQuery = useDocuments(documentsParams);
   const documents = documentsQuery.data?.documents ?? [];
   const meta = documentsQuery.data?.meta;
   const isLoading = documentsQuery.isLoading;

   // ── Folders ──────────────────────────────────────────────────────
   // Root view uses GET /folders (root-only); drill-down uses
   // GET /folders/:id and picks out .children for the folder cards.
   const rootFoldersQuery = useRootFolders();
   const folderDetailQuery = useFolderDetail(currentFolderId ?? undefined);
   const breadcrumbQuery = useFolderBreadcrumb(currentFolderId ?? undefined);

   const foldersToShow: FolderModel[] = currentFolderId
      ? folderDetailQuery.data?.children ?? []
      : rootFoldersQuery.data ?? [];

   const currentFolderName = currentFolderId
      ? folderDetailQuery.data?.name
      : undefined;

   const navigateToFolder = (folderId: string | null) => {
      // Fresh context = drop filters. Users opening a folder don't want
      // their last search + mime filter bleeding in.
      const params = new URLSearchParams();
      if (folderId) params.set("folder", folderId);
      clearSelection();
      const qs = params.toString();
      router.push(qs ? `/documents?${qs}` : "/documents");
   };

   // Mutations
   const uploadMutation = useUploadDocument();
   const deleteMutation = useSoftDeleteDocument();
   const archiveMutation = useArchiveDocument();
   const unarchiveMutation = useUnarchiveDocument();
   const addFavoriteMutation = useAddFavorite();
   const removeFavoriteMutation = useRemoveFavorite();
   const updateDocumentMutation = useUpdateDocument();
   const queryClient = useQueryClient();

   // Active tag set — derived from the URL, matched against the catalog
   // by slug (so the chip's display name tracks renames without needing
   // a refetch of the list response).
   const activeTagSlugs = new Set(tagsParam);
   const tagBySlug = useMemo(() => {
      const m = new Map<string, string>();
      for (const t of allTags) m.set(t.slug, t.name);
      return m;
   }, [allTags]);

   // Tracked-download guard — single source for any download UI on this
   // page that might touch a confidential document.
   const { dialog: trackedDialog, confirm: confirmTrackedDownload } =
      useTrackedDownload();

   // How many of the currently-selected docs are confidential. Used to
   // label the bulk bar ("3 selected (1 confidential)") and to decide
   // whether bulk download must open the awareness dialog first.
   const confidentialSelectedCount = useMemo(() => {
      if (selectedDocuments.length === 0) return 0;
      const set = new Set(selectedDocuments);
      return documents.filter((d) => set.has(d.id) && d.isConfidential).length;
   }, [documents, selectedDocuments]);

   // ── Handlers ─────────────────────────────────────────────────────
   const handleView = (id: string) => router.push(`/documents/${id}`);

   const handleDownload = () =>
      toast.info("Download", "Not wired yet — coming in a later phase");

   const handleBulkDownload = async () => {
      if (selectedDocuments.length === 0) return;
      if (confidentialSelectedCount > 0) {
         const ok = await confirmTrackedDownload({
            kind: "bulk",
            total: selectedDocuments.length,
            confidential: confidentialSelectedCount,
         });
         if (!ok) return;
      }
      handleDownload();
   };

   const handleShare = (id: string) => {
      setDocumentToShare(id);
      fetchShares(id);
      setShareModalOpen(true);
   };

   const handleDelete = async (id: string) => {
      if (!window.confirm("Move this document to trash?")) return;
      try {
         await deleteMutation.mutateAsync(id);
         toast.success("Moved to trash");
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            "Delete failed",
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleFavoriteToggle = async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      try {
         if (doc.isFavorite) {
            await removeFavoriteMutation.mutateAsync(id);
            toast.success("Removed from favorites", `"${doc.title}"`);
         } else {
            await addFavoriteMutation.mutateAsync(id);
            toast.success("Added to favorites", `"${doc.title}"`);
         }
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error("Failed", apiErr?.message ?? "Try again");
      }
   };

   const handleArchiveToggle = async (id: string) => {
      const doc = documents.find((d) => d.id === id);
      if (!doc) return;
      const mutation = doc.isArchived ? unarchiveMutation : archiveMutation;
      const verb = doc.isArchived ? "Unarchived" : "Archived";
      try {
         await mutation.mutateAsync(id);
         toast.success(verb, `"${doc.title}"`);
      } catch (err) {
         const apiErr = err as ApiError;
         toast.error(
            `${doc.isArchived ? "Unarchive" : "Archive"} failed`,
            apiErr?.details?.[0] ?? apiErr?.message ?? "Try again"
         );
      }
   };

   const handleBulkDelete = async () => {
      const count = selectedDocuments.length;
      if (count === 0) return;
      if (
         !window.confirm(
            `Move ${count} document${count === 1 ? "" : "s"} to trash?`
         )
      )
         return;

      const results = await Promise.allSettled(
         selectedDocuments.map((id) => deleteMutation.mutateAsync(id))
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - ok;
      clearSelection();
      if (failed === 0) toast.success(`${ok} moved to trash`);
      else if (ok === 0) toast.error(`Failed to delete ${failed}`);
      else toast.error(`${ok} deleted, ${failed} failed`);
   };

   const handleBulkMove = async (destinationId: string | null) => {
      const count = selectedDocuments.length;
      if (count === 0) return;
      // Patch each doc's folder_id in parallel. `null` destination means
      // root — backend accepts `folder_id: null` to clear the association.
      const results = await Promise.allSettled(
         selectedDocuments.map((id) =>
            updateDocumentMutation.mutateAsync({
               id,
               updates: { folderId: destinationId },
            })
         )
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - ok;
      clearSelection();
      // Invalidate folder-detail queries so the destination's count refreshes
      // immediately (updateDocument already handles documents cache).
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      if (failed === 0) {
         toast.success(
            `${ok} moved`,
            destinationId ? "Documents moved to the selected folder" : "Documents moved to Home"
         );
      } else if (ok === 0) {
         toast.error(`Move failed for all ${failed} documents`);
      } else {
         toast.error(`${ok} moved, ${failed} failed`);
      }
   };

   const cycleSort = () => {
      const idx = SORT_CYCLE.findIndex((s) => s.value === sortBy);
      const next = SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
      setSortBy(next.value);
      setPage(1);
   };

   const currentSortLabel =
      SORT_CYCLE.find((s) => s.value === sortBy)?.label ?? "Recently updated";

   // Stats calc
   const totalDocs = stats?.total_documents ?? 0;
   const blockchainConfirmed = stats?.blockchain_confirmed ?? 0;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)] pb-24'>
         <PageHead
            title='Documents'
            subtitle={
               <>
                  <span>Manage and organize your documents</span>
                  {meta && meta.total > 0 && (
                     <>
                        <DotSep />
                        <span>
                           {documents.length} of {meta.total} visible
                        </span>
                     </>
                  )}
                  {blockchainConfirmed > 0 && (
                     <>
                        <DotSep />
                        <span style={{ color: "var(--dc-info)" }}>
                           <Shield
                              size={11}
                              strokeWidth={2}
                              className='inline mr-1 align-[-2px]'
                           />
                           {blockchainConfirmed} verified on-chain
                        </span>
                     </>
                  )}
               </>
            }
            actions={
               <>
                  <DcButton
                     icon={<FolderPlus size={14} strokeWidth={2} />}
                     onClick={() => setCreateFolderOpen(true)}
                  >
                     New folder
                  </DcButton>
                  <DcButton
                     variant='primary'
                     icon={<Upload size={14} strokeWidth={2} />}
                     onClick={() => setUploadDialogOpen(true)}
                  >
                     Upload
                  </DcButton>
               </>
            }
         />

         {/* ── Folder breadcrumb ────────────────────────────────── */}
         <FolderBreadcrumb
            items={breadcrumbQuery.data ?? []}
            onNavigate={navigateToFolder}
            isLoading={!!currentFolderId && breadcrumbQuery.isLoading}
         />

         {/* ── Stats strip ──────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='Total documents'
               labelIcon={<Folder size={12} strokeWidth={1.75} />}
               value={statsLoading ? "—" : totalDocs.toString()}
               trend={
                  meta?.total !== undefined
                     ? `${meta.total} in library`
                     : undefined
               }
            />
            <Stat
               label='Verified on-chain'
               labelIcon={<Shield size={12} strokeWidth={1.75} />}
               value={
                  statsLoading
                     ? "—"
                     : `${blockchainConfirmed}/${totalDocs}`
               }
               valueColor='var(--dc-info)'
               trend={
                  totalDocs > 0
                     ? `${Math.round((blockchainConfirmed / totalDocs) * 100)}% coverage`
                     : "—"
               }
            />
            <Stat
               label='Confidential'
               labelIcon={<Lock size={12} strokeWidth={1.75} />}
               value={
                  statsLoading
                     ? "—"
                     : (stats?.confidential_documents ?? 0).toString()
               }
               trend='Marked sensitive'
            />
            <Stat
               label='Shared with me'
               labelIcon={<Share2 size={12} strokeWidth={1.75} />}
               value={
                  statsLoading ? "—" : (stats?.shared_with_me ?? 0).toString()
               }
               trend={stats?.shared_with_me ? "Incoming" : "None"}
            />
         </StatsStrip>

         {/* ── Toolbar ──────────────────────────────────────────── */}
         <div className='flex items-center gap-2 mb-3 flex-wrap'>
            <SearchInline
               value={searchInput}
               onChange={setSearchInput}
               onCommit={commitSearch}
               scope='Documents'
            />
            <DocumentFilterPopover
               values={filterValues}
               onChange={applyFilterPatch}
               onClear={clearAllFilters}
            />
            <DcButton
               icon={<ArrowDownUp size={14} strokeWidth={2} />}
               onClick={cycleSort}
               title='Cycle sort'
            >
               {currentSortLabel}
            </DcButton>
            <ViewSwitch value={viewMode} onChange={setViewMode} />
         </div>

         {/* ── Tag chip row — fed from the real /tags catalog so every
              tag in the workspace is reachable, not just ones that happen
              to be on the current page. Multi-select = AND semantics on
              the backend. ──────────────────────────────────────── */}
         {(allTags.length > 0 || activeTagSlugs.size > 0) && (
            <div className='flex items-center gap-1.5 mb-3 flex-wrap min-h-[28px]'>
               <span
                  className='text-[11px] uppercase tracking-[0.06em] mr-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Tags
               </span>
               {allTags.slice(0, 14).map((t) => (
                  <Chip
                     key={t.slug}
                     active={activeTagSlugs.has(t.slug)}
                     onClick={() => toggleTag(t.slug)}
                  >
                     {t.name}
                  </Chip>
               ))}
               {/* Active tags that aren't in the catalog's first 14 — show
                   so users can remove them without hunting. */}
               {tagsParam
                  .filter(
                     (slug) =>
                        !allTags.slice(0, 14).some((t) => t.slug === slug)
                  )
                  .map((slug) => (
                     <Chip
                        key={slug}
                        active
                        onClick={() => toggleTag(slug)}
                     >
                        {tagBySlug.get(slug) ?? slug}
                     </Chip>
                  ))}
            </div>
         )}

         {/* ── Active filters summary (removable chips) ──────────── */}
         <ActiveFiltersStrip
            values={activeValues}
            tagLabel={(slug) => tagBySlug.get(slug) ?? slug}
            onRemove={removeFilter}
            onClear={clearAllFilters}
         />

         {/* ── Error banner ─────────────────────────────────────── */}
         {documentsQuery.isError && (
            <div
               className='rounded-md p-4 text-sm mb-4'
               style={{
                  background: "var(--dc-danger-soft)",
                  border: "1px solid var(--dc-danger-border)",
                  color: "var(--dc-danger)",
               }}
            >
               <p className='font-medium'>Failed to load documents</p>
               <p className='opacity-80'>
                  {documentsQuery.error?.message ?? "Unknown error"}
               </p>
            </div>
         )}

         {/* ── Folders grid — always rendered above docs ────────── */}
         {foldersToShow.length > 0 && (
            <div className='mb-5'>
               <div
                  className='flex items-center gap-1.5 mb-2.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  <Folder size={12} strokeWidth={1.75} />
                  Folders
                  <span
                     className='font-normal tabular-nums'
                     style={{ color: "var(--dc-text-faint)" }}
                  >
                     {foldersToShow.length}
                  </span>
               </div>
               <div className='grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3'>
                  {foldersToShow.map((folder) => (
                     <FolderCard
                        key={folder.id}
                        folder={folder}
                        onOpen={() => navigateToFolder(folder.id)}
                        actions={
                           <FolderRowActions
                              folder={folder}
                              onRename={() => setRenameFolder(folder)}
                              onDelete={() => setDeleteFolder(folder)}
                           />
                        }
                     />
                  ))}
               </div>
            </div>
         )}

         {/* ── Grid / List view — documents ─────────────────────── */}
         {/* Section header only when we also have folders above, so users
             know this section is specifically documents (not "everything"). */}
         {foldersToShow.length > 0 && (documents.length > 0 || isLoading) && (
            <div
               className='flex items-center gap-1.5 mb-2.5 px-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]'
               style={{ color: "var(--dc-text-dim)" }}
            >
               <FileText size={12} strokeWidth={1.75} />
               Documents
               {meta && (
                  <span
                     className='font-normal tabular-nums'
                     style={{ color: "var(--dc-text-faint)" }}
                  >
                     {meta.total}
                  </span>
               )}
            </div>
         )}
         {viewMode === "grid" ? (
            <DocumentGrid
               documents={documents}
               isLoading={isLoading}
               selected={new Set(selectedDocuments)}
               onToggleSelect={toggleSelectDocument}
               onOpen={handleView}
               onShare={handleShare}
               onDownload={handleDownload}
               onDelete={handleDelete}
               onArchiveToggle={handleArchiveToggle}
               onFavoriteToggle={handleFavoriteToggle}
            />
         ) : (
            <DocumentTable
               documents={documents}
               isLoading={isLoading}
               selected={new Set(selectedDocuments)}
               onToggleSelect={toggleSelectDocument}
               onOpen={handleView}
            />
         )}

         {/* ── Pagination ───────────────────────────────────────── */}
         {meta && meta.total_pages > 1 && (
            <div className='flex items-center justify-between pt-4 mt-2'>
               <p
                  className='text-[12px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Page {meta.page} of {meta.total_pages}
               </p>
               <div className='flex gap-2'>
                  <DcButton
                     size='sm'
                     icon={<ChevronLeft size={12} strokeWidth={2} />}
                     onClick={() => setPage(Math.max(1, page - 1))}
                     disabled={page <= 1 || documentsQuery.isFetching}
                  >
                     Previous
                  </DcButton>
                  <DcButton
                     size='sm'
                     onClick={() => setPage(Math.min(meta.total_pages, page + 1))}
                     disabled={
                        page >= meta.total_pages || documentsQuery.isFetching
                     }
                  >
                     Next
                     <ChevronRight size={12} strokeWidth={2} />
                  </DcButton>
               </div>
            </div>
         )}

         {/* ── Floating bulk bar ────────────────────────────────── */}
         <BulkBar
            count={selectedDocuments.length}
            confidentialCount={confidentialSelectedCount}
            onClear={clearSelection}
            onDelete={handleBulkDelete}
            onShare={() => toast.info("Bulk share", "Coming soon")}
            onDownload={handleBulkDownload}
            onMove={() => setMoveDialogOpen(true)}
         />

         {/* Tracked-download confirmation (for bulk download path) */}
         {trackedDialog}

         {/* ── Upload dialog (reuses existing shadcn Dialog + DocumentUploader) */}
         <Dialog
            open={uploadDialogOpen}
            onOpenChange={(open) => {
               if (!open && uploadMutation.isPending) return;
               setUploadDialogOpen(open);
            }}
         >
            <DialogContent className='max-w-2xl'>
               <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                     Add a new file to your library. Tags typed here are
                     ignored for now — tag picker comes in the next phase.
                  </DialogDescription>
               </DialogHeader>
               <DocumentUploader
                  onUpload={async (file, metadata) => {
                     try {
                        await uploadMutation.mutateAsync({
                           file,
                           metadata: {
                              title: metadata.title,
                              description: metadata.description,
                              isConfidential: metadata.isConfidential,
                              // Drop the upload into the currently-viewed
                              // folder. Null/undefined = root.
                              folderId: currentFolderId ?? undefined,
                           },
                        });
                        toast.success(
                           "Upload successful",
                           currentFolderName
                              ? `"${metadata.title}" added to ${currentFolderName}`
                              : `"${metadata.title}" added`
                        );
                        setUploadDialogOpen(false);
                     } catch (err) {
                        const apiErr = err as ApiError;
                        toast.error(
                           "Upload failed",
                           apiErr?.details?.[0] ??
                              apiErr?.message ??
                              "Something went wrong"
                        );
                        throw err;
                     }
                  }}
                  isUploading={uploadMutation.isPending}
                  progress={uploadMutation.progress}
               />
            </DialogContent>
         </Dialog>

         {/* ── Share modal (unchanged) ─────────────────────────── */}
         {documentToShare && (
            <ShareModal
               open={shareModalOpen}
               onOpenChange={setShareModalOpen}
               document={documents.find((d) => d.id === documentToShare)!}
            >
               <ShareDocument
                  document={documents.find((d) => d.id === documentToShare)!}
                  shares={shares}
                  onShare={async (
                     userId: string,
                     permission: PermissionLevel
                  ) => {
                     try {
                        await shareDocument(
                           documentToShare,
                           userId,
                           permission
                        );
                        toast.success("Document shared successfully");
                        fetchShares(documentToShare);
                     } catch (error) {
                        toast.error(
                           "Failed to share document",
                           (error as Error).message
                        );
                     }
                  }}
                  onRemoveShare={async (shareId: string) => {
                     try {
                        await removeShare(shareId);
                        toast.success("Share removed successfully");
                        fetchShares(documentToShare);
                     } catch (error) {
                        toast.error(
                           "Failed to remove share",
                           (error as Error).message
                        );
                     }
                  }}
                  onGenerateLink={async (settings: ShareLinkSettings) => {
                     try {
                        const permission =
                           settings.permission === "admin"
                              ? "edit"
                              : settings.permission;
                        const link = await generateShareLink(documentToShare, {
                           permission,
                           expiresAt: settings.expiresAt,
                           password: settings.requirePassword
                              ? settings.password
                              : undefined,
                           allowDownload: settings.allowDownload,
                           blockchainAudit: settings.blockchainAudit ?? false,
                        });
                        toast.success("Share link generated");
                        return { id: link.id, url: link.url };
                     } catch (error) {
                        toast.error(
                           "Failed to generate link",
                           (error as Error).message
                        );
                        throw error;
                     }
                  }}
                  onRevokeLink={async (linkId: string) => {
                     toast.success(`Share link ${linkId} revoked`);
                  }}
               />
            </ShareModal>
         )}

         {/* ── Folder dialogs ──────────────────────────────────── */}
         <CreateFolderDialog
            open={createFolderOpen}
            onOpenChange={setCreateFolderOpen}
            parentId={currentFolderId ?? undefined}
            parentName={currentFolderName}
         />
         <RenameFolderDialog
            folder={renameFolder}
            onClose={() => setRenameFolder(null)}
         />
         <DeleteFolderDialog
            folder={deleteFolder}
            onClose={() => setDeleteFolder(null)}
         />

         {/* ── Move-to-folder picker (bulk) ────────────────────── */}
         <MoveToFolderDialog
            open={moveDialogOpen}
            onOpenChange={setMoveDialogOpen}
            itemsLabel={`${selectedDocuments.length} document${
               selectedDocuments.length === 1 ? "" : "s"
            }`}
            currentLocationId={currentFolderId}
            currentLocationName={currentFolderName}
            onMove={handleBulkMove}
         />
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Folder row ⋮ menu — rename / delete inside a FolderCard
// ─────────────────────────────────────────────────────────────────────
const FolderRowActions: FC<{
   folder: FolderModel;
   onRename: () => void;
   onDelete: () => void;
}> = ({ folder, onRename, onDelete }) => (
   <DropdownMenu>
      <DropdownMenuTrigger
         aria-label={`Actions for ${folder.name}`}
         className='w-[26px] h-[26px] rounded-md inline-flex items-center justify-center transition-colors'
         style={{
            background: "var(--dc-surface)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text-muted)",
         }}
         onClick={(e) => e.stopPropagation()}
      >
         <MoreHorizontal size={13} strokeWidth={1.75} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
         <DropdownMenuItem onClick={onRename}>
            <Pencil className='mr-2 h-4 w-4' />
            Rename
         </DropdownMenuItem>
         <DropdownMenuSeparator />
         <DropdownMenuItem variant='destructive' onClick={onDelete}>
            <Trash2 className='mr-2 h-4 w-4' />
            Delete folder
         </DropdownMenuItem>
      </DropdownMenuContent>
   </DropdownMenu>
);

// ═══════════════════════════════════════════════════════════════════
// Inline helpers — scoped to this page for now
// ═══════════════════════════════════════════════════════════════════

// ─── Inline search box with scope pill ────────────────────────────
// Controlled-ish: `value` is the caller's local mirror so typing feels
// instant; `onCommit` fires on blur or Enter so the URL-backed filter
// state doesn't thrash on every keystroke.
const SearchInline: FC<{
   value: string;
   onChange: (v: string) => void;
   onCommit: () => void;
   scope?: string;
}> = ({ value, onChange, onCommit, scope }) => (
   <div
      className='flex items-center gap-2 px-2.5 h-8 rounded-md flex-1 min-w-[240px] transition-all'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
      }}
      onFocus={(e) => {
         e.currentTarget.style.borderColor = "var(--dc-accent-border)";
         e.currentTarget.style.boxShadow = "0 0 0 3px var(--dc-accent-soft)";
      }}
      onBlur={(e) => {
         e.currentTarget.style.borderColor = "var(--dc-border)";
         e.currentTarget.style.boxShadow = "none";
      }}
   >
      <SearchIcon
         size={14}
         strokeWidth={1.75}
         style={{ color: "var(--dc-text-dim)" }}
      />
      <input
         value={value}
         onChange={(e) => onChange(e.target.value)}
         onBlur={onCommit}
         onKeyDown={(e) => {
            if (e.key === "Enter") {
               e.preventDefault();
               onCommit();
            }
         }}
         placeholder='Search documents by name, tag, or hash…'
         className='flex-1 bg-transparent border-none outline-none text-[13px] min-w-0'
         style={{ color: "var(--dc-text)" }}
      />
      {scope && (
         <span
            className='text-[11px] px-1.5 py-0.5 rounded whitespace-nowrap'
            style={{
               background: "var(--dc-surface-2)",
               color: "var(--dc-text-muted)",
               border: "1px solid var(--dc-border)",
            }}
         >
            in: {scope}
         </span>
      )}
   </div>
);

// ─── Grid/List view switch ────────────────────────────────────────
const ViewSwitch: FC<{
   value: "grid" | "list";
   onChange: (v: "grid" | "list") => void;
}> = ({ value, onChange }) => (
   <div
      className='inline-flex rounded-md p-0.5 gap-0.5'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {(["grid", "list"] as const).map((opt) => (
         <button
            key={opt}
            type='button'
            onClick={() => onChange(opt)}
            aria-label={opt === "grid" ? "Grid view" : "List view"}
            className='w-7 h-6 rounded flex items-center justify-center transition-colors'
            style={{
               background:
                  value === opt ? "var(--dc-surface-3)" : "transparent",
               color: value === opt ? "var(--dc-text)" : "var(--dc-text-dim)",
            }}
         >
            {opt === "grid" ? (
               <Grid3x3 size={14} strokeWidth={1.75} />
            ) : (
               <List size={14} strokeWidth={1.75} />
            )}
         </button>
      ))}
   </div>
);

// ─── Grid view ────────────────────────────────────────────────────
interface GridProps {
   documents: Document[];
   isLoading: boolean;
   selected: Set<string>;
   onToggleSelect: (id: string) => void;
   onOpen: (id: string) => void;
   onShare: (id: string) => void;
   onDownload: () => void;
   onDelete: (id: string) => void;
   onArchiveToggle: (id: string) => void;
   onFavoriteToggle: (id: string) => void;
}

const DocumentGrid: FC<GridProps> = ({
   documents,
   isLoading,
   selected,
   onToggleSelect,
   onOpen,
   onShare,
   onDownload,
   onDelete,
}) => {
   if (isLoading) {
      return (
         <div className='grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3'>
            {Array.from({ length: 8 }).map((_, i) => (
               <div
                  key={i}
                  className='h-[260px] rounded-xl animate-pulse'
                  style={{ background: "var(--dc-surface-2)" }}
               />
            ))}
         </div>
      );
   }

   if (documents.length === 0) {
      return (
         <div
            className='py-20 text-center rounded-xl'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
            }}
         >
            <FileText
               className='mx-auto mb-3'
               size={32}
               style={{ color: "var(--dc-text-faint)" }}
            />
            <p
               className='text-[14px] font-medium'
               style={{ color: "var(--dc-text)" }}
            >
               No documents match your filters
            </p>
            <p
               className='text-[12px] mt-1'
               style={{ color: "var(--dc-text-dim)" }}
            >
               Try clearing filters or uploading a new document
            </p>
         </div>
      );
   }

   return (
      <div className='grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3'>
         {documents.map((doc) => (
            <DocCard
               key={doc.id}
               doc={doc}
               selected={selected.has(doc.id)}
               onToggle={() => onToggleSelect(doc.id)}
               onOpen={() => onOpen(doc.id)}
               onShare={() => onShare(doc.id)}
               onDownload={onDownload}
               onDelete={() => onDelete(doc.id)}
            />
         ))}
      </div>
   );
};

// ─── Grid card (single document) ──────────────────────────────────
interface DocCardProps {
   doc: Document;
   selected: boolean;
   onToggle: () => void;
   onOpen: () => void;
   onShare: () => void;
   onDownload: () => void;
   onDelete: () => void;
}

const DocCard: FC<DocCardProps> = ({
   doc,
   selected,
   onToggle,
   onOpen,
   onShare,
   onDownload,
   onDelete,
}) => {
   return (
      <div
         role='button'
         onClick={onOpen}
         className={cn(
            "group relative p-3.5 flex flex-col gap-2.5 rounded-xl cursor-pointer transition-all duration-[160ms] ease-[cubic-bezier(.4,0,.2,1)] overflow-hidden"
         )}
         style={{
            background: "var(--dc-surface)",
            border: selected
               ? "1px solid var(--dc-accent-border)"
               : "1px solid var(--dc-border)",
            boxShadow: selected
               ? "0 0 0 1px var(--dc-accent-border), var(--dc-shadow-md)"
               : "none",
         }}
         onMouseEnter={(e) => {
            if (!selected) {
               e.currentTarget.style.borderColor = "var(--dc-border-bright)";
               e.currentTarget.style.boxShadow = "var(--dc-shadow-md)";
               e.currentTarget.style.transform = "translateY(-1px)";
            }
         }}
         onMouseLeave={(e) => {
            if (!selected) {
               e.currentTarget.style.borderColor = "var(--dc-border)";
               e.currentTarget.style.boxShadow = "none";
               e.currentTarget.style.transform = "translateY(0)";
            }
         }}
      >
         {/* Selection checkbox — appears on hover or when selected */}
         <div
            role='checkbox'
            aria-checked={selected}
            onClick={(e) => {
               e.stopPropagation();
               onToggle();
            }}
            className={cn(
               "absolute top-2.5 left-2.5 w-[18px] h-[18px] rounded flex items-center justify-center cursor-pointer transition-opacity z-[2]",
               selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            style={{
               background: selected ? "var(--dc-accent)" : "var(--dc-surface)",
               border: selected
                  ? "1.5px solid var(--dc-accent)"
                  : "1.5px solid var(--dc-border-bright)",
            }}
         >
            {selected && <Check size={12} color='#061f15' strokeWidth={2.5} />}
         </div>

         {/* Hover action buttons */}
         <div
            onClick={(e) => e.stopPropagation()}
            className='absolute top-2.5 right-2.5 flex gap-1 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all z-[2]'
         >
            <DocCardAction onClick={onOpen} ariaLabel='Preview'>
               <Eye size={13} strokeWidth={1.75} />
            </DocCardAction>
            <DocCardAction onClick={onShare} ariaLabel='Share'>
               <Share2 size={13} strokeWidth={1.75} />
            </DocCardAction>
            <DocCardAction onClick={onDownload} ariaLabel='Download'>
               <Download size={13} strokeWidth={1.75} />
            </DocCardAction>
            <DocCardAction onClick={onDelete} ariaLabel='Delete'>
               <Trash2 size={13} strokeWidth={1.75} />
            </DocCardAction>
         </div>

         {/* Preview area — auth-fetched thumbnail if backend provides one,
             mime-type-specific placeholder otherwise. AuthenticatedImage
             handles the bearer-token fetch and falls back to the
             placeholder on 404. */}
         <div
            className='h-[140px] rounded-lg relative overflow-hidden flex items-center justify-center'
            style={{
               background: "var(--dc-surface-2)",
               border: "1px solid var(--dc-border)",
            }}
         >
            {doc.thumbnailUrl ? (
               <AuthenticatedImage
                  src={doc.thumbnailUrl}
                  alt={doc.title}
                  className='w-full h-full object-cover'
                  fallback={<DocPreviewPlaceholder mimeType={doc.mimeType} />}
               />
            ) : (
               <DocPreviewPlaceholder mimeType={doc.mimeType} />
            )}
         </div>

         {/* Meta */}
         <div className='flex flex-col gap-1 min-w-0'>
            <div className='flex items-center gap-1.5 min-w-0'>
               {doc.isConfidential && (
                  <ConfidentialIndicator variant='icon' />
               )}
               <div
                  className='text-[13.5px] font-semibold truncate tracking-[-0.005em]'
                  style={{ color: "var(--dc-text)" }}
               >
                  {doc.title}
               </div>
            </div>
            <div
               className='text-[11.5px] flex items-center gap-1.5 tabular-nums'
               style={{ color: "var(--dc-text-dim)" }}
            >
               <span>{formatBytes(doc.fileSize ?? 0)}</span>
               <DotSep />
               <span>
                  {formatRelativeTime(
                     doc.updatedAt?.toISOString() ??
                        doc.createdAt?.toISOString() ??
                        ""
                  )}
               </span>
            </div>
         </div>

         {/* Footer — tags + verified badge */}
         <div className='flex items-center justify-between gap-2 mt-0.5'>
            <div className='flex gap-1 flex-wrap min-w-0'>
               {(doc.tags ?? []).slice(0, 2).map((t) => (
                  <TagPill key={t}>{t}</TagPill>
               ))}
            </div>
            <VerifiedBadge status='verified' />
         </div>
      </div>
   );
};

const DocCardAction: FC<{
   onClick: () => void;
   ariaLabel: string;
   children: ReactNode;
}> = ({ onClick, ariaLabel, children }) => (
   <button
      type='button'
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      className='w-[26px] h-[26px] rounded-md flex items-center justify-center transition-colors'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
         color: "var(--dc-text-muted)",
         backdropFilter: "blur(8px)",
      }}
      onMouseEnter={(e) => {
         e.currentTarget.style.background = "var(--dc-surface-3)";
         e.currentTarget.style.color = "var(--dc-text)";
         e.currentTarget.style.borderColor = "var(--dc-border-strong)";
      }}
      onMouseLeave={(e) => {
         e.currentTarget.style.background = "var(--dc-surface)";
         e.currentTarget.style.color = "var(--dc-text-muted)";
         e.currentTarget.style.borderColor = "var(--dc-border)";
      }}
   >
      {children}
   </button>
);

const TagPill: FC<{ children: ReactNode }> = ({ children }) => (
   <span
      className='text-[10.5px] px-1.5 py-[1px] rounded font-medium'
      style={{
         background: "var(--dc-surface-2)",
         color: "var(--dc-text-muted)",
         border: "1px solid var(--dc-border)",
      }}
   >
      {children}
   </span>
);

// ─── Mime-aware preview placeholder ──────────────────────────────
// Picks the best visual from mimeType. Falls back to generic lines
// for unknown types. All variants share the same 140px frame.
type PreviewVariant =
   | "spreadsheet"
   | "slides"
   | "image"
   | "markdown"
   | "code"
   | "archive"
   | "video"
   | "audio"
   | "pdf"
   | "word"
   | "lines"
   | "generic";

function classifyMimeType(mimeType?: string): PreviewVariant {
   if (!mimeType) return "lines";
   const m = mimeType.toLowerCase();

   if (m.startsWith("image/")) return "image";
   if (m.startsWith("video/")) return "video";
   if (m.startsWith("audio/")) return "audio";

   if (m === "application/pdf") return "pdf";

   if (
      m === "application/msword" ||
      m.includes("wordprocessingml")
   )
      return "word";

   if (
      m === "text/csv" ||
      m === "application/vnd.ms-excel" ||
      m.includes("spreadsheetml") ||
      m === "application/vnd.oasis.opendocument.spreadsheet"
   )
      return "spreadsheet";

   if (
      m === "application/vnd.ms-powerpoint" ||
      m.includes("presentationml") ||
      m === "application/vnd.oasis.opendocument.presentation" ||
      m.includes("keynote")
   )
      return "slides";

   if (m === "text/markdown" || m === "text/x-markdown") return "markdown";

   if (
      m === "application/json" ||
      m === "application/xml" ||
      m === "text/xml" ||
      m === "application/x-yaml" ||
      m === "text/yaml" ||
      m === "text/html" ||
      m === "application/javascript" ||
      m === "text/javascript" ||
      m === "application/typescript" ||
      m === "text/typescript"
   )
      return "code";

   if (
      m === "application/zip" ||
      m === "application/x-zip-compressed" ||
      m === "application/x-tar" ||
      m === "application/gzip" ||
      m === "application/x-gzip" ||
      m === "application/x-rar-compressed" ||
      m === "application/vnd.rar" ||
      m === "application/x-7z-compressed"
   )
      return "archive";

   if (m.startsWith("text/")) return "lines";

   return "generic";
}

const DocPreviewPlaceholder: FC<{ mimeType?: string }> = ({ mimeType }) => {
   const variant = classifyMimeType(mimeType);
   switch (variant) {
      case "spreadsheet": return <DocPlaceholderTable />;
      case "slides":      return <DocPlaceholderSlides />;
      case "image":       return <DocPlaceholderImage />;
      case "markdown":    return <DocPlaceholderMarkdown />;
      case "code":        return <DocPlaceholderCode />;
      case "archive":     return <DocPlaceholderArchive />;
      case "video":       return <DocPlaceholderVideo />;
      case "audio":       return <DocPlaceholderAudio />;
      case "pdf":         return <DocPlaceholderLines badge='PDF' badgeColor='var(--dc-danger)' />;
      case "word":        return <DocPlaceholderLines badge='W' badgeColor='#2563eb' />;
      case "generic":     return <DocPlaceholderGeneric />;
      case "lines":
      default:            return <DocPlaceholderLines />;
   }
};

// ─── Table (spreadsheets) — 4×3 grid, first row brighter ──────────
const DocPlaceholderTable: FC = () => {
   const rows = [true, false, false, false]; // true = header row
   return (
      <div className='w-full h-full p-3.5 grid grid-rows-4 gap-[3px]'>
         {rows.map((isHead, ri) => (
            <div key={ri} className='grid grid-cols-3 gap-[3px]'>
               {[0, 1, 2].map((ci) => (
                  <div
                     key={ci}
                     className='rounded-[1px]'
                     style={{
                        background: isHead
                           ? "var(--dc-border-bright)"
                           : "var(--dc-surface-3)",
                     }}
                  />
               ))}
            </div>
         ))}
      </div>
   );
};

// ─── Slides — title bar + 2 content boxes ─────────────────────────
const DocPlaceholderSlides: FC = () => (
   <div className='w-full h-full p-3.5 flex flex-col gap-2'>
      <div
         className='h-3 rounded-sm w-1/2'
         style={{ background: "var(--dc-border-bright)" }}
      />
      <div
         className='flex-1 rounded-sm'
         style={{ background: "var(--dc-surface-3)" }}
      />
      <div
         className='flex-1 rounded-sm'
         style={{ background: "var(--dc-surface-3)" }}
      />
   </div>
);

// ─── Image fallback — sun + mountain silhouette ───────────────────
const DocPlaceholderImage: FC = () => (
   <svg
      viewBox='0 0 80 60'
      preserveAspectRatio='xMidYMid meet'
      className='w-[70%] h-[70%]'
      aria-hidden
   >
      {/* sun */}
      <circle
         cx='56'
         cy='18'
         r='5'
         fill='var(--dc-border-bright)'
      />
      {/* near mountain */}
      <path
         d='M 0 50 L 22 26 L 42 42 L 56 30 L 80 50 Z'
         fill='var(--dc-surface-3)'
      />
      {/* far mountain */}
      <path
         d='M 12 50 L 34 18 L 52 36 L 80 18 L 80 50 Z'
         fill='var(--dc-border-strong)'
         opacity='0.6'
      />
   </svg>
);

// ─── Markdown — heading bar + prose lines ─────────────────────────
const DocPlaceholderMarkdown: FC = () => (
   <div className='w-full h-full p-3.5 flex flex-col gap-1'>
      <div className='flex items-center gap-1.5 mb-0.5'>
         <span
            className='text-[10px] font-mono font-bold leading-none'
            style={{ color: "var(--dc-accent)" }}
         >
            #
         </span>
         <div
            className='h-[5px] rounded-sm flex-1'
            style={{ background: "var(--dc-border-bright)" }}
         />
      </div>
      <Line w='100%' />
      <Line w='60%' />
      <div className='h-1' />
      <div className='flex items-center gap-1.5'>
         <span
            className='text-[9px] font-mono font-bold leading-none'
            style={{ color: "var(--dc-accent)" }}
         >
            ##
         </span>
         <div
            className='h-[4px] rounded-sm w-2/5'
            style={{ background: "var(--dc-border-bright)" }}
         />
      </div>
      <Line w='100%' />
      <Line w='70%' />
   </div>
);

// ─── Code — indented mono lines with bracket dots ─────────────────
const DocPlaceholderCode: FC = () => {
   // [indent-level, width-%]
   const lines: [number, string][] = [
      [0, "20%"],
      [1, "55%"],
      [1, "70%"],
      [2, "50%"],
      [2, "65%"],
      [1, "40%"],
      [0, "15%"],
   ];
   return (
      <div
         className='w-full h-full p-3 flex flex-col gap-[3px]'
         style={{ fontFamily: "var(--dc-font-mono)" }}
      >
         {lines.map(([indent, w], i) => (
            <div key={i} className='flex items-center gap-1'>
               <div style={{ width: indent * 8 }} />
               <div
                  className='w-1 h-1 rounded-full shrink-0'
                  style={{ background: "var(--dc-border-bright)" }}
               />
               <div
                  className='h-[3px] rounded-sm'
                  style={{
                     width: w,
                     background: "var(--dc-border-strong)",
                  }}
               />
            </div>
         ))}
      </div>
   );
};

// ─── Archive — two offset folders ─────────────────────────────────
const DocPlaceholderArchive: FC = () => (
   <div className='w-full h-full flex items-center justify-center relative'>
      <FolderShape style={{ transform: "translate(-8px, -6px)" }} dim />
      <FolderShape
         style={{ transform: "translate(8px, 6px)", position: "absolute" }}
      />
   </div>
);

const FolderShape: FC<{ style?: React.CSSProperties; dim?: boolean }> = ({
   style,
   dim,
}) => (
   <svg
      viewBox='0 0 48 38'
      className='w-[60px] h-[46px]'
      aria-hidden
      style={style}
   >
      {/* folder tab */}
      <path
         d='M 0 6 Q 0 0 6 0 L 18 0 Q 22 0 23 4 L 24 6 L 42 6 Q 48 6 48 12 L 48 32 Q 48 38 42 38 L 6 38 Q 0 38 0 32 Z'
         fill={dim ? "var(--dc-surface-3)" : "var(--dc-border-strong)"}
         stroke='var(--dc-border-bright)'
         strokeWidth='1'
      />
   </svg>
);

// ─── Video — dark frame with play triangle ────────────────────────
const DocPlaceholderVideo: FC = () => (
   <div
      className='w-full h-full flex items-center justify-center relative'
      style={{ background: "var(--dc-bg)" }}
   >
      {/* film-strip perforations — top and bottom */}
      <div className='absolute top-2 left-0 right-0 flex justify-around px-3'>
         {Array.from({ length: 8 }).map((_, i) => (
            <div
               key={i}
               className='w-1.5 h-1.5 rounded-[1px]'
               style={{ background: "var(--dc-surface-3)" }}
            />
         ))}
      </div>
      <div className='absolute bottom-2 left-0 right-0 flex justify-around px-3'>
         {Array.from({ length: 8 }).map((_, i) => (
            <div
               key={i}
               className='w-1.5 h-1.5 rounded-[1px]'
               style={{ background: "var(--dc-surface-3)" }}
            />
         ))}
      </div>
      {/* play triangle */}
      <div
         className='w-9 h-9 rounded-full flex items-center justify-center'
         style={{ background: "var(--dc-surface-2)" }}
      >
         <svg viewBox='0 0 24 24' className='w-4 h-4 translate-x-0.5'>
            <polygon points='6,4 20,12 6,20' fill='var(--dc-text-muted)' />
         </svg>
      </div>
   </div>
);

// ─── Audio — waveform bars ────────────────────────────────────────
const DocPlaceholderAudio: FC = () => {
   // Deterministic pseudo-random heights (seeded, so layout is stable across renders)
   const heights = [
      30, 55, 70, 85, 60, 40, 75, 90, 65, 45, 80, 55, 35, 70, 88, 60, 40, 75, 50, 65,
   ];
   return (
      <div className='w-full h-full px-4 flex items-center justify-center gap-[3px]'>
         {heights.map((h, i) => (
            <div
               key={i}
               className='w-[3px] rounded-sm'
               style={{
                  height: `${h}%`,
                  background:
                     i % 3 === 0 ? "var(--dc-border-bright)" : "var(--dc-border-strong)",
               }}
            />
         ))}
      </div>
   );
};

// ─── Generic unknown — centered file icon ─────────────────────────
const DocPlaceholderGeneric: FC = () => (
   <svg
      viewBox='0 0 24 24'
      className='w-12 h-12'
      fill='none'
      stroke='var(--dc-text-faint)'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden
   >
      <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
      <polyline points='14 2 14 8 20 8' />
   </svg>
);

// ─── Default lines — optional corner badge (PDF/Word) ─────────────
const DocPlaceholderLines: FC<{ badge?: string; badgeColor?: string }> = ({
   badge,
   badgeColor,
}) => (
   <div className='w-full h-full p-3.5 flex flex-col gap-1 relative'>
      <Line w='40%' bright />
      <div className='h-0.5' />
      <Line w='100%' />
      <Line w='100%' />
      <Line w='60%' />
      <div className='h-1' />
      <Line w='100%' />
      <Line w='60%' />
      <div className='h-1' />
      <Line w='100%' />
      <Line w='100%' />
      <Line w='33%' />
      {badge && badgeColor && (
         <span
            aria-hidden
            className='absolute top-2 right-2 text-[8px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded'
            style={{
               color: "white",
               background: badgeColor,
               letterSpacing: "0.04em",
               lineHeight: 1,
            }}
         >
            {badge}
         </span>
      )}
   </div>
);

// A 3px horizontal bar with optional brighter tone (used as a pretend "heading")
const Line: FC<{ w: string; bright?: boolean }> = ({ w, bright }) => (
   <div
      className='h-[3px] rounded-sm'
      style={{
         width: w,
         background: bright
            ? "var(--dc-border-bright)"
            : "var(--dc-border-strong)",
      }}
   />
);

// ─── List (table) view ────────────────────────────────────────────
interface TableProps {
   documents: Document[];
   isLoading: boolean;
   selected: Set<string>;
   onToggleSelect: (id: string) => void;
   onOpen: (id: string) => void;
}

const DocumentTable: FC<TableProps> = ({
   documents,
   isLoading,
   selected,
   onToggleSelect,
   onOpen,
}) => {
   if (isLoading) {
      return (
         <div
            className='rounded-xl overflow-hidden'
            style={{
               background: "var(--dc-surface)",
               border: "1px solid var(--dc-border)",
            }}
         >
            {Array.from({ length: 6 }).map((_, i) => (
               <div
                  key={i}
                  className='h-12 animate-pulse'
                  style={{
                     background: "var(--dc-surface-2)",
                     borderBottom: "1px solid var(--dc-border)",
                  }}
               />
            ))}
         </div>
      );
   }

   return (
      <div
         className='rounded-xl overflow-hidden'
         style={{
            background: "var(--dc-surface)",
            border: "1px solid var(--dc-border)",
         }}
      >
         <table className='w-full border-collapse text-[13px]'>
            <thead>
               <tr
                  style={{
                     background: "var(--dc-surface-2)",
                     borderBottom: "1px solid var(--dc-border)",
                  }}
               >
                  <Th style={{ width: 40 }}></Th>
                  <Th>Name</Th>
                  <Th>Tags</Th>
                  <Th>Chain status</Th>
                  <Th>Size</Th>
                  <Th>Updated</Th>
                  <Th style={{ width: 40 }}></Th>
               </tr>
            </thead>
            <tbody>
               {documents.map((d) => {
                  const isSel = selected.has(d.id);
                  return (
                     <tr
                        key={d.id}
                        onClick={() => onOpen(d.id)}
                        className='cursor-pointer transition-colors'
                        style={{
                           borderBottom: "1px solid var(--dc-border)",
                           background: isSel ? "var(--dc-accent-soft)" : undefined,
                        }}
                        onMouseEnter={(e) => {
                           if (!isSel)
                              e.currentTarget.style.background =
                                 "var(--dc-surface-2)";
                        }}
                        onMouseLeave={(e) => {
                           if (!isSel) e.currentTarget.style.background = "";
                        }}
                     >
                        <Td>
                           <div
                              role='checkbox'
                              aria-checked={isSel}
                              onClick={(e) => {
                                 e.stopPropagation();
                                 onToggleSelect(d.id);
                              }}
                              className='w-[18px] h-[18px] rounded flex items-center justify-center cursor-pointer'
                              style={{
                                 background: isSel
                                    ? "var(--dc-accent)"
                                    : "var(--dc-surface)",
                                 border: isSel
                                    ? "1.5px solid var(--dc-accent)"
                                    : "1.5px solid var(--dc-border-bright)",
                              }}
                           >
                              {isSel && (
                                 <Check size={12} color='#061f15' strokeWidth={2.5} />
                              )}
                           </div>
                        </Td>
                        <Td>
                           <div className='flex items-center gap-2.5 min-w-0'>
                              <div
                                 className='w-5 h-6 rounded-sm relative shrink-0'
                                 style={{
                                    background: "var(--dc-surface-2)",
                                    border: "1px solid var(--dc-border-strong)",
                                 }}
                              />
                              <div className='min-w-0'>
                                 <div className='flex items-center gap-1.5 min-w-0'>
                                    {d.isConfidential && (
                                       <ConfidentialIndicator variant='icon' />
                                    )}
                                    <div
                                       className='font-medium truncate'
                                       style={{ color: "var(--dc-text)" }}
                                    >
                                       {d.title}
                                    </div>
                                 </div>
                                 {d.description && (
                                    <div
                                       className='text-[11px] truncate'
                                       style={{ color: "var(--dc-text-dim)" }}
                                    >
                                       {d.description}
                                    </div>
                                 )}
                              </div>
                           </div>
                        </Td>
                        <Td>
                           <div className='flex gap-1 flex-wrap'>
                              {(d.tags ?? []).slice(0, 2).map((t) => (
                                 <TagPill key={t}>{t}</TagPill>
                              ))}
                           </div>
                        </Td>
                        <Td>
                           <VerifiedBadge status='verified' />
                        </Td>
                        <Td
                           style={{
                              color: "var(--dc-text-muted)",
                              fontVariantNumeric: "tabular-nums",
                           }}
                        >
                           {formatBytes(d.fileSize ?? 0)}
                        </Td>
                        <Td style={{ color: "var(--dc-text-muted)" }}>
                           {formatRelativeTime(
                              d.updatedAt?.toISOString() ??
                                 d.createdAt?.toISOString() ??
                                 ""
                           )}
                        </Td>
                        <Td>
                           <button
                              type='button'
                              onClick={(e) => {
                                 e.stopPropagation();
                              }}
                              aria-label='More actions'
                              className='w-[26px] h-[26px] rounded-md flex items-center justify-center transition-colors'
                              style={{
                                 background: "var(--dc-surface)",
                                 border: "1px solid var(--dc-border)",
                                 color: "var(--dc-text-muted)",
                              }}
                           >
                              <MoreHorizontal size={13} strokeWidth={1.75} />
                           </button>
                        </Td>
                     </tr>
                  );
               })}
               {documents.length === 0 && (
                  <tr>
                     <td
                        colSpan={7}
                        className='py-12 text-center text-[13px]'
                        style={{ color: "var(--dc-text-dim)" }}
                     >
                        No documents match your filters.
                     </td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
   );
};

const Th: FC<{ children?: ReactNode; style?: React.CSSProperties }> = ({
   children,
   style,
}) => (
   <th
      className='px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap'
      style={{ color: "var(--dc-text-dim)", ...style }}
   >
      {children}
   </th>
);

const Td: FC<{ children?: ReactNode; style?: React.CSSProperties }> = ({
   children,
   style,
}) => (
   <td
      className='px-4 py-2.5 align-middle whitespace-nowrap'
      style={{ color: "var(--dc-text)", ...style }}
   >
      {children}
   </td>
);

// ─── Floating bulk bar ────────────────────────────────────────────
const BulkBar: FC<{
   count: number;
   /** How many of the selected docs carry is_confidential=true. */
   confidentialCount: number;
   onClear: () => void;
   onDelete: () => void;
   onShare: () => void;
   onDownload: () => void;
   onMove: () => void;
}> = ({
   count,
   confidentialCount,
   onClear,
   onDelete,
   onShare,
   onDownload,
   onMove,
}) => (
   <div
      className={cn(
         "fixed bottom-6 left-1/2 z-50 flex items-center gap-2.5 pr-2.5 pl-4 py-2 rounded-xl transition-all duration-[220ms] ease-[cubic-bezier(.4,0,.2,1)]",
         count > 0
            ? "opacity-100 -translate-x-1/2 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-x-1/2 translate-y-4 pointer-events-none"
      )}
      style={{
         background: "var(--dc-elevated)",
         border: "1px solid var(--dc-border-strong)",
         boxShadow: "var(--dc-shadow-lg)",
         backdropFilter: "blur(12px)",
      }}
   >
      <div
         className='text-[13px] font-medium flex items-center gap-2 pr-2.5'
         style={{
            color: "var(--dc-text)",
            borderRight: "1px solid var(--dc-border)",
         }}
      >
         <strong
            className='tabular-nums font-semibold'
            style={{ color: "var(--dc-accent)" }}
         >
            {count}
         </strong>
         <span>selected</span>
         {confidentialCount > 0 && (
            <span
               className='inline-flex items-center gap-1 text-[11.5px] font-medium tabular-nums'
               style={{ color: "var(--dc-warn)" }}
               title='Confidential documents trigger a tracked-download confirmation'
            >
               <Lock size={11} strokeWidth={2.25} />
               {confidentialCount} confidential
            </span>
         )}
      </div>
      <div className='flex gap-0.5'>
         <DcButton
            variant='ghost'
            size='sm'
            icon={<FolderInput size={13} strokeWidth={1.75} />}
            onClick={onMove}
         >
            Move
         </DcButton>
         <DcButton
            variant='ghost'
            size='sm'
            icon={<Share2 size={13} strokeWidth={1.75} />}
            onClick={onShare}
         >
            Share
         </DcButton>
         <DcButton
            variant='ghost'
            size='sm'
            icon={<Download size={13} strokeWidth={1.75} />}
            onClick={onDownload}
         >
            Download
         </DcButton>
         <DcButton
            variant='ghost'
            size='sm'
            icon={<TagIcon size={13} strokeWidth={1.75} />}
         >
            Tag
         </DcButton>
         <DcButton
            variant='danger'
            size='sm'
            icon={<Trash2 size={13} strokeWidth={1.75} />}
            onClick={onDelete}
         >
            Delete
         </DcButton>
      </div>
      <button
         type='button'
         onClick={onClear}
         aria-label='Clear selection'
         className='w-7 h-7 rounded-md flex items-center justify-center transition-colors ml-0.5'
         style={{ color: "var(--dc-text-muted)" }}
         onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--dc-surface-2)")
         }
         onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
         <X size={14} strokeWidth={1.75} />
      </button>
   </div>
);
