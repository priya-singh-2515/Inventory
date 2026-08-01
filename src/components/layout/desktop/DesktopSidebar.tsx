"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
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
  Boxes,
} from "lucide-react";

const navItems = [
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

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-h-screen bg-[#0b2641] text-white border-r border-[#1e3a5f] shadow-lg fixed left-0 top-0 bottom-0 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[#1e3a5f]">
        <div className="p-2 bg-blue-600 rounded-lg text-white">
          <Boxes className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide">Acme Inventory</h1>
          <p className="text-xs text-blue-200">GST Billing & Stock Hub</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-150 ${
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
