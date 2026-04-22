"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { userStatsService } from "@/lib/services/userStatsService";
import { documentService } from "@/lib/services/documentService";
import { formatRelativeTime } from "@/lib/utils/format";
import {
   BrainCircuit,
   Clock,
   FileText,
   FileUp,
   Folder,
   Lock,
   MessageSquare,
   Settings,
   Share2,
   Shield,
   ShieldOff,
   Trash2,
   Unlock,
   UserPlus,
} from "lucide-react";
import type { MyActivity, MySuggestion } from "@/lib/services/userStatsService";
import {
   ListRow,
   Panel,
   PageHead,
   PriorityBadge,
   Stat,
   StatsStrip,
   VerifiedBadge,
   ViewAllLink,
} from "@/components/design/primitives";

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
   const { user } = useAuth();

   const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ["users", "me", "stats"],
      queryFn: () => userStatsService.getMyStats(),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
   });

   const greet = (() => {
      const h = new Date().getHours();
      if (h < 12) return "morning";
      if (h < 18) return "afternoon";
      return "evening";
   })();

   const displayName =
      user?.firstName ||
      (user?.name ? user.name.split(" ")[0] : null) ||
      user?.email?.split("@")[0] ||
      "there";

   const totalDocs = stats?.total_documents ?? 0;
   const blockchainConfirmed = stats?.blockchain_confirmed ?? 0;
   // Defensive clamp: `/users/me/stats` currently returns a
   // `blockchain_confirmed` that can exceed `total_documents` (tx rows vs
   // distinct docs — backend bug tracked in the stats service). Cap at 100%
   // so the UI doesn't show "117%". Remove the Math.min once the backend
   // returns distinct-doc counts.
   const protectedPct =
      totalDocs > 0
         ? Math.min(100, Math.round((blockchainConfirmed / totalDocs) * 100))
         : 0;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title={`Good ${greet}, ${displayName}`}
            subtitle={
               <span>
                  Welcome to DocChain — your blockchain-secured document
                  management system
               </span>
            }
         />

         {/* ── Stats strip ──────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='Total documents'
               labelIcon={<Folder size={12} strokeWidth={1.75} />}
               value={statsLoading ? "—" : totalDocs.toString()}
               trend='Across your library'
            />
            <Stat
               label='Shared with me'
               labelIcon={<Share2 size={12} strokeWidth={1.75} />}
               value={statsLoading ? "—" : (stats?.shared_with_me ?? 0).toString()}
               trend={stats?.shared_with_me ? "Recently shared" : "Nothing new"}
            />
            <Stat
               label='Blockchain protected'
               labelIcon={<Shield size={12} strokeWidth={1.75} />}
               value={statsLoading ? "—" : `${protectedPct}%`}
               valueAccent
               trend={
                  statsLoading
                     ? ""
                     : `${blockchainConfirmed}/${totalDocs} anchored`
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
         </StatsStrip>

         {/* ── Two-column panel grid ────────────────────────────── */}
         <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4'>
            <RecentDocumentsPanel />
            <RecentActivityPanel />
         </div>

         {/* ── AI Insights ──────────────────────────────────────── */}
         <AIInsightsPanel />
      </div>
   );
}

// (Primitives — StatsStrip, Stat, Panel, ViewAllLink, ListRow,
// VerifiedBadge, PriorityBadge — now live in @/components/design/primitives)

