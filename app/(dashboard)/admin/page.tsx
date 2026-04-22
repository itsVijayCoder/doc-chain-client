"use client";

import { FC, ReactNode, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { adminService } from "@/lib/services/adminService";
import {
   Activity,
   CheckCircle,
   Clock,
   Cuboid,
   Database,
   FileText,
   Folder,
   HardDrive,
   LayoutDashboard,
   MessageSquare,
   Shield,
   TrendingUp,
   Users,
   XCircle,
} from "lucide-react";
import {
   PageHead,
   Panel,
   Stat,
   StatsStrip,
   ViewAllLink,
} from "@/components/design/primitives";

export default function AdminDashboardPage() {
   const { user, isLoading: authLoading } = useAuth();

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, authLoading]);

   const statsQuery = useQuery({
      queryKey: ["admin", "stats"],
      queryFn: () => adminService.getStats(),
      staleTime: 60_000,
      enabled: !!user && isAdmin(user.role),
   });

   const networkQuery = useQuery({
      queryKey: ["admin", "blockchain-network"],
      queryFn: () => adminService.getBlockchainNetwork(),
      staleTime: 60_000,
      enabled: !!user && isAdmin(user.role),
   });

   const bcStatsQuery = useQuery({
      queryKey: ["admin", "blockchain-stats"],
      queryFn: () => adminService.getBlockchainStats(),
      staleTime: 60_000,
      enabled: !!user && isAdmin(user.role),
   });

   const readyzQuery = useQuery({
      queryKey: ["admin", "readyz"],
      queryFn: () => adminService.getReadyz(),
      staleTime: 30_000,
      refetchInterval: 60_000,
      enabled: !!user && isAdmin(user.role),
   });

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

   const stats = statsQuery.data;
   const network = networkQuery.data;
   const bcStats = bcStatsQuery.data;
   const readyz = readyzQuery.data;
   const isLoading = statsQuery.isLoading;

   const bcTotal =
      (bcStats?.confirmed ?? 0) + (bcStats?.failed ?? 0) + (bcStats?.pending ?? 0);
   const networkHealth =
      network?.available === false
         ? 0
         : bcTotal > 0
         ? Math.round(((bcStats?.confirmed ?? 0) / bcTotal) * 100)
         : network?.available
         ? 100
         : 98;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)]'>
         <PageHead
            title='Admin Overview'
            titleIcon={<LayoutDashboard size={22} strokeWidth={1.75} />}
            subtitle={<span>Monitor and manage your DocChain system</span>}
         />

         {/* ── Primary stats ────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='Total users'
               labelIcon={
                  <Users
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-info)" }}
                  />
               }
               value={isLoading ? "—" : (stats?.total_users ?? 0).toLocaleString()}
               trend='All registered'
            />
            <Stat
               label='Total documents'
               labelIcon={
                  <FileText
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-text-muted)" }}
                  />
               }
               value={
                  isLoading ? "—" : (stats?.total_documents ?? 0).toLocaleString()
               }
               trend='In library'
            />
            <Stat
               label='Protected on-chain'
               labelIcon={
                  <Shield
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-accent)" }}
                  />
               }
               value={
                  isLoading
                     ? "—"
                     : (stats?.protected_documents ?? 0).toLocaleString()
               }
               trend={
                  stats?.total_documents
                     ? `${Math.round(
                          ((stats.protected_documents ?? 0) /
                             stats.total_documents) *
                             100
                       )}% coverage`
                     : "—"
               }
            />
            <Stat
               label='Storage used'
               labelIcon={
                  <HardDrive
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-warn)" }}
                  />
               }
               value={isLoading ? "—" : stats?.storage_display ?? "—"}
               trend='Across all users'
            />
         </StatsStrip>

         {/* ── System health + Blockchain network ───────────────── */}
         <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4'>
            <div className='lg:col-span-2'>
               <Panel
                  title='System Health'
                  titleIcon={
                     <Activity
                        size={13}
                        strokeWidth={1.75}
                        style={{ color: "var(--dc-accent)" }}
                     />
                  }
                  subtitle='Real-time service status'
                  bodyClassName='p-4'
               >
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                     <HealthTile
                        label='Postgres'
                        status={readyz?.dependencies.postgres.status ?? "up"}
                        latency={readyz?.dependencies.postgres.latency_ms}
                     />
                     <HealthTile
                        label='Redis'
                        status={readyz?.dependencies.redis.status ?? "up"}
                        latency={readyz?.dependencies.redis.latency_ms}
                     />
                     <HealthTile
                        label='Uptime'
                        status='up'
                        valueOverride={stats?.uptime_display ?? "—"}
                     />
                     <HealthTile
                        label='Network health'
                        status={network?.available === false ? "down" : "up"}
                        valueOverride={`${networkHealth}%`}
                     />
                  </div>
               </Panel>
            </div>

            <Panel
               title='Blockchain Network'
               titleIcon={
                  <Cuboid
                     size={13}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-info)" }}
                  />
               }
               action={<ViewAllLink href='/admin/blockchain' />}
               bodyClassName='p-4 space-y-2'
            >
               <NetworkRow
                  label='Network'
                  value={network?.available ? "Online" : "Offline"}
                  accent={network?.available ? "good" : "bad"}
               />
               <NetworkRow
                  label='Peer status'
                  value={network?.peer_status ?? "—"}
                  mono
               />
               <NetworkRow
                  label='Channel'
                  value={network?.channel ?? "—"}
                  mono
               />
               <NetworkRow
                  label='Chaincode'
                  value={network?.chaincode ?? "—"}
                  mono
               />
               <div
                  className='mt-3 pt-3 grid grid-cols-3 gap-2'
                  style={{ borderTop: "1px solid var(--dc-border)" }}
               >
                  <TxCount
                     label='Confirmed'
                     value={bcStats?.confirmed ?? 0}
                     color='var(--dc-accent)'
                     Icon={CheckCircle}
                  />
                  <TxCount
                     label='Pending'
                     value={bcStats?.pending ?? 0}
                     color='var(--dc-warn)'
                     Icon={Clock}
                  />
                  <TxCount
                     label='Failed'
                     value={bcStats?.failed ?? 0}
                     color='var(--dc-danger)'
                     Icon={XCircle}
                  />
               </div>
            </Panel>
         </div>

         {/* ── Engagement stats ─────────────────────────────────── */}
         <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
            <EngagementCard
               label='Active today'
               value={stats?.recent_active_users ?? 0}
               helper='Logged in last 24 hours'
               icon={<Activity size={16} strokeWidth={1.75} />}
               iconColor='var(--dc-accent)'
               iconBg='var(--dc-accent-soft)'
               isLoading={isLoading}
            />
            <EngagementCard
               label='Active accounts'
               value={stats?.active_users ?? 0}
               helper='Users with status active'
               icon={<Users size={16} strokeWidth={1.75} />}
               iconColor='var(--dc-info)'
               iconBg='var(--dc-info-soft)'
               isLoading={isLoading}
            />
            <EngagementCard
               label='AI sessions'
               value={stats?.chat_sessions ?? 0}
               helper='Total AI chat sessions'
               icon={<MessageSquare size={16} strokeWidth={1.75} />}
               iconColor='var(--dc-warn)'
               iconBg='var(--dc-warn-soft)'
               isLoading={isLoading}
            />
         </div>

         {/* ── Quick links ──────────────────────────────────────── */}
         <Panel title='Manage' bodyClassName='p-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1'>
               <QuickLink
                  href='/admin/users'
                  icon={<Users size={14} strokeWidth={1.75} />}
                  title='Users'
                  sub='Add, edit, suspend accounts'
               />
               <QuickLink
                  href='/admin/roles'
                  icon={<Shield size={14} strokeWidth={1.75} />}
                  title='Roles'
                  sub='Define permission sets'
               />
               <QuickLink
                  href='/admin/security'
                  icon={<Shield size={14} strokeWidth={1.75} />}
                  title='Security'
                  sub='Events + enforcement mode'
               />
               <QuickLink
                  href='/admin/blockchain'
                  icon={<Database size={14} strokeWidth={1.75} />}
                  title='Blockchain'
                  sub='Transactions + proof'
               />
               <QuickLink
                  href='/admin/audit-logs'
                  icon={<Activity size={14} strokeWidth={1.75} />}
                  title='Audit logs'
                  sub='Full activity trail'
               />
               <QuickLink
                  href='/admin/watermark/trace'
                  icon={<TrendingUp size={14} strokeWidth={1.75} />}
                  title='Watermark trace'
                  sub='Forensic fingerprint lookup'
               />
            </div>
         </Panel>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const HealthTile: FC<{
   label: string;
   status: "up" | "down" | string;
   latency?: number;
   valueOverride?: string;
}> = ({ label, status, latency, valueOverride }) => {
   const good = status === "up";
   return (
      <div
         className='p-3 rounded-lg flex items-center gap-2.5'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
         }}
      >
         <div
            className='w-2 h-2 rounded-full shrink-0'
            style={{
               background: good ? "var(--dc-accent)" : "var(--dc-danger)",
               boxShadow: `0 0 0 3px ${
                  good ? "var(--dc-accent-soft)" : "var(--dc-danger-soft)"
               }`,
            }}
         />
         <div className='flex-1 min-w-0'>
            <div
               className='text-[12px] font-medium'
               style={{ color: "var(--dc-text)" }}
            >
               {label}
            </div>
            <div
               className='text-[11px] tabular-nums'
               style={{ color: "var(--dc-text-dim)" }}
            >
               {valueOverride ??
                  (good
                     ? latency != null
                        ? `${latency}ms`
                        : "Healthy"
                     : "Degraded")}
            </div>
         </div>
      </div>
   );
};

