"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Sparkles, Shield, Zap } from "lucide-react";
import Link from "next/link";

const benefits = [
   { icon: Shield, text: "Bank-grade blockchain security" },
   { icon: Sparkles, text: "AI-powered intelligence" },
   { icon: Zap, text: "Deploy in under 5 minutes" },
   { icon: CheckCircle2, text: "No credit card required" },
];

export function CTA() {
   return (
      <section className='py-20 md:py-32 bg-linear-to-b from-background via-primary/5 to-background relative overflow-hidden'>
         {/* Background elements */}
         <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[48px_48px]' />
         <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-primary/10 rounded-full blur-3xl' />

         <div className='container px-4 md:px-6 relative z-10'>
            <motion.div
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
               className='max-w-4xl mx-auto'
            >
               <div className='relative rounded-3xl bg-linear-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 p-8 md:p-12 lg:p-16 backdrop-blur-sm overflow-hidden'>
                  {/* Inner glow */}
                  <div className='absolute inset-0 bg-linear-to-tr from-primary/5 via-transparent to-blue-600/5 rounded-3xl' />

                  <div className='relative z-10 space-y-8 text-center'>
                     {/* Badge */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className='inline-flex'
                     >
                        <div className='px-5 py-2.5 rounded-full bg-linear-to-r from-primary to-blue-600 text-primary-foreground text-sm font-semibold shadow-xl'>
                           🚀 Start Securing Documents Today
                        </div>
                     </motion.div>

                     {/* Heading */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className='space-y-4'
                     >
                        <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'>
                           Ready to Secure Your
                           <br />
                           <span className='bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient'>
                              Document Workflow?
                           </span>
                        </h2>
                        <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
                           Join 150+ organizations trusting DocChain for
                           blockchain-powered document security. Get started in
                           minutes.
                        </p>
                     </motion.div>

                     {/* CTA Buttons */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className='flex flex-col sm:flex-row gap-4 justify-center'
                     >
                        <Button
                           size='lg'
                           className='rounded-full text-base px-8 h-14 shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90'
                        >
                           <Link href='/register'>
                              Start Free Trial
                              <ArrowRight className='ml-2 w-5 h-5' />
                           </Link>
                        </Button>
                        <Button
                           size='lg'
                           variant='outline'
                           className='rounded-full text-base px-8 h-14 border-2 hover:bg-background/50 backdrop-blur-sm'
                        >
                           <Link href='/login'>Sign In</Link>
                        </Button>
                     </motion.div>

                     {/* Benefits Grid */}
                     <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-8'
                     >
                        {benefits.map((benefit, index) => {
                           const Icon = benefit.icon;
                           return (
                              <div
                                 key={index}
                                 className='flex items-center gap-3 justify-center sm:justify-start'
                              >
                                 <div className='w-8 h-8 rounded-full bg-linear-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/30'>
                                    <Icon className='w-4 h-4 text-primary' />
                                 </div>
                                 <span className='text-sm font-medium'>
                                    {benefit.text}
                                 </span>
                              </div>
                           );
                        })}
                     </motion.div>

                     {/* Trust indicator */}
                     <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                        className='text-sm text-muted-foreground pt-4'
                     >
                        Trusted by 150+ organizations • 99.98% uptime •
                        Enterprise support
                     </motion.p>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>
   );
}
