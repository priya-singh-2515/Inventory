"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ItemMaster } from "@/lib/types/inventory";
import { Invoice } from "@/lib/types/invoice";
import { formatInr } from "@/lib/utils/invoice-format";
import { useDialogA11y } from "@/hooks/useDialogA11y";

interface CreditNoteRecord {
  _id: string;
  creditNoteNo: string;
  invoiceNumber?: string;
  date: string;
  partyName: string;
  partyGstin?: string;
  partyAddress: string;
  partyState: string;
  totalAmount: number;
  status: string;
  items: Array<{ name: string; qty: number; rate: number }>;
}

interface CreditNoteFormInput {
  date: string;
  invoiceNumber: string;
  partyName: string;
  partyAddress: string;
  partyState: string;
  selectedItemName: string;
  returnQty: number;
  returnRate: number;
}

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const dialogRef = useDialogA11y({
    isOpen: showModal,
    onClose: () => setShowModal(false),
  });
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sourceInvoice, setSourceInvoice] = useState<Invoice | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreditNoteFormInput>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      invoiceNumber: "",
      partyName: "",
      partyAddress: "",
      partyState: "Maharashtra",
      selectedItemName: "",
      returnQty: 1,
      returnRate: 0,
    },
  });

  async function loadCreditNotes() {
    setLoading(true);
    try {
      const res = await fetch("/api/credit-notes");
      if (res.ok) {
        const payload = await res.json();
        setCreditNotes(payload.data ?? payload);
      }
    } catch {
      toast.error("Failed to load credit notes");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems() {
    try {
      const res = await fetch("/api/items?all=true");
      if (res.ok) {
        const payload = await res.json();
        setItemsMaster(payload.data ?? payload);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadInvoices() {
    try {
      const res = await fetch("/api/invoices");
      if (res.ok) {
        const payload = await res.json();
        const data: Invoice[] = payload.data ?? payload;
        // A cancelled invoice has already had its stock reverted — returning
        // against it would double-count.
        setInvoices(data.filter((inv) => inv.status !== "Cancelled"));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadCreditNotes();
    loadItems();
    loadInvoices();
  }, []);

  /** Picking the original invoice fills in the customer and scopes the items. */
  function handleSelectInvoice(invoiceId: string) {
    const found = invoices.find((inv) => inv._id === invoiceId) ?? null;
    setSourceInvoice(found);

    setValue("selectedItemName", "");
    setValue("returnQty", 1);
    setValue("returnRate", 0);

    if (!found) {
      setValue("invoiceNumber", "");
      return;
    }

    setValue("invoiceNumber", found.invoiceNumber);
    setValue("partyName", found.partyName);
    setValue("partyAddress", found.partyAddress ?? "");
    setValue("partyState", found.partyState ?? "Maharashtra");
  }

  /** Lines available to return: the invoice's own lines, else the full master. */
  const returnableItems = sourceInvoice
    ? (sourceInvoice.items ?? []).map((line) => ({
        name: line.name,
        detail: `${line.qty} ${line.unit} @ ${formatInr(line.rate)}`,
        qty: line.qty,
        rate: line.rate,
      }))
    : itemsMaster.map((item) => ({
        name: item.name,
        detail: `Stock: ${item.stock} ${item.unit}`,
        qty: 1,
        rate: item.sellingRate,
      }));

  async function onSubmit(data: CreditNoteFormInput) {
    if (!data.selectedItemName) {
      toast.error("Please select a returned item");
      return;
    }

    const itemObj = itemsMaster.find((i) => i.name === data.selectedItemName);
    const taxable = Number(data.returnQty) * Number(data.returnRate);

    const toastId = toast.loading("Recording Credit Note & Updating Stock...");

    try {
      const payload = {
        date: data.date,
        invoiceNumber: data.invoiceNumber,
        partyName: data.partyName,
        partyAddress: data.partyAddress,
        partyState: data.partyState,
        totalTaxable: taxable,
        totalTax: 0,
        totalAmount: taxable,
        items: [
          {
            name: data.selectedItemName,
            type: itemObj?.type || "Product",
            qty: Number(data.returnQty),
            rate: Number(data.returnRate),
            taxRate: 0,
            taxableAmount: taxable,
          },
        ],
      };

      const res = await fetch("/api/credit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Credit Note saved & inventory stock restored!", { id: toastId });
        setShowModal(false);
        reset();
        loadCreditNotes();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to record Credit Note", { id: toastId });
      }
    } catch {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/sales"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0b2641]">Credit Notes (Sales Returns)</h1>
            <p className="text-sm text-slate-500">Record customer returns & automatically increase inventory stock back</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Issue Credit Note
        </button>
      </div>

      {/* Credit Notes List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Credit Note No</th>
                <th className="py-3 px-4">Original Invoice</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-right">Return Value (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading credit notes...
                  </td>
                </tr>
              ) : creditNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No credit notes issued yet. Click "+ Issue Credit Note" above to record a sales return.
                  </td>
                </tr>
              ) : (
                creditNotes.map((cn) => (
                  <tr key={cn._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{cn.date}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-purple-700">{cn.creditNoteNo}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{cn.invoiceNumber || "-"}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{cn.partyName}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{cn.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {cn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="credit-note-dialog-title"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="credit-note-dialog-title" className="font-bold text-[#0b2641] text-lg">Issue Sales Return Credit Note</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Original Sales Invoice
                </label>
                <select
                  value={sourceInvoice?._id ?? ""}
                  onChange={(e) => handleSelectInvoice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="">— Not linked (enter details manually) —</option>
                  {invoices.map((inv) => (
                    <option key={inv._id} value={inv._id}>
                      {inv.invoiceNumber} · {inv.partyName} · {formatInr(inv.totalAmount)} · {inv.date}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {sourceInvoice
                    ? "Customer details filled from the invoice; only its line items can be returned."
                    : "Pick an invoice to auto-fill the customer and restrict the returnable items."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Date *</label>
                  <input
                    type="date"
                    {...register("date", { required: "Date is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                  {errors.date && <p className="text-xs text-rose-600 mt-0.5">{errors.date.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Original Invoice No</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-001"
                    readOnly={Boolean(sourceInvoice)}
                    {...register("invoiceNumber")}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono ${
                      sourceInvoice ? "bg-slate-100 text-slate-500" : "bg-slate-50"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ethara AI Store"
                  {...register("partyName", { required: "Customer name is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                {errors.partyName && <p className="text-xs text-rose-600 mt-0.5">{errors.partyName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Address</label>
                <input
                  type="text"
                  placeholder="Customer address"
                  {...register("partyAddress")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Returned Product Item *</label>
                <select
                  {...register("selectedItemName", {
                    required: "Product item is required",
                    onChange: (e) => {
                      const line = returnableItems.find((i) => i.name === e.target.value);
                      if (line) {
                        setValue("returnRate", line.rate);
                        setValue("returnQty", line.qty);
                      }
                    },
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="">Select Item Returned</option>
                  {returnableItems.map((line) => (
                    <option key={line.name} value={line.name}>
                      {line.name} ({line.detail})
                    </option>
                  ))}
                </select>
                {errors.selectedItemName && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.selectedItemName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Quantity (+Stock) *</label>
                  <input
                    type="number"
                    min={1}
                    {...register("returnQty", { valueAsNumber: true, min: 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Rate (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    {...register("returnRate", { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Save Credit Note & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
