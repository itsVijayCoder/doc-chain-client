"use client";

import { useQuery } from "@tanstack/react-query";
import {
   DashboardHeader,
   StatsCard,
   RecentActivity,
   AISuggestions,
   RecentDocuments,
} from "@/components/dashboard";
import { FileText, Share2, Shield, Lock } from "lucide-react";
import Link from "next/link";
import { userStatsService } from "@/lib/services/userStatsService";

export default function DashboardPage() {
   const { data: stats, isLoading: statsLoading } = useQuery({
      queryKey: ["users", "me", "stats"],
      queryFn: () => userStatsService.getMyStats(),
      staleTime: 60_000,
      refetchOnWindowFocus: false,
   });

   const { data: suggestions = [] } = useQuery({
      queryKey: ["users", "me", "suggestions"],
      queryFn: () => userStatsService.getMySuggestions(),
      staleTime: 120_000,
      refetchOnWindowFocus: false,
   });

   const totalDocs = stats?.total_documents ?? 0;
   const blockchainConfirmed = stats?.blockchain_confirmed ?? 0;
   const protectedPct =
      totalDocs > 0 ? Math.round((blockchainConfirmed / totalDocs) * 100) : 0;

   return (
      <div className='space-y-6'>
         <DashboardHeader showGreeting />

         {/* Stats */}
         <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Link href='/documents' className='block'>
               <StatsCard
                  title='Total Documents'
                  value={statsLoading ? "—" : totalDocs}
                  icon={<FileText size={24} />}
               />
            </Link>
            <Link href='/shared' className='block'>
               <StatsCard
                  title='Shared with Me'
                  value={statsLoading ? "—" : (stats?.shared_with_me ?? "—")}
                  icon={<Share2 size={24} />}
               />
            </Link>
            <Link href='/documents' className='block'>
               <StatsCard
                  title='Blockchain Protected'
                  value={statsLoading ? "—" : `${protectedPct}%`}
                  icon={<Shield size={24} />}
                  variant='blockchain'
               />
            </Link>
            <Link href='/documents' className='block'>
               <StatsCard
                  title='Confidential'
                  value={statsLoading ? "—" : (stats?.confidential_documents ?? "—")}
                  icon={<Lock size={24} />}
                  variant='warning'
               />
            </Link>
         </div>

         {/* Recent Documents + Recent Activity side by side */}
         <div className='grid gap-6 lg:grid-cols-2'>
            <RecentDocuments />
            <RecentActivity />
         </div>

         <AISuggestions />
      </div>
   );
}
