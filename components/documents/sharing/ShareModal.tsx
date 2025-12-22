"use client";

import { FC, useState } from "react";
import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Link2, Clock } from "lucide-react";
import { Document } from "@/lib/types/document";

interface ShareModalProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   document: Document;
   children?: React.ReactNode;
}

/**
 * ShareModal Component
 * Main sharing interface with tabs for different sharing methods
 * Follows Single Responsibility Principle - orchestrates sharing UI
 */
export const ShareModal: FC<ShareModalProps> = ({
   open,
   onOpenChange,
   document,
   children,
}) => {
   const [activeTab, setActiveTab] = useState<"users" | "link" | "history">(
      "users"
   );

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className='max-w-2xl max-h-[80vh] overflow-hidden flex flex-col'>
            <DialogHeader>
               <DialogTitle>Share "{document.title}"</DialogTitle>
               <DialogDescription>
                  Manage access and sharing settings for this document
               </DialogDescription>
            </DialogHeader>

            <Tabs
               value={activeTab}
               onValueChange={(v) => setActiveTab(v as any)}
               className='flex-1 flex flex-col overflow-hidden'
            >
               <TabsList className='grid grid-cols-3 w-full'>
                  <TabsTrigger value='users' className='gap-2'>
                     <Users size={16} />
                     Share with Users
                  </TabsTrigger>
                  <TabsTrigger value='link' className='gap-2'>
                     <Link2 size={16} />
                     Share Link
                  </TabsTrigger>
                  <TabsTrigger value='history' className='gap-2'>
                     <Clock size={16} />
                     Share History
                  </TabsTrigger>
               </TabsList>

               <div className='flex-1 overflow-y-auto mt-4'>
                  <TabsContent value='users' className='mt-0 space-y-4'>
                     {children}
                  </TabsContent>

                  <TabsContent value='link' className='mt-0 space-y-4'>
                     {/* Link tab content will be passed as children */}
                  </TabsContent>

                  <TabsContent value='history' className='mt-0 space-y-4'>
                     {/* History tab content will be passed as children */}
                  </TabsContent>
               </div>
            </Tabs>
         </DialogContent>
      </Dialog>
   );
};
