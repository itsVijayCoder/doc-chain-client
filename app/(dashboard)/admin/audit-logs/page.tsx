"use client";

import {
   FC,
   Fragment,
   ReactNode,
   useCallback,
   useEffect,
   useMemo,
   useState,
} from "react";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
   Activity,
   ChevronDown,
   ChevronRight,
   Database,
   Download,
   Edit,
   ExternalLink,
   FileText,
   Share,
   Shield,
   Trash,
   User,
   X,
} from "lucide-react";
import { adminService, type AuditLog } from "@/lib/services/adminService";
import { formatRelativeTime } from "@/lib/utils/format";
import {
   Chip,
   DcButton,
   PageHead,
   Panel,
   Stat,
   StatsStrip,
} from "@/components/design/primitives";
import { cn } from "@/lib/utils";
import { Paginator } from "../../favorites/page";

const PAGE_SIZE = 25;

// ─────────────────────────────────────────────────────────────────────
// Quick-filter chips — each maps to an EXACT backend action string
// (from `auditSvc.Log(...)` calls in docchain-backend). The previous
// chip row mapped to fuzzy categories and relied on client-side filtering
// of the visible page — that meant filters lied as soon as pagination
// kicked in. Users can always edit the URL directly (`?action=...`) for
// actions that aren't in this shortlist.
// ─────────────────────────────────────────────────────────────────────
const QUICK_ACTIONS: { label: string; value: string }[] = [
   { label: "Uploads", value: "document.create" },
   { label: "Updates", value: "document.update" },
   { label: "Deletes", value: "document.delete" },
   { label: "Downloads", value: "document.download.forensic" },
   { label: "Versions", value: "version.create" },
   { label: "Shares", value: "permission.grant" },
   { label: "Archives", value: "document.archive" },
];

// ─────────────────────────────────────────────────────────────────────
// Action classification — maps raw action strings to design-system colors
// ─────────────────────────────────────────────────────────────────────
type ActionKind =
   | "upload"
   | "update"
   | "delete"
   | "share"
   | "verify"
   | "view"
   | "sign"
   | "other";

function classifyAction(action: string): ActionKind {
   const a = action.toLowerCase();
   if (a.includes("upload") || a.includes("create")) return "upload";
   if (a.includes("update") || a.includes("edit") || a.includes("metadata")) return "update";
   if (a.includes("delete") || a.includes("trash") || a.includes("remove")) return "delete";
   if (a.includes("share") || a.includes("permission")) return "share";
   if (a.includes("verify") || a.includes("blockchain") || a.includes("anchor")) return "verify";
   if (a.includes("sign")) return "sign";
   if (a.includes("view") || a.includes("read") || a.includes("download")) return "view";
   return "other";
}

const ACTION_STYLE: Record<
   ActionKind,
   { color: string; bg: string; border: string }
> = {
   upload: {
      color: "var(--dc-accent)",
      bg: "var(--dc-accent-soft)",
      border: "var(--dc-accent-border)",
   },
   update: {
      color: "var(--dc-info)",
      bg: "var(--dc-info-soft)",
      border: "var(--dc-info-border)",
   },
   delete: {
      color: "var(--dc-danger)",
      bg: "var(--dc-danger-soft)",
      border: "var(--dc-danger-border)",
   },
   share: {
      color: "#a855f7",
      bg: "#a855f71a",
      border: "#a855f744",
   },
   verify: {
      color: "var(--dc-info)",
      bg: "var(--dc-info-soft)",
      border: "var(--dc-info-border)",
   },
   sign: {
      color: "var(--dc-warn)",
      bg: "var(--dc-warn-soft)",
      border: "var(--dc-warn-border)",
   },
   view: {
      color: "var(--dc-text-muted)",
      bg: "var(--dc-surface-2)",
      border: "var(--dc-border)",
   },
   other: {
      color: "var(--dc-text-muted)",
      bg: "var(--dc-surface-2)",
      border: "var(--dc-border)",
   },
};

