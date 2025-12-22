"use client";

import { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
   href: string;
   icon: React.ReactNode;
   label: string;
   collapsed?: boolean;
   badge?: number;
}

export const SidebarLink: FC<SidebarLinkProps> = ({
   href,
   icon,
   label,
   collapsed = false,
   badge,
}) => {
   const pathname = usePathname();
   const isActive = pathname === href || pathname.startsWith(href + "/");

   return (
      <Link
         href={href}
         className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
            "hover:bg-accent/50",
            isActive && "bg-primary/10 text-primary font-medium",
            !isActive && "text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-2"
         )}
      >
         <span className={cn("shrink-0", isActive && "text-primary")}>
            {icon}
         </span>
         {!collapsed && (
            <>
               <span className='flex-1 truncate'>{label}</span>
               {badge !== undefined && badge > 0 && (
                  <span className='flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium'>
                     {badge > 99 ? "99+" : badge}
                  </span>
               )}
            </>
         )}
      </Link>
   );
};
