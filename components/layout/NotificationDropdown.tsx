"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
   AlertTriangle,
   Bell,
   CheckCircle2,
   FileText,
   FileUp,
   Lock,
   Settings,
   Share2,
   Shield,
   ShieldCheck,
   UserPlus,
} from "lucide-react";
import {
   notificationService,
   type Notification,
} from "@/lib/services/notificationService";

// ─────────────────────────────────────────────────────────────────────
// Type classification — derives the visual treatment from the backend's
// `type` slug (e.g. "document.share", "security.alert", "blockchain.verified").
// Matches backend slugs loosely — unknown types fall back to "system" muted.
// ─────────────────────────────────────────────────────────────────────
type NotifKind =
   | "share"
   | "upload"
   | "verified"
   | "warning"
   | "security"
   | "document"
   | "user"
   | "system";

function classifyNotif(type: string, entityType?: string): NotifKind {
   const t = type.toLowerCase();
   if (t.includes("share") || t.includes("permission")) return "share";
   if (t.includes("upload") || t.includes("create")) return "upload";
   if (t.includes("verified") || t.includes("confirmed") || t.includes("blockchain")) return "verified";
   if (t.includes("warning") || t.includes("expir") || t.includes("reminder")) return "warning";
   if (t.includes("security") || t.includes("login.failed") || t.includes("2fa")) return "security";
   if (t.includes("user") || entityType === "user") return "user";
   if (entityType === "document") return "document";
   return "system";
}

const KIND_STYLE: Record<
   NotifKind,
   { Icon: typeof Bell; bg: string; color: string; border: string }
> = {
   share: {
      Icon: Share2,
      bg: "var(--dc-info-soft)",
      color: "var(--dc-info)",
      border: "var(--dc-info-border)",
   },
   upload: {
      Icon: FileUp,
      bg: "var(--dc-accent-soft)",
      color: "var(--dc-accent)",
      border: "var(--dc-accent-border)",
   },
   verified: {
      Icon: ShieldCheck,
      bg: "var(--dc-accent-soft)",
      color: "var(--dc-accent)",
      border: "var(--dc-accent-border)",
   },
   warning: {
      Icon: AlertTriangle,
      bg: "var(--dc-warn-soft)",
      color: "var(--dc-warn)",
      border: "var(--dc-warn-border)",
   },
   security: {
      Icon: Lock,
      bg: "var(--dc-danger-soft)",
      color: "var(--dc-danger)",
      border: "var(--dc-danger-border)",
   },
   document: {
      Icon: FileText,
      bg: "var(--dc-info-soft)",
      color: "var(--dc-info)",
      border: "var(--dc-info-border)",
   },
   user: {
      Icon: UserPlus,
      bg: "var(--dc-surface-2)",
      color: "var(--dc-text-muted)",
      border: "var(--dc-border)",
   },
   system: {
      Icon: Settings,
      bg: "var(--dc-surface-2)",
      color: "var(--dc-text-muted)",
      border: "var(--dc-border)",
   },
};

// Relative time helper (local, since this is used heavily in one place)
function formatRelativeTime(iso: string): string {
   const date = new Date(iso);
   const diff = Date.now() - date.getTime();
   const mins = Math.floor(diff / 60000);
   const hours = Math.floor(diff / 3600000);
   const days = Math.floor(diff / 86400000);
   if (mins < 1) return "just now";
   if (mins < 60) return `${mins}m ago`;
   if (hours < 24) return `${hours}h ago`;
   if (days < 7) return `${days}d ago`;
   return date.toLocaleDateString();
}

// Route a notification to the right page when clicked.
function notifHref(n: Notification): string | null {
   if (n.entity_type === "document" && n.entity_id)
      return `/documents/${n.entity_id}`;
   if (n.entity_type === "user") return `/admin/users`;
   return null;
}

