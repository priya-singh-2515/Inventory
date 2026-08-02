"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, History, Package, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { StockLedgerEntry, ItemMaster } from "@/lib/types/inventory";

export default function ItemLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<ItemMaster | null>(null);
  const [ledgers, setLedgers] = useState<StockLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedgerData() {
      try {
        const [itemRes, ledgerRes] = await Promise.all([
          fetch(`/api/items/${id}`),
          fetch(`/api/inventory/ledger?itemId=${id}`),
        ]);

        if (itemRes.ok) {
          const itemData = await itemRes.json();
          setItem(itemData);
        }
        if (ledgerRes.ok) {
          const payload = await ledgerRes.json();
          setLedgers(payload.data ?? payload);
        }
      } catch (e) {
        console.error("Failed to load item stock ledger", e);
      } finally {
        setLoading(false);
      }
    }

    fetchLedgerData();
  }, [id]);

  return (
    <div className="space-y-6">
      {/* Header & Back Link */}
      <div className="flex items-center gap-4">
        <Link
          href="/inventory"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">
            Stock Movement History Log
          </h1>
          <p className="text-sm text-slate-500">
            Audit trail of all stock additions, deductions & transfers
          </p>
        </div>
      </div>

      {/* Item Summary Card */}
      {item && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{item.name}</h2>
              <p className="text-xs text-slate-500">
                {item.category || "General"} | Unit: {item.unit} | GST: {item.taxRate}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
            <div>
              <p className="text-xs text-slate-400 font-medium">Current Stock</p>
              <p className="text-xl font-bold text-slate-800">
                {item.stock} {item.unit}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Reorder Point</p>
              <p className="text-xl font-bold text-amber-600">
                {item.minStock} {item.unit}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stock Ledger History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Movement Timeline</h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {ledgers.length} Transactions Recorded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Type</th>
                <th className="py-3 px-4">Reference No</th>
                <th className="py-3 px-4 text-emerald-600">Qty In (+)</th>
                <th className="py-3 px-4 text-rose-600">Qty Out (-)</th>
                <th className="py-3 px-4">Balance Stock</th>
                <th className="py-3 px-4">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading stock ledger entries...
                  </td>
                </tr>
              ) : ledgers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No stock movements recorded for this item yet.
                  </td>
                </tr>
              ) : (
                ledgers.map((entry) => {
                  const isIn = entry.qtyIn > 0;

                  return (
                    <tr key={entry._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {new Date(entry.date).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-xs">
                          {isIn ? (
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span
                            className={isIn ? "text-emerald-800" : "text-rose-800"}
                          >
                            {entry.transactionType}
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-700">
                        {entry.referenceId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-emerald-600">
                        {entry.qtyIn > 0 ? `+${entry.qtyIn}` : "-"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-rose-600">
                        {entry.qtyOut > 0 ? `-${entry.qtyOut}` : "-"}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {entry.balanceStock}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {entry.narration || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
