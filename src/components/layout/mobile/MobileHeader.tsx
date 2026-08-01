"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Boxes,
  FileText,
  ShoppingBag,
  Package,
  Sliders,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  LayoutDashboard,
  Receipt,
  Settings,
} from "lucide-react";

const mobileNavItems = [
  { label: "Sales Invoices", href: "/sales", icon: FileText },
  { label: "Purchase Bills", href: "/purchases", icon: ShoppingBag },
  { label: "Inventory Master", href: "/inventory", icon: Package },
  { label: "Stock Adjustments", href: "/inventory/adjustments", icon: Sliders },
  { label: "Godown Transfers", href: "/inventory/transfers", icon: ArrowLeftRight },
  { label: "Credit Notes", href: "/credit-notes", icon: TrendingDown },
  { label: "Debit Notes", href: "/debit-notes", icon: TrendingUp },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Transactions", href: "/transactions", icon: Receipt },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="lg:hidden bg-[#0b2641] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md hover:bg-blue-900 transition-colors text-white focus:outline-none"
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
        <div className="fixed inset-0 top-[57px] bg-[#0b2641]/95 z-50 flex flex-col p-4 overflow-y-auto border-t border-blue-900">
          <nav className="space-y-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm font-medium ${
                    isActive ? "bg-blue-600 text-white font-bold" : "text-blue-100 hover:bg-blue-900"
                  }`}
                >
                  <Icon className="w-5 h-5 text-blue-300" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
