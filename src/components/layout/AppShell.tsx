"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/layout/desktop/DesktopSidebar";
import { DesktopHeader } from "@/components/layout/desktop/DesktopHeader";
import { MobileHeader } from "@/components/layout/mobile/MobileHeader";

/** Routes that render standalone, without the app navigation chrome. */
const BARE_ROUTES = ["/login", "/signup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isBare = BARE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isBare) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">{children}</main>
    );
  }

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col lg:pl-[260px]">
        <DesktopHeader />
        <MobileHeader />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
