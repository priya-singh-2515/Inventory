"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus, ShoppingBag, Package, LogOut } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { CompanySwitcher } from "@/components/layout/CompanySwitcher";

export function DesktopHeader() {
  const router = useRouter();
  const { data: session } = useSession();
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [companyName, setCompanyName] = useState<string>("Ethara AI Store");

  useEffect(() => {
    async function fetchData() {
      try {
        const [sumRes, compRes] = await Promise.all([
          fetch("/api/inventory/summary"),
          fetch("/api/company"),
        ]);
        if (sumRes.ok) {
          const sumData = await sumRes.json();
          setLowStockCount(sumData.lowStockItemsCount || 0);
        }
        if (compRes.ok) {
          const compData = await compRes.json();
          if (compData?.tradeName || compData?.legalName) {
            setCompanyName(compData.tradeName || compData.legalName);
          }
        }
      } catch {
        // silent fallback
      }
    }
    fetchData();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="hidden lg:flex items-center justify-between h-[72px] px-8 bg-white border-b border-[#e5e5e5] sticky top-0 z-30 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-[#0b2641] leading-none">{companyName}</h2>
        <p className="text-xs text-slate-500 mt-1">Indian GST Compliant Inventory Management</p>
      </div>

      <div className="flex items-center gap-4">
        {lowStockCount > 0 && (
          <Link
            href="/inventory?filter=low-stock"
            className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
            <span>{lowStockCount} Items Low Stock</span>
          </Link>
        )}

        <Link
          href="/purchases/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition-colors border border-slate-300"
        >
          <ShoppingBag className="w-4 h-4 text-slate-600" />
          <span>New Purchase</span>
        </Link>

        <Link
          href="/inventory/adjustments"
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-lg transition-colors border border-emerald-300"
        >
          <Package className="w-4 h-4 text-emerald-600" />
          <span>Adjust Stock</span>
        </Link>

        <Link
          href="/sales/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Sales Invoice</span>
        </Link>

        <div className="pl-4 ml-1 border-l border-slate-200">
          <CompanySwitcher />
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right leading-tight">
            <p className="text-xs font-semibold text-slate-700">{session?.user?.name ?? "Account"}</p>
            <p className="text-[11px] text-slate-400">{session?.user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
