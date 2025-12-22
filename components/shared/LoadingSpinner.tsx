import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
   size?: "sm" | "md" | "lg";
   className?: string;
}

export function LoadingSpinner({
   size = "md",
   className,
}: LoadingSpinnerProps) {
   const sizeClasses = {
      sm: "h-4 w-4 border-2",
      md: "h-8 w-8 border-2",
      lg: "h-12 w-12 border-3",
   };

   return (
      <div
         className={cn(
            "inline-block animate-spin rounded-full border-solid border-primary border-r-transparent",
            sizeClasses[size],
            className
         )}
         role='status'
         aria-label='Loading'
      >
         <span className='sr-only'>Loading...</span>
      </div>
   );
}

interface LoadingOverlayProps {
   message?: string;
}

export function LoadingOverlay({
   message = "Loading...",
}: LoadingOverlayProps) {
   return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm'>
         <div className='flex flex-col items-center gap-4'>
            <LoadingSpinner size='lg' />
            <p className='text-sm text-muted-foreground'>{message}</p>
         </div>
      </div>
   );
}
