"use client";

import { redirect } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { DashboardHeader, StatsCard } from "@/components/dashboard";
import { SystemOverview } from "@/components/dashboard/SystemOverview";
import { AdminActivityLog } from "@/components/dashboard/AdminActivityLog";
import { BlockchainStats } from "@/components/dashboard/BlockchainStats";
import {
   Users,
   FileText,
   Shield,
   Activity,
   Server,
   Database,
   Lock,
   AlertTriangle,
} from "lucide-react";
import { useEffect } from "react";

export default function AdminDashboardPage() {
   const { user, isLoading } = useAuth();

   useEffect(() => {
      if (!isLoading && (!user || user.role !== "admin")) {
         redirect("/dashboard");
      }
   }, [user, isLoading]);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
         </div>
      );
   }

   if (!user || user.role !== "admin") {
      return null;
   }

   return (
      <div className="space-y-6">
         {/* Header */}
         <DashboardHeader
            title="Admin Dashboard"
            subtitle="Monitor and manage your DocChain system"
            showGreeting={false}
         />

         {/* Admin Stats Grid */}
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
               title="Total Users"
               value={156}
               icon={<Users size={24} />}
               trend={{ value: 12, label: "from last month", direction: "up" }}
               variant="default"
            />
            <StatsCard
               title="System Documents"
               value="2,453"
               icon={<FileText size={24} />}
               trend={{ value: 8, label: "from last month", direction: "up" }}
               variant="default"
            />
            <StatsCard
               title="Security Events"
               value={0}
               icon={<Shield size={24} />}
               trend={{
                  value: 0,
                  label: "No threats detected",
                  direction: "neutral",
               }}
               variant="success"
            />
            <StatsCard
               title="System Uptime"
               value="99.8%"
               icon={<Activity size={24} />}
               trend={{ value: 0.2, label: "Last 30 days", direction: "up" }}
               variant="success"
            />
         </div>

         {/* System Overview */}
         <SystemOverview />

         {/* Grid Layout for Activity and Blockchain */}
         <div className="grid gap-6 lg:grid-cols-3">
            {/* Admin Activity Log - Takes 2 columns */}
            <div className="lg:col-span-2">
               <AdminActivityLog />
            </div>

            {/* Blockchain Stats - Takes 1 column */}
            <div>
               <BlockchainStats
                  totalDocuments={2453}
                  protectedDocuments={2453}
                  pendingVerifications={15}
                  failedVerifications={0}
                  networkHealth={98}
               />
            </div>
         </div>

         {/* Additional Admin Stats */}
         <div className="grid gap-4 md:grid-cols-3">
            <div className="p-6 rounded-lg border bg-card">
               <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-(--info)/10 text-(--info)">
                     <Server size={20} />
                  </div>
                  <div>
                     <p className="text-sm text-muted-foreground">
                        API Requests
                     </p>
                     <p className="text-2xl font-bold">1.2M</p>
                  </div>
               </div>
               <p className="text-xs text-muted-foreground">Last 24 hours</p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
               <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-(--success)/10 text-(--success)">
                     <Database size={20} />
                  </div>
                  <div>
                     <p className="text-sm text-muted-foreground">
                        Database Size
                     </p>
                     <p className="text-2xl font-bold">145 GB</p>
                  </div>
               </div>
               <p className="text-xs text-muted-foreground">61% of capacity</p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
               <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-lg bg-(--warning)/10 text-(--warning)">
                     <Lock size={20} />
                  </div>
                  <div>
                     <p className="text-sm text-muted-foreground">
                        Active Sessions
                     </p>
                     <p className="text-2xl font-bold">89</p>
                  </div>
               </div>
               <p className="text-xs text-muted-foreground">Concurrent users</p>
            </div>
         </div>
      </div>
   );
}
