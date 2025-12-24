"use client";

import { motion } from "framer-motion";
import {
   Shield,
   Lock,
   Sparkles,
   Zap,
   Users,
   FileCheck,
   Search,
   Clock,
   Code,
   Globe,
   Database,
   GitBranch,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Bento Grid Layout Features
const bentoFeatures = [
   {
      icon: Shield,
      title: "Blockchain Security",
      description:
         "Every document automatically secured with immutable blockchain hashes. Tamper-proof protection you can verify instantly.",
      size: "large", // spans 2 columns
      gradient: "from-primary/20 via-primary/10 to-transparent",
      borderColor: "border-primary/30",
      iconColor: "text-primary",
   },
   {
      icon: Sparkles,
      title: "AI Intelligence",
      description:
         "Smart auto-tagging, content analysis, and predictive insights. Let AI work for you.",
      size: "small",
      gradient: "from-blue-500/20 via-blue-500/10 to-transparent",
      borderColor: "border-blue-500/30",
      iconColor: "text-blue-500",
   },
   {
      icon: Zap,
      title: "Lightning Fast",
      description: "1.2s average hashing time with 99.98% success rate.",
      size: "small",
      gradient: "from-yellow-500/20 via-yellow-500/10 to-transparent",
      borderColor: "border-yellow-500/30",
      iconColor: "text-yellow-500",
   },
   {
      icon: Lock,
      title: "End-to-End Encryption",
      description:
         "Military-grade encryption ensures your documents remain private and secure at all times.",
      size: "medium",
      gradient: "from-green-500/20 via-green-500/10 to-transparent",
      borderColor: "border-green-500/30",
      iconColor: "text-green-500",
   },
   {
      icon: Users,
      title: "Smart Collaboration",
      description:
         "Share securely with granular permissions. AI suggests the right people automatically.",
      size: "medium",
      gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
      borderColor: "border-purple-500/30",
      iconColor: "text-purple-500",
   },
   {
      icon: FileCheck,
      title: "Version Control",
      description:
         "Track every change with blockchain-protected versions and AI summaries.",
      size: "small",
      gradient: "from-orange-500/20 via-orange-500/10 to-transparent",
      borderColor: "border-orange-500/30",
      iconColor: "text-orange-500",
   },
   {
      icon: Search,
      title: "Intelligent Search",
      description:
         "Natural language queries with semantic understanding and content search.",
      size: "small",
      gradient: "from-cyan-500/20 via-cyan-500/10 to-transparent",
      borderColor: "border-cyan-500/30",
      iconColor: "text-cyan-500",
   },
   {
      icon: Clock,
      title: "Audit Trail",
      description:
         "Complete immutable blockchain logs for every action. Perfect for compliance.",
      size: "large",
      gradient: "from-pink-500/20 via-pink-500/10 to-transparent",
      borderColor: "border-pink-500/30",
      iconColor: "text-pink-500",
   },
];

export function Features() {
   return (
      <section className='py-20 md:py-32 bg-muted/20 relative overflow-hidden'>
         {/* Background decoration */}
         <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[32px_32px]' />

         <div className='container px-4 md:px-6 relative z-10'>
            <div className='text-center space-y-4 mb-16'>
               <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
               >
                  <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4'>
                     <Database className='w-4 h-4 text-primary' />
                     <span className='text-sm font-medium'>
                        Enterprise Features
                     </span>
                  </div>
                  <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'>
                     Built for Security
                     <br />
                     <span className='bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent'>
                        Designed for Scale
                     </span>
                  </h2>
               </motion.div>
               <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className='text-lg text-muted-foreground max-w-2xl mx-auto'
               >
                  Combining cutting-edge blockchain technology with intelligent
                  AI to deliver unmatched document security and management.
               </motion.p>
            </div>

            {/* Bento Grid Layout */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto'>
               {bentoFeatures.map((feature, index) => {
                  const Icon = feature.icon;
                  const sizeClasses = {
                     small: "md:col-span-1",
                     medium: "md:col-span-1 lg:col-span-2",
                     large: "md:col-span-2",
                  };

                  return (
                     <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5, delay: index * 0.05 }}
                        className={
                           sizeClasses[feature.size as keyof typeof sizeClasses]
                        }
                     >
                        <Card
                           className={`group relative p-6 h-full hover:shadow-2xl transition-all duration-500 border ${feature.borderColor} bg-linear-to-br ${feature.gradient} backdrop-blur-sm overflow-hidden`}
                        >
                           {/* Hover glow effect */}
                           <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500'>
                              <div
                                 className={`absolute inset-0 bg-linear-to-br ${feature.gradient} blur-xl`}
                              />
                           </div>

                           <div className='relative z-10 space-y-4'>
                              <div
                                 className={`w-14 h-14 rounded-2xl bg-linear-to-br ${feature.gradient} flex items-center justify-center border ${feature.borderColor}`}
                              >
                                 <Icon
                                    className={`w-7 h-7 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}
                                 />
                              </div>
                              <h3 className='text-xl font-bold'>
                                 {feature.title}
                              </h3>
                              <p className='text-muted-foreground leading-relaxed'>
                                 {feature.description}
                              </p>
                           </div>
                        </Card>
                     </motion.div>
                  );
               })}
            </div>
         </div>
      </section>
   );
}
