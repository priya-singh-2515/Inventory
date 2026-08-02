"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Ban, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Invoice } from "@/lib/types/invoice";
import { CompanyDetails } from "@/lib/types/settings";
import { formatInr, isIntraState } from "@/lib/utils/invoice-format";
import { downloadInvoicePdf } from "@/lib/utils/invoice-pdf";

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function loadInvoice() {
    try {
      const [invRes, compRes] = await Promise.all([
        fetch(`/api/invoices/${id}`),
        fetch("/api/company"),
      ]);

      if (invRes.status === 404) {
        setNotFound(true);
        return;
      }
      if (invRes.ok) setInvoice(await invRes.json());
      if (compRes.ok) setCompany(await compRes.json());
    } catch (e) {
      console.error("Failed to load invoice", e);
      toast.error("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDownloadPdf() {
    if (!invoice) return;

    setExporting(true);
    const toastId = toast.loading("Building PDF...");
    try {
      await downloadInvoicePdf(invoice, company);
      toast.success("PDF downloaded", { id: toastId });
    } catch (e) {
      console.error("PDF export failed", e);
      toast.error("Could not generate the PDF", { id: toastId });
    } finally {
      setExporting(false);
    }
  }

  async function handleCancel() {
    if (!invoice) return;
    const confirmed = window.confirm(
      `Cancel invoice ${invoice.invoiceNumber}?\n\nThe invoice is kept as a cancelled record and every stock movement it created is reverted. This cannot be undone.`
    );
    if (!confirmed) return;

    setCancelling(true);
    const toastId = toast.loading("Cancelling invoice & reverting stock...");
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Invoice cancelled, stock reverted", { id: toastId });
        loadInvoice();
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to cancel invoice", { id: toastId });
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
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading invoice...
      </div>
    );
  }

  if (notFound || !invoice) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
        <h1 className="text-xl font-bold text-[#0b2641]">Invoice not found</h1>
        <p className="text-sm text-slate-500">
          It may have been removed, or the link is no longer valid.
        </p>
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white text-sm font-semibold rounded-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Back to invoices
        </Link>
      </div>
    );
  }

  const intraState = isIntraState(invoice.partyState, company?.state);
  const isCancelled = invoice.status === "Cancelled";

  return (
    <div className="space-y-6">
      {/* Action bar — excluded from print and from the PDF capture */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <Link
            href="/sales"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0b2641]">{invoice.invoiceNumber}</h1>
            <p className="text-sm text-slate-500">
              {invoice.partyName} · {invoice.date}
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
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-lg border border-emerald-300 transition-colors disabled:opacity-60"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {exporting ? "Preparing..." : "Download PDF"}
          </button>
          {!isCancelled && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-lg border border-rose-300 transition-colors disabled:opacity-60"
            >
              <Ban className="w-4 h-4" /> Cancel Invoice
            </button>
          )}
        </div>
      </div>

      {/* The printable document */}
      <div
        id="invoice-document"
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-8 print:border-0 print:shadow-none print:rounded-none print:p-0"
      >
        {isCancelled && (
          <div className="mb-6 px-4 py-2 bg-rose-50 border border-rose-300 text-rose-800 text-sm font-bold rounded-lg text-center">
            CANCELLED — stock movements for this invoice have been reverted
          </div>
        )}

        <header className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-[#0b2641]">
              {company?.tradeName || company?.legalName || "Your Company"}
            </h2>
            {company && (
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                <p>{company.address1}</p>
                {company.address2 && <p>{company.address2}</p>}
                <p>
                  {company.location} — {company.pincode}, {company.state}
                </p>
                <p className="font-mono">GSTIN: {company.gstin}</p>
                <p>
                  {company.phone} · {company.email}
                </p>
              </div>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              Tax Invoice
            </p>
            <p className="text-lg font-bold text-[#0b2641] font-mono">{invoice.invoiceNumber}</p>
            <dl className="text-xs text-slate-600 mt-2 space-y-0.5">
              <div className="flex sm:justify-end gap-2">
                <dt className="text-slate-400">Date:</dt>
                <dd>{invoice.date}</dd>
              </div>
              {invoice.dueDate && (
                <div className="flex sm:justify-end gap-2">
                  <dt className="text-slate-400">Due:</dt>
                  <dd>{invoice.dueDate}</dd>
                </div>
              )}
              <div className="flex sm:justify-end gap-2">
                <dt className="text-slate-400">Supply:</dt>
                <dd>{intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Bill To
            </p>
            <p className="font-semibold text-slate-800">{invoice.partyName}</p>
            <div className="text-xs text-slate-600 mt-1 space-y-0.5">
              <p>{invoice.partyAddress}</p>
              <p>
                {invoice.partyPlace} — {invoice.partyPincode}, {invoice.partyState}
              </p>
              {invoice.partyGstin && <p className="font-mono">GSTIN: {invoice.partyGstin}</p>}
              {invoice.partyPhone && <p>{invoice.partyPhone}</p>}
            </div>
          </div>

          {invoice.shipToName && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                Ship To
              </p>
              <p className="font-semibold text-slate-800">{invoice.shipToName}</p>
              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                {invoice.shipToAddress && <p>{invoice.shipToAddress}</p>}
                <p>
                  {invoice.shipToPlace} {invoice.shipToPincode && `— ${invoice.shipToPincode}`}
                  {invoice.shipToState && `, ${invoice.shipToState}`}
                </p>
                {invoice.shipToGstin && <p className="font-mono">GSTIN: {invoice.shipToGstin}</p>}
              </div>
            </div>
          )}
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
                <th className="py-2.5 px-2 text-right">Disc</th>
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
              {invoice.items?.map((line, index) => {
                const taxable = Number(line.taxableAmount) || 0;
                const cgst = (taxable * (Number(line.cgstRate) || 0)) / 100;
                const sgst = (taxable * (Number(line.sgstRate) || 0)) / 100;
                const igst = (taxable * (Number(line.igstRate) || 0)) / 100;

                return (
                  <tr key={line._id ?? `${line.name}-${index}`}>
                    <td className="py-2.5 px-2 text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-2">
                      <p className="font-medium text-slate-800">{line.name}</p>
                      {line.description && (
                        <p className="text-[11px] text-slate-400">{line.description}</p>
                      )}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">
                      {line.hsnCode || line.sacCode || "—"}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      {line.qty} {line.unit}
                    </td>
                    <td className="py-2.5 px-2 text-right">{formatInr(line.rate)}</td>
                    <td className="py-2.5 px-2 text-right">
                      {line.discountPercent ? `${line.discountPercent}%` : "—"}
                    </td>
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

        <section className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
          <div className="text-xs text-slate-600 space-y-3 max-w-sm">
            {company?.bankName && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Bank Details
                </p>
                <p>{company.bankName}</p>
                <p className="font-mono">A/C: {company.bankAccountNo}</p>
                <p className="font-mono">IFSC: {company.bankIfsc}</p>
                {company.bankBranch && <p>{company.bankBranch}</p>}
              </div>
            )}
            {invoice.term && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Terms
                </p>
                <p>{invoice.term}</p>
              </div>
            )}
            {invoice.notesText && <p className="text-slate-500 italic">{invoice.notesText}</p>}
          </div>

          <dl className="w-full sm:w-72 text-sm space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <dt>Taxable Value</dt>
              <dd>{formatInr(invoice.totalTaxable)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Total Tax</dt>
              <dd>{formatInr(invoice.totalTax)}</dd>
            </div>
            {Boolean(invoice.roundOff) && (
              <div className="flex justify-between text-slate-500">
                <dt>Round Off</dt>
                <dd>{formatInr(invoice.roundOff)}</dd>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-1 border-t border-slate-200 text-base font-bold text-[#0b2641]">
              <dt>Grand Total</dt>
              <dd>{formatInr(invoice.totalAmount)}</dd>
            </div>
          </dl>
        </section>

        <footer className="pt-8 mt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
          <p>This is a computer-generated invoice.</p>
          <div className="text-right">
            <div className="h-10" />
            <p className="text-slate-600 font-medium border-t border-slate-300 pt-1 px-6">
              Authorised Signatory
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
