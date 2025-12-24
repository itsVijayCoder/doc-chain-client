"use client";

import { motion } from "framer-motion";
import {
   Shield,
   Lock,
   Sparkles,
   ArrowRight,
   Zap,
   CheckCircle2,
   Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function Hero() {
   return (
      <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
         {/* Modern gradient mesh background */}
         <div className='absolute inset-0 overflow-hidden pointer-events-none'>
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--tw-gradient-stops))] from-primary/20 via-background to-background' />
            <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent' />

            {/* Animated orbs */}
            <div className='absolute top-0 left-1/4 w-150 h-150 bg-primary/10 rounded-full blur-3xl animate-pulse' />
            <div
               className='absolute top-1/3 right-1/4 w-125 h-125 bg-blue-500/10 rounded-full blur-3xl animate-pulse'
               style={{ animationDelay: "1s" }}
            />
            <div
               className='absolute bottom-1/4 left-1/3 w-100 h-100 bg-purple-500/10 rounded-full blur-3xl animate-pulse'
               style={{ animationDelay: "2s" }}
            />

            {/* Grid pattern overlay */}
            <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-[radial-gradient(ellipse_at_center,transparent_20%,black_70%)]' />
         </div>

         <div className='container relative z-10 px-4 md:px-6 py-20'>
            <div className='flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto'>
               {/* Premium Trust Badge */}
               <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
               >
                  <Badge
                     variant='outline'
                     className='px-5 py-2.5 text-sm font-medium border-primary/30 bg-primary/10 backdrop-blur-md shadow-lg shadow-primary/5 hover:shadow-primary/10 transition-all group'
                  >
                     <Shield className='w-4 h-4 mr-2 text-primary animate-pulse' />
                     Enterprise Blockchain • AI-Powered • Bank-Grade Security
                     <Star className='w-4 h-4 ml-2 text-yellow-500 fill-yellow-500' />
                  </Badge>
               </motion.div>

               {/* Hero Headline with Gradient Animation */}
               <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className='space-y-6'
               >
                  <h1 className='text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]'>
                     <span className='block mb-2'>Secure Your Documents</span>
                     <span className='block bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient'>
                        with Blockchain
                     </span>
                  </h1>
                  <p className='text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-light'>
                     Enterprise-grade document protection powered by{" "}
                     <span className='text-foreground font-semibold'>
                        blockchain technology
                     </span>{" "}
                     and{" "}
                     <span className='text-foreground font-semibold'>
                        AI intelligence
                     </span>
                     . Unhackable. Verifiable. Simple.
                  </p>
               </motion.div>

               {/* Modern Feature Cards Grid */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className='grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-3xl'
               >
                  <div className='group flex flex-col items-center gap-2 p-5 rounded-2xl bg-linear-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all cursor-default'>
                     <Lock className='w-7 h-7 text-primary group-hover:scale-110 transition-transform' />
                     <span className='text-sm font-semibold'>Tamper-Proof</span>
                     <span className='text-xs text-muted-foreground'>
                        Immutable
                     </span>
                  </div>
                  <div className='group flex flex-col items-center gap-2 p-5 rounded-2xl bg-linear-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-default'>
                     <Sparkles className='w-7 h-7 text-blue-500 group-hover:scale-110 transition-transform' />
                     <span className='text-sm font-semibold'>AI-Powered</span>
                     <span className='text-xs text-muted-foreground'>
                        Smart
                     </span>
                  </div>
                  <div className='group flex flex-col items-center gap-2 p-5 rounded-2xl bg-linear-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 transition-all cursor-default'>
                     <Zap className='w-7 h-7 text-green-500 group-hover:scale-110 transition-transform' />
                     <span className='text-sm font-semibold'>1.2s Speed</span>
                     <span className='text-xs text-muted-foreground'>
                        Lightning
                     </span>
                  </div>
                  <div className='group flex flex-col items-center gap-2 p-5 rounded-2xl bg-linear-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-default'>
                     <CheckCircle2 className='w-7 h-7 text-purple-500 group-hover:scale-110 transition-transform' />
                     <span className='text-sm font-semibold'>
                        99.98% Uptime
                     </span>
                     <span className='text-xs text-muted-foreground'>
                        Reliable
                     </span>
                  </div>
               </motion.div>

               {/* Premium CTA Buttons */}
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className='flex flex-col sm:flex-row gap-4 pt-8'
               >
                  <Button
                     size='lg'
                     className='text-lg px-10 h-14 rounded-full shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all font-semibold group'
                  >
                     <Link href='/register'>
                        Start Free Trial
                        <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform' />
                     </Link>
                  </Button>
                  <Button
                     size='lg'
                     variant='outline'
                     className='text-lg px-10 h-14 rounded-full border-2 hover:bg-muted/50 backdrop-blur-sm font-semibold'
                  >
                     <Link href='/login'>Sign In</Link>
                  </Button>
               </motion.div>

               {/* Trust Indicators */}
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className='pt-12 space-y-4'
               >
                  <p className='text-sm text-muted-foreground font-medium'>
                     Trusted by 150+ organizations • SOC 2 Compliant • GDPR
                     Ready
                  </p>
                  <div className='flex flex-wrap justify-center gap-3 items-center opacity-60'>
                     <div className='px-4 py-2 bg-muted/50 backdrop-blur-sm rounded-lg text-xs font-medium'>
                        ✓ No credit card
                     </div>
                     <div className='px-4 py-2 bg-muted/50 backdrop-blur-sm rounded-lg text-xs font-medium'>
                        ✓ 30-day trial
                     </div>
                     <div className='px-4 py-2 bg-muted/50 backdrop-blur-sm rounded-lg text-xs font-medium'>
                        ✓ Cancel anytime
                     </div>
                  </div>
               </motion.div>
            </div>
         </div>

         {/* Modern Scroll Indicator */}
         <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className='absolute bottom-12 left-1/2 -translate-x-1/2'
         >
            <div className='w-8 h-12 rounded-full border-2 border-border/50 flex items-start justify-center p-2 backdrop-blur-sm bg-background/30'>
               <motion.div
                  animate={{ y: [0, 16, 0] }}
                  transition={{
                     duration: 2,
                     repeat: Infinity,
                     ease: "easeInOut",
                  }}
                  className='w-1.5 h-1.5 rounded-full bg-linear-to-b from-primary to-blue-600'
               />
            </div>
         </motion.div>
      </section>
   );
}
