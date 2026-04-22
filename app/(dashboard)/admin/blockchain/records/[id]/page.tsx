"use client";

import { FC, ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { adminService } from "@/lib/services/adminService";
import { formatDateTime } from "@/lib/utils/format";
import {
   ArrowLeft,
   Check,
   CheckCircle,
   Clock,
   Copy,
   ExternalLink,
   Eye,
   Hash,
   Link as LinkIcon,
   User,
   XCircle,
} from "lucide-react";
import { DcButton, Panel } from "@/components/design/primitives";

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<
   string,
   { color: string; bg: string; border: string; Icon: typeof CheckCircle; label: string }
> = {
   confirmed: {
      color: "var(--dc-accent)",
      bg: "var(--dc-accent-soft)",
      border: "var(--dc-accent-border)",
      Icon: CheckCircle,
      label: "confirmed",
   },
   pending: {
      color: "var(--dc-warn)",
      bg: "var(--dc-warn-soft)",
      border: "var(--dc-warn-border)",
      Icon: Clock,
      label: "pending",
   },
   failed: {
      color: "var(--dc-danger)",
      bg: "var(--dc-danger-soft)",
      border: "var(--dc-danger-border)",
      Icon: XCircle,
      label: "failed",
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

function duration(from: string, to: string): string {
   const ms = new Date(to).getTime() - new Date(from).getTime();
   if (ms < 0) return "—";
   if (ms < 1000) return `${ms}ms`;
   return `${(ms / 1000).toFixed(1)}s`;
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
// Copy button — subtle, inline
// ─────────────────────────────────────────────────────────────────────
const CopyButton: FC<{ value: string }> = ({ value }) => {
   const [copied, setCopied] = useState(false);
   return (
      <button
         type='button'
         onClick={async (e) => {
            e.stopPropagation();
            try {
               await navigator.clipboard.writeText(value);
               setCopied(true);
               setTimeout(() => setCopied(false), 1600);
            } catch {
               /* clipboard denied */
            }
         }}
         aria-label='Copy to clipboard'
         title='Copy'
         className='inline-flex items-center justify-center h-[22px] w-[22px] rounded transition-colors shrink-0'
         style={{ color: "var(--dc-text-muted)" }}
         onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--dc-surface-2)";
            e.currentTarget.style.color = "var(--dc-text)";
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--dc-text-muted)";
         }}
      >
         {copied ? (
            <Check
               size={12}
               strokeWidth={2.25}
               style={{ color: "var(--dc-accent)" }}
            />
         ) : (
            <Copy size={12} strokeWidth={1.75} />
         )}
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function BlockchainRecordDetailPage() {
   const { id } = useParams<{ id: string }>();
   const router = useRouter();
   const { user, isLoading: authLoading } = useAuth();

   useEffect(() => {
      if (!authLoading && (!user || !isAdmin(user.role))) {
         router.push("/dashboard");
      }
   }, [user, authLoading, router]);

   const { data: record, isLoading, isError } = useQuery({
      queryKey: ["admin", "blockchain", "record", id],
      queryFn: () => adminService.getBlockchainRecord(id),
      enabled: !!id && !!user && isAdmin(user.role),
      staleTime: 60_000,
   });

   if (authLoading || (!record && isLoading)) {
      return (
         <div className='flex items-center justify-center min-h-[60vh]'>
            <div
               className='w-10 h-10 rounded-full border-b-2 animate-spin'
               style={{ borderColor: "var(--dc-accent)" }}
            />
         </div>
      );
   }

   if (isError || (!isLoading && !record)) {
      return (
         <div className='flex flex-col items-center justify-center min-h-[60vh] gap-3'>
            <p style={{ color: "var(--dc-text-dim)" }}>Record not found.</p>
            <Link
               href='/admin/blockchain'
               className='text-[13px] flex items-center gap-1'
               style={{ color: "var(--dc-accent)" }}
            >
               <ArrowLeft size={14} strokeWidth={1.75} />
               Back to Blockchain Monitor
            </Link>
         </div>
      );
   }

   if (!record) return null;

   const statusCfg = STATUS_STYLE[record.status];
   const StatusIcon = statusCfg?.Icon;
   const ownerName =
      `${record.owner.first_name} ${record.owner.last_name}`.trim() ||
      record.owner.email;

   const confirmLatency =
      record.submitted_at && record.confirmed_at
         ? duration(record.submitted_at, record.confirmed_at)
         : null;
   const totalLatency =
      record.created_at && record.confirmed_at
         ? duration(record.created_at, record.confirmed_at)
         : null;

   return (
      <div className='animate-[fadeIn_280ms_cubic-bezier(.4,0,.2,1)] max-w-[760px] mx-auto'>
         {/* ── Breadcrumb-style back nav ────────────────────────── */}
         <div
            className='flex items-center gap-2 mb-3 text-[13px]'
            style={{ color: "var(--dc-text-muted)" }}
         >
            <button
               type='button'
               onClick={() => router.push("/admin/blockchain")}
               className='flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors'
               style={{ color: "var(--dc-text-muted)" }}
               onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--dc-surface-2)";
                  e.currentTarget.style.color = "var(--dc-text)";
               }}
               onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--dc-text-muted)";
               }}
            >
               <ArrowLeft size={14} strokeWidth={1.75} />
               Blockchain Monitor
            </button>
            <span style={{ color: "var(--dc-text-faint)" }}>/</span>
            <span
               style={{
                  fontFamily: "var(--dc-font-mono)",
                  fontSize: 12,
                  color: "var(--dc-text-dim)",
               }}
            >
               {record.tx_id.slice(0, 16)}…
            </span>
         </div>

         {/* ── Header ───────────────────────────────────────────── */}
         <div className='flex items-start justify-between gap-4 flex-wrap mb-5'>
            <div className='min-w-0'>
               <div className='flex items-center gap-2 flex-wrap mb-2.5'>
                  {statusCfg && (
                     <span
                        className='inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                        style={{
                           color: statusCfg.color,
                           background: statusCfg.bg,
                           border: `1px solid ${statusCfg.border}`,
                        }}
                     >
                        {StatusIcon && <StatusIcon size={10} strokeWidth={2} />}
                        {record.status}
                     </span>
                  )}
                  <span
                     className='inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium'
                     style={typeStyle(record.record_type)}
                  >
                     {record.record_type}
                  </span>
                  {record.block_number && (
                     <span
                        className='text-[12px]'
                        style={{
                           color: "var(--dc-text-dim)",
                        }}
                     >
                        Block{" "}
                        <span
                           style={{
                              fontFamily: "var(--dc-font-mono)",
                              color: "var(--dc-text)",
                           }}
                        >
                           #{record.block_number.toLocaleString()}
                        </span>
                     </span>
                  )}
               </div>
               <h1
                  className='text-[24px] font-semibold tracking-[-0.02em] m-0'
                  style={{
                     color: "var(--dc-text)",
                     fontFamily: "var(--dc-font-display)",
                  }}
               >
                  {record.document_title}
               </h1>
               <p
                  className='text-[13px] mt-1'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  Version {record.version_number}
               </p>
            </div>
            <DcButton
               variant='primary'
               icon={<Eye size={14} strokeWidth={2} />}
               onClick={() => router.push(`/documents/${record.document_id}`)}
            >
               View Document
            </DcButton>
         </div>

         {/* ── Transaction panel ────────────────────────────────── */}
         <div className='mb-3.5'>
            <Panel
               title='Transaction'
               titleIcon={
                  <LinkIcon
                     size={13}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-text-muted)" }}
                  />
               }
               flushBody
            >
               <KVRow label='Transaction ID'>
                  <span
                     className='truncate'
                     style={{
                        fontFamily: "var(--dc-font-mono)",
                        fontSize: 11.5,
                        color: "var(--dc-text)",
                     }}
                  >
                     {record.tx_id}
                  </span>
                  <CopyButton value={record.tx_id} />
               </KVRow>
               <KVRow label='Record ID'>
                  <span
                     className='truncate'
                     style={{
                        fontFamily: "var(--dc-font-mono)",
                        fontSize: 11.5,
                        color: "var(--dc-text-muted)",
                     }}
                  >
                     {record.id}
                  </span>
                  <CopyButton value={record.id} />
               </KVRow>
               <KVRow label='Block'>
                  <span
                     style={{
                        fontFamily: "var(--dc-font-mono)",
                        color: "var(--dc-text)",
                     }}
                  >
                     {record.block_number != null
                        ? `#${record.block_number.toLocaleString()}`
                        : "—"}
                  </span>
               </KVRow>
               <KVRow label='Status' last>
                  {statusCfg && (
                     <span
                        className='inline-flex items-center gap-1 h-5 px-2 rounded-full text-[11px] font-medium capitalize'
                        style={{
                           color: statusCfg.color,
                           background: statusCfg.bg,
                           border: `1px solid ${statusCfg.border}`,
                        }}
                     >
                        {StatusIcon && <StatusIcon size={10} strokeWidth={2} />}
                        {record.status}
                     </span>
                  )}
               </KVRow>
            </Panel>
         </div>

         {/* ── Cryptographic proof ──────────────────────────────── */}
         <div className='mb-3.5'>
            <Panel
               title='Cryptographic Proof'
               titleIcon={
                  <Hash
                     size={13}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-text-muted)" }}
                  />
               }
               flushBody
            >
               <KVRow label='SHA-256 Hash'>
                  <code
                     className='px-2 py-1 rounded flex-1 min-w-0 break-all'
                     style={{
                        fontFamily: "var(--dc-font-mono)",
                        fontSize: 11.5,
                        background: "var(--dc-surface-2)",
                        color: "var(--dc-text)",
                        border: "1px solid var(--dc-border)",
                     }}
                  >
                     {record.file_hash}
                  </code>
                  <CopyButton value={record.file_hash} />
               </KVRow>
               <KVRow label='Version ID' last>
                  <span
                     className='truncate'
                     style={{
                        fontFamily: "var(--dc-font-mono)",
                        fontSize: 11.5,
                        color: "var(--dc-text-muted)",
                     }}
                  >
                     {record.version_id}
                  </span>
                  <CopyButton value={record.version_id} />
               </KVRow>
            </Panel>
         </div>

         {/* ── Timeline ─────────────────────────────────────────── */}
         <div className='mb-3.5'>
            <Panel
               title='Timeline'
               titleIcon={
                  <Clock
                     size={13}
                     strokeWidth={1.75}
                     style={{ color: "var(--dc-text-muted)" }}
                  />
               }
               bodyClassName='p-4'
            >
               <TimelineStep
                  title='Created'
                  time={record.created_at}
                  delta={null}
                  isFirst
               />
               {record.submitted_at && (
                  <TimelineStep
                     title='Submitted to chain'
                     time={record.submitted_at}
                     delta={duration(record.created_at, record.submitted_at)}
                  />
               )}
               {record.confirmed_at && (
                  <TimelineStep
                     title='Confirmed'
                     time={record.confirmed_at}
                     delta={confirmLatency}
                     isLast
                     active={record.status === "confirmed"}
                  />
               )}
               {totalLatency && (
                  <div
                     className='mt-3 pt-3 text-[12px]'
                     style={{
                        borderTop: "1px solid var(--dc-border)",
                        color: "var(--dc-text-dim)",
                     }}
                  >
                     Total confirmation time:{" "}
                     <strong
                        style={{
                           color: "var(--dc-text)",
                           fontFamily: "var(--dc-font-mono)",
                        }}
                     >
                        {totalLatency}
                     </strong>
                  </div>
               )}
            </Panel>
         </div>

         {/* ── Owner ────────────────────────────────────────────── */}
         <Panel
            title='Document Owner'
            titleIcon={
               <User
                  size={13}
                  strokeWidth={1.75}
                  style={{ color: "var(--dc-text-muted)" }}
               />
            }
            bodyClassName='p-3'
         >
            <div
               className='flex items-center gap-2.5 px-3 py-2.5 rounded-md transition-colors'
               onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--dc-surface-2)")
               }
               onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
               }
            >
               <div
                  className='w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-semibold shrink-0'
                  style={{
                     background: avatarGradient(record.owner.email),
                  }}
               >
                  {(record.owner.first_name?.[0] ?? record.owner.email[0]).toUpperCase()}
               </div>
               <div className='flex-1 min-w-0'>
                  <div
                     className='text-[13px] font-medium truncate'
                     style={{ color: "var(--dc-text)" }}
                  >
                     {ownerName}
                  </div>
                  <div
                     className='text-[11.5px] truncate'
                     style={{ color: "var(--dc-text-dim)" }}
                  >
                     {record.owner.email}
                  </div>
               </div>
               <Link
                  href='/admin/users'
                  className='inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded-md transition-colors'
                  style={{ color: "var(--dc-text-muted)" }}
                  title='Open in user management'
                  onMouseEnter={(e) =>
                     (e.currentTarget.style.color = "var(--dc-text)")
                  }
                  onMouseLeave={(e) =>
                     (e.currentTarget.style.color = "var(--dc-text-muted)")
                  }
               >
                  <ExternalLink size={11} strokeWidth={1.75} />
                  Users
               </Link>
            </div>
         </Panel>
      </div>
   );
}

