"use client";

import { motion } from "framer-motion";
import { TrendingUp, Users, Shield, Zap } from "lucide-react";

const stats = [
   {
      value: "150+",
      label: "Organizations",
      subtext: "Trust DocChain",
      icon: Users,
      gradient: "from-primary to-blue-600",
   },
   {
      value: "2,847",
      label: "Documents",
      subtext: "Blockchain Protected",
      icon: Shield,
      gradient: "from-blue-600 to-cyan-600",
   },
   {
      value: "99.98%",
      label: "Success Rate",
      subtext: "Blockchain Transactions",
      icon: TrendingUp,
      gradient: "from-cyan-600 to-green-600",
   },
   {
      value: "1.2s",
      label: "Avg Speed",
      subtext: "Document Hashing",
      icon: Zap,
      gradient: "from-green-600 to-emerald-600",
   },
];

export function Stats() {
   return (
      <section className='py-20 md:py-32 bg-linear-to-b from-background via-primary/5 to-background border-y border-border/50 relative overflow-hidden'>
         {/* Background decoration */}
         <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent' />

         <div className='container px-4 md:px-6 relative z-10'>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
               className='text-center mb-16'
            >
               <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6'>
                  <TrendingUp className='w-5 h-5 text-primary' />
                  <span className='text-sm font-semibold'>
                     Growing Fast & Trusted Worldwide
                  </span>
               </div>
               <h2 className='text-4xl sm:text-5xl md:text-6xl font-bold'>
                  Trusted by Teams{" "}
                  <span className='bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent'>
                     Worldwide
                  </span>
               </h2>
            </motion.div>

            <div className='grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8'>
               {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                     <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className='relative group'
                     >
                        <div className='relative p-8 rounded-3xl bg-linear-to-br from-background via-muted/30 to-background border border-border/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10'>
                           {/* Icon */}
                           <div className='flex justify-center mb-4'>
                              <div
                                 className={`w-16 h-16 rounded-2xl bg-linear-to-br ${stat.gradient} p-0.5 group-hover:scale-110 transition-transform duration-300`}
                              >
                                 <div className='w-full h-full rounded-2xl bg-background/95 flex items-center justify-center'>
                                    <Icon className='w-8 h-8 text-primary' />
                                 </div>
                              </div>
                           </div>

                           {/* Value */}
                           <div
                              className={`text-5xl md:text-6xl font-bold text-center mb-2 bg-linear-to-br ${stat.gradient} bg-clip-text text-transparent`}
                           >
                              {stat.value}
                           </div>

                           {/* Label */}
                           <div className='text-center space-y-1'>
                              <div className='text-lg font-semibold'>
                                 {stat.label}
                              </div>
                              <div className='text-sm text-muted-foreground'>
                                 {stat.subtext}
                              </div>
                           </div>

                           {/* Hover glow effect */}
                           <div className='absolute inset-0 rounded-3xl bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' />
                        </div>
                     </motion.div>
                  );
               })}
            </div>
         </div>
      </section>
   );
}
