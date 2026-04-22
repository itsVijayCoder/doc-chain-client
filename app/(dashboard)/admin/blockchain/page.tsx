"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
   CheckCircle,
   Clock,
   Link as LinkIcon,
   TrendingUp,
   XCircle,
} from "lucide-react";
import {
   adminService,
   type BlockchainTransaction,
} from "@/lib/services/adminService";
import {
   PageHead,
   Panel,
   Stat,
   StatsStrip,
} from "@/components/design/primitives";
import { Paginator } from "../../favorites/page";

const PAGE_SIZE = 20;

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────
function formatRelativeTime(iso: string): string {
   const date = new Date(iso);
   const diff = Date.now() - date.getTime();
   const mins = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);
   if (mins < 1) return "just now";
   if (mins < 60) return `${mins}m ago`;
   if (hours < 24) return `${hours}h ago`;
   return `${days}d ago`;
}

const STATUS_STYLE: Record<
   string,
   { color: string; bg: string; border: string; Icon: typeof CheckCircle }
> = {
   confirmed: {
      color: "var(--dc-accent)",
      bg: "var(--dc-accent-soft)",
      border: "var(--dc-accent-border)",
      Icon: CheckCircle,
   },
   pending: {
      color: "var(--dc-warn)",
      bg: "var(--dc-warn-soft)",
      border: "var(--dc-warn-border)",
      Icon: Clock,
   },
   failed: {
      color: "var(--dc-danger)",
      bg: "var(--dc-danger-soft)",
      border: "var(--dc-danger-border)",
      Icon: XCircle,
   },
};

