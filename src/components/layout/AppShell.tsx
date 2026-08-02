"use client";

import { usePathname } from "next/navigation";
import { DesktopSidebar } from "@/components/layout/desktop/DesktopSidebar";
import { DesktopHeader } from "@/components/layout/desktop/DesktopHeader";
import { MobileHeader } from "@/components/layout/mobile/MobileHeader";
import { ReadOnlyBanner } from "@/components/layout/ReadOnlyBanner";
import { KeyboardProvider } from "@/components/keyboard/KeyboardProvider";

/** Routes that render standalone, without the app navigation chrome. */
const BARE_ROUTES = ["/login", "/signup", "/invite", "/onboarding"];

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
      {/* First tab stop on every page — jumps past the nav straight to content. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-100 focus:px-4 focus:py-2 focus:bg-[#0b2641] focus:text-white focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>
      <KeyboardProvider />
      <DesktopSidebar />
      {/*
        min-w-0 is required: a flex item defaults to min-width:auto, so without
        it this column refuses to shrink below its content and a wide table
        pushes the whole page into horizontal scroll instead of scrolling
        inside its own container.
      */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[260px]">
        <DesktopHeader />
        <MobileHeader />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto outline-hidden"
        >
          <ReadOnlyBanner />
          {children}
        </main>
      </div>
    </div>
  );
}
