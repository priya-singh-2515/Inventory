"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, Calendar, User, Tag } from "lucide-react";
import { PurchaseInvoice } from "@/lib/types/invoice";

export default function PurchaseInvoicesPage() {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  async function fetchPurchases() {
    setLoading(true);
    try {
      const res = await fetch("/api/purchases");
      if (res.ok) {
        const data = await res.json();
        setPurchases(data);
      }
    } catch (e) {
      console.error("Failed to fetch purchases", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPurchases();
  }, []);

  const filtered = purchases.filter(
    (p) =>
      p.purchaseInvoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Purchase Bills</h1>
          <p className="text-sm text-slate-500">Record supplier purchase bills, ITC eligibility & increase inventory stock</p>
        </div>

        <Link
          href="/purchases/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Bill</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier, bill no or purchase ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400">Loading purchase bills...</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">No purchase bills recorded.</div>
        ) : (
          filtered.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm text-[#0b2641]">{p.purchaseInvoiceNumber}</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                    <Tag className="w-3 h-3" /> ITC: {p.itcEligibility}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{p.supplierName}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {p.date}
                    </span>
                    <span className="font-mono">Bill No: {p.supplierInvoiceNo}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Amount</p>
                  <p className="text-lg font-bold text-slate-900">₹{p.totalAmount?.toLocaleString("en-IN")}</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded border border-emerald-200">
                  Stock Added
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