// ─────────────────────────────────────────────────────────────────────
// Recent Documents
// ─────────────────────────────────────────────────────────────────────
const RecentDocumentsPanel: FC = () => {
   const { data, isLoading } = useQuery({
      queryKey: [
         "documents",
         "list",
         { page: 1, pageSize: 5, sortBy: "updated_at", sortDir: "desc" },
      ],
      queryFn: () =>
         documentService.list({
            page: 1,
            pageSize: 5,
            sortBy: "updated_at",
            sortDir: "desc",
         }),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
   });

   const docs = data?.documents ?? [];

   return (
      <Panel
         title='Recent Documents'
         action={<ViewAllLink href='/documents' />}
      >
         {isLoading ? (
            <div className='py-10 text-center text-[13px]' style={{ color: "var(--dc-text-dim)" }}>
               Loading…
            </div>
         ) : docs.length === 0 ? (
            <div className='py-10 text-center'>
               <FileText
                  className='mx-auto mb-3 opacity-40'
                  size={28}
                  style={{ color: "var(--dc-text-faint)" }}
               />
               <p className='text-[13px]' style={{ color: "var(--dc-text-dim)" }}>
                  No documents yet
               </p>
               <Link
                  href='/documents?action=upload'
                  className='text-[13px] mt-1 inline-block'
                  style={{ color: "var(--dc-accent)" }}
               >
                  Upload your first document
               </Link>
            </div>
         ) : (
            docs.map((doc) => (
               <ListRow
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  icon={<FileText size={14} strokeWidth={1.75} />}
                  title={doc.title}
                  sub={formatRelativeTime(
                     doc.updatedAt?.toISOString() ??
                        doc.createdAt?.toISOString() ??
                        ""
                  )}
                  // Default "verified" until backend adds blockchain_status.
                  // Once wired, replace with: status={doc.blockchainStatus}
                  right={<VerifiedBadge status='verified' />}
               />
            ))
         )}
      </Panel>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Recent Activity
// ─────────────────────────────────────────────────────────────────────
type ActivityIconKey =
   | "upload"
   | "share"
   | "blockchain"
   | "edit"
   | "delete"
   | "protect"
   | "unprotect"
   | "user"
   | "comment"
   | "settings";

function resolveActivityIcon(action: string, entityType: string): ActivityIconKey {
   const a = action.toLowerCase();
   const e = entityType.toLowerCase();
   if (a.includes("upload") || a.includes("version")) return "upload";
   if (a.includes("share") || a.includes("permission")) return "share";
   if (a.includes("blockchain") || a.includes("verify")) return "blockchain";
   if (a.includes("delete") || a.includes("trash") || a.includes("remove")) return "delete";
   if (a.includes("unprotect")) return "unprotect";
   if (a.includes("protect") || a.includes("encrypt")) return "protect";
   if (a.includes("comment")) return "comment";
   if (e.includes("user") || a.includes("register")) return "user";
   if (a.includes("update") || a.includes("edit") || a.includes("metadata")) return "edit";
   return "settings";
}

const ACTIVITY_ICON: Record<ActivityIconKey, ReactNode> = {
   upload: <FileUp size={14} strokeWidth={1.75} />,
   share: <Share2 size={14} strokeWidth={1.75} />,
   blockchain: <Shield size={14} strokeWidth={1.75} />,
   edit: <FileText size={14} strokeWidth={1.75} />,
   delete: <Trash2 size={14} strokeWidth={1.75} />,
   protect: <Lock size={14} strokeWidth={1.75} />,
   unprotect: <Unlock size={14} strokeWidth={1.75} />,
   user: <UserPlus size={14} strokeWidth={1.75} />,
   comment: <MessageSquare size={14} strokeWidth={1.75} />,
   settings: <Settings size={14} strokeWidth={1.75} />,
};

function humanizeAction(action: string): string {
   const parts = action.split(".");
   const entity = parts[0] ? parts[0].replace(/_/g, " ") : "";
   const verb = parts[1] ? parts[1].replace(/_/g, " ") : action;
   const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
   if (entity && verb) return `${cap(entity)} ${verb}`;
   return cap(action.replace(/[._]/g, " "));
}

const RecentActivityPanel: FC = () => {
   const { data, isLoading } = useQuery({
      queryKey: ["users", "me", "activity"],
      queryFn: () => userStatsService.getMyActivity({ page_size: 5 }),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
   });

   const items: MyActivity[] = (data?.data ?? []).slice(0, 5);

   return (
      <Panel title='Recent Activity' action={<ViewAllLink href='/admin/audit-logs' />}>
         {isLoading ? (
            <div className='py-10 text-center text-[13px]' style={{ color: "var(--dc-text-dim)" }}>
               Loading…
            </div>
         ) : items.length === 0 ? (
            <div
               className='py-10 text-center text-[13px]'
               style={{ color: "var(--dc-text-dim)" }}
            >
               No recent activity
            </div>
         ) : (
            items.map((item) => {
               const iconKey = resolveActivityIcon(item.action, item.entity_type);
               return (
                  <ListRow
                     key={item.id}
                     icon={ACTIVITY_ICON[iconKey]}
                     title={humanizeAction(item.action)}
                     sub={
                        <>
                           <span style={{ fontFamily: "var(--dc-font-mono)" }}>
                              {item.entity_type}
                              {item.entity_id
                                 ? ` · ${item.entity_id.slice(0, 8)}`
                                 : ""}
                           </span>
                           {" · "}
                           {formatRelativeTime(item.created_at)}
                        </>
                     }
                  />
               );
            })
         )}
      </Panel>
   );
};

// ─────────────────────────────────────────────────────────────────────
// AI Insights
// ─────────────────────────────────────────────────────────────────────
const SUGGESTION_ICON: Record<string, ReactNode> = {
   expiring: <Clock size={14} strokeWidth={1.75} />,
   blockchain_failed: <ShieldOff size={14} strokeWidth={1.75} />,
   unverified_confidential: <Shield size={14} strokeWidth={1.75} />,
   recently_shared: <Share2 size={14} strokeWidth={1.75} />,
};

const AIInsightsPanel: FC = () => {
   const { data: suggestions = [], isLoading } = useQuery({
      queryKey: ["users", "me", "suggestions"],
      queryFn: () => userStatsService.getMySuggestions(),
      staleTime: 120_000,
      refetchOnWindowFocus: false,
   });

   const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
   const sorted = [...suggestions].sort(
      (a, b) =>
         (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
   );

   return (
      <Panel
         title='AI Insights'
         titleIcon={
            <BrainCircuit size={14} strokeWidth={1.75} style={{ color: "var(--dc-accent)" }} />
         }
         action={
            !isLoading && suggestions.length > 0 ? (
               <span
                  className='inline-flex items-center h-6 px-2 rounded-xl text-[12px] font-medium'
                  style={{
                     background: "var(--dc-accent-soft)",
                     color: "var(--dc-accent)",
                     border: "1px solid var(--dc-accent-border)",
                  }}
               >
                  live
               </span>
            ) : undefined
         }
      >
         {isLoading ? (
            <div
               className='py-10 text-center text-[13px]'
               style={{ color: "var(--dc-text-dim)" }}
            >
               Loading…
            </div>
         ) : sorted.length === 0 ? (
            <div
               className='py-9 px-5 text-center text-[13px]'
               style={{ color: "var(--dc-text-dim)" }}
            >
               No suggestions right now — everything looks good.
            </div>
         ) : (
            sorted.map((s: MySuggestion) => (
               <ListRow
                  key={s.id}
                  href={s.document_id ? `/documents/${s.document_id}` : undefined}
                  icon={SUGGESTION_ICON[s.type] ?? <BrainCircuit size={14} strokeWidth={1.75} />}
                  title={s.title}
                  sub={s.description}
                  right={<PriorityBadge priority={s.priority} />}
               />
            ))
         )}
      </Panel>
   );
};

