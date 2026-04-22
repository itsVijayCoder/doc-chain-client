"use client";

import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlockchainStatsProps {
   totalDocuments?: number;
   protectedDocuments?: number;
   pendingVerifications?: number;
   failedVerifications?: number;
   networkHealth?: number;
}

export const BlockchainStats: FC<BlockchainStatsProps> = ({
   totalDocuments = 24,
   protectedDocuments = 24,
   pendingVerifications = 2,
   failedVerifications = 0,
   networkHealth = 98,
}) => {
   const protectionRate =
      totalDocuments > 0
         ? Math.round((protectedDocuments / totalDocuments) * 100)
         : 0;

   const getHealthColor = () => {
      if (networkHealth >= 90) return "text-(--success)";
      if (networkHealth >= 70) return "text-(--warning)";
      return "text-(--error)";
   };

   const getHealthBadgeVariant = () => {
      if (networkHealth >= 90) return "default";
      if (networkHealth >= 70) return "secondary";
      return "destructive";
   };

   return (
      <Card className='p-6 border-blockchain/20 bg-blockchain/5 h-[390px]'>
         <div className='flex items-center gap-2 mb-4'>
            <Shield
               className='text-blockchain animate-blockchain-pulse'
               size={20}
            />
            <h2 className='text-xl font-semibold'>Blockchain Protection</h2>
            <Badge variant={getHealthBadgeVariant()} className='ml-auto'>
               {networkHealth}% Network Health
            </Badge>
         </div>

         {/* Protection Progress */}
         <div className='space-y-2 mb-6'>
            <div className='flex items-center justify-between text-sm'>
               <span className='text-muted-foreground'>
                  Protection Coverage
               </span>
               <span className='font-medium'>{protectionRate}%</span>
            </div>
            <Progress value={protectionRate} className='h-2' />
            <p className='text-xs text-muted-foreground'>
               {protectedDocuments} of {totalDocuments} documents protected
            </p>
         </div>

         {/* Stats Grid */}
         <div className='grid grid-cols-3 gap-4'>
            <div className='text-center'>
               <div className='flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-(--success)/10 text-(--success) mb-2'>
                  <CheckCircle2 size={20} />
               </div>
               <p className='text-2xl font-bold'>{protectedDocuments}</p>
               <p className='text-xs text-muted-foreground mt-1'>Protected</p>
            </div>

            <div className='text-center'>
               <div className='flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-(--warning)/10 text-(--warning) mb-2'>
                  <Clock size={20} />
               </div>
               <p className='text-2xl font-bold'>{pendingVerifications}</p>
               <p className='text-xs text-muted-foreground mt-1'>Pending</p>
            </div>

            <div className='text-center'>
               <div
                  className={cn(
                     "flex items-center justify-center w-10 h-10 mx-auto rounded-full mb-2",
                     failedVerifications > 0
                        ? "bg-(--error)/10 text-(--error)"
                        : "bg-muted text-muted-foreground"
                  )}
               >
                  <AlertCircle size={20} />
               </div>
               <p className='text-2xl font-bold'>{failedVerifications}</p>
               <p className='text-xs text-muted-foreground mt-1'>Failed</p>
            </div>
         </div>

         {/* Network Status */}
         <div className='mt-6 pt-6 border-t'>
            <div className='flex items-center justify-between'>
               <span className='text-sm text-muted-foreground'>
                  Network Status
               </span>
               <span className={cn("text-sm font-medium", getHealthColor())}>
                  {networkHealth >= 90
                     ? "Excellent"
                     : networkHealth >= 70
                     ? "Good"
                     : "Poor"}
               </span>
            </div>
         </div>
      </Card>
   );
};
