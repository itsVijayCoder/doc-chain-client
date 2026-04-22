"use client";

import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
   BrainCircuit,
   Clock,
   Shield,
   ShieldOff,
   Share2,
   AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
   userStatsService,
   type MySuggestion,
   type SuggestionType,
   type SuggestionPriority,
} from "@/lib/services/userStatsService";

// ─── Visual config per type ──────────────────────────────────────────────

const TYPE_CONFIG: Record<SuggestionType, {
   icon: React.ReactNode;
   color: string;
   href?: string;
}> = {
   expiring: {
      icon: <Clock size={16} />,
      color: "bg-yellow-500/10 text-yellow-600",
      href: "/documents",
   },
   blockchain_failed: {
      icon: <ShieldOff size={16} />,
      color: "bg-red-500/10 text-red-600",
      href: "/documents",
   },
   unverified_confidential: {
      icon: <Shield size={16} />,
      color: "bg-orange-500/10 text-orange-600",
      href: "/documents",
   },
   recently_shared: {
      icon: <Share2 size={16} />,
      color: "bg-blue-500/10 text-blue-600",
      href: "/shared",
   },
};

const PRIORITY_BADGE: Record<SuggestionPriority, { label: string; class: string }> = {
   high:   { label: "High",   class: "bg-red-500/10 text-red-500 border-red-500/20" },
   medium: { label: "Medium", class: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
   low:    { label: "Low",    class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

function SuggestionCard({ s }: { s: MySuggestion }) {
   const config = TYPE_CONFIG[s.type] ?? {
      icon: <AlertTriangle size={16} />,
      color: "bg-muted text-muted-foreground",
   };
   const priority = PRIORITY_BADGE[s.priority];

   const inner = (
      <div className='p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors'>
         <div className='flex items-start gap-3'>
            <div className={cn(
               "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
               config.color
            )}>
               {config.icon}
            </div>
            <div className='flex-1 min-w-0'>
               <div className='flex items-start justify-between gap-2'>
                  <p className='text-sm font-medium'>{s.title}</p>
                  {priority && (
                     <Badge variant='outline' className={cn("text-[10px] shrink-0", priority.class)}>
                        {priority.label}
                     </Badge>
                  )}
               </div>
               <p className='text-xs text-muted-foreground mt-1'>{s.description}</p>
               {s.document_title && (
                  <p className='text-xs text-muted-foreground/70 mt-0.5 truncate'>
                     {s.document_title}
                  </p>
               )}
            </div>
         </div>
      </div>
   );

   if (config.href) {
      return (
         <Link href={s.document_id ? `/documents/${s.document_id}` : config.href}>
            {inner}
         </Link>
      );
   }
   return inner;
}

// ─── Main component ───────────────────────────────────────────────────────

export const AISuggestions: FC = () => {
   const { data: suggestions = [], isLoading } = useQuery({
      queryKey: ["users", "me", "suggestions"],
      queryFn: () => userStatsService.getMySuggestions(),
      staleTime: 120_000,
      refetchOnWindowFocus: false,
   });

   // Sort: high → medium → low
   const priorityOrder: Record<SuggestionPriority, number> = { high: 0, medium: 1, low: 2 };
   const sorted = [...suggestions].sort(
      (a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3)
   );

   return (
      <Card className='p-6 border-ai/20 bg-ai/5'>
         <div className='flex items-center gap-2 mb-4'>
            <BrainCircuit className='text-ai' size={20} />
            <h2 className='text-xl font-semibold'>AI Insights</h2>
            {!isLoading && suggestions.length > 0 && (
               <Badge variant='secondary' className='ml-auto'>
                  {suggestions.length} action{suggestions.length !== 1 ? "s" : ""}
               </Badge>
            )}
         </div>

         {isLoading ? (
            <div className='py-8 text-center text-sm text-muted-foreground'>Loading…</div>
         ) : sorted.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-8'>
               No suggestions right now — everything looks good.
            </p>
         ) : (
            <div className='space-y-3'>
               {sorted.map((s) => (
                  <SuggestionCard key={s.id} s={s} />
               ))}
            </div>
         )}
      </Card>
   );
};
