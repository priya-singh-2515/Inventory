"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Receipt, ArrowLeft, Search, ArrowUpRight, ArrowDownLeft, RefreshCw , ExternalLink } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  voucherNo: string;
  date: string;
  partyName: string;
  amount: number;
  status: string;
  createdAt: string;
}

/**
 * Where a transaction row leads. Sales invoices and purchase bills have detail
 * views; the other document types do not yet, so those rows stay plain text
 * rather than linking somewhere that 404s.
 */
function documentHref(t: Transaction): string | null {
  if (t.type === "Sales Invoice") return `/sales/${t.id}`;
  if (t.type === "Purchase Bill") return `/purchases/${t.id}`;
  return null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      t.voucherNo?.toLowerCase().includes(search.toLowerCase()) ||
      t.partyName?.toLowerCase().includes(search.toLowerCase()) ||
      t.type?.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "ALL" || t.type.toLowerCase().includes(filterType.toLowerCase());
    return matchesSearch && matchesType;
  });

  const totalSales = transactions.filter((t) => t.type === "Sales Invoice").reduce((s, t) => s + t.amount, 0);
  const totalPurchases = transactions.filter((t) => t.type === "Purchase Bill").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0b2641]">Transactions Audit Ledger</h1>
            <p className="text-sm text-slate-500">Unified audit history of sales, purchases, stock movements & vouchers</p>
          </div>
        </div>

        <button
          onClick={loadTransactions}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 shadow-xs"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Sales Billing</div>
            <div className="text-xl font-bold text-slate-900">₹{totalSales.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Purchases</div>
            <div className="text-xl font-bold text-slate-900">₹{totalPurchases.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Recorded Entries</div>
            <div className="text-xl font-bold text-slate-900">{transactions.length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Voucher No, Party Name, Type..."
            data-search="true"
            aria-keyshortcuts="/"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium"
        >
          <option value="ALL">All Transaction Types</option>
          <option value="Sales">Sales Invoices</option>
          <option value="Purchase">Purchase Bills</option>
          <option value="Credit Note">Credit Notes</option>
          <option value="Debit Note">Debit Notes</option>
          <option value="Adjustment">Stock Adjustments</option>
          <option value="Transfer">Stock Transfers</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Voucher No</th>
                <th className="py-3 px-4">Party / Reference</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading transactions ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{t.date}</td>
                    <td className="py-3.5 px-4 font-medium text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full font-semibold ${
                          t.type.includes("Sales")
                            ? "bg-emerald-100 text-emerald-800"
                            : t.type.includes("Purchase")
                            ? "bg-blue-100 text-blue-800"
                            : t.type.includes("Credit Note")
                            ? "bg-purple-100 text-purple-800"
                            : t.type.includes("Debit Note")
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {documentHref(t) ? (
                        <Link
                          href={documentHref(t)!}
                          className="text-[#0b2641] hover:underline inline-flex items-center gap-1"
                        >
                          {t.voucherNo}
                          <ExternalLink className="w-3 h-3 opacity-50" />
                        </Link>
                      ) : (
                        t.voucherNo
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">{t.partyName || "-"}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {t.amount > 0 ? `₹${t.amount.toLocaleString("en-IN")}` : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