function getActionIcon(action: string): ReactNode {
   const k = classifyAction(action);
   if (k === "upload") return <FileText size={11} strokeWidth={2} />;
   if (k === "update") return <Edit size={11} strokeWidth={2} />;
   if (k === "delete") return <Trash size={11} strokeWidth={2} />;
   if (k === "share") return <Share size={11} strokeWidth={2} />;
   if (k === "verify") return <Shield size={11} strokeWidth={2} />;
   return <Activity size={11} strokeWidth={2} />;
}

function getEntityIcon(entityType: string): ReactNode {
   switch (entityType) {
      case "document":
         return <FileText size={13} strokeWidth={1.75} />;
      case "user":
         return <User size={13} strokeWidth={1.75} />;
      case "blockchain":
         return <Database size={13} strokeWidth={1.75} />;
      default:
         return <Activity size={13} strokeWidth={1.75} />;
   }
}

function getSeverityStyle(severity?: string): React.CSSProperties | null {
   switch (severity) {
      case "high":
         return {
            color: "var(--dc-danger)",
            background: "var(--dc-danger-soft)",
            border: "1px solid var(--dc-danger-border)",
         };
      case "medium":
         return {
            color: "var(--dc-warn)",
            background: "var(--dc-warn-soft)",
            border: "1px solid var(--dc-warn-border)",
         };
      case "low":
         return {
            color: "var(--dc-info)",
            background: "var(--dc-info-soft)",
            border: "1px solid var(--dc-info-border)",
         };
      default:
         return null;
   }
}

