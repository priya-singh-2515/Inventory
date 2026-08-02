"use client";

import Link from "next/link";
import { Plus, Search, CheckCircle, XCircle, Eye } from "lucide-react";
import { PurchaseInvoice } from "@/lib/types/invoice";
import { formatInr } from "@/lib/utils/invoice-format";
import { usePagedList } from "@/hooks/usePagedList";

/** ITC buckets get their own colour so ineligible input tax stands out. */
const ITC_STYLES: Record<string, string> = {
  Inputs: "bg-blue-50 text-blue-700 border-blue-200",
  "Capital Goods": "bg-violet-50 text-violet-700 border-violet-200",
  "Input Services": "bg-teal-50 text-teal-700 border-teal-200",
  Ineligible: "bg-amber-50 text-amber-800 border-amber-300",
};

export default function PurchaseInvoicesPage() {
  const {
    rows: purchases,
    search: searchTerm,
    setSearch: setSearchTerm,
    loading,
    loadingMore,
    hasMore,
    loadMore,
  } = usePagedList<PurchaseInvoice>({ endpoint: "/api/purchases" });


  const filtered = purchases;

  const totals = filtered.reduce(
    (acc, p) => {
      if (p.status === "Cancelled") return acc;
      return {
        taxable: acc.taxable + (Number(p.totalTaxable) || 0),
        tax: acc.tax + (Number(p.totalTax) || 0),
        amount: acc.amount + (Number(p.totalAmount) || 0),
        claimableItc:
          acc.claimableItc + (p.itcEligibility === "Ineligible" ? 0 : Number(p.totalTax) || 0),
      };
    },
    { taxable: 0, tax: 0, amount: 0, claimableItc: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Purchase Bills</h1>
          <p className="text-sm text-slate-500">
            Record supplier purchase bills, ITC eligibility &amp; increase inventory stock
          </p>
        </div>

        <Link
          href="/purchases/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Bill</span>
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search supplier, bill no, GSTIN or state..."
            data-search="true"
            aria-keyshortcuts="/"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Purchase No</th>
                <th className="py-3 px-4">Supplier Bill No</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4">ITC</th>
                <th className="py-3 px-4 text-right">Taxable</th>
                <th className="py-3 px-4 text-right">Tax</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    Loading purchase bills...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-10 text-center text-slate-400">
                    No purchase bills found.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const isCancelled = p.status === "Cancelled";

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/80 transition-colors ${isCancelled ? "opacity-60" : ""}`}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#0b2641]">
                        {p.purchaseInvoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                        {p.supplierInvoiceNo || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{p.date}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{p.supplierName}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {p.supplierGstin || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">{p.supplierState}</td>
                      <td className="py-3.5 px-4 text-center text-slate-600">
                        {p.items?.length ?? 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            ITC_STYLES[p.itcEligibility] ?? "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {p.itcEligibility}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatInr(p.totalTaxable)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-600">
                        {formatInr(p.totalTax)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatInr(p.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isCancelled
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isCancelled ? (
                            <>
                              <XCircle className="w-3 h-3" /> Cancelled
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3 h-3" /> Completed
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/purchases/${p._id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {!loading && filtered.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200 text-sm font-bold text-slate-800">
                  <td colSpan={8} className="py-3 px-4 text-xs uppercase tracking-wider text-slate-500">
                    Totals for the {filtered.length} loaded row
                    {filtered.length === 1 ? "" : "s"} — excludes cancelled · claimable ITC{" "}
                    {formatInr(totals.claimableItc)}
                    {hasMore ? " · load more for the full figure" : ""}
                  </td>
                  <td className="py-3 px-4 text-right">{formatInr(totals.taxable)}</td>
                  <td className="py-3 px-4 text-right">{formatInr(totals.tax)}</td>
                  <td className="py-3 px-4 text-right text-[#0b2641]">{formatInr(totals.amount)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {(hasMore || loadingMore) && (
          <div className="flex justify-center border-t border-slate-100 p-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              {loadingMore ? "Loading..." : "Load more purchase bills"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
