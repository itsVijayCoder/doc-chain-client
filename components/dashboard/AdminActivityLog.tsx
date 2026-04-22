"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import { adminService, type AuditLog } from "@/lib/services/adminService";
import Link from "next/link";

function getSeverityVariant(severity?: string): "destructive" | "secondary" | "outline" {
   if (severity === "high") return "destructive";
   if (severity === "medium") return "secondary";
   return "outline";
}

export const AdminActivityLog = () => {
   const { data, isLoading } = useQuery({
      queryKey: ["admin", "audit-logs", "dashboard"],
      queryFn: () => adminService.listAuditLogs({ page_size: 7 }),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
   });

   const logs: AuditLog[] = data?.data ?? [];

   return (
      <Card className='p-6 h-[390px] flex flex-col'>
         <div className='flex items-center justify-between mb-4 shrink-0'>
            <h2 className='text-xl font-semibold'>Recent Activity</h2>
            <Link
               href='/admin/audit-logs'
               className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
               View All <ChevronRight size={14} />
            </Link>
         </div>

         {isLoading ? (
            <div className='space-y-3'>
               {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className='h-9 rounded bg-muted animate-pulse' />
               ))}
            </div>
         ) : logs.length === 0 ? (
            <p className='text-sm text-muted-foreground py-4 text-center'>No activity yet.</p>
         ) : (
            <div className='divide-y overflow-y-auto flex-1'>
               {logs.map((log) => (
                  <div key={log.id} className='flex items-center justify-between gap-3 py-2.5'>
                     <div className='flex items-center gap-2 min-w-0'>
                        <span className='text-sm font-mono text-foreground truncate'>{log.action}</span>
                        <span className='text-xs text-muted-foreground shrink-0'>
                           by {log.user_name || log.user_email || "System"}
                        </span>
                     </div>
                     <div className='flex items-center gap-2 shrink-0'>
                        {log.severity && log.severity !== "info" && (
                           <Badge variant={getSeverityVariant(log.severity)} className='text-xs'>
                              {log.severity}
                           </Badge>
                        )}
                        <span className='text-xs text-muted-foreground'>
                           {formatRelativeTime(log.created_at)}
                        </span>
                     </div>
                  </div>
               ))}
            </div>
         )}
      </Card>
   );
};
