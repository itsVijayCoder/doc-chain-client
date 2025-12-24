import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import { Providers } from "@/components/shared/Providers";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

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
            className={`font-poppins ${poppins.variable} ${inter.variable} antialiased`}
         >
            <ErrorBoundary>
               <Providers>{children}</Providers>
            </ErrorBoundary>
         </body>
      </html>
   );
}
