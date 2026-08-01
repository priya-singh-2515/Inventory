"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { InvoiceItem } from "@/lib/types/invoice";
import { ItemMaster } from "@/lib/types/inventory";
import { INDIAN_STATES, ITC_ELIGIBILITY_OPTIONS } from "@/lib/constants";

interface PurchaseBillFormInput {
  supplierInvoiceNo: string;
  date: string;
  supplierName: string;
  supplierGstin: string;
  supplierAddress: string;
  supplierState: string;
  itcEligibility: string;
}

export default function CreatePurchaseBillPage() {
  const router = useRouter();

  const [availableItems, setAvailableItems] = useState<ItemMaster[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);

  const [totalTaxable, setTotalTaxable] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PurchaseBillFormInput>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      supplierInvoiceNo: "",
      supplierName: "",
      supplierGstin: "",
      supplierAddress: "",
      supplierState: "Maharashtra",
      itcEligibility: "Inputs",
    },
  });

  const supplierState = watch("supplierState");

  useEffect(() => {
    async function loadMasterItems() {
      try {
        const res = await fetch("/api/items");
        if (res.ok) {
          const data = await res.json();
          setAvailableItems(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMasterItems();
  }, []);

  function handleAddItem() {
    setItems([
      ...items,
      {
        name: "",
        type: "Product",
        qty: 1,
        unit: "NOS",
        rate: 0,
        taxRate: 18,
        taxType: "Exclusive",
        discountPercent: 0,
        discountAmount: 0,
        igstRate: 0,
        cgstRate: 9,
        sgstRate: 9,
        taxableAmount: 0,
      },
    ]);
  }

  function handleSelectItem(index: number, selectedName: string) {
    const found = availableItems.find((i) => i.name === selectedName);
    const updated = [...items];
    if (found) {
      updated[index] = {
        ...updated[index],
        name: found.name,
        type: found.type,
        rate: found.purchaseRate || found.sellingRate,
        unit: found.unit || "NOS",
        hsnCode: found.hsnCode,
        taxRate: found.taxRate || 18,
        taxType: found.taxType || "Exclusive",
      };
    } else {
      updated[index].name = selectedName;
    }
    setItems(updated);
  }

  function handleItemChange(index: number, field: keyof InvoiceItem, val: any) {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  }

  function handleRemoveItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  useEffect(() => {
    let taxableSum = 0;
    let taxSum = 0;

    items.forEach((item) => {
      const q = Number(item.qty) || 0;
      const r = Number(item.rate) || 0;
      const disc = Number(item.discountPercent) || 0;
      const taxR = Number(item.taxRate) || 0;

      const gross = q * r;
      const net = gross - (gross * disc) / 100;

      let taxable = net;
      if (item.taxType === "Inclusive") {
        taxable = net / (1 + taxR / 100);
      }
      const taxAmt = (taxable * taxR) / 100;

      taxableSum += taxable;
      taxSum += taxAmt;
    });

    setTotalTaxable(Number(taxableSum.toFixed(2)));
    setTotalTax(Number(taxSum.toFixed(2)));
    setGrandTotal(Math.round(taxableSum + taxSum));
  }, [items, supplierState]);

  async function onSubmit(formData: PurchaseBillFormInput) {
    if (items.length === 0) {
      toast.error("Please add at least one line item to the purchase bill");
      return;
    }

    const toastId = toast.loading("Saving Purchase Bill & Adding Inventory Stock...");

    try {
      const payload = {
        ...formData,
        items,
        totalTaxable,
        totalTax,
        totalAmount: grandTotal,
        status: "Completed",
      };

      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Purchase Bill saved successfully & inventory stock added!", { id: toastId });
        router.push("/purchases");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save purchase bill", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/purchases"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">New Purchase Bill</h1>
          <p className="text-sm text-slate-500">Record supplier purchase bill to increase product inventory stock</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Supplier & Bill Metadata */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-[#0b2641] text-base">Supplier & Bill Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Bill/Invoice No *</label>
              <input
                type="text"
                placeholder="e.g. BILL-9876"
                {...register("supplierInvoiceNo", { required: "Supplier bill number is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
              />
              {errors.supplierInvoiceNo && (
                <p className="text-xs text-rose-600 mt-0.5">{errors.supplierInvoiceNo.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Date *</label>
              <input
                type="date"
                {...register("date", { required: "Date is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.date && <p className="text-xs text-rose-600 mt-0.5">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Name *</label>
              <input
                type="text"
                placeholder="e.g. Tata Steel Trading Co"
                {...register("supplierName", { required: "Supplier name is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.supplierName && (
                <p className="text-xs text-rose-600 mt-0.5">{errors.supplierName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ITC Eligibility</label>
              <select
                {...register("itcEligibility")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-blue-900"
              >
                {ITC_ELIGIBILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Address *</label>
              <input
                type="text"
                placeholder="Supplier street address"
                {...register("supplierAddress", { required: "Address is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.supplierAddress && (
                <p className="text-xs text-rose-600 mt-0.5">{errors.supplierAddress.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier State *</label>
              <select
                {...register("supplierState", { required: "State is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Purchase Items */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#0b2641] text-base">Purchased Product Line Items</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-3 min-w-[200px]">Product Name</th>
                  <th className="py-2.5 px-3 w-24">Qty (+)</th>
                  <th className="py-2.5 px-3 w-24">Unit</th>
                  <th className="py-2.5 px-3 w-32">Cost Rate (₹)</th>
                  <th className="py-2.5 px-3 w-28">GST %</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      No items added yet. Click "+ Add Item" above.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <select
                          value={item.name}
                          onChange={(e) => handleSelectItem(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-semibold"
                        >
                          <option value="">Select or Type Item</option>
                          {availableItems.map((masterItem) => (
                            <option key={masterItem._id} value={masterItem.name}>
                              {masterItem.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-emerald-700"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, "unit", e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, "rate", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={item.taxRate}
                          onChange={(e) => handleItemChange(idx, "taxRate", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                        >
                          {[0, 5, 12, 18, 28].map((r) => (
                            <option key={r} value={r}>
                              {r}%
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">
            Grand Total Purchase Amount: <span className="text-xl font-bold text-[#0b2641] ml-2">₹{grandTotal.toLocaleString("en-IN")}</span>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Save Bill & Add Stock</span>
          </button>
        </div>
      </form>
    </div>
  );
}
