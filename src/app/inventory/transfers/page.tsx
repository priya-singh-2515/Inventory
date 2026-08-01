"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { StockTransfer, ItemMaster } from "@/lib/types/inventory";

interface TransferFormInput {
  sourceGodown: string;
  destinationGodown: string;
  date: string;
  selectedItemId: string;
  qty: number;
  narration: string;
}

export default function StockTransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [availableItems, setAvailableItems] = useState<ItemMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TransferFormInput>({
    defaultValues: {
      sourceGodown: "Main Warehouse (Mumbai)",
      destinationGodown: "Store 1 (Thane)",
      date: new Date().toISOString().split("T")[0],
      selectedItemId: "",
      qty: 1,
      narration: "",
    },
  });

  async function loadData() {
    setLoading(true);
    try {
      const [trnRes, itemRes] = await Promise.all([
        fetch("/api/stock-transfers"),
        fetch("/api/items"),
      ]);
      if (trnRes.ok) setTransfers(await trnRes.json());
      if (itemRes.ok) setAvailableItems(await itemRes.json());
    } catch (e) {
      toast.error("Failed to load stock transfers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function onSubmit(formData: TransferFormInput) {
    const selectedItem = availableItems.find((i) => i._id === formData.selectedItemId);
    if (!selectedItem) {
      toast.error("Please select a product item");
      return;
    }

    const toastId = toast.loading("Recording godown stock transfer...");

    try {
      const payload = {
        date: formData.date,
        sourceGodown: formData.sourceGodown,
        destinationGodown: formData.destinationGodown,
        items: [
          {
            itemId: selectedItem._id,
            name: selectedItem.name,
            qty: formData.qty,
            unit: selectedItem.unit || "NOS",
          },
        ],
        narration: formData.narration,
      };

      const res = await fetch("/api/stock-transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success("Godown stock transfer recorded successfully!", { id: toastId });
        setIsOpen(false);
        reset();
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to record stock transfer", { id: toastId });
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
            <h1 className="text-2xl font-bold text-[#0b2641]">Godown Stock Transfers</h1>
            <p className="text-sm text-slate-500">Transfer product stock between warehouses and godowns</p>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Transfer No</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Source Godown</th>
                <th className="py-3.5 px-4">Destination Godown</th>
                <th className="py-3.5 px-4">Items & Qty</th>
                <th className="py-3.5 px-4">Narration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading stock transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No inter-godown transfers recorded.
                  </td>
                </tr>
              ) : (
                transfers.map((trn) => (
                  <tr key={trn._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{trn.transferNo}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{trn.date}</td>
                    <td className="py-3.5 px-4 font-semibold text-rose-700">{trn.sourceGodown}</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-700">{trn.destinationGodown}</td>
                    <td className="py-3.5 px-4">
                      {trn.items?.map((it, idx) => (
                        <div key={idx} className="text-xs font-medium text-slate-800">
                          {it.name}: <span className="font-bold">{it.qty} {it.unit}</span>
                        </div>
                      ))}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{trn.narration || "-"}</td>
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
            <h3 className="text-lg font-bold text-slate-900">New Inter-Godown Stock Transfer</h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Source Warehouse / Godown *</label>
                <input
                  type="text"
                  {...register("sourceGodown", { required: "Source godown is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
                {errors.sourceGodown && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.sourceGodown.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Warehouse / Godown *</label>
                <input
                  type="text"
                  {...register("destinationGodown", { required: "Destination godown is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
                {errors.destinationGodown && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.destinationGodown.message}</p>
                )}
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
                      {item.name} (Stock: {item.stock} {item.unit})
                    </option>
                  ))}
                </select>
                {errors.selectedItemId && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.selectedItemId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity to Transfer *</label>
                  <input
                    type="number"
                    min={1}
                    {...register("qty", { valueAsNumber: true, min: 1 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    {...register("date", { required: "Date is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Narration / Transport Note</label>
                <input
                  type="text"
                  placeholder="e.g. Stock rebalancing for retail store"
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
                  Save Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
