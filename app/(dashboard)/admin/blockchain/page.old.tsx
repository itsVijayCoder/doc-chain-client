"use client";

import { useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Link as LinkIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  Zap,
} from "lucide-react";
import {
  adminService,
  type BlockchainTransaction,
} from "@/lib/services/adminService";

export default function AdminBlockchainPage() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user.role))) {
      redirect("/dashboard");
    }
  }, [user, authLoading]);

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ["admin", "blockchain", "transactions"],
    queryFn: () =>
      adminService.listTransactions({ page: 1, page_size: 50 }).then((r) => r.data),
    enabled: !!user && isAdmin(user.role),
    staleTime: 30_000,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin", "blockchain", "stats"],
    queryFn: () => adminService.getBlockchainStats(),
    enabled: !!user && isAdmin(user.role),
    staleTime: 30_000,
  });

  const transactions: BlockchainTransaction[] = txData ?? [];
  const isLoading = txLoading || statsLoading;

  const successRate =
    stats && stats.confirmed + stats.failed > 0
      ? ((stats.confirmed / (stats.confirmed + stats.failed)) * 100).toFixed(1)
      : null;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "";
    }
  };

  const getTypeColor = (type: string) => {
    if (type.includes("verif"))
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    if (type.includes("update"))
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
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
            <LinkIcon className="h-8 w-8" />
            Blockchain Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Track document verification and blockchain transactions
          </p>
        </div>
        <Button>
          <Database className="mr-2 h-4 w-4" />
          View Explorer
        </Button>
      </div>

      {/* Blockchain Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Confirmed Transactions
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {statsLoading ? "—" : (stats?.confirmed ?? "—").toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">All time</p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Pending
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {statsLoading ? "—" : (stats?.pending ?? "—").toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Awaiting confirmation
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-red-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Failed
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {statsLoading ? "—" : (stats?.failed ?? "—").toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Requires retry
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <p className="text-sm font-medium text-muted-foreground">
              Success Rate
            </p>
          </div>
          <p className="text-2xl font-bold mt-2">
            {statsLoading ? "—" : successRate ? `${successRate}%` : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Confirmed / (confirmed + failed)
          </p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Transactions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Latest blockchain verification activities
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading transactions…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Transaction Hash
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium">
                    Block
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">
                          {tx.tx_id
                            ? `${tx.tx_id.substring(0, 20)}…`
                            : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-sm">
                          {tx.document_title || "—"}
                        </p>
                        <p className="text-sm text-muted-foreground font-mono">
                          {tx.document_id.slice(0, 8)}…
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getTypeColor(tx.record_type)}
                      >
                        {tx.record_type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={getStatusColor(tx.status)}
                      >
                        <span className="flex items-center gap-1">
                          {getStatusIcon(tx.status)}
                          {tx.status}
                        </span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono">
                        {tx.block_number != null
                          ? tx.block_number.toLocaleString()
                          : "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(tx.created_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/blockchain/records/${tx.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No transactions found.
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