function humanizeKey(key: string): string {
   return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseUserAgent(ua?: string): string {
   if (!ua) return "—";
   if (ua.includes("Edg/"))
      return `Edge ${ua.match(/Edg\/([\d]+)/)?.[1] ?? ""}`.trim();
   if (ua.includes("Chrome/")) {
      const v = ua.match(/Chrome\/([\d]+)/)?.[1] ?? "";
      const os = ua.includes("Mac")
         ? " / macOS"
         : ua.includes("Win")
         ? " / Windows"
         : ua.includes("Linux")
         ? " / Linux"
         : "";
      return `Chrome ${v}${os}`;
   }
   if (ua.includes("Firefox/"))
      return `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ""}`.trim();
   if (ua.includes("Safari/"))
      return `Safari ${ua.match(/Version\/([\d]+)/)?.[1] ?? ""}`.trim();
   return ua.length > 60 ? `${ua.slice(0, 60)}…` : ua;
}

function entityLinkPath(entityType: string, entityId?: string): string | null {
   if (!entityId) return null;
   if (entityType === "document") return `/documents/${entityId}`;
   if (entityType === "user") return `/admin/users`;
   return null;
}

function avatarGradient(seed: string): string {
   const palettes = [
      "linear-gradient(135deg, #6366f1, #ec4899)",
      "linear-gradient(135deg, #0ea5e9, #6366f1)",
      "linear-gradient(135deg, #10b981, #06b6d4)",
      "linear-gradient(135deg, #f59e0b, #f43f5e)",
      "linear-gradient(135deg, #a855f7, #ec4899)",
   ];
   let hash = 0;
   for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
   return palettes[Math.abs(hash) % palettes.length];
}

function downloadBlob(blob: Blob, filename: string) {
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────
// Date helpers — backend expects RFC3339; HTML date inputs give us
// YYYY-MM-DD. Pad to start/end of day so `to=2026-04-03` is inclusive.
// ─────────────────────────────────────────────────────────────────────
function toRFC3339Start(yyyyMmDd: string): string {
   return `${yyyyMmDd}T00:00:00Z`;
}
function toRFC3339End(yyyyMmDd: string): string {
   return `${yyyyMmDd}T23:59:59Z`;
}
// Best-effort parse of the RFC3339 we stored in the URL back to the
// YYYY-MM-DD the <input type="date"> can render. Failure falls through
// to empty (the input shows placeholder).
function fromRFC3339ToDateInput(value: string | null): string {
   if (!value) return "";
   return value.slice(0, 10);
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function AdminAuditLogsPage() {
   const { user, isLoading: authLoading } = useAuth();
   const router = useRouter();
   const searchParams = useSearchParams();

   // URL-synced state. The rule: read everything from the URL, write via
   // pushWithParams(). Compliance users can share this URL verbatim and
   // the other admin will land on the same filtered+paginated view.
   const page = Math.max(1, Number(searchParams?.get("page") ?? "1") || 1);
   const actionParam = searchParams?.get("action") ?? "";
   const userIdParam = searchParams?.get("user_id") ?? "";
   const dateFromParam = searchParams?.get("date_from") ?? "";
   const dateToParam = searchParams?.get("date_to") ?? "";

   const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
   const [isExporting, setIsExporting] = useState(false);

   // Local mirrors for inputs that shouldn't push to URL on every keystroke
   // (user id UUID, dates) — we commit on blur or Enter. Action chips are
   // one-click so they commit immediately.
   const [userIdInput, setUserIdInput] = useState(userIdParam);
   const [dateFromInput, setDateFromInput] = useState(
      fromRFC3339ToDateInput(dateFromParam)
   );
   const [dateToInput, setDateToInput] = useState(
      fromRFC3339ToDateInput(dateToParam)
   );

   // Keep local state in sync when URL changes externally (e.g., a chip
   // click by another handler, or browser back/forward).
   useEffect(() => {
      setUserIdInput(userIdParam);
   }, [userIdParam]);
   useEffect(() => {
      setDateFromInput(fromRFC3339ToDateInput(dateFromParam));
   }, [dateFromParam]);
   useEffect(() => {
      setDateToInput(fromRFC3339ToDateInput(dateToParam));
   }, [dateToParam]);

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, authLoading]);

   // URL writer. Any filter change resets page=1 so users don't land on
   // "page 7 of 2" after narrowing. Empty values are removed so the URL
   // stays clean.
   const pushWithParams = useCallback(
      (updates: Record<string, string | null>) => {
         const next = new URLSearchParams(searchParams?.toString() ?? "");
         // Always reset page on any filter mutation unless page itself
         // is being set in this call.
         if (!("page" in updates)) next.set("page", "1");
         for (const [k, v] of Object.entries(updates)) {
            if (v === null || v === "") next.delete(k);
            else next.set(k, v);
         }
         const qs = next.toString();
         router.push(qs ? `/admin/audit-logs?${qs}` : "/admin/audit-logs");
      },
      [router, searchParams]
   );

   const setAction = (action: string) =>
      pushWithParams({ action: action || null });
   const setPage = (p: number) => pushWithParams({ page: String(p) });

   const commitUserId = () => {
      // Treat empty strings as cleared. Backend validates UUID; we don't
      // duplicate that here — if the value is malformed, backend 400s and
      // the user sees the empty table. Clearer than front-side validation
      // drift.
      if (userIdInput === userIdParam) return;
      pushWithParams({ user_id: userIdInput.trim() || null });
   };
   const commitDateFrom = () => {
      const next = dateFromInput ? toRFC3339Start(dateFromInput) : "";
      if (next === dateFromParam) return;
      pushWithParams({ date_from: next || null });
   };
   const commitDateTo = () => {
      const next = dateToInput ? toRFC3339End(dateToInput) : "";
      if (next === dateToParam) return;
      pushWithParams({ date_to: next || null });
   };

   const hasAnyFilter = Boolean(
      actionParam || userIdParam || dateFromParam || dateToParam
   );
   const clearAllFilters = () => {
      router.push("/admin/audit-logs");
   };

   const listParams = useMemo(
      () => ({
         page,
         page_size: PAGE_SIZE,
         action: actionParam || undefined,
         user_id: userIdParam || undefined,
         date_from: dateFromParam || undefined,
         date_to: dateToParam || undefined,
      }),
      [page, actionParam, userIdParam, dateFromParam, dateToParam]
   );

   const { data, isLoading, isFetching } = useQuery({
      queryKey: ["admin", "audit-logs", listParams],
      queryFn: () => adminService.listAuditLogs(listParams),
      enabled: !!user && isAdmin(user.role),
      staleTime: 30_000,
      placeholderData: keepPreviousData,
   });

   // Backend returns the page's rows; use them directly. No more
   // client-side post-filter.
   const logs = data?.data ?? [];
   const meta = data?.meta;
   const total = meta?.total ?? 0;

   const handleExport = async () => {
      setIsExporting(true);
      try {
         // Export the current filtered set. Pagination params are
         // stripped by exportAuditLogs; filter params are forwarded.
         const blob = await adminService.exportAuditLogs({
            action: actionParam || undefined,
            user_id: userIdParam || undefined,
            date_from: dateFromParam || undefined,
            date_to: dateToParam || undefined,
         });
         const date = new Date().toISOString().slice(0, 10);
         downloadBlob(blob, `audit-logs-${date}.csv`);
      } finally {
         setIsExporting(false);
      }
   };

   const toggleRow = (id: string) => {
      setExpandedRows((prev) => {
         const next = new Set(prev);
         next.has(id) ? next.delete(id) : next.add(id);
         return next;
      });
   };

   const docActionCount = logs.filter((l) => l.entity_type === "document").length;
   const highSeverityCount = logs.filter((l) => l.severity === "high").length;
   const uniqueUserCount = new Set(logs.map((l) => l.user_id).filter(Boolean))
      .size;

   if (authLoading) {
      return (
         <div className='flex items-center justify-center min-h-screen'>
            <div
               className='w-12 h-12 rounded-full border-b-2 animate-spin'
               style={{ borderColor: "var(--dc-accent)" }}
            />
         </div>
      );
   }

   if (!user || !isAdmin(user.role)) return null;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Audit Logs'
            titleIcon={<Activity size={22} strokeWidth={1.75} />}
            subtitle={
               <span>Complete activity trail and system audit logs</span>
            }
            actions={
               <DcButton
                  variant='primary'
                  icon={<Download size={14} strokeWidth={2} />}
                  onClick={handleExport}
                  disabled={isExporting}
               >
                  {isExporting ? "Exporting…" : "Export CSV"}
               </DcButton>
            }
         />

         {/* ── Stats strip ──────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='Total events'
               labelIcon={
                  <Activity
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-accent)" }}
                  />
               }
               value={isLoading ? "—" : total.toLocaleString()}
               trend='All time'
            />
            <Stat
               label='Unique users'
               labelIcon={
                  <User
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-info)" }}
                  />
               }
               value={isLoading ? "—" : uniqueUserCount.toString()}
               trend='In current page'
            />
            <Stat
               label='Document actions'
               labelIcon={
                  <FileText
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-text-muted)" }}
                  />
               }
               value={isLoading ? "—" : docActionCount.toString()}
               trend='In current page'
            />
            <Stat
               label='High severity'
               labelIcon={
                  <Shield
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-danger)" }}
                  />
               }
               value={isLoading ? "—" : highSeverityCount.toString()}
               valueColor={
                  highSeverityCount > 0 ? "var(--dc-danger)" : undefined
               }
               trend='In current page'
            />
         </StatsStrip>

         {/* ── Quick-action chip row — maps 1:1 to backend actions so
              filters hold across pagination. ─────────────────────── */}
         <div className='flex items-center gap-1.5 mb-2 flex-wrap min-h-[28px]'>
            <span
               className='text-[11px] uppercase tracking-[0.06em] mr-1'
               style={{ color: "var(--dc-text-dim)" }}
            >
               Action
            </span>
            <Chip active={!actionParam} onClick={() => setAction("")}>
               all
            </Chip>
            {QUICK_ACTIONS.map((a) => (
               <Chip
                  key={a.value}
                  active={actionParam === a.value}
                  onClick={() => setAction(a.value)}
               >
                  {a.label}
               </Chip>
            ))}
            {/* When the URL carries an action that's NOT in the shortlist
                (e.g., someone deep-linked from an error report), surface
                it as an extra active chip so users see what they're
                filtering on. */}
            {actionParam &&
               !QUICK_ACTIONS.find((a) => a.value === actionParam) && (
                  <Chip active onRemove={() => setAction("")}>
                     {actionParam}
                  </Chip>
               )}
         </div>

         {/* ── Secondary filter row — user, date range, clear ──── */}
         <div className='flex items-center gap-2 mb-3.5 flex-wrap'>
            <FilterInput
               label='User UUID'
               value={userIdInput}
               onChange={setUserIdInput}
               onCommit={commitUserId}
               placeholder='Filter by user UUID'
               width={280}
               mono
            />
            <FilterInput
               label='From'
               type='date'
               value={dateFromInput}
               onChange={setDateFromInput}
               onCommit={commitDateFrom}
               width={160}
            />
            <FilterInput
               label='To'
               type='date'
               value={dateToInput}
               onChange={setDateToInput}
               onCommit={commitDateTo}
               width={160}
            />
            {hasAnyFilter && (
               <DcButton
                  size='sm'
                  icon={<X size={12} strokeWidth={2} />}
                  onClick={clearAllFilters}
                  title='Clear all filters'
               >
                  Clear filters
               </DcButton>
            )}
         </div>

         {/* ── Activity log panel ───────────────────────────────── */}
         <Panel
            title='Activity Log'
            subtitle={
               meta
                  ? `${total.toLocaleString()} total · page ${meta.page} of ${meta.total_pages || 1}`
                  : "Click any row to expand details."
            }
            flushBody
         >
            {isLoading ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Loading audit logs…
               </div>
            ) : logs.length === 0 ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {hasAnyFilter
                     ? "No entries match your filters."
                     : "No audit logs found."}
               </div>
            ) : (
               <div className='overflow-x-auto'>
                  <table className='w-full border-collapse text-[13px]'>
                     <thead>
                        <tr
                           style={{
                              background: "var(--dc-surface-2)",
                              borderBottom: "1px solid var(--dc-border)",
                           }}
                        >
                           <Th style={{ width: 36 }}></Th>
                           <Th>Action</Th>
                           <Th>User</Th>
                           <Th>Entity</Th>
                           <Th>Severity</Th>
                           <Th>Time</Th>
                        </tr>
                     </thead>
                     <tbody>
                        {logs.map((log) => {
                           const expanded = expandedRows.has(log.id);
                           const actionKind = classifyAction(log.action);
                           const actionCfg = ACTION_STYLE[actionKind];
                           const severityStyle = getSeverityStyle(log.severity);

                           return (
                              <Fragment key={log.id}>
                                 <tr
                                    onClick={() => toggleRow(log.id)}
                                    className='cursor-pointer transition-colors'
                                    style={{
                                       borderBottom: "1px solid var(--dc-border)",
                                       background: expanded
                                          ? "var(--dc-surface-2)"
                                          : undefined,
                                    }}
                                    onMouseEnter={(e) => {
                                       if (!expanded)
                                          e.currentTarget.style.background =
                                             "var(--dc-surface-2)";
                                    }}
                                    onMouseLeave={(e) => {
                                       if (!expanded)
                                          e.currentTarget.style.background = "";
                                    }}
                                 >
                                    <Td>
                                       <span
                                          className='inline-flex items-center'
                                          style={{ color: "var(--dc-text-dim)" }}
                                       >
                                          {expanded ? (
                                             <ChevronDown
                                                size={14}
                                                strokeWidth={1.75}
                                             />
                                          ) : (
                                             <ChevronRight
                                                size={14}
                                                strokeWidth={1.75}
                                             />
                                          )}
                                       </span>
                                    </Td>
                                    <Td>
                                       <span
                                          className='inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium'
                                          style={{
                                             color: actionCfg.color,
                                             background: actionCfg.bg,
                                             border: `1px solid ${actionCfg.border}`,
                                          }}
                                       >
                                          {getActionIcon(log.action)}
                                          <span
                                             style={{
                                                fontFamily:
                                                   "var(--dc-font-mono)",
                                                fontSize: 11,
                                             }}
                                          >
                                             {log.action}
                                          </span>
                                       </span>
                                    </Td>
                                    <Td>
                                       {log.user_name || log.user_email ? (
                                          <div className='flex items-center gap-2 min-w-0'>
                                             <div
                                                className='w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0'
                                                style={{
                                                   background: avatarGradient(
                                                      log.user_email ??
                                                         log.user_id ??
                                                         ""
                                                   ),
                                                }}
                                             >
                                                {(
                                                   log.user_name?.[0] ??
                                                   log.user_email?.[0] ??
                                                   "?"
                                                ).toUpperCase()}
                                             </div>
                                             <div className='min-w-0'>
                                                <div
                                                   className='text-[12.5px] font-medium truncate'
                                                   style={{
                                                      color: "var(--dc-text)",
                                                   }}
                                                >
                                                   {log.user_name || "—"}
                                                </div>
                                                <div
                                                   className='text-[11px] truncate'
                                                   style={{
                                                      color:
                                                         "var(--dc-text-dim)",
                                                   }}
                                                >
                                                   {log.user_email ?? "—"}
                                                </div>
                                             </div>
                                          </div>
                                       ) : (
                                          <span style={{ color: "var(--dc-text-faint)" }}>
                                             system
                                          </span>
                                       )}
                                    </Td>
                                    <Td>
                                       <span
                                          className='inline-flex items-center gap-1.5 capitalize'
                                          style={{
                                             color: "var(--dc-text-muted)",
                                          }}
                                       >
                                          {getEntityIcon(log.entity_type)}
                                          {log.entity_type}
                                       </span>
                                    </Td>
                                    <Td>
                                       {severityStyle ? (
                                          <span
                                             className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                                             style={severityStyle}
                                          >
                                             {log.severity}
                                          </span>
                                       ) : (
                                          <span
                                             style={{ color: "var(--dc-text-faint)" }}
                                          >
                                             —
                                          </span>
                                       )}
                                    </Td>
                                    <Td
                                       style={{ color: "var(--dc-text-muted)" }}
                                    >
                                       {formatRelativeTime(log.created_at)}
                                    </Td>
                                 </tr>

                                 {expanded && (
                                    <tr
                                       style={{
                                          background: "var(--dc-surface-2)",
                                          borderBottom: "1px solid var(--dc-border)",
                                       }}
                                    >
                                       <td
                                          colSpan={6}
                                          className='px-6 py-4'
                                       >
                                          <AccordionDetails log={log} />
                                       </td>
                                    </tr>
                                 )}
                              </Fragment>
                           );
                        })}
                     </tbody>
                  </table>
               </div>
            )}
         </Panel>

         <Paginator
            page={page}
            meta={meta}
            isFetching={isFetching}
            onPrev={() => setPage(Math.max(1, page - 1))}
            onNext={() => setPage(Math.min(meta?.total_pages ?? 1, page + 1))}
         />
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Filter input — label + themed <input>. Commits to URL on blur or
// Enter so we don't thrash history on every keystroke. Date inputs
// use native `type="date"` for keyboard-friendly entry.
// ─────────────────────────────────────────────────────────────────────
const FilterInput: FC<{
   label: string;
   value: string;
   onChange: (v: string) => void;
   onCommit: () => void;
   placeholder?: string;
   type?: "text" | "date";
   width?: number;
   mono?: boolean;
}> = ({ label, value, onChange, onCommit, placeholder, type = "text", width, mono }) => (
   <label
      className='flex items-center gap-2 h-8 px-2.5 rounded-md transition-all focus-within:shadow-[0_0_0_3px_var(--dc-accent-soft)] focus-within:border-[color:var(--dc-accent-border)]'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
         width: width ? `${width}px` : undefined,
      }}
   >
      <span
         className='text-[11px] uppercase tracking-[0.06em] whitespace-nowrap'
         style={{ color: "var(--dc-text-dim)" }}
      >
         {label}
      </span>
      <input
         type={type}
         value={value}
         onChange={(e) => onChange(e.target.value)}
         onBlur={onCommit}
         onKeyDown={(e) => {
            if (e.key === "Enter") {
               e.preventDefault();
               onCommit();
            }
         }}
         placeholder={placeholder}
         className='flex-1 min-w-0 bg-transparent border-none outline-none text-[12.5px]'
         style={{
            color: "var(--dc-text)",
            fontFamily: mono ? "var(--dc-font-mono)" : undefined,
         }}
      />
   </label>
);

