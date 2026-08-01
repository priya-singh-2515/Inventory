"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { InvoiceItem } from "@/lib/types/invoice";
import { ItemMaster } from "@/lib/types/inventory";
import { INDIAN_STATES } from "@/lib/constants";

interface SalesInvoiceFormInput {
  date: string;
  partyName: string;
  partyGstin: string;
  partyAddress: string;
  partyPlace: string;
  partyPincode: string;
  partyState: string;
}

export default function CreateSalesInvoicePage() {
  const router = useRouter();

  const [availableItems, setAvailableItems] = useState<ItemMaster[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Calculation results
  const [totalTaxable, setTotalTaxable] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SalesInvoiceFormInput>({
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      partyName: "",
      partyGstin: "",
      partyAddress: "",
      partyPlace: "Mumbai",
      partyPincode: "400001",
      partyState: "Maharashtra",
    },
  });

  const partyState = watch("partyState");

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
        rate: found.sellingRate,
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
  }, [items, partyState]);

  async function onSubmit(formData: SalesInvoiceFormInput) {
    if (items.length === 0) {
      toast.error("Please add at least one line item to the invoice");
      return;
    }

    const toastId = toast.loading("Generating GST Invoice & Updating Stock...");

    try {
      const payload = {
        ...formData,
        items,
        totalTaxable,
        totalTax,
        totalAmount: grandTotal,
        status: "Completed",
      };

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Sales Invoice created & inventory stock updated!", { id: toastId });
        router.push("/sales");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create sales invoice", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/sales"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">New Sales Invoice</h1>
          <p className="text-sm text-slate-500">Create GST compliant invoice & update item inventory</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer / Party Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-[#0b2641] text-base">Customer / Bill To Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Name *</label>
              <input
                type="text"
                placeholder="e.g. Reliance Retail Ltd"
                {...register("partyName", { required: "Customer name is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.partyName && <p className="text-xs text-rose-600 mt-0.5">{errors.partyName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer GSTIN</label>
              <input
                type="text"
                placeholder="27ABCDE1234F1Z5"
                {...register("partyGstin")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                {...register("date", { required: "Date is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.date && <p className="text-xs text-rose-600 mt-0.5">{errors.date.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Billing Address *</label>
              <input
                type="text"
                placeholder="Street address, building name"
                {...register("partyAddress", { required: "Address is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.partyAddress && <p className="text-xs text-rose-600 mt-0.5">{errors.partyAddress.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <select
                {...register("partyState", { required: "State is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st.code} value={st.name}>
                    {st.code} - {st.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode *</label>
              <input
                type="text"
                {...register("partyPincode", { required: "Pincode is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.partyPincode && <p className="text-xs text-rose-600 mt-0.5">{errors.partyPincode.message}</p>}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-[#0b2641] text-base">Invoice Line Items</h3>
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
                  <th className="py-2.5 px-3 min-w-[200px]">Product / Service Name</th>
                  <th className="py-2.5 px-3 w-24">Qty</th>
                  <th className="py-2.5 px-3 w-24">Unit</th>
                  <th className="py-2.5 px-3 w-32">Rate (₹)</th>
                  <th className="py-2.5 px-3 w-28">GST %</th>
                  <th className="py-2.5 px-3 w-28">Tax Type</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400 text-xs">
                      No line items added yet. Click "+ Add Item" above.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-3">
                        <select
                          value={item.name}
                          onChange={(e) => handleSelectItem(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-semibold text-slate-800"
                        >
                          <option value="">-- Select Product --</option>
                          {availableItems.map((masterItem) => (
                            <option key={masterItem._id} value={masterItem.name}>
                              {masterItem.name} (Stock: {masterItem.stock} {masterItem.unit})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          min={0.01}
                          step="any"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, "qty", Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800"
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
                      <td className="py-2.5 px-3">
                        <select
                          value={item.taxType}
                          onChange={(e) => handleItemChange(idx, "taxType", e.target.value as any)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                        >
                          <option value="Exclusive">Exclusive</option>
                          <option value="Inclusive">Inclusive</option>
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

        {/* Totals Summary */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-slate-600 text-xs">
            <p>
              Taxable Amount: <span className="font-semibold text-slate-800">₹{totalTaxable.toLocaleString("en-IN")}</span>
            </p>
            <p>
              GST Amount: <span className="font-semibold text-slate-800">₹{totalTax.toLocaleString("en-IN")}</span>
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-400 font-semibold uppercase">Grand Total</p>
              <p className="text-2xl font-bold text-[#0b2641]">₹{grandTotal.toLocaleString("en-IN")}</p>
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Save & Complete Invoice</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
