"use client";

import { motion } from "framer-motion";
import { Upload, Link2, CheckCircle2, Share2, ArrowRight } from "lucide-react";

const steps = [
   {
      number: "01",
      icon: Upload,
      title: "Upload Document",
      description:
         "Drag and drop or select files. AI automatically analyzes and tags your content for easy discovery.",
      gradient: "from-primary/20 to-primary/5",
      iconGradient: "from-primary to-blue-600",
   },
   {
      number: "02",
      icon: Link2,
      title: "Blockchain Protection",
      description:
         "Document instantly hashed and recorded on blockchain. Immutable, tamper-proof, verifiable forever.",
      gradient: "from-blue-600/20 to-blue-600/5",
      iconGradient: "from-blue-600 to-cyan-600",
   },
   {
      number: "03",
      icon: CheckCircle2,
      title: "Instant Verification",
      description:
         "Get cryptographic proof and blockchain certificate. Verify document authenticity anytime.",
      gradient: "from-cyan-600/20 to-cyan-600/5",
      iconGradient: "from-cyan-600 to-green-600",
   },
   {
      number: "04",
      icon: Share2,
      title: "Smart Sharing",
      description:
         "Share with granular permissions. AI suggests collaborators and maintains full audit trail.",
      gradient: "from-green-600/20 to-green-600/5",
      iconGradient: "from-green-600 to-emerald-600",
   },
];

export function HowItWorks() {
   return (
      <section className='py-20 md:py-32 bg-background relative overflow-hidden'>
         {/* Decorative gradient orbs */}
         <div className='absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
         <div className='absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl' />

         <div className='container px-4 md:px-6 relative z-10'>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
               className='text-center space-y-4 mb-16 md:mb-24'
            >
               <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4'>
                  <ArrowRight className='w-4 h-4 text-primary' />
                  <span className='text-sm font-semibold'>Simple Process</span>
               </div>
               <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'>
                  How DocChain{" "}
                  <span className='bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent'>
                     Works
                  </span>
               </h2>
               <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                  Blockchain-powered document security in four simple steps.
                  <br />
                  No technical knowledge required.
               </p>
            </motion.div>

            <div className='max-w-6xl mx-auto space-y-8 md:space-y-12'>
               {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isEven = index % 2 === 0;

                  return (
                     <motion.div
                        key={index}
                        initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        className='relative'
                     >
                        <div
                           className={`grid md:grid-cols-2 gap-8 items-center ${
                              isEven ? "" : "md:grid-flow-dense"
                           }`}
                        >
                           {/* Content */}
                           <div
                              className={
                                 isEven ? "md:pr-12" : "md:pl-12 md:col-start-2"
                              }
                           >
                              <div className='space-y-4'>
                                 <div
                                    className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-linear-to-r ${step.gradient} border border-border/50`}
                                 >
                                    <span className='text-sm font-mono font-bold'>
                                       {step.number}
                                    </span>
                                    <div className='w-px h-4 bg-border' />
                                    <span className='text-sm font-semibold'>
                                       Step {index + 1}
                                    </span>
                                 </div>

                                 <h3 className='text-2xl sm:text-3xl md:text-4xl font-bold'>
                                    {step.title}
                                 </h3>

                                 <p className='text-lg text-muted-foreground leading-relaxed'>
                                    {step.description}
                                 </p>
                              </div>
                           </div>

                           {/* Visual */}
                           <div
                              className={
                                 isEven
                                    ? "md:pl-12"
                                    : "md:pr-12 md:col-start-1 md:row-start-1"
                              }
                           >
                              <div className='relative group'>
                                 <div
                                    className={`aspect-square rounded-3xl bg-linear-to-br ${step.gradient} border border-border/50 backdrop-blur-sm p-8 hover:shadow-2xl transition-all duration-500 flex items-center justify-center`}
                                 >
                                    <div
                                       className={`w-32 h-32 rounded-2xl bg-linear-to-br ${step.iconGradient} p-1 group-hover:scale-110 transition-transform duration-500`}
                                    >
                                       <div className='w-full h-full rounded-2xl bg-background/95 flex items-center justify-center'>
                                          <Icon className='w-16 h-16 text-primary' />
                                       </div>
                                    </div>
                                 </div>

                                 {/* Connector line */}
                                 {index < steps.length - 1 && (
                                    <div className='hidden md:block absolute top-full left-1/2 -translate-x-1/2 w-px h-12 bg-linear-to-b from-border to-transparent' />
                                 )}
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  );
               })}
            </div>
         </div>
      </section>
   );
}
