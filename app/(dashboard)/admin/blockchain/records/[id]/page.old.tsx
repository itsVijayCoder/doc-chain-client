"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { adminService } from "@/lib/services/adminService";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  Check,
  Link as LinkIcon,
  FileText,
  User,
  Hash,
  Layers,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── helpers ────────────────────────────────────────────────────────────────

function statusBadgeClass(status: string) {
  switch (status) {
    case "confirmed": return "bg-green-500/10 text-green-500 border-green-500/20";
    case "pending":   return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "failed":    return "bg-red-500/10 text-red-500 border-red-500/20";
    default:          return "";
  }
}

function statusIcon(status: string) {
  if (status === "confirmed") return <CheckCircle className="h-4 w-4" />;
  if (status === "pending")   return <Clock className="h-4 w-4" />;
  return <XCircle className="h-4 w-4" />;
}

function typeColor(type: string) {
  if (type.includes("verif"))  return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (type.includes("update")) return "bg-purple-500/10 text-purple-500 border-purple-500/20";
  return "bg-orange-500/10 text-orange-500 border-orange-500/20";
}

/** Duration between two ISO strings in human-readable form */
function duration(from: string, to: string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  if (ms < 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

// ─── Copy button ────────────────────────────────────────────────────────────

function CopyButton({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard denied */ }
  };
  return (
    <button
      onClick={copy}
      title="Copy to clipboard"
      className={cn(
        "inline-flex items-center justify-center h-7 w-7 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─── Section card ────────────────────────────────────────────────────────────

function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-muted/30">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2 border-b last:border-0">
      <span className="w-32 shrink-0 text-xs text-muted-foreground pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (isError || (!isLoading && !record)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Record not found.</p>
        <Link href="/admin/blockchain" className="text-sm text-primary hover:underline">
          ← Back to Blockchain Monitor
        </Link>
      </div>
    );
  }

  if (!record) return null;

  const ownerName = `${record.owner.first_name} ${record.owner.last_name}`.trim() || record.owner.email;

  // Confirmation latency: submitted_at → confirmed_at (if both present)
  const confirmLatency =
    record.submitted_at && record.confirmed_at
      ? duration(record.submitted_at, record.confirmed_at)
      : null;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/blockchain" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Blockchain Monitor
        </Link>
        <span>/</span>
        <span className="font-mono">{record.tx_id.slice(0, 16)}…</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("gap-1", statusBadgeClass(record.status))}>
              {statusIcon(record.status)}
              {record.status}
            </Badge>
            <Badge variant="outline" className={typeColor(record.record_type)}>
              {record.record_type}
            </Badge>
            {record.block_number && (
              <span className="text-sm text-muted-foreground font-mono">
                Block #{record.block_number.toLocaleString()}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{record.document_title}</h1>
          <p className="text-sm text-muted-foreground">Version {record.version_number}</p>
        </div>
        <Link
          href={`/documents/${record.document_id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Document
        </Link>
      </div>

      {/* Transaction details */}
      <Section title="Transaction" icon={<LinkIcon className="h-4 w-4" />}>
        <Row label="Transaction ID">
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm break-all">{record.tx_id}</span>
            <CopyButton value={record.tx_id} />
          </div>
        </Row>
        <Row label="Record ID">
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm text-muted-foreground">{record.id}</span>
            <CopyButton value={record.id} />
          </div>
        </Row>
        <Row label="Block">
          <span className="font-mono text-sm">
            {record.block_number != null ? `#${record.block_number.toLocaleString()}` : "—"}
          </span>
        </Row>
        <Row label="Status">
          <Badge variant="outline" className={cn("gap-1 text-xs", statusBadgeClass(record.status))}>
            {statusIcon(record.status)}
            {record.status}
          </Badge>
        </Row>
      </Section>

      {/* Cryptographic proof */}
      <Section title="Cryptographic Proof" icon={<Hash className="h-4 w-4" />}>
        <Row label="SHA-256 Hash">
          <div className="flex items-start gap-1">
            <code className="font-mono text-xs bg-muted px-2 py-1.5 rounded break-all flex-1">
              {record.file_hash}
            </code>
            <CopyButton value={record.file_hash} className="mt-0.5 shrink-0" />
          </div>
        </Row>
        <Row label="Version ID">
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm text-muted-foreground">{record.version_id}</span>
            <CopyButton value={record.version_id} />
          </div>
        </Row>
      </Section>

      {/* Timeline */}
      <Section title="Timeline" icon={<Clock className="h-4 w-4" />}>
        <div className="space-y-0">
          <TimelineRow
            label="Created"
            time={record.created_at}
            delta={null}
            isFirst
          />
          {record.submitted_at && (
            <TimelineRow
              label="Submitted to chain"
              time={record.submitted_at}
              delta={duration(record.created_at, record.submitted_at)}
            />
          )}
          {record.confirmed_at && (
            <TimelineRow
              label="Confirmed"
              time={record.confirmed_at}
              delta={confirmLatency}
              isLast
              highlight={record.status === "confirmed"}
            />
          )}
        </div>
        {confirmLatency && (
          <p className="mt-3 text-xs text-muted-foreground border-t pt-3">
            Total confirmation time: <span className="font-medium text-foreground">{confirmLatency}</span>
          </p>
        )}
      </Section>

      {/* Owner */}
      <Section title="Document Owner" icon={<User className="h-4 w-4" />}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-primary">
              {(record.owner.first_name?.[0] ?? record.owner.email[0]).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium">{ownerName}</p>
            <p className="text-sm text-muted-foreground">{record.owner.email}</p>
          </div>
          <Link
            href={`/admin/users`}
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
            title="View in user management"
          >
            <ExternalLink className="h-3 w-3" />
            Users
          </Link>
        </div>
      </Section>
    </div>
  );
}

// ─── Timeline row ─────────────────────────────────────────────────────────────

function TimelineRow({
  label,
  time,
  delta,
  isFirst = false,
  isLast = false,
  highlight = false,
}: {
  label: string;
  time: string;
  delta: string | null;
  isFirst?: boolean;
  isLast?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 py-2.5">
      {/* Line + dot */}
      <div className="flex flex-col items-center w-4 shrink-0">
        <div className={cn(
          "w-2.5 h-2.5 rounded-full border-2 mt-0.5",
          highlight
            ? "border-green-500 bg-green-500/20"
            : "border-muted-foreground/50 bg-background"
        )} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[1.5rem]" />}
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground font-mono">{formatDateTime(time)}</p>
      </div>
      {/* Delta badge */}
      {delta && (
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 mt-0.5">
          +{delta}
        </span>
      )}
    </div>
  );
}
