
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header"; // Import the Header here

const inter = Inter({ subsets: ["latin"] });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Metric",
  description: "Decentralized Fair Lending Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${display.variable} bg-black text-white`}>
        <Providers>
          <Header /> {/* Add the Header here */}
          <main className="pt-16 sm:pt-20">{children}</main>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
