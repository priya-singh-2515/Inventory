"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Ban, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { PurchaseInvoice } from "@/lib/types/invoice";
import { CompanyDetails } from "@/lib/types/settings";
import { formatInr, isIntraState } from "@/lib/utils/invoice-format";

export default function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [purchase, setPurchase] = useState<PurchaseInvoice | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function loadPurchase() {
    try {
      const [purRes, compRes] = await Promise.all([
        fetch(`/api/purchases/${id}`),
        fetch("/api/company"),
      ]);

      if (purRes.status === 404) {
        setNotFound(true);
        return;
      }
      if (purRes.ok) setPurchase(await purRes.json());
      if (compRes.ok) setCompany(await compRes.json());
    } catch (e) {
      console.error("Failed to load purchase bill", e);
      toast.error("Failed to load purchase bill");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPurchase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleCancel() {
    if (!purchase) return;
    const confirmed = window.confirm(
      `Cancel purchase bill ${purchase.purchaseInvoiceNumber}?\n\nThe bill is kept as a cancelled record and the stock it added is removed again. This cannot be undone.`
    );
    if (!confirmed) return;

    setCancelling(true);
    const toastId = toast.loading("Cancelling bill & reverting stock...");
    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Purchase bill cancelled, stock reverted", { id: toastId });
        loadPurchase();
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel purchase bill", { id: toastId });
      }
    } catch {
      toast.error("Network error occurred", { id: toastId });
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading purchase bill...
      </div>
    );
  }

  if (notFound || !purchase) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
        <h1 className="text-xl font-bold text-[#0b2641]">Purchase bill not found</h1>
        <p className="text-sm text-slate-500">It may have been removed, or the link is no longer valid.</p>
        <Link
          href="/purchases"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white text-sm font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to purchase bills
        </Link>
      </div>
    );
  }

  const intraState = isIntraState(purchase.supplierState, company?.state);
  const isCancelled = purchase.status === "Cancelled";
  const itcClaimable = purchase.itcEligibility !== "Ineligible" && !isCancelled;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/purchases"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0b2641]">{purchase.purchaseInvoiceNumber}</h1>
            <p className="text-sm text-slate-500">
              {purchase.supplierName} · {purchase.date}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          {!isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-lg border border-rose-300 transition-colors disabled:opacity-60"
            >
              <Ban className="w-4 h-4" /> Cancel Bill
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 print:border-0 print:shadow-none print:p-0">
        {isCancelled && (
          <div className="mb-6 px-4 py-2 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-bold rounded-lg text-center">
            CANCELLED — stock added by this bill has been reverted
          </div>
        )}

        <header className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Supplier
            </p>
            <p className="text-lg font-bold text-slate-800">{purchase.supplierName}</p>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <p>{purchase.supplierAddress}</p>
              <p>{purchase.supplierState}</p>
              {purchase.supplierGstin && (
                <p className="font-mono">GSTIN: {purchase.supplierGstin}</p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Purchase Bill
            </p>
            <p className="text-lg font-bold text-[#0b2641] font-mono">
              {purchase.purchaseInvoiceNumber}
            </p>
            <dl className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div className="flex sm:justify-end gap-2">
                <dt className="text-slate-400">Supplier Bill No:</dt>
                <dd className="font-mono">{purchase.supplierInvoiceNo || "—"}</dd>
              </div>
              <div className="flex sm:justify-end gap-2">
                <dt className="text-slate-400">Date:</dt>
                <dd>{purchase.date}</dd>
              </div>
              <div className="flex sm:justify-end gap-2">
                <dt className="text-slate-400">Supply:</dt>
                <dd>{intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}</dd>
              </div>
              <div className="flex sm:justify-end gap-2">
                <dt className="text-slate-400">Received by:</dt>
                <dd>{company?.tradeName || company?.legalName || "—"}</dd>
              </div>
            </dl>
          </div>
        </header>

        {/* ITC treatment is the reason this record exists for GST purposes. */}
        <section className="py-5 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Input Tax Credit
            </span>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                purchase.itcEligibility === "Ineligible"
                  ? "bg-amber-50 text-amber-800 border-amber-300"
                  : "bg-emerald-50 text-emerald-700 border-emerald-300"
              }`}
            >
              {purchase.itcEligibility}
            </span>
            <span className="text-xs text-slate-500">
              {itcClaimable
                ? `${formatInr(purchase.totalTax)} claimable as input credit`
                : "No input credit claimable on this bill"}
            </span>
          </div>
        </section>

        <div className="overflow-x-auto py-6">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-y border-slate-200 print:bg-transparent">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Description</th>
                <th className="py-2.5 px-2">HSN/SAC</th>
                <th className="py-2.5 px-2 text-right">Qty</th>
                <th className="py-2.5 px-2 text-right">Rate</th>
                <th className="py-2.5 px-2 text-right">Taxable</th>
                {intraState ? (
                  <>
                    <th className="py-2.5 px-2 text-right">CGST</th>
                    <th className="py-2.5 px-2 text-right">SGST</th>
                  </>
                ) : (
                  <th className="py-2.5 px-2 text-right">IGST</th>
                )}
                <th className="py-2.5 px-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchase.items?.map((line, index) => {
                const taxable = Number(line.taxableAmount) || 0;
                const cgst = (taxable * (Number(line.cgstRate) || 0)) / 100;
                const sgst = (taxable * (Number(line.sgstRate) || 0)) / 100;
                const igst = (taxable * (Number(line.igstRate) || 0)) / 100;

                return (
                  <tr key={line._id ?? `${line.name}-${index}`}>
                    <td className="py-2.5 px-2 text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-2 font-medium text-slate-800">{line.name}</td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">
                      {line.hsnCode || line.sacCode || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {line.qty} {line.unit}
                    </td>
                    <td className="py-2.5 px-2 text-right">{formatInr(line.rate)}</td>
                    <td className="py-2.5 px-2 text-right">{formatInr(taxable)}</td>
                    {intraState ? (
                      <>
                        <td className="py-2.5 px-2 text-right">
                          {formatInr(cgst)}
                          <span className="text-[10px] text-slate-400 block">{line.cgstRate}%</span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {formatInr(sgst)}
                          <span className="text-[10px] text-slate-400 block">{line.sgstRate}%</span>
                        </td>
                      </>
                    ) : (
                      <td className="py-2.5 px-2 text-right">
                        {formatInr(igst)}
                        <span className="text-[10px] text-slate-400 block">{line.igstRate}%</span>
                      </td>
                    )}
                    <td className="py-2.5 px-2 text-right font-semibold text-slate-800">
                      {formatInr(taxable + cgst + sgst + igst)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <section className="flex justify-end pt-2">
          <dl className="w-full sm:w-72 text-sm space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <dt>Taxable Value</dt>
              <dd>{formatInr(purchase.totalTaxable)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Total Tax</dt>
              <dd>{formatInr(purchase.totalTax)}</dd>
            </div>
            <div className="flex justify-between pt-2 mt-1 border-t border-slate-200 text-base font-bold text-[#0b2641]">
              <dt>Grand Total</dt>
              <dd>{formatInr(purchase.totalAmount)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
