"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, HardDrive, Activity, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminStats, BlockchainNetworkStatus, ReadyzResponse } from "@/lib/services/adminService";

function HealthRow({ label, up, latencyMs, loading }: {
   label: string;
   up: boolean;
   latencyMs?: number;
   loading?: boolean;
}) {
   return (
      <div className={cn(
         "flex items-center justify-between p-3 rounded-lg border",
         loading ? "bg-muted/30 border-border"
            : up ? "bg-(--success)/10 border-(--success)/20"
            : "bg-(--error)/10 border-(--error)/20"
      )}>
         <div className='flex items-center gap-2'>
            {loading
               ? <span className='w-4 h-4 rounded-full bg-muted animate-pulse' />
               : up
               ? <CheckCircle2 size={16} className='text-(--success)' />
               : <XCircle size={16} className='text-(--error)' />
            }
            <span className='text-sm font-medium'>{label}</span>
         </div>
         <Badge variant='outline' className={cn(
            loading ? "text-muted-foreground border-border"
               : up ? "text-(--success) border-(--success)"
               : "text-(--error) border-(--error)"
         )}>
            {loading ? "Checking…" : up ? `Up${latencyMs !== undefined ? ` · ${latencyMs}ms` : ""}` : "Down"}
         </Badge>
      </div>
   );
}

interface SystemOverviewProps {
   stats?: AdminStats;
   network?: BlockchainNetworkStatus;
   readyz?: ReadyzResponse;
   isLoading?: boolean;
}

export const SystemOverview = ({ stats, network, readyz, isLoading }: SystemOverviewProps) => {
   const dash = isLoading ? "—" : undefined;

   const metrics = [
      {
         label: "Total Users",
         value: dash ?? stats?.total_users?.toLocaleString() ?? "—",
         icon: <Users size={20} />,
         color: "text-(--info)",
      },
      {
         label: "Total Documents",
         value: dash ?? stats?.total_documents?.toLocaleString() ?? "—",
         icon: <FileText size={20} />,
         color: "text-(--success)",
      },
      {
         label: "Storage Used",
         value: dash ?? stats?.storage_display ?? "—",
         icon: <HardDrive size={20} />,
         color: "text-(--warning)",
      },
      {
         label: "System Uptime",
         value: dash ?? stats?.uptime_display ?? "—",
         icon: <Activity size={20} />,
         color: "text-(--success)",
      },
   ];

   const networkAvailable = network?.available ?? false;
   const networkLoading = isLoading || network === undefined;

   return (
      <Card className='p-6'>
         <h2 className='text-xl font-semibold mb-4'>System Overview</h2>

         {/* Metrics Grid */}
         <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
            {metrics.map((metric, index) => (
               <div key={index} className='p-4 rounded-lg border bg-card'>
                  <div className='flex items-center justify-between mb-2'>
                     <span className={cn("p-2 rounded-lg bg-muted", metric.color)}>
                        {metric.icon}
                     </span>
                  </div>
                  <p className={cn("text-2xl font-bold", isLoading && "text-muted-foreground")}>
                     {metric.value}
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>{metric.label}</p>
               </div>
            ))}
         </div>

         {/* System Health Indicators */}
         <div className='space-y-3'>
            <h3 className='text-sm font-medium'>System Health</h3>

            {/* PostgreSQL */}
            <HealthRow
               label='PostgreSQL'
               up={readyz?.dependencies.postgres.status === "up"}
               latencyMs={readyz?.dependencies.postgres.latency_ms}
               loading={!readyz}
            />

            {/* Redis */}
            <HealthRow
               label='Redis'
               up={readyz?.dependencies.redis.status === "up"}
               latencyMs={readyz?.dependencies.redis.latency_ms}
               loading={!readyz}
            />

            {/* Blockchain Network */}
            <div className={cn(
               "flex items-center justify-between p-3 rounded-lg border",
               networkLoading
                  ? "bg-muted/30 border-border"
                  : networkAvailable
                  ? "bg-(--success)/10 border-(--success)/20"
                  : "bg-(--error)/10 border-(--error)/20"
            )}>
               <div className='flex items-center gap-2'>
                  {networkAvailable
                     ? <CheckCircle2 size={16} className='text-(--success)' />
                     : <XCircle size={16} className={networkLoading ? "text-muted-foreground" : "text-(--error)"} />
                  }
                  <span className='text-sm font-medium'>Blockchain Network</span>
                  {network && (
                     <span className='text-xs text-muted-foreground'>
                        {network.channel} / {network.chaincode}
                     </span>
                  )}
               </div>
               <Badge variant='outline' className={cn(
                  networkLoading
                     ? "text-muted-foreground border-border"
                     : networkAvailable
                     ? "text-(--success) border-(--success)"
                     : "text-(--error) border-(--error)"
               )}>
                  {networkLoading ? "Checking…" : networkAvailable ? `Connected · ${network?.peer_status}` : "Disconnected"}
               </Badge>
            </div>
         </div>
      </Card>
   );
};