function typeStyle(type: string): React.CSSProperties {
   if (type.includes("verif") || type.includes("document_hash"))
      return {
         background: "var(--dc-warn-soft)",
         color: "var(--dc-warn)",
         border: "1px solid var(--dc-warn-border)",
      };
   if (type.includes("update"))
      return {
         background: "#a855f71a",
         color: "#a855f7",
         border: "1px solid #a855f744",
      };
   return {
      background: "var(--dc-surface-2)",
      color: "var(--dc-text-muted)",
      border: "1px solid var(--dc-border)",
   };
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function AdminBlockchainPage() {
   const { user, isLoading: authLoading } = useAuth();
   const router = useRouter();
   // Local page state only — this surface has no filters yet, so syncing
   // to URL would be noise. `keepPreviousData` prevents the table from
   // blanking while the next page is in flight.
   const [page, setPage] = useState(1);

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, authLoading]);

   const txQuery = useQuery({
      queryKey: ["admin", "blockchain", "transactions", page],
      queryFn: () =>
         adminService.listTransactions({ page, page_size: PAGE_SIZE }),
      enabled: !!user && isAdmin(user.role),
      staleTime: 30_000,
      placeholderData: keepPreviousData,
   });

   const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ["admin", "blockchain", "stats"],
      queryFn: () => adminService.getBlockchainStats(),
      enabled: !!user && isAdmin(user.role),
      staleTime: 30_000,
   });

   const transactions: BlockchainTransaction[] = txQuery.data?.data ?? [];
   const meta = txQuery.data?.meta;
   const txLoading = txQuery.isLoading;

   const successRate =
      stats && stats.confirmed + stats.failed > 0
         ? ((stats.confirmed / (stats.confirmed + stats.failed)) * 100).toFixed(1)
         : null;

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
            title='Blockchain Monitor'
            titleIcon={<LinkIcon size={22} strokeWidth={1.75} />}
            subtitle={
               <span>Track document verification and blockchain transactions</span>
            }
         />

         {/* ── Stats strip ──────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='Confirmed transactions'
               labelIcon={
                  <CheckCircle
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-accent)" }}
                  />
               }
               value={statsLoading ? "—" : (stats?.confirmed ?? 0).toLocaleString()}
               trend='All time'
            />
            <Stat
               label='Pending'
               labelIcon={
                  <Clock
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-warn)" }}
                  />
               }
               value={statsLoading ? "—" : (stats?.pending ?? 0).toLocaleString()}
               valueColor={
                  (stats?.pending ?? 0) > 0 ? "var(--dc-warn)" : undefined
               }
               trend='Awaiting confirmation'
            />
            <Stat
               label='Failed'
               labelIcon={
                  <XCircle
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-danger)" }}
                  />
               }
               value={statsLoading ? "—" : (stats?.failed ?? 0).toLocaleString()}
               valueColor={
                  (stats?.failed ?? 0) > 0 ? "var(--dc-danger)" : undefined
               }
               trend='Requires retry'
            />
            <Stat
               label='Success rate'
               labelIcon={
                  <TrendingUp
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-info)" }}
                  />
               }
               value={
                  statsLoading
                     ? "—"
                     : successRate
                     ? `${successRate}%`
                     : "—"
               }
               valueAccent={
                  successRate !== null && parseFloat(successRate) >= 99
               }
               trend='Confirmed / (confirmed + failed)'
            />
         </StatsStrip>

         {/* ── Recent transactions ──────────────────────────────── */}
         <Panel
            title='Recent Transactions'
            subtitle={
               meta && meta.total > 0
                  ? `${meta.total.toLocaleString()} total · page ${meta.page} of ${meta.total_pages}`
                  : "Latest blockchain verification activities"
            }
            flushBody
         >
            {txLoading ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Loading transactions…
               </div>
            ) : transactions.length === 0 ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  No transactions found.
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
                           <Th>Transaction hash</Th>
                           <Th>Document</Th>
                           <Th>Type</Th>
                           <Th>Status</Th>
                           <Th>Block</Th>
                           <Th>Time</Th>
                        </tr>
                     </thead>
                     <tbody>
                        {transactions.map((tx) => {
                           const statusCfg = STATUS_STYLE[tx.status];
                           return (
                              <tr
                                 key={tx.id}
                                 onClick={() =>
                                    router.push(`/admin/blockchain/records/${tx.id}`)
                                 }
                                 className='cursor-pointer transition-colors'
                                 style={{
                                    borderBottom: "1px solid var(--dc-border)",
                                 }}
                                 onMouseEnter={(e) =>
                                    (e.currentTarget.style.background =
                                       "var(--dc-surface-2)")
                                 }
                                 onMouseLeave={(e) =>
                                    (e.currentTarget.style.background = "")
                                 }
                              >
                                 <Td>
                                    <div className='flex items-center gap-2'>
                                       <LinkIcon
                                          size={14}
                                          strokeWidth={1.75}
                                          style={{ color: "var(--dc-text-dim)" }}
                                       />
                                       <span
                                          style={{
                                             fontFamily: "var(--dc-font-mono)",
                                             fontSize: 12,
                                             color: tx.tx_id
                                                ? "var(--dc-text)"
                                                : "var(--dc-text-faint)",
                                          }}
                                       >
                                          {tx.tx_id
                                             ? `${tx.tx_id.slice(0, 20)}…`
                                             : "—"}
                                       </span>
                                    </div>
                                 </Td>
                                 <Td>
                                    <div className='min-w-0'>
                                       <div
                                          className='font-medium truncate'
                                          style={{ color: "var(--dc-text)" }}
                                       >
                                          {tx.document_title || "—"}
                                       </div>
                                       <div
                                          className='text-[11px] truncate'
                                          style={{
                                             fontFamily: "var(--dc-font-mono)",
                                             color: "var(--dc-text-dim)",
                                          }}
                                       >
                                          {tx.document_id.slice(0, 8)}…
                                       </div>
                                    </div>
                                 </Td>
                                 <Td>
                                    <span
                                       className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
                                       style={typeStyle(tx.record_type)}
                                    >
                                       {tx.record_type}
                                    </span>
                                 </Td>
                                 <Td>
                                    {statusCfg && (
                                       <span
                                          className='inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                                          style={{
                                             color: statusCfg.color,
                                             background: statusCfg.bg,
                                             border: `1px solid ${statusCfg.border}`,
                                          }}
                                       >
                                          <statusCfg.Icon
                                             size={10}
                                             strokeWidth={2}
                                          />
                                          {tx.status}
                                       </span>
                                    )}
                                 </Td>
                                 <Td
                                    style={{
                                       fontFamily: "var(--dc-font-mono)",
                                       color: "var(--dc-text-muted)",
                                       fontSize: 12,
                                    }}
                                 >
                                    {tx.block_number != null
                                       ? `#${tx.block_number.toLocaleString()}`
                                       : "—"}
                                 </Td>
                                 <Td style={{ color: "var(--dc-text-muted)" }}>
                                    {formatRelativeTime(tx.created_at)}
                                 </Td>
                              </tr>
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
            isFetching={txQuery.isFetching}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() =>
               setPage((p) => Math.min(meta?.total_pages ?? 1, p + 1))
            }
         />
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Inline helpers
// ─────────────────────────────────────────────────────────────────────

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
