import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "@/components/ui/sonner";
import Header from "@/components/Header"; // Import the Header here

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} bg-gray-50`}>
        <Providers>
          <Header /> {/* Add the Header here */}
          <main>{children}</main>
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}