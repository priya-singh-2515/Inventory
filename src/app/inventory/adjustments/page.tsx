"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { StockAdjustment, ItemMaster } from "@/lib/types/inventory";
import { STOCK_ADJUSTMENT_REASONS } from "@/lib/constants";

interface AdjustmentFormInput {
  type: "Stock In" | "Stock Out";
  reason: string;
  date: string;
  selectedItemId: string;
  qty: number;
  narration: string;
}

export default function StockAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [availableItems, setAvailableItems] = useState<ItemMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormInput>({
    defaultValues: {
      type: "Stock In",
      reason: "Physical Count Variance",
      date: new Date().toISOString().split("T")[0],
      selectedItemId: "",
      qty: 1,
      narration: "",
    },
  });

  const adjustmentType = watch("type");

  async function loadData() {
    setLoading(true);
    try {
      const [adjRes, itemRes] = await Promise.all([
        fetch("/api/stock-adjustments"),
        fetch("/api/items"),
      ]);
      if (adjRes.ok) setAdjustments(await adjRes.json());
      if (itemRes.ok) setAvailableItems(await itemRes.json());
    } catch (e) {
      toast.error("Failed to load stock adjustments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onSubmit(formData: AdjustmentFormInput) {
    const selectedItem = availableItems.find((i) => i._id === formData.selectedItemId);
    if (!selectedItem) {
      toast.error("Please select a product item");
      return;
    }

    const toastId = toast.loading("Saving stock adjustment...");

    try {
      const payload = {
        date: formData.date,
        type: formData.type,
        reason: formData.reason,
        items: [
          {
            itemId: selectedItem._id,
            name: selectedItem.name,
            qty: formData.qty,
            unit: selectedItem.unit || "NOS",
            rate: selectedItem.sellingRate,
          },
        ],
        narration: formData.narration,
      };

      const res = await fetch("/api/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Stock adjustment recorded & inventory updated!", { id: toastId });
        setIsOpen(false);
        reset();
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save stock adjustment", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/inventory"
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0b2641]">Stock Adjustments</h1>
            <p className="text-sm text-slate-500">Record Stock In / Stock Out for audits, damage, or opening stock setup</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Adjustment</span>
        </button>
      </div>

      {/* Adjustment Entries Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Adjustment No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Reason</th>
                <th className="py-3.5 px-4">Items & Qty</th>
                <th className="py-3.5 px-4">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading stock adjustments...
                  </td>
                </tr>
              ) : adjustments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No stock adjustments recorded.
                  </td>
                </tr>
              ) : (
                adjustments.map((adj) => (
                  <tr key={adj._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{adj.adjustmentNo}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{adj.date}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          adj.type === "Stock In"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {adj.type === "Stock In" ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Stock In
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" /> Stock Out
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{adj.reason}</td>
                    <td className="py-3.5 px-4">
                      {adj.items?.map((it, idx) => (
                        <div key={idx} className="text-xs font-medium text-slate-800">
                          {it.name}: <span className="font-bold">{it.qty} {it.unit}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{adj.narration || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">New Stock Adjustment</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Adjustment Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("type", "Stock In")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                      adjustmentType === "Stock In"
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    + Stock In (Increase)
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("type", "Stock Out")}
                    className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                      adjustmentType === "Stock Out"
                        ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    - Stock Out (Decrease)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product *</label>
                <select
                  {...register("selectedItemId", { required: "Product item is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Choose Item --</option>
                  {availableItems.map((item) => (
                    <option key={item._id} value={item._id}>
                      {item.name} (Current Stock: {item.stock} {item.unit})
                    </option>
                  ))}
                </select>
                {errors.selectedItemId && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.selectedItemId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
                  <input
                    type="number"
                    min={1}
                    {...register("qty", { valueAsNumber: true, min: 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason *</label>
                  <select
                    {...register("reason", { required: "Reason is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {STOCK_ADJUSTMENT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  {...register("date", { required: "Date is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Annual audit count variance"
                  {...register("narration")}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0b2641] hover:bg-blue-900 rounded-lg shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
