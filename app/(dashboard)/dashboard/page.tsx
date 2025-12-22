export default function DashboardPage() {
   return (
      <div className='space-y-6'>
         <div>
            <h1 className='text-3xl font-bold'>Dashboard</h1>
            <p className='text-muted-foreground mt-2'>
               Welcome to DocChain - Your blockchain-secured document management
               system
            </p>
         </div>

         {/* Stats Grid */}
         <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='p-6 rounded-lg border bg-card'>
               <p className='text-sm text-muted-foreground'>Total Documents</p>
               <p className='text-3xl font-bold mt-2'>24</p>
               <p className='text-xs text-[var(--success)] mt-1'>
                  +12% from last month
               </p>
            </div>
            <div className='p-6 rounded-lg border bg-card'>
               <p className='text-sm text-muted-foreground'>Shared</p>
               <p className='text-3xl font-bold mt-2'>12</p>
               <p className='text-xs text-[var(--info)] mt-1'>50% of total</p>
            </div>
            <div className='p-6 rounded-lg border bg-card'>
               <p className='text-sm text-muted-foreground'>Protected</p>
               <p className='text-3xl font-bold mt-2'>100%</p>
               <p className='text-xs text-[var(--success)] mt-1'>All secured</p>
            </div>
            <div className='p-6 rounded-lg border bg-card'>
               <p className='text-sm text-muted-foreground'>AI Insights</p>
               <p className='text-3xl font-bold mt-2'>8</p>
               <p className='text-xs text-[var(--warning)] mt-1'>
                  Pending review
               </p>
            </div>
         </div>

         {/* Quick Actions */}
         <div className='p-6 rounded-lg border bg-card'>
            <h2 className='text-xl font-semibold mb-4'>Quick Actions</h2>
            <div className='flex flex-wrap gap-3'>
               <button className='px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'>
                  Upload Document
               </button>
               <button className='px-4 py-2 rounded-lg border hover:bg-accent transition-colors'>
                  New Folder
               </button>
               <button className='px-4 py-2 rounded-lg border hover:bg-accent transition-colors'>
                  Share Files
               </button>
            </div>
         </div>

         {/* Recent Activity */}
         <div className='p-6 rounded-lg border bg-card'>
            <h2 className='text-xl font-semibold mb-4'>Recent Activity</h2>
            <div className='space-y-4'>
               <div className='flex items-start gap-3 pb-4 border-b last:border-0'>
                  <div className='w-8 h-8 rounded-full bg-[var(--success)]/10 flex items-center justify-center flex-shrink-0'>
                     <div className='w-2 h-2 rounded-full bg-[var(--success)]' />
                  </div>
                  <div className='flex-1'>
                     <p className='text-sm font-medium'>Document uploaded</p>
                     <p className='text-xs text-muted-foreground'>
                        Contract.pdf was successfully uploaded
                     </p>
                     <p className='text-xs text-muted-foreground mt-1'>
                        2 hours ago
                     </p>
                  </div>
               </div>
               <div className='flex items-start gap-3 pb-4 border-b last:border-0'>
                  <div className='w-8 h-8 rounded-full bg-[var(--info)]/10 flex items-center justify-center flex-shrink-0'>
                     <div className='w-2 h-2 rounded-full bg-[var(--info)]' />
                  </div>
                  <div className='flex-1'>
                     <p className='text-sm font-medium'>Document shared</p>
                     <p className='text-xs text-muted-foreground'>
                        Proposal.pdf shared with john@example.com
                     </p>
                     <p className='text-xs text-muted-foreground mt-1'>
                        5 hours ago
                     </p>
                  </div>
               </div>
               <div className='flex items-start gap-3'>
                  <div className='w-8 h-8 rounded-full bg-blockchain/10 flex items-center justify-center flex-shrink-0'>
                     <div className='w-2 h-2 rounded-full bg-blockchain' />
                  </div>
                  <div className='flex-1'>
                     <p className='text-sm font-medium'>
                        Blockchain verification
                     </p>
                     <p className='text-xs text-muted-foreground'>
                        Report.docx verified on blockchain
                     </p>
                     <p className='text-xs text-muted-foreground mt-1'>
                        1 day ago
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
}
