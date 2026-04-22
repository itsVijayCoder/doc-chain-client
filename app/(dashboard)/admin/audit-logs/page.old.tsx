"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Download,
  Filter,
  User,
  Activity,
  Shield,
  Database,
  Edit,
  Trash,
  Share,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { adminService, type AuditLog } from "@/lib/services/adminService";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────

function getActionIcon(action: string) {
  if (action.includes("create") || action.includes("upload")) return <FileText className="h-3.5 w-3.5" />;
  if (action.includes("update") || action.includes("edit"))   return <Edit className="h-3.5 w-3.5" />;
  if (action.includes("delete") || action.includes("trash"))  return <Trash className="h-3.5 w-3.5" />;
  if (action.includes("share") || action.includes("permission")) return <Share className="h-3.5 w-3.5" />;
  if (action.includes("verify") || action.includes("blockchain")) return <Shield className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

function getActionColor(action: string) {
  if (action.includes("create") || action.includes("upload"))    return "bg-green-500/10 text-green-600 border-green-500/20";
  if (action.includes("update") || action.includes("edit"))      return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (action.includes("delete") || action.includes("trash"))     return "bg-red-500/10 text-red-600 border-red-500/20";
  if (action.includes("share") || action.includes("permission")) return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  if (action.includes("verify") || action.includes("blockchain")) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
  return "bg-gray-500/10 text-gray-600 border-gray-500/20";
}

function getEntityIcon(entityType: string) {
  switch (entityType) {
    case "document":   return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
    case "user":       return <User className="h-3.5 w-3.5 text-muted-foreground" />;
    case "blockchain": return <Database className="h-3.5 w-3.5 text-muted-foreground" />;
    default:           return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

function getSeverityColor(severity?: string) {
  switch (severity) {
    case "high":   return "bg-red-500/10 text-red-500 border-red-500/20";
    case "medium": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    case "low":    return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    default:       return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
}

/** snake_case → Title Case */
function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Parse user agent string into readable browser + OS */
function parseUserAgent(ua?: string): string {
  if (!ua) return "—";
  if (ua.includes("Edg/"))     return `Edge ${ua.match(/Edg\/([\d]+)/)?.[1] ?? ""}`.trim();
  if (ua.includes("Chrome/"))  {
    const v = ua.match(/Chrome\/([\d]+)/)?.[1] ?? "";
    const os = ua.includes("Mac") ? " / macOS" : ua.includes("Win") ? " / Windows" : ua.includes("Linux") ? " / Linux" : "";
    return `Chrome ${v}${os}`;
  }
  if (ua.includes("Firefox/")) return `Firefox ${ua.match(/Firefox\/([\d]+)/)?.[1] ?? ""}`.trim();
  if (ua.includes("Safari/"))  return `Safari ${ua.match(/Version\/([\d]+)/)?.[1] ?? ""}`.trim();
  return ua.length > 60 ? `${ua.slice(0, 60)}…` : ua;
}

/** Entity ID → clickable link path, or null */
function entityLinkPath(entityType: string, entityId?: string): string | null {
  if (!entityId) return null;
  if (entityType === "document") return `/documents/${entityId}`;
  if (entityType === "user")     return `/admin/users`;
  return null;
}

// ─── Accordion expand row ─────────────────────────────────────────────────

function AccordionRow({ log }: { log: AuditLog }) {
  const metaEntries = log.metadata
    ? Object.entries(log.metadata).filter(([, v]) => v !== null && v !== undefined && v !== "")
    : [];

  const linkPath = entityLinkPath(log.entity_type, log.entity_id);

  return (
    <tr className="bg-muted/20 border-b">
      <td colSpan={6} className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3 text-sm">

          {/* Metadata key-value pairs — most valuable */}
          {metaEntries.length > 0 && (
            <div className="lg:col-span-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Details
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
                {metaEntries.map(([k, v]) => (
                  <div key={k} className="flex gap-2 min-w-0">
                    <span className="text-xs text-muted-foreground shrink-0 w-28 pt-0.5 truncate">
                      {humanizeKey(k)}
                    </span>
                    <span className="text-xs font-medium break-words flex-1">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider if metadata present */}
          {metaEntries.length > 0 && (
            <div className="lg:col-span-3 border-t my-1" />
          )}

          {/* Entity ID */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Entity ID</p>
            {linkPath ? (
              <Link
                href={linkPath}
                className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
              >
                {log.entity_id?.slice(0, 20)}…
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <span className="text-xs font-mono text-muted-foreground">
                {log.entity_id ?? "—"}
              </span>
            )}
          </div>

          {/* Email */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
            <span className="text-xs">{log.user_email || "—"}</span>
          </div>

          {/* IP Address */}
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">IP Address</p>
            <span className="text-xs font-mono">{log.ip_address || "—"}</span>
          </div>

          {/* User Agent */}
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-xs text-muted-foreground mb-0.5">Client</p>
            <span className="text-xs">{parseUserAgent(log.user_agent)}</span>
          </div>

        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAuditLogsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user.role))) {
      redirect("/dashboard");
    }
  }, [user, authLoading]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: () => adminService.listAuditLogs({ page_size: 50 }),
    enabled: !!user && isAdmin(user.role),
    staleTime: 30_000,
  });

  const logs = data?.data ?? [];
  const total = data?.meta.total ?? 0;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await adminService.exportAuditLogs();
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

  // Derive stat counts from loaded page
  const docActionCount = logs.filter((l) => l.entity_type === "document").length;
  const highSeverityCount = logs.filter((l) => l.severity === "high").length;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user || !isAdmin(user.role)) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete activity trail and system audit logs
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Total Events</p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : total.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Unique Users</p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : new Set(logs.map((l) => l.user_id).filter(Boolean)).size}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In current page</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">Document Actions</p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : docActionCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In current page</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">High Severity</p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : highSeverityCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In current page</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search audit logs..." className="pl-9" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Activity Log</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Click any row to expand details. {expandedRows.size > 0 && `${expandedRows.size} expanded.`}
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading audit logs…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Entity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Severity</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const expanded = expandedRows.has(log.id);
                  return (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => toggleRow(log.id)}
                        className={cn(
                          "border-b cursor-pointer transition-colors",
                          expanded ? "bg-muted/30" : "hover:bg-muted/50"
                        )}
                      >
                        {/* Chevron */}
                        <td className="w-10 px-4 py-4 text-muted-foreground">
                          {expanded
                            ? <ChevronDown className="h-4 w-4" />
                            : <ChevronRight className="h-4 w-4" />}
                        </td>

                        {/* Action */}
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={cn("gap-1 text-xs", getActionColor(log.action))}>
                            {getActionIcon(log.action)}
                            {log.action}
                          </Badge>
                        </td>

                        {/* User */}
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium">{log.user_name || "—"}</p>
                        </td>

                        {/* Entity type */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            {getEntityIcon(log.entity_type)}
                            <span className="text-sm capitalize">{log.entity_type}</span>
                          </div>
                        </td>

                        {/* Severity */}
                        <td className="px-4 py-4">
                          {log.severity ? (
                            <Badge variant="outline" className={cn("text-xs", getSeverityColor(log.severity))}>
                              {log.severity}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Time */}
                        <td className="px-4 py-4">
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </td>
                      </tr>

                      {/* Accordion expand */}
                      {expanded && <AccordionRow key={`${log.id}-expand`} log={log} />}
                    </>
                  );
                })}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No audit logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
