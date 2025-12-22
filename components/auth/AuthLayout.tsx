import { FC, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
   children: ReactNode;
   title: string;
   subtitle?: string;
}

export const AuthLayout: FC<AuthLayoutProps> = ({
   children,
   title,
   subtitle,
}) => {
   return (
      <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-muted/20 p-4'>
         {/* Blockchain grid background effect */}
         <div className='absolute inset-0 bg-grid-white/[0.02] bg-size-[60px_60px]' />

         {/* Animated glow effect */}
         <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blockchain/10 rounded-full blur-3xl animate-blockchain-pulse' />
         <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-ai/10 rounded-full blur-3xl animate-ai-thinking' />

         <div className='relative w-full max-w-md'>
            {/* Header */}
            <div className='text-center mb-8'>
               <div className='flex items-center justify-center mb-4'>
                  <div className='w-12 h-12 rounded-lg bg-linear-to-br from-blockchain-primary to-blockchain-secondary flex items-center justify-center'>
                     <svg
                        className='w-6 h-6 text-white'
                        fill='none'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth='2'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                     >
                        <path d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
                     </svg>
                  </div>
               </div>
               <h1 className='text-3xl font-bold tracking-tight'>DocChain</h1>
               <p className='text-sm text-muted-foreground mt-1'>
                  Blockchain-Secured Document Management
               </p>
            </div>

            {/* Auth Card */}
            <div className='bg-card border rounded-lg shadow-lg p-6 sm:p-8'>
               <div className='mb-6'>
                  <h2 className='text-2xl font-semibold'>{title}</h2>
                  {subtitle && (
                     <p className='text-sm text-muted-foreground mt-1'>
                        {subtitle}
                     </p>
                  )}
               </div>
               {children}
            </div>

            {/* Footer */}
            <p className='text-center text-xs text-muted-foreground mt-6'>
               Protected by blockchain technology • Powered by AI
            </p>
         </div>
      </div>
   );
};
