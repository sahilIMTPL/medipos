import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MedCare POS — Medical Store & Pharmacy Management",
  description: "Next-generation Medical Store POS, Batch-wise FEFO Expiry Tracking, and GST Invoicing System",
};

import { StoreProvider } from "@/context/StoreContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased font-sans`}>
      <body suppressHydrationWarning className={`${inter.className} min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans`}>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}


