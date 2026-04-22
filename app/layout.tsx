import type { Metadata } from "next";
import { Inter, Poppins, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import "./globals.css";

// Inter: primary UI font (replaces Poppins as default). Uses variable axis
// so weight transitions stay smooth.
const inter = Inter({
   subsets: ["latin"],
   variable: "--font-inter",
   display: "swap",
});

// JetBrains Mono: monospace for hashes, addresses, block numbers.
const jetbrainsMono = JetBrains_Mono({
   subsets: ["latin"],
   variable: "--font-jetbrains-mono",
   weight: ["400", "500"],
   display: "swap",
});

// Poppins: kept for any legacy pages that still reference it. New
// components use Inter via var(--dc-font-sans).
const poppins = Poppins({
   variable: "--font-poppins",
   subsets: ["latin"],
   weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
   title: "DocChain - Blockchain-Secured Document Management",
   description:
      "Secure your documents with blockchain technology and AI-powered insights",
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang='en' suppressHydrationWarning>
         <body
            className={`${inter.variable} ${jetbrainsMono.variable} ${poppins.variable} antialiased`}
         >
            <ErrorBoundary>
               <Providers>{children}</Providers>
            </ErrorBoundary>
         </body>
      </html>
   );
}
