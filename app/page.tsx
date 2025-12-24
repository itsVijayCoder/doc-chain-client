export const runtime = "edge";

import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Stats } from "@/components/landing/Stats";
import { Testimonials } from "@/components/landing/Testimonials";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Page() {
   return (
      <main className='min-h-screen'>
         <Hero />
         <Stats />
         <Features />
         <HowItWorks />
         <Testimonials />
         <CTA />
         <Footer />
      </main>
   );
}
