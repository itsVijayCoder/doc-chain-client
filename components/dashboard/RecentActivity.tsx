"use client";

import { FC } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import {
   FileUp,
   Share2,
   Shield,
   FileText,
   Trash2,
   Lock,
   Unlock,
   UserPlus,
   Settings,
   MessageSquare,
} from "lucide-react";
import { userStatsService, type MyActivity } from "@/lib/services/userStatsService";

type IconKey =
   | "upload" | "share" | "blockchain" | "edit" | "delete"
   | "protect" | "unprotect" | "user" | "comment" | "settings";

function resolveIcon(action: string, entityType: string): IconKey {
   const a = action.toLowerCase();
   const e = entityType.toLowerCase();
   if (a.includes("upload") || a.includes("version")) return "upload";
   if (a.includes("share") || a.includes("permission")) return "share";
   if (a.includes("blockchain") || a.includes("verify")) return "blockchain";
   if (a.includes("delete") || a.includes("trash") || a.includes("remove")) return "delete";
   if (a.includes("unprotect")) return "unprotect";
   if (a.includes("protect") || a.includes("encrypt")) return "protect";
   if (a.includes("comment")) return "comment";
   if (e.includes("user") || a.includes("register")) return "user";
   if (a.includes("update") || a.includes("edit") || a.includes("metadata")) return "edit";
   return "settings";
}

const ICONS: Record<IconKey, React.ReactNode> = {
   upload:    <FileUp size={16} />,
   share:     <Share2 size={16} />,
   blockchain:<Shield size={16} />,
   edit:      <FileText size={16} />,
   delete:    <Trash2 size={16} />,
   protect:   <Lock size={16} />,
   unprotect: <Unlock size={16} />,
   user:      <UserPlus size={16} />,
   comment:   <MessageSquare size={16} />,
   settings:  <Settings size={16} />,
};

const ICON_COLORS: Record<IconKey, string> = {
   upload:    "bg-(--success)/10 text-(--success)",
   share:     "bg-(--info)/10 text-(--info)",
   blockchain:"bg-blockchain/10 text-blockchain",
   edit:      "bg-(--warning)/10 text-(--warning)",
   delete:    "bg-(--error)/10 text-(--error)",
   protect:   "bg-blockchain/10 text-blockchain",
   unprotect: "bg-(--warning)/10 text-(--warning)",
   user:      "bg-(--success)/10 text-(--success)",
   comment:   "bg-(--info)/10 text-(--info)",
   settings:  "bg-(--info)/10 text-(--info)",
};

function humanizeAction(action: string): string {
   // "document.upload" → "Document uploaded"
   // "document.share" → "Document shared"
   const parts = action.split(".");
   const entity = parts[0] ? parts[0].replace(/_/g, " ") : "";
   const verb = parts[1] ? parts[1].replace(/_/g, " ") : action;
   if (entity && verb) return `${capitalize(entity)} ${verb}`;
   return capitalize(action.replace(/[._]/g, " "));
}

function capitalize(s: string) {
   return s.charAt(0).toUpperCase() + s.slice(1);
}

interface RecentActivityProps {
   maxItems?: number;
}

export const RecentActivity: FC<RecentActivityProps> = ({ maxItems = 5 }) => {
   const { data, isLoading } = useQuery({
      queryKey: ["users", "me", "activity"],
      queryFn: () => userStatsService.getMyActivity({ page_size: maxItems }),
      staleTime: 30_000,
      refetchOnWindowFocus: false,
   });

   const items: MyActivity[] = (data?.data ?? []).slice(0, maxItems);

   return (
      <Card className='p-6'>
         <h2 className='text-xl font-semibold mb-4'>Recent Activity</h2>
         {isLoading ? (
            <div className='py-8 text-center text-sm text-muted-foreground'>
               Loading…
            </div>
         ) : items.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-8'>
               No recent activity
            </p>
         ) : (
            <div className='space-y-4'>
               {items.map((item, index) => {
                  const iconKey = resolveIcon(item.action, item.entity_type);
                  return (
                     <div
                        key={item.id}
                        className={cn(
                           "flex items-start gap-3 pb-4",
                           index !== items.length - 1 && "border-b"
                        )}
                     >
                        <div
                           className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                              ICON_COLORS[iconKey]
                           )}
                        >
                           {ICONS[iconKey]}
                        </div>
                        <div className='flex-1 min-w-0'>
                           <p className='text-sm font-medium'>
                              {humanizeAction(item.action)}
                           </p>
                           <p className='text-xs text-muted-foreground truncate capitalize'>
                              {item.entity_type}
                              {item.entity_id ? ` · ${item.entity_id.slice(0, 8)}…` : ""}
                           </p>
                           <p className='text-xs text-muted-foreground mt-1'>
                              {formatRelativeTime(item.created_at)}
                           </p>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </Card>
   );
};
