"use client";

import { FC, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import { Bell, Trash2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { notificationService, type Notification } from "@/lib/services/notificationService";

const TYPE_DOT_COLOR: Record<string, string> = {
   success: "text-green-500",
   warning: "text-yellow-500",
   error: "text-red-500",
   info: "text-blue-500",
};

function dotColor(type: string): string {
   return TYPE_DOT_COLOR[type] ?? "text-blue-500";
}

export const NotificationBell: FC = () => {
   const queryClient = useQueryClient();
   const [open, setOpen] = useState(false);

   // Always-on poll so the badge stays fresh even with popover closed
   const { data } = useQuery({
      queryKey: ["notifications"],
      queryFn: () => notificationService.list({ page_size: 30 }),
      staleTime: 15_000,
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
   });

   const notifications: Notification[] = data?.data ?? [];
   const unreadCount = notifications.filter((n) => !n.is_read).length;

   const markReadMutation = useMutation({
      mutationFn: (id: string) => notificationService.markRead(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
   });

   const markAllMutation = useMutation({
      mutationFn: () => notificationService.markAllRead(),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
   });

   const deleteMutation = useMutation({
      mutationFn: (id: string) => notificationService.delete(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
   });

   const handleItemClick = (n: Notification) => {
      if (!n.is_read) markReadMutation.mutate(n.id);
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative'>
            <Bell size={20} />
            {unreadCount > 0 && (
               <span className='absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold bg-(--error) rounded-full'>
                  {unreadCount > 9 ? "9+" : unreadCount}
               </span>
            )}
         </PopoverTrigger>
         <PopoverContent className='w-80 p-0' align='end'>
            <div className='flex items-center justify-between p-4 border-b'>
               <h3 className='font-semibold'>Notifications</h3>
               {unreadCount > 0 && (
                  <Button
                     variant='ghost'
                     size='sm'
                     onClick={() => markAllMutation.mutate()}
                     disabled={markAllMutation.isPending}
                     className='h-auto py-1 px-2 text-xs'
                  >
                     Mark all as read
                  </Button>
               )}
            </div>
            <div className='max-h-100 overflow-y-auto'>
               {notifications.length === 0 ? (
                  <div className='p-8 text-center'>
                     <p className='text-sm text-muted-foreground'>No notifications</p>
                  </div>
               ) : (
                  <div className='divide-y'>
                     {notifications.map((n) => (
                        <div
                           key={n.id}
                           className={cn(
                              "flex items-start gap-1 hover:bg-accent/50 transition-colors",
                              !n.is_read && "bg-accent/20"
                           )}
                        >
                           <button
                              onClick={() => handleItemClick(n)}
                              className='flex-1 p-4 text-left'
                           >
                              <div className='flex items-start gap-3'>
                                 <div className={cn("mt-0.5 shrink-0", dotColor(n.type))}>
                                    <div className='w-2 h-2 rounded-full bg-current' />
                                 </div>
                                 <div className='flex-1 min-w-0'>
                                    <p className={cn("text-sm", !n.is_read && "font-medium")}>
                                       {n.title}
                                    </p>
                                    <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                                       {n.body}
                                    </p>
                                    <p className='text-xs text-muted-foreground mt-1'>
                                       {formatRelativeTime(n.created_at)}
                                    </p>
                                 </div>
                              </div>
                           </button>
                           <button
                              onClick={() => deleteMutation.mutate(n.id)}
                              disabled={deleteMutation.isPending}
                              className='p-2 mt-3 mr-2 rounded hover:text-destructive transition-colors text-muted-foreground shrink-0'
                              title='Delete notification'
                           >
                              <Trash2 className='h-3.5 w-3.5' />
                           </button>
                        </div>
                     ))}
                  </div>
               )}
            </div>
            {notifications.length > 0 && (
               <div className='p-2 border-t'>
                  <Button
                     variant='ghost'
                     size='sm'
                     className='w-full'
                     onClick={() => setOpen(false)}
                  >
                     Close
                  </Button>
               </div>
            )}
         </PopoverContent>
      </Popover>
   );
};
