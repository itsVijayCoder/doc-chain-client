"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Shield,
  Lock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Download,
  KeyRound,
} from "lucide-react";
import { adminService, type AuditLog } from "@/lib/services/adminService";
import { roleService } from "@/lib/services/roleService";
import { cn } from "@/lib/utils";

const SECURITY_ACTIONS = [
  "auth.login",
  "auth.login.failed",
  "auth.logout",
  "auth.register",
  "auth.password",
  "auth.token",
  "user.password",
  "admin.login",
];

function isSecurityEvent(action: string): boolean {
  return SECURITY_ACTIONS.some((prefix) => action.startsWith(prefix));
}

type EnforcementMode = "off" | "audit" | "enforce";

const ENFORCEMENT_OPTIONS: {
  value: EnforcementMode;
  label: string;
  description: string;
}[] = [
  {
    value: "off",
    label: "Off",
    description: "Role permissions are ignored; all users have full access.",
  },
  {
    value: "audit",
    label: "Audit",
    description: "Permissions are checked and violations logged, but not blocked.",
  },
  {
    value: "enforce",
    label: "Enforce",
    description: "Permissions are strictly enforced; unauthorized actions are blocked.",
  },
];

export default function AdminSecurityPage() {
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [pendingMode, setPendingMode] = useState<EnforcementMode | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user.role))) {
      redirect("/dashboard");
    }
  }, [user, authLoading]);

  const { data: enforcementData } = useQuery({
    queryKey: ["admin", "enforcement-mode"],
    queryFn: () => roleService.getEnforcementMode(),
    enabled: !!user && isAdmin(user.role),
    staleTime: 60_000,
  });

  const enforcementModeMutation = useMutation({
    mutationFn: (mode: EnforcementMode) =>
      roleService.setEnforcementMode({ enforcement_mode: mode }),
    onSuccess: (_, mode) => {
      queryClient.setQueryData(["admin", "enforcement-mode"], {
        enforcement_mode: mode,
      });
      queryClient.invalidateQueries({ queryKey: ["users", "me", "permissions"] });
      setPendingMode(null);
    },
  });

  const currentMode: EnforcementMode =
    pendingMode ?? enforcementData?.enforcement_mode ?? "off";

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "security-events"],
    queryFn: () => adminService.listAuditLogs({ page_size: 100 }),
    enabled: !!user && isAdmin(user.role),
    staleTime: 30_000,
  });

  const allLogs: AuditLog[] = data?.data ?? [];
  const securityLogs = allLogs.filter((l) => isSecurityEvent(l.action));
  const logs = securityLogs.length > 0 ? securityLogs : allLogs;

  const failedCount = logs.filter(
    (l) => l.action.includes("failed") || l.action.includes("invalid")
  ).length;
  const highCount = logs.filter((l) => l.severity === "high").length;

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getEventIcon = (action: string) => {
    if (action.includes("failed") || action.includes("invalid"))
      return <XCircle className="h-4 w-4" />;
    if (action.includes("login")) return <CheckCircle className="h-4 w-4" />;
    if (action.includes("password")) return <Lock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "high":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "low":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "info":
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default:
        return "";
    }
  };

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
            <Shield className="h-8 w-8" />
            Security Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor security events and system protection
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-muted-foreground">
              High Severity
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : highCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Requires attention
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Failed Logins
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : failedCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In current page</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-blue-500" />
            <p className="text-sm font-medium text-muted-foreground">
              2FA Enabled
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">—</p>
          <p className="text-xs text-muted-foreground mt-1">
            Not available from API
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium text-muted-foreground">
              Total Events
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {isLoading ? "—" : logs.length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">In current page</p>
        </div>
      </div>

      {/* Role Enforcement Mode */}
      <div className="rounded-lg border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Role Permission Enforcement</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Controls how role-based permissions are applied across the system.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {ENFORCEMENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                setPendingMode(opt.value);
                enforcementModeMutation.mutate(opt.value);
              }}
              disabled={enforcementModeMutation.isPending}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                currentMode === opt.value
                  ? "border-primary bg-primary/5"
                  : "hover:border-muted-foreground/50"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{opt.label}</span>
                {currentMode === opt.value && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Security Events */}
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Security Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time security monitoring and alerts
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading security events…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Time
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.map((event) => (
                  <tr key={event.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-muted">
                          {getEventIcon(event.action)}
                        </div>
                        <span className="font-medium text-sm">
                          {event.action.replace(/_/g, " ")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-sm">
                          {event.user_name || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {event.user_email ?? "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono">
                        {event.ip_address || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {event.severity ? (
                        <Badge
                          variant="outline"
                          className={getSeverityColor(event.severity)}
                        >
                          {event.severity}
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(event.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No security events found.
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
