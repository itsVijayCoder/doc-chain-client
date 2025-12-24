"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { useToast } from "@/lib/hooks/useToast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuGroup,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator,
   DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getInitials } from "@/lib/utils/format";
import { getRoleDisplayName, getRoleBadgeColor } from "@/lib/utils/permissions";
import { User, Settings, LogOut, ShieldCheck, ChevronDown } from "lucide-react";

export const ProfileDropdown: FC = () => {
   const router = useRouter();
   const { user, logout, isLoading } = useAuth();
   const toast = useToast();

   const handleLogout = async () => {
      try {
         await logout();
         toast.success("Logged out successfully");
         router.push("/login");
      } catch (error) {
         toast.error("Logout failed", "Please try again");
      }
   };

   if (!user) return null;

   return (
      <DropdownMenu>
         <DropdownMenuTrigger className='inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground px-2 h-10'>
            <Avatar className='h-8 w-8'>
               <AvatarImage src={user.avatar} alt={user.name} />
               <AvatarFallback className='text-xs'>
                  {getInitials(user.name)}
               </AvatarFallback>
            </Avatar>
            <div className='hidden lg:block text-left'>
               <p className='text-sm font-medium leading-none'>{user.name}</p>
               <p className='text-xs text-muted-foreground mt-1'>
                  {user.email}
               </p>
            </div>
            <ChevronDown size={16} className='text-muted-foreground' />
         </DropdownMenuTrigger>
         <DropdownMenuContent className='w-64' align='end'>
            <div className='px-2 py-1.5'>
               <div className='flex items-center gap-3'>
                  <Avatar className='h-12 w-12'>
                     <AvatarImage src={user.avatar} alt={user.name} />
                     <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                     <p className='font-medium truncate'>{user.name}</p>
                     <p className='text-xs text-muted-foreground truncate'>
                        {user.email}
                     </p>
                     <Badge
                        variant='secondary'
                        className={getRoleBadgeColor(user.role) + " mt-1"}
                     >
                        {getRoleDisplayName(user.role)}
                     </Badge>
                  </div>
               </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
               <DropdownMenuItem
                  onClick={() => router.push("/settings/profile")}
               >
                  <User size={16} className='mr-2' />
                  Profile
               </DropdownMenuItem>
               <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings size={16} className='mr-2' />
                  Settings
               </DropdownMenuItem>
               {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                     <ShieldCheck size={16} className='mr-2' />
                     Admin Dashboard
                  </DropdownMenuItem>
               )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
               onClick={handleLogout}
               disabled={isLoading}
               className='text-destructive focus:text-destructive'
            >
               <LogOut size={16} className='mr-2' />
               Logout
            </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   );
};