const NetworkRow: FC<{
   label: string;
   value: string;
   accent?: "good" | "bad";
   mono?: boolean;
}> = ({ label, value, accent, mono }) => (
   <div className='flex items-center justify-between gap-3 text-[12.5px]'>
      <span style={{ color: "var(--dc-text-dim)" }}>{label}</span>
      <span
         className='truncate'
         style={{
            color:
               accent === "good"
                  ? "var(--dc-accent)"
                  : accent === "bad"
                  ? "var(--dc-danger)"
                  : "var(--dc-text)",
            fontFamily: mono ? "var(--dc-font-mono)" : undefined,
            fontSize: mono ? 11.5 : undefined,
         }}
      >
         {value}
      </span>
   </div>
);

const TxCount: FC<{
   label: string;
   value: number;
   color: string;
   Icon: typeof CheckCircle;
}> = ({ label, value, color, Icon }) => (
   <div className='flex flex-col items-center gap-0.5 text-center'>
      <div className='flex items-center gap-1' style={{ color }}>
         <Icon size={11} strokeWidth={2} />
         <span className='text-[11px] uppercase tracking-[0.05em] font-medium'>
            {label}
         </span>
      </div>
      <div
         className='text-[18px] font-semibold tabular-nums'
         style={{
            color: "var(--dc-text)",
            fontFamily: "var(--dc-font-display)",
         }}
      >
         {value.toLocaleString()}
      </div>
   </div>
);

