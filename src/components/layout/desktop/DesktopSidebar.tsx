"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes } from "lucide-react";
import { NAV_GROUPS, resolveActiveHref } from "@/components/layout/nav-items";

export function DesktopSidebar() {
  const pathname = usePathname();
  const activeHref = resolveActiveHref(pathname);

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-[#0b2641] text-white border-r border-[#1e3a5f] shadow-lg fixed left-0 top-0 bottom-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e3a5f]">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide">Ethara AI Inventory</h1>
          <p className="text-xs text-blue-200">GST Billing &amp; Stock Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 overflow-y-auto" aria-label="Main navigation">
        {NAV_GROUPS.map((group, groupIndex) => (
          <div
            key={group.title ?? "general"}
            className={groupIndex > 0 ? "mt-5 pt-5 border-t border-[#173653]" : ""}
          >
            {group.title && (
              <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-300/70">
                {group.title}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === activeHref;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md font-semibold"
                        : "text-blue-100 hover:bg-[#15385c] hover:text-white"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-blue-300"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[#1e3a5f] bg-[#081c30]">
        <div className="text-xs text-blue-300 flex items-center justify-between">
          <span>GST Version</span>
          <span className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded text-[10px] font-mono">v2.4</span>
        </div>
      </div>
    </aside>
  );
}
