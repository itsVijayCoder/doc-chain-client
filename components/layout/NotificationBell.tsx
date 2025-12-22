"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import {
   Popover,
   PopoverContent,
   PopoverTrigger,
} from "@/components/ui/popover";
import { Bell } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

interface Notification {
   id: string;
   title: string;
   message: string;
   type: "info" | "success" | "warning" | "error";
   read: boolean;
   createdAt: Date;
}

// Mock notifications (will be replaced with real data)
const mockNotifications: Notification[] = [
   {
      id: "1",
      title: "Document shared",
      message: 'John Doe shared "Project Proposal.pdf" with you',
      type: "info",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
   },
   {
      id: "2",
      title: "Blockchain verification complete",
      message:
         'Your document "Contract.pdf" has been verified on the blockchain',
      type: "success",
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
   },
   {
      id: "3",
      title: "AI suggestion available",
      message: 'AI has detected potential improvements for "Report.docx"',
      type: "info",
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
   },
];

export const NotificationBell: FC = () => {
   const [notifications, setNotifications] = useState(mockNotifications);
   const [open, setOpen] = useState(false);

   const unreadCount = notifications.filter((n) => !n.read).length;

   const markAsRead = (id: string) => {
      setNotifications((prev) =>
         prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
   };

   const markAllAsRead = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
   };

   const getNotificationColor = (type: string) => {
      switch (type) {
         case "success":
            return "text-(--success)";
         case "warning":
            return "text-(--warning)";
         case "error":
            return "text-(--error)";
         default:
            return "text-(--info)";
      }
   };

   return (
      <Popover open={open} onOpenChange={setOpen}>
         <PopoverTrigger className='inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-10 w-10 relative'>
            <Bell size={20} />
            {unreadCount > 0 && (
               <span className='absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-(--error) rounded-full'>
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
                     onClick={markAllAsRead}
                     className='h-auto py-1 px-2 text-xs'
                  >
                     Mark all as read
                  </Button>
               )}
            </div>
            <div className='max-h-100 overflow-y-auto'>
               {notifications.length === 0 ? (
                  <div className='p-8 text-center'>
                     <p className='text-sm text-muted-foreground'>
                        No notifications
                     </p>
                  </div>
               ) : (
                  <div className='divide-y'>
                     {notifications.map((notification) => (
                        <button
                           key={notification.id}
                           onClick={() => markAsRead(notification.id)}
                           className={cn(
                              "w-full p-4 text-left hover:bg-accent/50 transition-colors",
                              !notification.read && "bg-accent/20"
                           )}
                        >
                           <div className='flex items-start gap-3'>
                              <div
                                 className={cn(
                                    "mt-0.5",
                                    getNotificationColor(notification.type)
                                 )}
                              >
                                 <div className='w-2 h-2 rounded-full bg-current' />
                              </div>
                              <div className='flex-1 min-w-0'>
                                 <p
                                    className={cn(
                                       "text-sm",
                                       !notification.read && "font-medium"
                                    )}
                                 >
                                    {notification.title}
                                 </p>
                                 <p className='text-xs text-muted-foreground mt-1 line-clamp-2'>
                                    {notification.message}
                                 </p>
                                 <p className='text-xs text-muted-foreground mt-1'>
                                    {formatRelativeTime(notification.createdAt)}
                                 </p>
                              </div>
                           </div>
                        </button>
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
                     View all notifications
                  </Button>
               </div>
            )}
         </PopoverContent>
      </Popover>
   );
};