const EngagementCard: FC<{
   label: string;
   value: number | string;
   helper: string;
   icon: ReactNode;
   iconColor: string;
   iconBg: string;
   isLoading?: boolean;
}> = ({ label, value, helper, icon, iconColor, iconBg, isLoading }) => (
   <div
      className='p-5 rounded-xl'
      style={{
         background: "var(--dc-surface)",
         border: "1px solid var(--dc-border)",
      }}
   >
      <div className='flex items-center gap-3 mb-2.5'>
         <div
            className='w-10 h-10 rounded-lg flex items-center justify-center shrink-0'
            style={{ background: iconBg, color: iconColor }}
         >
            {icon}
         </div>
         <div className='min-w-0'>
            <div
               className='text-[12px]'
               style={{ color: "var(--dc-text-dim)" }}
            >
               {label}
            </div>
            <div
               className='text-[22px] font-semibold tabular-nums tracking-[-0.02em]'
               style={{
                  color: "var(--dc-text)",
                  fontFamily: "var(--dc-font-display)",
               }}
            >
               {isLoading ? "—" : value.toLocaleString?.() ?? value}
            </div>
         </div>
      </div>
      <p className='text-[11.5px]' style={{ color: "var(--dc-text-dim)" }}>
         {helper}
      </p>
   </div>
);

const QuickLink: FC<{
   href: string;
   icon: ReactNode;
   title: string;
   sub: string;
}> = ({ href, icon, title, sub }) => (
   <Link
      href={href}
      className='flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors'
      onMouseEnter={(e) =>
         (e.currentTarget.style.background = "var(--dc-surface-2)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
   >
      <div
         className='w-7 h-7 rounded-md flex items-center justify-center shrink-0'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text-muted)",
         }}
      >
         {icon}
      </div>
      <div className='flex-1 min-w-0'>
         <div
            className='text-[13px] font-medium'
            style={{ color: "var(--dc-text)" }}
         >
            {title}
         </div>
         <div
            className='text-[11.5px]'
            style={{ color: "var(--dc-text-dim)" }}
         >
            {sub}
         </div>
      </div>
   </Link>
);
