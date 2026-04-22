"use client";

import { FC, ReactNode, useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery } from "@tanstack/react-query";
import {
   Activity,
   AlertTriangle,
   CheckCircle,
   Download,
   Lock,
   Shield,
   ShieldCheck,
   User,
   XCircle,
} from "lucide-react";
import { adminService, type AuditLog } from "@/lib/services/adminService";
import { roleService } from "@/lib/services/roleService";
import {
   DcButton,
   PageHead,
   Panel,
   Stat,
   StatsStrip,
} from "@/components/design/primitives";

// ─────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────
// Honest whitelist of what counts as a "security event" for this page. Audit
// logs include a lot of routine CRUD (document.update, etc.) that isn't a
// security concern — those get filtered out. Prefixes catch variants
// (auth.login, auth.login_failed, etc.); exacts pin specific actions.
const SECURITY_ACTION_PREFIXES = ["auth.", "2fa.", "permission.", "role.", "session."];
const SECURITY_ACTION_EXACT = new Set([
   "setting.update",
   "document.permanent_delete",
]);

function isSecurityEvent(action: string): boolean {
   if (SECURITY_ACTION_EXACT.has(action)) return true;
   return SECURITY_ACTION_PREFIXES.some((p) => action.startsWith(p));
}

// Machine action names → human labels. Unknown actions fall back to the raw
// string so nothing ever "disappears" from the table.
const ACTION_LABELS: Record<string, string> = {
   "auth.login": "Signed in",
   "auth.login_failed": "Sign-in failed",
   "auth.logout": "Signed out",
   "auth.register": "Registered",
   "auth.password_reset": "Reset password",
   "2fa.enabled": "Enabled 2FA",
   "2fa.disabled": "Disabled 2FA",
   "2fa.verified": "Verified 2FA",
   "2fa.locked": "2FA lockout",
   "permission.grant": "Granted permission",
   "permission.revoke": "Revoked permission",
   "role.create": "Created role",
   "role.update": "Updated role",
   "role.delete": "Deleted role",
   "role.assign": "Assigned role",
   "setting.update": "Updated setting",
   "document.permanent_delete": "Permanently deleted document",
};

function actionLabel(action: string): string {
   return ACTION_LABELS[action] ?? action;
}

type EnforcementMode = "off" | "audit" | "enforce";

interface ModeConfig {
   value: EnforcementMode;
   label: string;
   description: string;
   accent: string; // CSS var ref
   soft: string;
   border: string;
}

const ENFORCEMENT_MODES: ModeConfig[] = [
   {
      value: "off",
      label: "Off",
      description:
         "Role permissions are ignored; all users have full access.",
      accent: "var(--dc-warn)",
      soft: "var(--dc-warn-soft)",
      border: "var(--dc-warn-border)",
   },
   {
      value: "audit",
      label: "Audit",
      description:
         "Permissions are checked and violations logged, but not blocked.",
      accent: "var(--dc-info)",
      soft: "var(--dc-info-soft)",
      border: "var(--dc-info-border)",
   },
   {
      value: "enforce",
      label: "Enforce",
      description:
         "Permissions are strictly enforced; unauthorized actions are blocked.",
      accent: "var(--dc-accent)",
      soft: "var(--dc-accent-soft)",
      border: "var(--dc-accent-border)",
   },
];

// Severity pill config
const SEVERITY_STYLE: Record<
   string,
   { color: string; bg: string; border: string }
> = {
   high: {
      color: "var(--dc-danger)",
      bg: "var(--dc-danger-soft)",
      border: "var(--dc-danger-border)",
   },
   medium: {
      color: "var(--dc-warn)",
      bg: "var(--dc-warn-soft)",
      border: "var(--dc-warn-border)",
   },
   low: {
      color: "var(--dc-info)",
      bg: "var(--dc-info-soft)",
      border: "var(--dc-info-border)",
   },
   info: {
      color: "var(--dc-text-muted)",
      bg: "var(--dc-surface-2)",
      border: "var(--dc-border)",
   },
};

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