// ─────────────────────────────────────────────────────────────────────
// Accordion detail content
// ─────────────────────────────────────────────────────────────────────
const AccordionDetails: FC<{ log: AuditLog }> = ({ log }) => {
   const metaEntries = log.metadata
      ? Object.entries(log.metadata).filter(
           ([, v]) => v !== null && v !== undefined && v !== ""
        )
      : [];

   const linkPath = entityLinkPath(log.entity_type, log.entity_id);

   return (
      <div
         className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-[13px]'
      >
         {/* Metadata key-value pairs */}
         {metaEntries.length > 0 && (
            <div className='lg:col-span-3'>
               <p
                  className='text-[10.5px] font-semibold uppercase tracking-[0.06em] mb-2'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Details
               </p>
               <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5'>
                  {metaEntries.map(([k, v]) => (
                     <div key={k} className='flex gap-2 min-w-0'>
                        <span
                           className='text-[11px] shrink-0 w-28 pt-0.5 truncate'
                           style={{ color: "var(--dc-text-dim)" }}
                        >
                           {humanizeKey(k)}
                        </span>
                        <span
                           className='text-[11.5px] font-medium break-words flex-1'
                           style={{ color: "var(--dc-text)" }}
                        >
                           {String(v)}
                        </span>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {metaEntries.length > 0 && (
            <div
               className='lg:col-span-3 my-1'
               style={{ borderTop: "1px solid var(--dc-border)" }}
            />
         )}

         {/* Entity ID */}
         <DetailField label='Entity ID'>
            {linkPath ? (
               <Link
                  href={linkPath}
                  className='inline-flex items-center gap-1 transition-colors'
                  style={{
                     fontFamily: "var(--dc-font-mono)",
                     fontSize: 11.5,
                     color: "var(--dc-accent)",
                  }}
               >
                  {log.entity_id?.slice(0, 20)}…
                  <ExternalLink size={11} strokeWidth={1.75} />
               </Link>
            ) : (
               <span
                  style={{
                     fontFamily: "var(--dc-font-mono)",
                     fontSize: 11.5,
                     color: "var(--dc-text-muted)",
                  }}
               >
                  {log.entity_id ?? "—"}
               </span>
            )}
         </DetailField>

         <DetailField label='Email'>
            <span
               className='text-[12px]'
               style={{ color: "var(--dc-text)" }}
            >
               {log.user_email || "—"}
            </span>
         </DetailField>

         <DetailField label='IP address'>
            <span
               style={{
                  fontFamily: "var(--dc-font-mono)",
                  fontSize: 11.5,
                  color: "var(--dc-text-muted)",
               }}
            >
               {log.ip_address || "—"}
            </span>
         </DetailField>

         <DetailField label='Client' colSpan='all'>
            <span
               className='text-[12px]'
               style={{ color: "var(--dc-text-muted)" }}
            >
               {parseUserAgent(log.user_agent)}
            </span>
         </DetailField>
      </div>
   );
};

const DetailField: FC<{
   label: string;
   children: ReactNode;
   colSpan?: "all";
}> = ({ label, children, colSpan }) => (
   <div className={cn(colSpan === "all" && "sm:col-span-2 lg:col-span-3")}>
      <p
         className='text-[10.5px] mb-1'
         style={{ color: "var(--dc-text-dim)" }}
      >
         {label}
      </p>
      {children}
   </div>
);

// ─────────────────────────────────────────────────────────────────────
// Table cell helpers
// ─────────────────────────────────────────────────────────────────────
const Th: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
}> = ({ children, style }) => (
   <th
      className='px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap'
      style={{ color: "var(--dc-text-dim)", ...style }}
   >
      {children}
   </th>
);

const Td: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
}> = ({ children, style }) => (
   <td
      className='px-4 py-2.5 align-middle whitespace-nowrap'
      style={{ color: "var(--dc-text)", ...style }}
   >
      {children}
   </td>
);
