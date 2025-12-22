"use client";

import { FC, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExpirySettingsProps {
   value?: Date;
   onChange: (date?: Date) => void;
   disabled?: boolean;
}

const EXPIRY_OPTIONS = [
   { label: "1 hour", hours: 1 },
   { label: "24 hours", hours: 24 },
   { label: "7 days", hours: 24 * 7 },
   { label: "30 days", hours: 24 * 30 },
   { label: "Never", hours: null },
];

/**
 * ExpirySettings Component
 * Select expiry time for shared links
 * Follows KISS principle - simple expiry selection
 */
export const ExpirySettings: FC<ExpirySettingsProps> = ({
   value,
   onChange,
   disabled = false,
}) => {
   const [selectedOption, setSelectedOption] = useState<number | null>(() => {
      if (!value) return null;

      const diffMs = value.getTime() - Date.now();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      const option = EXPIRY_OPTIONS.find((opt) => opt.hours === diffHours);
      return option ? option.hours : null;
   });

   const handleSelect = (hours: number | null) => {
      setSelectedOption(hours);

      if (hours === null) {
         onChange(undefined);
      } else {
         const expiryDate = new Date();
         expiryDate.setHours(expiryDate.getHours() + hours);
         onChange(expiryDate);
      }
   };

   const formatExpiryDate = (date: Date) => {
      return new Intl.DateTimeFormat("en-US", {
         month: "short",
         day: "numeric",
         hour: "numeric",
         minute: "2-digit",
      }).format(date);
   };

   return (
      <div className='space-y-3'>
         <Label className='flex items-center gap-2'>
            <Clock size={14} />
            Link Expiry
         </Label>

         <div className='grid grid-cols-3 gap-2'>
            {EXPIRY_OPTIONS.map((option) => {
               const isSelected = selectedOption === option.hours;

               return (
                  <Button
                     key={option.label}
                     variant={isSelected ? "default" : "outline"}
                     size='sm'
                     onClick={() => handleSelect(option.hours)}
                     disabled={disabled}
                     className={cn(
                        "text-xs",
                        isSelected && "ring-2 ring-primary ring-offset-2"
                     )}
                  >
                     {option.label}
                  </Button>
               );
            })}
         </div>

         {value && (
            <div className='flex items-center justify-between p-2 bg-muted/50 rounded-lg text-sm'>
               <div className='flex items-center gap-2 text-muted-foreground'>
                  <Calendar size={14} />
                  <span>Expires: {formatExpiryDate(value)}</span>
               </div>
               <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => handleSelect(null)}
               >
                  <X size={12} />
               </Button>
            </div>
         )}
      </div>
   );
};