function getEventIcon(action: string): ReactNode {
   if (action.includes("failed") || action.includes("invalid"))
      return <XCircle size={14} strokeWidth={1.75} />;
   if (action.includes("login"))
      return <CheckCircle size={14} strokeWidth={1.75} />;
   if (action.includes("password")) return <Lock size={14} strokeWidth={1.75} />;
   return <AlertTriangle size={14} strokeWidth={1.75} />;
}

function avatarGradient(seed: string): string {
   const palettes = [
      "linear-gradient(135deg, #6366f1, #ec4899)",
      "linear-gradient(135deg, #0ea5e9, #6366f1)",
      "linear-gradient(135deg, #10b981, #06b6d4)",
      "linear-gradient(135deg, #f59e0b, #f43f5e)",
   ];
   let hash = 0;
   for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
   return palettes[Math.abs(hash) % palettes.length];
}

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function AdminSecurityPage() {
   const { user, isLoading: authLoading } = useAuth();

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         redirect("/dashboard");
      }
   }, [user, authLoading]);

   const enabled = !!user && isAdmin(user.role);

   const { data: enforcementData } = useQuery({
      queryKey: ["admin", "enforcement-mode"],
      queryFn: () => roleService.getEnforcementMode(),
      enabled,
      staleTime: 60_000,
   });

   const currentMode: EnforcementMode =
      enforcementData?.enforcement_mode ?? "off";

   // Main list for the table — a page of recent events, filtered client-side
   // to the security whitelist.
   const { data, isLoading } = useQuery({
      queryKey: ["admin", "security-events"],
      queryFn: () => adminService.listAuditLogs({ page_size: 100 }),
      enabled,
      staleTime: 30_000,
   });

   // Server-filtered count of failed sign-ins in the last 24h. Uses
   // page_size: 1 and reads meta.total — avoids fetching the rows. The
   // 24h cutoff is computed inside queryFn (not render) so the window
   // slides forward naturally on each refetch.
   const { data: failedLogins24h } = useQuery({
      queryKey: ["admin", "failed-logins-24h"],
      queryFn: async () => {
         const r = await adminService.listAuditLogs({
            action: "auth.login_failed",
            date_from: new Date(Date.now() - 86_400_000).toISOString(),
            page_size: 1,
         });
         return r.meta.total;
      },
      enabled,
      staleTime: 30_000,
   });

   // Total audit events across the whole system — same meta.total trick.
   const { data: totalEvents } = useQuery({
      queryKey: ["admin", "audit-total"],
      queryFn: async () => {
         const r = await adminService.listAuditLogs({ page_size: 1 });
         return r.meta.total;
      },
      enabled,
      staleTime: 60_000,
   });

   // Shared cache with /admin and /admin/users — gives us totp_enabled_count
   // and total_users for the "N of M" 2FA display.
   const { data: stats } = useQuery({
      queryKey: ["admin", "stats"],
      queryFn: () => adminService.getStats(),
      enabled,
      staleTime: 60_000,
   });

   const allLogs: AuditLog[] = data?.data ?? [];
   const logs = allLogs.filter((l) => isSecurityEvent(l.action));
   const highCount = logs.filter((l) => l.severity === "high").length;

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
            title='Security Center'
            titleIcon={<Shield size={22} strokeWidth={1.75} />}
            subtitle={<span>Monitor security events and system protection</span>}
            actions={
               <DcButton
                  variant='primary'
                  icon={<Download size={14} strokeWidth={2} />}
               >
                  Export Report
               </DcButton>
            }
         />

         {/* ── Stats strip ──────────────────────────────────────── */}
         <StatsStrip>
            <Stat
               label='High severity'
               labelIcon={
                  <AlertTriangle
                     size={12}
                     strokeWidth={1.75}
                     style={{
                        color:
                           highCount > 0 ? "var(--dc-danger)" : "var(--dc-accent)",
                     }}
                  />
               }
               value={isLoading ? "—" : highCount.toString()}
               valueColor={
                  highCount === 0 ? "var(--dc-accent)" : "var(--dc-danger)"
               }
               trend={highCount > 0 ? "Requires attention" : "All clear"}
            />
            <Stat
               label='Failed logins'
               labelIcon={
                  <XCircle
                     size={12}
                     strokeWidth={1.75}
                     style={{
                        color:
                           (failedLogins24h ?? 0) > 0
                              ? "var(--dc-danger)"
                              : "var(--dc-accent)",
                     }}
                  />
               }
               value={failedLogins24h == null ? "—" : failedLogins24h.toString()}
               valueColor={
                  (failedLogins24h ?? 0) === 0
                     ? "var(--dc-accent)"
                     : "var(--dc-danger)"
               }
               trend='Last 24h'
            />
            <Stat
               label='2FA enabled'
               labelIcon={
                  <ShieldCheck
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-info)" }}
                  />
               }
               value={
                  stats?.totp_enabled_count == null
                     ? "—"
                     : stats.total_users
                     ? `${stats.totp_enabled_count} of ${stats.total_users}`
                     : stats.totp_enabled_count.toString()
               }
               trend={
                  stats?.total_users && stats.totp_enabled_count != null
                     ? `${Math.round(
                          (stats.totp_enabled_count / stats.total_users) * 100
                       )}% coverage`
                     : "2FA adoption"
               }
            />
            <Stat
               label='Total events'
               labelIcon={
                  <Activity
                     size={12}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-accent)" }}
                  />
               }
               value={
                  totalEvents == null ? "—" : totalEvents.toLocaleString()
               }
               trend='All-time'
            />
         </StatsStrip>

         {/* ── Enforcement mode ────────────────────────────────── */}
         <div className='mb-4'>
            <Panel
               title='Role Permission Enforcement'
               titleIcon={
                  <Lock
                     size={13}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-accent)" }}
                  />
               }
               subtitle='Current enforcement mode (read-only). Changes are applied via admin CLI.'
               bodyClassName='p-3.5'
            >
               <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
                  {ENFORCEMENT_MODES.map((mode) => {
                     const active = currentMode === mode.value;
                     return (
                        <div
                           key={mode.value}
                           className='p-3.5 rounded-lg'
                           style={{
                              background: active
                                 ? mode.soft
                                 : "var(--dc-surface-2)",
                              border: active
                                 ? `1px solid ${mode.border}`
                                 : "1px solid var(--dc-border)",
                              opacity: active ? 1 : 0.55,
                           }}
                        >
                           <div className='flex items-center justify-between mb-1.5'>
                              <span
                                 className='text-[14px] font-semibold'
                                 style={{ color: "var(--dc-text)" }}
                              >
                                 {mode.label}
                              </span>
                              {active && (
                                 <span
                                    className='inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.06em]'
                                    style={{
                                       background: `${mode.accent}22`,
                                       color: mode.accent,
                                       border: `1px solid ${mode.accent}44`,
                                    }}
                                 >
                                    Active
                                 </span>
                              )}
                           </div>
                           <p
                              className='text-[11.5px] leading-relaxed'
                              style={{ color: "var(--dc-text-dim)" }}
                           >
                              {mode.description}
                           </p>
                        </div>
                     );
                  })}
               </div>
            </Panel>
         </div>

         {/* ── Recent security events ──────────────────────────── */}
         <Panel
            title='Recent Security Events'
            subtitle='Real-time security monitoring and alerts'
            flushBody
         >
            {isLoading ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Loading security events…
               </div>
            ) : logs.length === 0 ? (
               <div
                  className='py-12 text-center text-[13px]'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  No security events in the most recent activity.
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
                           <Th>Event</Th>
                           <Th>User</Th>
                           <Th>IP address</Th>
                           <Th>Severity</Th>
                           <Th>Time</Th>
                           <Th style={{ width: 90 }} align='right'>
                              Actions
                           </Th>
                        </tr>
                     </thead>
                     <tbody>
                        {logs.map((event) => (
                           <tr
                              key={event.id}
                              className='transition-colors'
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
                                 <div className='flex items-center gap-2.5 min-w-0'>
                                    <div
                                       className='w-7 h-7 rounded-full flex items-center justify-center shrink-0'
                                       style={{
                                          background:
                                             (event.severity &&
                                                SEVERITY_STYLE[event.severity]
                                                   ?.bg) ||
                                             "var(--dc-surface-2)",
                                          color:
                                             (event.severity &&
                                                SEVERITY_STYLE[event.severity]
                                                   ?.color) ||
                                             "var(--dc-text-muted)",
                                       }}
                                    >
                                       {getEventIcon(event.action)}
                                    </div>
                                    <span
                                       className='text-[12.5px] font-medium truncate'
                                       style={{ color: "var(--dc-text)" }}
                                       title={event.action}
                                    >
                                       {actionLabel(event.action)}
                                    </span>
                                 </div>
                              </Td>
                              <Td>
                                 {event.user_email ? (
                                    <div className='flex items-center gap-2 min-w-0'>
                                       <div
                                          className='w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold shrink-0'
                                          style={{
                                             background: avatarGradient(
                                                event.user_email ?? event.user_id ?? ""
                                             ),
                                          }}
                                       >
                                          {(event.user_name?.[0] ??
                                             event.user_email?.[0] ??
                                             "?").toUpperCase()}
                                       </div>
                                       <div className='min-w-0'>
                                          <div
                                             className='text-[12.5px] font-medium truncate'
                                             style={{ color: "var(--dc-text)" }}
                                          >
                                             {event.user_name || "—"}
                                          </div>
                                          <div
                                             className='text-[11px] truncate'
                                             style={{
                                                color: "var(--dc-text-dim)",
                                             }}
                                          >
                                             {event.user_email}
                                          </div>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className='flex items-center gap-2'>
                                       <div
                                          className='w-6 h-6 rounded-full flex items-center justify-center shrink-0'
                                          style={{
                                             background: "var(--dc-surface-2)",
                                             color: "var(--dc-text-faint)",
                                             border: "1px solid var(--dc-border)",
                                          }}
                                       >
                                          <User size={10} strokeWidth={1.75} />
                                       </div>
                                       <span style={{ color: "var(--dc-text-faint)" }}>
                                          system
                                       </span>
                                    </div>
                                 )}
                              </Td>
                              <Td
                                 style={{
                                    fontFamily: "var(--dc-font-mono)",
                                    color: "var(--dc-text-muted)",
                                    fontSize: 12,
                                 }}
                              >
                                 {event.ip_address || "—"}
                              </Td>
                              <Td>
                                 {event.severity ? (
                                    <span
                                       className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                                       style={{
                                          color:
                                             SEVERITY_STYLE[event.severity]?.color ??
                                             "var(--dc-text-muted)",
                                          background:
                                             SEVERITY_STYLE[event.severity]?.bg ??
                                             "var(--dc-surface-2)",
                                          border: `1px solid ${
                                             SEVERITY_STYLE[event.severity]?.border ??
                                             "var(--dc-border)"
                                          }`,
                                       }}
                                    >
                                       {event.severity}
                                    </span>
                                 ) : (
                                    <span style={{ color: "var(--dc-text-faint)" }}>
                                       —
                                    </span>
                                 )}
                              </Td>
                              <Td style={{ color: "var(--dc-text-muted)" }}>
                                 {formatRelativeTime(event.created_at)}
                              </Td>
                              <Td align='right'>
                                 <DcButton variant='ghost' size='sm'>
                                    Details
                                 </DcButton>
                              </Td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            )}
         </Panel>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// Inline helpers
// ─────────────────────────────────────────────────────────────────────

const Th: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
   align?: "left" | "right";
}> = ({ children, style, align = "left" }) => (
   <th
      className='px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.06em] whitespace-nowrap'
      style={{ color: "var(--dc-text-dim)", textAlign: align, ...style }}
   >
      {children}
   </th>
);

const Td: FC<{
   children?: ReactNode;
   style?: React.CSSProperties;
   align?: "left" | "right";
}> = ({ children, style, align = "left" }) => (
   <td
      className='px-4 py-2.5 align-middle whitespace-nowrap'
      style={{ color: "var(--dc-text)", textAlign: align, ...style }}
   >
      {children}
   </td>
);
