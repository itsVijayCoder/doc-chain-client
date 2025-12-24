"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
   {
      name: "Sarah Chen",
      role: "CTO, TechCorp",
      avatar: "/avatars/sarah.jpg",
      initials: "SC",
      rating: 5,
      quote: "DocChain transformed how we manage sensitive documents. The blockchain verification gives us confidence and the AI features save hours every week.",
      gradient: "from-primary/20 to-primary/5",
   },
   {
      name: "Michael Rodriguez",
      role: "Legal Director, LawFirm Inc",
      avatar: "/avatars/michael.jpg",
      initials: "MR",
      rating: 5,
      quote: "The immutable audit trail is exactly what we needed for compliance. DocChain's blockchain integration is seamless and actually works.",
      gradient: "from-blue-600/20 to-blue-600/5",
   },
   {
      name: "Emily Watson",
      role: "Operations Manager, HealthCare Co",
      avatar: "/avatars/emily.jpg",
      initials: "EW",
      rating: 5,
      quote: "We've been using DocChain for 6 months and haven't had a single security incident. The AI auto-tagging alone is worth the investment.",
      gradient: "from-purple-600/20 to-purple-600/5",
   },
   {
      name: "David Kim",
      role: "Founder, StartupX",
      avatar: "/avatars/david.jpg",
      initials: "DK",
      rating: 5,
      quote: "Setup took less than 10 minutes. The UX is incredibly intuitive and our team adopted it immediately. Best document management solution we've used.",
      gradient: "from-green-600/20 to-green-600/5",
   },
   {
      name: "Lisa Anderson",
      role: "IT Security Lead, FinanceHub",
      avatar: "/avatars/lisa.jpg",
      initials: "LA",
      rating: 5,
      quote: "The blockchain verification gives us peace of mind for regulatory compliance. DocChain's security features are enterprise-grade.",
      gradient: "from-cyan-600/20 to-cyan-600/5",
   },
   {
      name: "James Thompson",
      role: "CEO, MediaGroup",
      avatar: "/avatars/james.jpg",
      initials: "JT",
      rating: 5,
      quote: "Exceptional product and support. The AI suggestions for sharing and organization have streamlined our entire content workflow.",
      gradient: "from-orange-600/20 to-orange-600/5",
   },
];

export function Testimonials() {
   return (
      <section className='py-20 md:py-32 bg-muted/20 relative overflow-hidden'>
         {/* Background decoration */}
         <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[48px_48px]' />
         <div className='absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl' />
         <div className='absolute bottom-1/4 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl' />

         <div className='container px-4 md:px-6 relative z-10'>
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5 }}
               className='text-center space-y-4 mb-16'
            >
               <div className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-4'>
                  <Star className='w-4 h-4 text-primary fill-primary' />
                  <span className='text-sm font-semibold'>
                     Loved by Teams Worldwide
                  </span>
               </div>
               <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight'>
                  Trusted by{" "}
                  <span className='bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent'>
                     Industry Leaders
                  </span>
               </h2>
               <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                  Join thousands of teams who have transformed their document
                  management with DocChain's blockchain-powered platform.
               </p>
            </motion.div>

            {/* Masonry Grid for Testimonials */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto'>
               {testimonials.map((testimonial, index) => (
                  <motion.div
                     key={index}
                     initial={{ opacity: 0, y: 30 }}
                     whileInView={{ opacity: 1, y: 0 }}
                     viewport={{ once: true, margin: "-50px" }}
                     transition={{ duration: 0.5, delay: index * 0.05 }}
                  >
                     <Card
                        className={`group relative p-6 h-full hover:shadow-2xl transition-all duration-500 border border-border/50 bg-linear-to-br ${testimonial.gradient} backdrop-blur-sm overflow-hidden`}
                     >
                        {/* Quote icon decoration */}
                        <div className='absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity'>
                           <Quote className='w-12 h-12' />
                        </div>

                        <div className='relative z-10 space-y-4'>
                           {/* Rating */}
                           <div className='flex gap-1'>
                              {[...Array(testimonial.rating)].map((_, i) => (
                                 <Star
                                    key={i}
                                    className='w-5 h-5 text-yellow-500 fill-yellow-500'
                                 />
                              ))}
                           </div>

                           {/* Quote */}
                           <p className='text-muted-foreground leading-relaxed'>
                              "{testimonial.quote}"
                           </p>

                           {/* Author */}
                           <div className='flex items-center gap-3 pt-4 border-t border-border/50'>
                              <Avatar className='w-12 h-12 border-2 border-primary/20'>
                                 <AvatarImage
                                    src={testimonial.avatar}
                                    alt={testimonial.name}
                                 />
                                 <AvatarFallback className='bg-linear-to-br from-primary to-blue-600 text-primary-foreground font-semibold'>
                                    {testimonial.initials}
                                 </AvatarFallback>
                              </Avatar>
                              <div>
                                 <div className='font-semibold'>
                                    {testimonial.name}
                                 </div>
                                 <div className='text-sm text-muted-foreground'>
                                    {testimonial.role}
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Hover glow effect */}
                        <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none'>
                           <div
                              className={`absolute inset-0 bg-linear-to-br ${testimonial.gradient} blur-xl`}
                           />
                        </div>
                     </Card>
                  </motion.div>
               ))}
            </div>

            {/* Bottom Stats */}
            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.5, delay: 0.3 }}
               className='mt-16 text-center'
            >
               <div className='inline-flex flex-col sm:flex-row items-center gap-6 sm:gap-12 px-8 py-6 rounded-2xl bg-linear-to-r from-primary/10 via-blue-600/10 to-purple-600/10 border border-border/50 backdrop-blur-sm'>
                  <div>
                     <div className='text-3xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent'>
                        4.9/5
                     </div>
                     <div className='text-sm text-muted-foreground'>
                        Average Rating
                     </div>
                  </div>
                  <div className='hidden sm:block w-px h-12 bg-border' />
                  <div>
                     <div className='text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
                        500+
                     </div>
                     <div className='text-sm text-muted-foreground'>
                        Happy Customers
                     </div>
                  </div>
                  <div className='hidden sm:block w-px h-12 bg-border' />
                  <div>
                     <div className='text-3xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                        98%
                     </div>
                     <div className='text-sm text-muted-foreground'>
                        Would Recommend
                     </div>
                  </div>
               </div>
            </motion.div>
         </div>
      </section>
   );
}