// ─────────────────────────────────────────────────────────────────────
// KV row inside a panel (label column + value column, hairline border)
// ─────────────────────────────────────────────────────────────────────
const KVRow: FC<{
   label: string;
   children: ReactNode;
   last?: boolean;
}> = ({ label, children, last }) => (
   <div
      className='grid grid-cols-[140px_1fr] items-center gap-3 px-4 py-2.5'
      style={{
         borderBottom: last ? "none" : "1px solid var(--dc-border)",
      }}
   >
      <div className='text-[12px]' style={{ color: "var(--dc-text-dim)" }}>
         {label}
      </div>
      <div
         className='flex items-center gap-1.5 min-w-0'
         style={{ color: "var(--dc-text)" }}
      >
         {children}
      </div>
   </div>
);

// ─────────────────────────────────────────────────────────────────────
// Timeline step — line + dot + title + time + delta chip
// ─────────────────────────────────────────────────────────────────────
const TimelineStep: FC<{
   title: string;
   time: string;
   delta: string | null;
   isFirst?: boolean;
   isLast?: boolean;
   active?: boolean;
}> = ({ title, time, delta, isLast, active }) => (
   <div className='flex items-start gap-3.5 mb-3.5'>
      <div className='flex flex-col items-center w-3 shrink-0'>
         <div
            className='w-3 h-3 rounded-full mt-0.5'
            style={{
               border: active ? "none" : "1.5px solid var(--dc-border-strong)",
               background: active ? "var(--dc-accent)" : "transparent",
               boxShadow: active ? "0 0 0 4px var(--dc-accent-soft)" : "none",
            }}
         />
         {!isLast && (
            <div
               className='w-px flex-1 mt-1 min-h-[16px]'
               style={{ background: "var(--dc-border)" }}
            />
         )}
      </div>
      <div className='flex-1 min-w-0 flex items-start justify-between gap-3'>
         <div className='min-w-0'>
            <div
               className='text-[13px] font-medium'
               style={{ color: "var(--dc-text)" }}
            >
               {title}
            </div>
            <div
               className='text-[11.5px] mt-0.5'
               style={{
                  fontFamily: "var(--dc-font-mono)",
                  color: "var(--dc-text-dim)",
               }}
            >
               {formatDateTime(time)}
            </div>
         </div>
         {delta && (
            <span
               className='text-[11px] shrink-0'
               style={{
                  fontFamily: "var(--dc-font-mono)",
                  color: "var(--dc-text-dim)",
                  background: "var(--dc-surface-2)",
                  border: "1px solid var(--dc-border)",
                  padding: "2px 6px",
                  borderRadius: 4,
               }}
            >
               +{delta}
            </span>
         )}
      </div>
   </div>
);
