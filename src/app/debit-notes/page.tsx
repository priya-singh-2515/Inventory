"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ItemMaster } from "@/lib/types/inventory";
import { PurchaseInvoice } from "@/lib/types/invoice";
import { formatInr } from "@/lib/utils/invoice-format";
import { useDialogA11y } from "@/hooks/useDialogA11y";

interface DebitNoteRecord {
  _id: string;
  debitNoteNo: string;
  purchaseInvoiceNumber?: string;
  date: string;
  partyName: string;
  partyGstin?: string;
  partyAddress: string;
  partyState: string;
  totalAmount: number;
  status: string;
  items: Array<{ name: string; qty: number; rate: number }>;
}

interface DebitNoteFormInput {
  date: string;
  purchaseInvoiceNumber: string;
  partyName: string;
  partyAddress: string;
  partyState: string;
  selectedItemName: string;
  returnQty: number;
  returnRate: number;
}

export default function DebitNotesPage() {
  const [debitNotes, setDebitNotes] = useState<DebitNoteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const dialogRef = useDialogA11y({
    isOpen: showModal,
    onClose: () => setShowModal(false),
  });
  const [itemsMaster, setItemsMaster] = useState<ItemMaster[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [sourcePurchase, setSourcePurchase] = useState<PurchaseInvoice | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DebitNoteFormInput>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      purchaseInvoiceNumber: "",
      partyName: "",
      partyAddress: "",
      partyState: "Maharashtra",
      selectedItemName: "",
      returnQty: 1,
      returnRate: 0,
    },
  });

  async function loadDebitNotes() {
    setLoading(true);
    try {
      const res = await fetch("/api/debit-notes");
      if (res.ok) {
        const payload = await res.json();
        setDebitNotes(payload.data ?? payload);
      }
    } catch {
      toast.error("Failed to load debit notes");
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

  async function loadPurchases() {
    try {
      const res = await fetch("/api/purchases");
      if (res.ok) {
        const payload = await res.json();
        const data: PurchaseInvoice[] = payload.data ?? payload;
        // A cancelled bill has already had its stock reverted — returning
        // against it would double-count.
        setPurchases(data.filter((p) => p.status !== "Cancelled"));
      }
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    loadDebitNotes();
    loadItems();
    loadPurchases();
  }, []);

  /** Picking the original bill fills in the supplier and scopes the items. */
  function handleSelectPurchase(purchaseId: string) {
    const found = purchases.find((p) => p._id === purchaseId) ?? null;
    setSourcePurchase(found);

    setValue("selectedItemName", "");
    setValue("returnQty", 1);
    setValue("returnRate", 0);

    if (!found) {
      setValue("purchaseInvoiceNumber", "");
      return;
    }

    setValue("purchaseInvoiceNumber", found.supplierInvoiceNo || found.purchaseInvoiceNumber);
    setValue("partyName", found.supplierName);
    setValue("partyAddress", found.supplierAddress ?? "");
    setValue("partyState", found.supplierState ?? "Maharashtra");
  }

  /** Lines available to return: the bill's own lines, else the full master. */
  const returnableItems = sourcePurchase
    ? (sourcePurchase.items ?? []).map((line) => ({
        name: line.name,
        detail: `${line.qty} ${line.unit} @ ${formatInr(line.rate)}`,
        qty: line.qty,
        rate: line.rate,
      }))
    : itemsMaster.map((item) => ({
        name: item.name,
        detail: `Stock: ${item.stock} ${item.unit}`,
        qty: 1,
        rate: item.purchaseRate || item.sellingRate,
      }));

  async function onSubmit(data: DebitNoteFormInput) {
    if (!data.selectedItemName) {
      toast.error("Please select a returned item");
      return;
    }

    const itemObj = itemsMaster.find((i) => i.name === data.selectedItemName);
    const taxable = Number(data.returnQty) * Number(data.returnRate);

    const toastId = toast.loading("Recording Debit Note & Updating Stock...");

    try {
      const payload = {
        date: data.date,
        purchaseInvoiceNumber: data.purchaseInvoiceNumber,
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

      const res = await fetch("/api/debit-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Debit Note saved & stock reduced!", { id: toastId });
        setShowModal(false);
        reset();
        loadDebitNotes();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to record Debit Note", { id: toastId });
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
            href="/purchases"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0b2641]">Debit Notes (Purchase Returns)</h1>
            <p className="text-sm text-slate-500">Record supplier returns & automatically reduce item inventory stock</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Issue Debit Note
        </button>
      </div>

      {/* Debit Notes List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Debit Note No</th>
                <th className="py-3 px-4">Supplier Bill No</th>
                <th className="py-3 px-4">Supplier Name</th>
                <th className="py-3 px-4 text-right">Return Value (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading debit notes...
                  </td>
                </tr>
              ) : debitNotes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No debit notes issued yet. Click "+ Issue Debit Note" above to record a purchase return.
                  </td>
                </tr>
              ) : (
                debitNotes.map((dn) => (
                  <tr key={dn._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{dn.date}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-amber-700">{dn.debitNoteNo}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">{dn.purchaseInvoiceNumber || "-"}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{dn.partyName}</td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{dn.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {dn.status}
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
            aria-labelledby="debit-note-dialog-title"
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 id="debit-note-dialog-title" className="font-bold text-[#0b2641] text-lg">Issue Purchase Return Debit Note</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Original Purchase Bill
                </label>
                <select
                  value={sourcePurchase?._id ?? ""}
                  onChange={(e) => handleSelectPurchase(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="">— Not linked (enter details manually) —</option>
                  {purchases.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.purchaseInvoiceNumber} · {p.supplierName} · {formatInr(p.totalAmount)} · {p.date}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {sourcePurchase
                    ? "Supplier details filled from the bill; only its line items can be returned."
                    : "Pick a bill to auto-fill the supplier and restrict the returnable items."}
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Bill No</label>
                  <input
                    type="text"
                    placeholder="e.g. BILL-9876"
                    readOnly={Boolean(sourcePurchase)}
                    {...register("purchaseInvoiceNumber")}
                    className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono ${
                      sourcePurchase ? "bg-slate-100 text-slate-500" : "bg-slate-50"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Tata Steel Trading Co"
                  {...register("partyName", { required: "Supplier name is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
                {errors.partyName && <p className="text-xs text-rose-600 mt-0.5">{errors.partyName.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Address</label>
                <input
                  type="text"
                  placeholder="Supplier address"
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Return Quantity (-Stock) *</label>
                  <input
                    type="number"
                    min={1}
                    {...register("returnQty", { valueAsNumber: true, min: 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-rose-700"
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
                  Save Debit Note & Reduce Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