export const NotificationDropdown: FC = () => {
   const router = useRouter();
   const queryClient = useQueryClient();
   const [open, setOpen] = useState(false);

   // List of notifications — poll every 60s so the list stays fresh even
   // without a dedicated websocket push.
   const listQuery = useQuery({
      queryKey: ["notifications", "list"],
      queryFn: () => notificationService.list({ page: 1, page_size: 20 }),
      staleTime: 30_000,
      refetchInterval: 60_000,
   });

   // Unread count — lightweight endpoint, hit more often so the bell badge
   // updates fast even when the dropdown is closed.
   const unreadQuery = useQuery({
      queryKey: ["notifications", "unread-count"],
      queryFn: () => notificationService.unreadCount(),
      staleTime: 15_000,
      refetchInterval: 30_000,
   });

   const notifs = listQuery.data?.data ?? [];
   const unreadCount = unreadQuery.data?.count ?? 0;

   const markAllMutation = useMutation({
      mutationFn: () => notificationService.markAllRead(),
      // Optimistic: clear all unread locally, then sync with server.
      onMutate: async () => {
         await queryClient.cancelQueries({ queryKey: ["notifications"] });
         const prevList = queryClient.getQueryData(["notifications", "list"]);
         const prevCount = queryClient.getQueryData(["notifications", "unread-count"]);

         queryClient.setQueryData(["notifications", "list"], (old: typeof listQuery.data) => {
            if (!old) return old;
            return {
               ...old,
               data: old.data.map((n) => ({ ...n, is_read: true })),
            };
         });
         queryClient.setQueryData(["notifications", "unread-count"], { count: 0 });

         return { prevList, prevCount };
      },
      onError: (_err, _vars, ctx) => {
         if (ctx?.prevList)
            queryClient.setQueryData(["notifications", "list"], ctx.prevList);
         if (ctx?.prevCount)
            queryClient.setQueryData(["notifications", "unread-count"], ctx.prevCount);
      },
      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
   });

   const markOneMutation = useMutation({
      mutationFn: (id: string) => notificationService.markRead(id),
      onMutate: async (id) => {
         await queryClient.cancelQueries({ queryKey: ["notifications"] });
         const prevList = queryClient.getQueryData(["notifications", "list"]);
         const prevCount = queryClient.getQueryData(["notifications", "unread-count"]) as
            | { count: number }
            | undefined;

         queryClient.setQueryData(["notifications", "list"], (old: typeof listQuery.data) => {
            if (!old) return old;
            return {
               ...old,
               data: old.data.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
            };
         });
         if (prevCount) {
            queryClient.setQueryData(["notifications", "unread-count"], {
               count: Math.max(0, prevCount.count - 1),
            });
         }

         return { prevList, prevCount };
      },
      onError: (_err, _id, ctx) => {
         if (ctx?.prevList)
            queryClient.setQueryData(["notifications", "list"], ctx.prevList);
         if (ctx?.prevCount)
            queryClient.setQueryData(["notifications", "unread-count"], ctx.prevCount);
      },
      onSettled: () => {
         queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
   });

   const handleRowClick = (n: Notification) => {
      if (!n.is_read) markOneMutation.mutate(n.id);
      const href = notifHref(n);
      if (href) {
         setOpen(false);
         router.push(href);
      }
   };

   return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
         <DropdownMenuTrigger
            aria-label='Notifications'
            className='relative w-8 h-8 rounded-md flex items-center justify-center transition-colors duration-[120ms]'
            style={{ color: "var(--dc-text-muted)" }}
            onMouseEnter={(e) => {
               e.currentTarget.style.background = "var(--dc-surface-2)";
               e.currentTarget.style.color = "var(--dc-text)";
            }}
            onMouseLeave={(e) => {
               e.currentTarget.style.background = "transparent";
               e.currentTarget.style.color = "var(--dc-text-muted)";
            }}
         >
            <Bell size={16} strokeWidth={1.75} />
            {unreadCount > 0 && (
               <span
                  aria-hidden
                  className='absolute top-[3px] right-[3px] min-w-[14px] h-[14px] rounded-full text-[9px] font-bold flex items-center justify-center px-[3px] animate-[fadeIn_220ms_cubic-bezier(.4,0,.2,1)]'
                  style={{
                     background: "var(--dc-accent)",
                     color: "#061f15",
                     border: "2px solid var(--dc-bg)",
                     boxSizing: "content-box",
                  }}
               >
                  {unreadCount > 9 ? "9+" : unreadCount}
               </span>
            )}
         </DropdownMenuTrigger>
         <DropdownMenuContent
            align='end'
            sideOffset={6}
            className='w-[380px] max-w-[calc(100vw-24px)] p-0'
         >
            {/* Header */}
            <div
               className='flex items-center justify-between px-4 py-3'
               style={{
                  borderBottom: "1px solid var(--dc-border)",
                  background: "var(--dc-surface-2)",
               }}
            >
               <div
                  className='text-[13px] font-semibold flex items-center gap-2'
                  style={{ color: "var(--dc-text)" }}
               >
                  Notifications
                  {unreadCount > 0 && (
                     <span
                        className='inline-flex items-center h-[18px] px-1.5 rounded-full text-[10px] font-semibold'
                        style={{
                           background: "var(--dc-accent-soft)",
                           color: "var(--dc-accent)",
                           border: "1px solid var(--dc-accent-border)",
                        }}
                     >
                        {unreadCount} new
                     </span>
                  )}
               </div>
               {unreadCount > 0 && (
                  <button
                     type='button'
                     onClick={(e) => {
                        e.stopPropagation();
                        markAllMutation.mutate();
                     }}
                     className='text-[11.5px] font-medium transition-colors hover:underline disabled:opacity-50'
                     style={{ color: "var(--dc-accent)" }}
                     disabled={markAllMutation.isPending}
                  >
                     Mark all read
                  </button>
               )}
            </div>

            {/* List */}
            <div
               className='overflow-y-auto'
               style={{ maxHeight: 380 }}
            >
               {listQuery.isLoading ? (
                  <LoadingNotifs />
               ) : listQuery.isError ? (
                  <ErrorNotifs />
               ) : notifs.length === 0 ? (
                  <EmptyNotifications />
               ) : (
                  notifs.map((n, i) => (
                     <NotificationRow
                        key={n.id}
                        notif={n}
                        onClick={() => handleRowClick(n)}
                        isLast={i === notifs.length - 1}
                     />
                  ))
               )}
            </div>
         </DropdownMenuContent>
      </DropdownMenu>
   );
};

