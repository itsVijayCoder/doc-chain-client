"use client";

import { FC } from "react";
import { Label } from "@/components/ui/label";
import { Eye, Edit, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type PermissionLevel = "view" | "edit" | "admin";

interface PermissionSelectorProps {
   value: PermissionLevel;
   onChange: (permission: PermissionLevel) => void;
   disabled?: boolean;
   showAdmin?: boolean;
}

const PERMISSIONS = [
   {
      value: "view" as const,
      label: "View",
      description: "Can view and download",
      icon: Eye,
   },
   {
      value: "edit" as const,
      label: "Edit",
      description: "Can view, edit, and upload new versions",
      icon: Edit,
   },
   {
      value: "admin" as const,
      label: "Admin",
      description: "Full control including sharing and deletion",
      icon: Shield,
   },
];

/**
 * PermissionSelector Component
 * Radio button group for selecting permission levels
 * Follows KISS principle - simple permission selection UI
 */
export const PermissionSelector: FC<PermissionSelectorProps> = ({
   value,
   onChange,
   disabled = false,
   showAdmin = false,
}) => {
   const permissions = showAdmin
      ? PERMISSIONS
      : PERMISSIONS.filter((p) => p.value !== "admin");

   return (
      <div className='space-y-2'>
         <Label>Permission Level</Label>
         <div className='space-y-2'>
            {permissions.map((permission) => {
               const Icon = permission.icon;
               const isSelected = value === permission.value;

               return (
                  <button
                     key={permission.value}
                     type='button'
                     onClick={() => onChange(permission.value)}
                     disabled={disabled}
                     className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-lg border-2 transition-colors text-left",
                        isSelected
                           ? "border-primary bg-primary/5"
                           : "border-muted hover:border-primary/50",
                        disabled && "opacity-50 cursor-not-allowed"
                     )}
                  >
                     <div
                        className={cn(
                           "flex h-5 w-5 items-center justify-center rounded-full border-2 mt-0.5",
                           isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground"
                        )}
                     >
                        {isSelected && (
                           <div className='h-2 w-2 rounded-full bg-white' />
                        )}
                     </div>
                     <div className='flex-1'>
                        <div className='flex items-center gap-2 mb-1'>
                           <Icon
                              size={16}
                              className={
                                 isSelected
                                    ? "text-primary"
                                    : "text-muted-foreground"
                              }
                           />
                           <span className='font-medium'>
                              {permission.label}
                           </span>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                           {permission.description}
                        </p>
                     </div>
                  </button>
               );
            })}
         </div>
      </div>
   );
};
