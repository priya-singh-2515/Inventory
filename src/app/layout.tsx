import type { Metadata } from "next";
import "./globals.css";
import { DesktopSidebar } from "@/components/layout/desktop/DesktopSidebar";
import { DesktopHeader } from "@/components/layout/desktop/DesktopHeader";
import { MobileHeader } from "@/components/layout/mobile/MobileHeader";
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
        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <DesktopSidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:pl-[260px]">
            <DesktopHeader />
            <MobileHeader />
            <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
