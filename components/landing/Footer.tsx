"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
   Github,
   Twitter,
   Linkedin,
   Mail,
   Shield,
   Sparkles,
} from "lucide-react";

const footerLinks = {
   product: [
      { name: "Features", href: "#features" },
      { name: "How it Works", href: "#how-it-works" },
      { name: "Pricing", href: "/pricing" },
      { name: "Security", href: "/security" },
      { name: "Integrations", href: "/integrations" },
   ],
   company: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Partners", href: "/partners" },
   ],
   resources: [
      { name: "Documentation", href: "/docs" },
      { name: "API Reference", href: "/api" },
      { name: "Guides", href: "/guides" },
      { name: "Support", href: "/support" },
      { name: "Status", href: "/status" },
   ],
   legal: [
      { name: "Privacy Policy", href: "/privacy" },
      { name: "Terms of Service", href: "/terms" },
      { name: "Cookie Policy", href: "/cookies" },
      { name: "Compliance", href: "/compliance" },
      { name: "Licenses", href: "/licenses" },
   ],
};

const socialLinks = [
   { name: "Twitter", icon: Twitter, href: "https://twitter.com/docchain" },
   {
      name: "LinkedIn",
      icon: Linkedin,
      href: "https://linkedin.com/company/docchain",
   },
   { name: "GitHub", icon: Github, href: "https://github.com/docchain" },
   { name: "Email", icon: Mail, href: "mailto:hello@docchain.io" },
];

const badges = [
   { text: "SOC 2 Certified", icon: Shield },
   { text: "GDPR Compliant", icon: Shield },
   { text: "ISO 27001", icon: Shield },
];

export function Footer() {
   return (
      <footer className='bg-muted/30 border-t border-border/50 relative overflow-hidden'>
         {/* Background decoration */}
         <div className='absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-size-[32px_32px]' />

         <div className='container px-4 md:px-6 py-16 md:py-20 relative z-10'>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12'>
               {/* Brand Section */}
               <div className='lg:col-span-2 space-y-6'>
                  <Link
                     href='/'
                     className='inline-flex items-center gap-2 group'
                  >
                     <div className='w-10 h-10 rounded-xl bg-linear-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow'>
                        <Shield className='w-6 h-6 text-primary-foreground' />
                     </div>
                     <div>
                        <span className='text-2xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent'>
                           DocChain
                        </span>
                        <div className='flex items-center gap-1 -mt-1'>
                           <Sparkles className='w-3 h-3 text-primary' />
                           <span className='text-xs text-muted-foreground'>
                              Blockchain Powered
                           </span>
                        </div>
                     </div>
                  </Link>

                  <p className='text-muted-foreground leading-relaxed max-w-sm'>
                     Enterprise-grade document management secured by blockchain
                     technology and powered by artificial intelligence.
                  </p>

                  {/* Compliance Badges */}
                  <div className='flex flex-wrap gap-2'>
                     {badges.map((badge, index) => {
                        const Icon = badge.icon;
                        return (
                           <div
                              key={index}
                              className='inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium'
                           >
                              <Icon className='w-3 h-3 text-primary' />
                              {badge.text}
                           </div>
                        );
                     })}
                  </div>
               </div>

               {/* Product Links */}
               <div>
                  <h3 className='font-semibold mb-4'>Product</h3>
                  <ul className='space-y-3'>
                     {footerLinks.product.map((link) => (
                        <li key={link.name}>
                           <Link
                              href={link.href}
                              className='text-muted-foreground hover:text-primary transition-colors'
                           >
                              {link.name}
                           </Link>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* Company Links */}
               <div>
                  <h3 className='font-semibold mb-4'>Company</h3>
                  <ul className='space-y-3'>
                     {footerLinks.company.map((link) => (
                        <li key={link.name}>
                           <Link
                              href={link.href}
                              className='text-muted-foreground hover:text-primary transition-colors'
                           >
                              {link.name}
                           </Link>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* Resources Links */}
               <div>
                  <h3 className='font-semibold mb-4'>Resources</h3>
                  <ul className='space-y-3'>
                     {footerLinks.resources.map((link) => (
                        <li key={link.name}>
                           <Link
                              href={link.href}
                              className='text-muted-foreground hover:text-primary transition-colors'
                           >
                              {link.name}
                           </Link>
                        </li>
                     ))}
                  </ul>
               </div>

               {/* Legal Links */}
               <div>
                  <h3 className='font-semibold mb-4'>Legal</h3>
                  <ul className='space-y-3'>
                     {footerLinks.legal.map((link) => (
                        <li key={link.name}>
                           <Link
                              href={link.href}
                              className='text-muted-foreground hover:text-primary transition-colors'
                           >
                              {link.name}
                           </Link>
                        </li>
                     ))}
                  </ul>
               </div>
            </div>

            {/* Bottom Section */}
            <div className='pt-8 border-t border-border/50'>
               <div className='flex flex-col md:flex-row justify-between items-center gap-6'>
                  {/* Copyright */}
                  <p className='text-sm text-muted-foreground'>
                     © {new Date().getFullYear()} DocChain. All rights reserved.
                  </p>

                  {/* Social Links */}
                  <div className='flex items-center gap-4'>
                     {socialLinks.map((social) => {
                        const Icon = social.icon;
                        return (
                           <Link
                              key={social.name}
                              href={social.href}
                              className='w-10 h-10 rounded-full bg-muted hover:bg-primary/10 border border-border/50 hover:border-primary/30 flex items-center justify-center transition-all duration-300 hover:scale-110'
                              aria-label={social.name}
                           >
                              <Icon className='w-5 h-5 text-muted-foreground hover:text-primary transition-colors' />
                           </Link>
                        );
                     })}
                  </div>
               </div>
            </div>
         </div>
      </footer>
   );
}
