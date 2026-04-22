"use client";

import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdmin } from "@/lib/utils/permissions";
import { adminService } from "@/lib/services/adminService";
import { DashboardHeader } from "@/components/dashboard";
import { SystemOverview } from "@/components/dashboard/SystemOverview";
import { AdminActivityLog } from "@/components/dashboard/AdminActivityLog";
import { BlockchainStats } from "@/components/dashboard/BlockchainStats";
import { Users, MessageSquare, Activity } from "lucide-react";

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

   const blockchainStatsQuery = useQuery({
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
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary' />
         </div>
      );
   }

   if (!user || !isAdmin(user.role)) return null;

   const stats = statsQuery.data;
   const network = networkQuery.data;
   const bcStats = blockchainStatsQuery.data;
   const isLoading = statsQuery.isLoading;

   // Derive a network health % from blockchain transaction stats
   const bcTotal = (bcStats?.confirmed ?? 0) + (bcStats?.failed ?? 0) + (bcStats?.pending ?? 0);
   const networkHealth = network?.available === false
      ? 0
      : bcTotal > 0
      ? Math.round(((bcStats?.confirmed ?? 0) / bcTotal) * 100)
      : network?.available
      ? 100
      : 98;

   return (
      <div className='space-y-6'>
         <DashboardHeader
            title='Admin Dashboard'
            subtitle='Monitor and manage your DocChain system'
            showGreeting={false}
         />

         {/* System Overview */}
         <SystemOverview
            stats={stats}
            network={network}
            readyz={readyzQuery.data}
            isLoading={isLoading || networkQuery.isLoading}
         />

         {/* Activity + Blockchain */}
         <div className='grid gap-6 lg:grid-cols-3'>
            <div className='lg:col-span-2'>
               <AdminActivityLog />
            </div>
            <div>
               <BlockchainStats
                  totalDocuments={stats?.total_documents ?? 0}
                  protectedDocuments={stats?.protected_documents ?? 0}
                  pendingVerifications={bcStats?.pending ?? 0}
                  failedVerifications={bcStats?.failed ?? 0}
                  networkHealth={networkHealth}
               />
            </div>
         </div>

         {/* User & engagement stats */}
         <div className='grid gap-4 md:grid-cols-3'>
            <div className='p-6 rounded-lg border bg-card'>
               <div className='flex items-center gap-3 mb-3'>
                  <div className='p-3 rounded-lg bg-(--success)/10 text-(--success)'>
                     <Activity size={20} />
                  </div>
                  <div>
                     <p className='text-sm text-muted-foreground'>Active Today</p>
                     <p className='text-2xl font-bold'>
                        {isLoading ? "—" : (stats?.recent_active_users ?? 0)}
                     </p>
                  </div>
               </div>
               <p className='text-xs text-muted-foreground'>Logged in last 24 hours</p>
            </div>

            <div className='p-6 rounded-lg border bg-card'>
               <div className='flex items-center gap-3 mb-3'>
                  <div className='p-3 rounded-lg bg-(--info)/10 text-(--info)'>
                     <Users size={20} />
                  </div>
                  <div>
                     <p className='text-sm text-muted-foreground'>Active Accounts</p>
                     <p className='text-2xl font-bold'>
                        {isLoading ? "—" : (stats?.active_users ?? 0)}
                     </p>
                  </div>
               </div>
               <p className='text-xs text-muted-foreground'>Users with status active</p>
            </div>

            <div className='p-6 rounded-lg border bg-card'>
               <div className='flex items-center gap-3 mb-3'>
                  <div className='p-3 rounded-lg bg-(--warning)/10 text-(--warning)'>
                     <MessageSquare size={20} />
                  </div>
                  <div>
                     <p className='text-sm text-muted-foreground'>AI Sessions</p>
                     <p className='text-2xl font-bold'>
                        {isLoading ? "—" : (stats?.chat_sessions ?? 0)}
                     </p>
                  </div>
               </div>
               <p className='text-xs text-muted-foreground'>Total AI chat sessions</p>
            </div>
         </div>
      </div>
   );
}
