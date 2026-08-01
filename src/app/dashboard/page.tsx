"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  ShoppingBag,
  Package,
  AlertTriangle,
  TrendingUp,
  Boxes,
  DollarSign,
} from "lucide-react";

export default function DashboardPage() {
  const [salesCount, setSalesCount] = useState(0);
  const [purchasesCount, setPurchasesCount] = useState(0);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const [sRes, pRes, sumRes] = await Promise.all([
          fetch("/api/invoices"),
          fetch("/api/purchases"),
          fetch("/api/inventory/summary"),
        ]);
        if (sRes.ok) setSalesCount((await sRes.json()).length);
        if (pRes.ok) setPurchasesCount((await pRes.json()).length);
        if (sumRes.ok) setSummary(await sumRes.json());
      } catch (e) {
        console.error(e);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Dashboard & Analytics</h1>
        <p className="text-sm text-slate-500">Business overview, sales, purchases & inventory valuation metrics</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Sales Invoices</p>
            <h3 className="text-xl font-bold text-slate-800">{salesCount} Created</h3>
            <Link href="/sales" className="text-[11px] text-blue-600 font-semibold hover:underline">
              View Invoices →
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Purchase Bills</p>
            <h3 className="text-xl font-bold text-slate-800">{purchasesCount} Recorded</h3>
            <Link href="/purchases" className="text-[11px] text-emerald-600 font-semibold hover:underline">
              View Purchases →
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Products</p>
            <h3 className="text-xl font-bold text-slate-800">{summary?.totalItemsCount || 0} Items</h3>
            <p className="text-[11px] text-slate-400">{summary?.totalStockQuantity || 0} Total Units</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-500 text-white rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-amber-900 font-semibold">Low Stock Alert</p>
            <h3 className="text-xl font-bold text-amber-950">{summary?.lowStockItemsCount || 0} Items</h3>
            <Link href="/inventory" className="text-[11px] text-amber-800 font-bold hover:underline">
              Reorder Items →
            </Link>
          </div>
        </div>
      </div>

      {/* Valuation Summary Card */}
      {summary && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-[#0b2641] text-base">Inventory Valuation Summary</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Value at Cost</p>
              <p className="text-2xl font-bold text-slate-900">₹{summary.totalValueAtCost.toLocaleString("en-IN")}</p>
              <p className="text-xs text-slate-400">Sum of (Stock × Purchase Price)</p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Inventory Value at Selling Price</p>
              <p className="text-2xl font-bold text-emerald-700">₹{summary.totalValueAtSelling.toLocaleString("en-IN")}</p>
              <p className="text-xs text-slate-400">Sum of (Stock × Selling Price)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
