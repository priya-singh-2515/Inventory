"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Boxes } from "lucide-react";
import { NAV_GROUPS, resolveActiveHref } from "@/components/layout/nav-items";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const activeHref = resolveActiveHref(pathname);

  return (
    <header className="lg:hidden bg-[#0b2641] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md hover:bg-blue-900 transition-colors text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
          aria-expanded={isOpen}
          aria-controls="mobile-nav-drawer"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="flex items-center gap-2">
          <Boxes className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-base tracking-wide">Ethara AI Inventory</span>
        </div>
      </div>

      <Link
        href="/sales/new"
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs"
      >
        + New Sale
      </Link>

      {/* Slide-out mobile drawer */}
      {isOpen && (
        <div id="mobile-nav-drawer" className="fixed inset-0 top-[57px] bg-[#0b2641]/95 z-50 flex flex-col p-4 overflow-y-auto border-t border-blue-900">
          <nav aria-label="Main navigation">
            {NAV_GROUPS.map((group, groupIndex) => (
              <div
                key={group.title ?? "general"}
                className={groupIndex > 0 ? "mt-4 pt-4 border-t border-blue-900/70" : ""}
              >
                {group.title && (
                  <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-blue-300/70">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === activeHref;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium ${
                          isActive ? "bg-blue-600 text-white font-bold" : "text-blue-100 hover:bg-blue-900"
                        }`}
                      >
                        <Icon className="w-5 h-5 text-blue-300" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
