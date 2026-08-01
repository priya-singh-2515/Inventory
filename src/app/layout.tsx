import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "Invoice & Inventory Management System",
  description: "Indian GST Compliant Billing, Stock Ledger & Inventory Management Web Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f0f4f7] text-[#1e293b] antialiased">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
