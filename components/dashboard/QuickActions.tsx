"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
   FileUp,
   FolderPlus,
   Share2,
   Search,
   Download,
   Upload,
} from "lucide-react";

interface QuickAction {
   icon: React.ReactNode;
   label: string;
   description: string;
   onClick: () => void;
   variant?: "default" | "outline";
}

interface QuickActionsProps {
   actions?: QuickAction[];
}

export const QuickActions: FC<QuickActionsProps> = ({ actions }) => {
   const router = useRouter();

   const defaultActions: QuickAction[] = [
      {
         icon: <FileUp size={20} />,
         label: "Upload Document",
         description: "Upload new files",
         onClick: () => router.push("/documents?action=upload"),
         variant: "outline",
      },
      {
         icon: <FolderPlus size={20} />,
         label: "New Folder",
         description: "Organize your files",
         onClick: () => router.push("/documents?action=new-folder"),
         variant: "outline",
      },
      {
         icon: <Share2 size={20} />,
         label: "Share Files",
         description: "Share with team",
         onClick: () => router.push("/shared"),
         variant: "outline",
      },
      {
         icon: <Search size={20} />,
         label: "Search",
         description: "Find documents",
         onClick: () => router.push("/search"),
         variant: "outline",
      },
   ];

   const displayActions = actions || defaultActions;

   return (
      <Card className='p-6'>
         <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
         <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            {displayActions.map((action, index) => (
               <Button
                  key={index}
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  className='h-auto flex-col items-start p-4 text-left'
               >
                  <div className='flex items-center gap-2 w-full'>
                     {action.icon}
                     <span className='font-medium'>{action.label}</span>
                  </div>
                  <span className='text-xs text-muted-foreground mt-1'>
                     {action.description}
                  </span>
               </Button>
            ))}
         </div>
      </Card>
   );
};