// ─────────────────────────────────────────────────────────────────────
// Row
// ─────────────────────────────────────────────────────────────────────
const NotificationRow: FC<{
   notif: Notification;
   onClick: () => void;
   isLast: boolean;
}> = ({ notif, onClick, isLast }) => {
   const kind = classifyNotif(notif.type, notif.entity_type);
   const cfg = KIND_STYLE[kind];
   const unread = !notif.is_read;

   return (
      <button
         type='button'
         onClick={onClick}
         className='w-full text-left flex items-start gap-3 px-4 py-3 transition-colors'
         style={{
            borderBottom: isLast ? "none" : "1px solid var(--dc-border)",
            background: unread ? "var(--dc-accent-soft)" : "transparent",
         }}
         onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--dc-surface-2)";
         }}
         onMouseLeave={(e) => {
            e.currentTarget.style.background = unread
               ? "var(--dc-accent-soft)"
               : "transparent";
         }}
      >
         <div
            className='w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5'
            style={{
               background: cfg.bg,
               color: cfg.color,
               border: `1px solid ${cfg.border}`,
            }}
         >
            <cfg.Icon size={14} strokeWidth={1.75} />
         </div>

         <div className='flex-1 min-w-0'>
            <div className='flex items-start gap-2'>
               <p
                  className='text-[13px] font-medium flex-1 line-clamp-2'
                  style={{ color: "var(--dc-text)" }}
               >
                  {notif.title}
               </p>
               {unread && (
                  <span
                     aria-hidden
                     className='w-2 h-2 rounded-full shrink-0 mt-1.5'
                     style={{ background: "var(--dc-accent)" }}
                  />
               )}
            </div>
            {notif.body && (
               <p
                  className='text-[11.5px] mt-0.5 line-clamp-2'
                  style={{ color: "var(--dc-text-dim)" }}
               >
                  {notif.body}
               </p>
            )}
            <p
               className='text-[11px] mt-1'
               style={{ color: "var(--dc-text-faint)" }}
            >
               {formatRelativeTime(notif.created_at)}
            </p>
         </div>
      </button>
   );
};

// ─────────────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────────────
const LoadingNotifs: FC = () => (
   <div className='py-6'>
      {[0, 1, 2].map((i) => (
         <div
            key={i}
            className='flex gap-3 px-4 py-2 animate-pulse'
            style={{
               borderBottom: i === 2 ? "none" : "1px solid var(--dc-border)",
            }}
         >
            <div
               className='w-8 h-8 rounded-lg shrink-0'
               style={{ background: "var(--dc-surface-2)" }}
            />
            <div className='flex-1 space-y-2'>
               <div
                  className='h-3 rounded w-3/4'
                  style={{ background: "var(--dc-surface-2)" }}
               />
               <div
                  className='h-2 rounded w-1/2'
                  style={{ background: "var(--dc-surface-2)" }}
               />
            </div>
         </div>
      ))}
   </div>
);

const ErrorNotifs: FC = () => (
   <div
      className='py-10 px-6 text-center text-[13px]'
      style={{ color: "var(--dc-text-dim)" }}
   >
      <AlertTriangle
         size={20}
         strokeWidth={1.75}
         className='mx-auto mb-2'
         style={{ color: "var(--dc-warn)" }}
      />
      Couldn&apos;t load notifications.
   </div>
);

const EmptyNotifications: FC = () => (
   <div className='py-10 px-6 text-center'>
      <div
         className='w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center'
         style={{
            background: "var(--dc-surface-2)",
            border: "1px solid var(--dc-border)",
            color: "var(--dc-text-muted)",
         }}
      >
         <Bell size={18} strokeWidth={1.75} />
      </div>
      <p
         className='text-[13px] font-medium'
         style={{ color: "var(--dc-text)" }}
      >
         You&apos;re all caught up
      </p>
      <p
         className='text-[11.5px] mt-1'
         style={{ color: "var(--dc-text-dim)" }}
      >
         New notifications will appear here.
      </p>
   </div>
);

// Re-export the Notification type for convenience
export type { Notification };
