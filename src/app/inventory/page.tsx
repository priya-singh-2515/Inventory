"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  Search,
  Plus,
  Sliders,
  ArrowLeftRight,
  History,
  TrendingUp,
  DollarSign,
  Boxes,
} from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { ItemMaster, StockValuationSummary } from "@/lib/types/inventory";

interface NewItemFormInput {
  name: string;
  type: string;
  sku: string;
  unit: string;
  stock: number;
  minStock: number;
  sellingRate: number;
  purchaseRate: number;
  taxRate: number;
  category: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemMaster[]>([]);
  const [summary, setSummary] = useState<StockValuationSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // New item modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewItemFormInput>({
    defaultValues: {
      name: "",
      type: "Product",
      sku: "",
      unit: "NOS",
      stock: 0,
      minStock: 5,
      sellingRate: 0,
      purchaseRate: 0,
      taxRate: 18,
      category: "General",
    },
  });

  async function loadInventoryData() {
    setLoading(true);
    try {
      const [itemsRes, sumRes] = await Promise.all([
        fetch("/api/items"),
        fetch("/api/inventory/summary"),
      ]);

      if (itemsRes.ok) {
        const data = await itemsRes.json();
        setItems(data);
      }
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }
    } catch (e) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventoryData();
  }, []);

  async function onSubmitItem(data: NewItemFormInput) {
    const toastId = toast.loading("Saving new product master...");
    try {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Product master created successfully!", { id: toastId });
        setIsModalOpen(false);
        reset();
        loadInventoryData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create item", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()));

    const isLow = item.minStock > 0 && item.stock <= item.minStock;
    if (showLowStockOnly) {
      return matchesSearch && isLow;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Inventory Master</h1>
          <p className="text-sm text-slate-500">Track stock levels, valuation, reorder alerts & movement history</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/inventory/adjustments"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-colors"
          >
            <Sliders className="w-4 h-4" />
            <span>Stock In / Out</span>
          </Link>
          <Link
            href="/inventory/transfers"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Godown Transfer</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Stock Valuation Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Products</p>
              <h3 className="text-xl font-bold text-slate-800">{summary.totalItemsCount}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{summary.totalStockQuantity} total units</p>
            </div>
          </div>

          <div
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`cursor-pointer p-5 rounded-xl border shadow-xs flex items-center gap-4 transition-all ${
              showLowStockOnly
                ? "bg-amber-100 border-amber-400 ring-2 ring-amber-400"
                : "bg-amber-50/70 border-amber-200 hover:bg-amber-100/80"
            }`}
          >
            <div className="p-3 bg-amber-500 text-white rounded-lg shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-amber-900 font-semibold">Low Stock Reorders</p>
              <h3 className="text-xl font-bold text-amber-950">{summary.lowStockItemsCount} Items</h3>
              <p className="text-[11px] text-amber-700 mt-0.5">Click to filter low stock</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Stock Value (Cost)</p>
              <h3 className="text-xl font-bold text-slate-800">₹{summary.totalValueAtCost.toLocaleString("en-IN")}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">At Purchase Cost</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Stock Value (Selling)</p>
              <h3 className="text-xl font-bold text-slate-800">₹{summary.totalValueAtSelling.toLocaleString("en-IN")}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">At Selling Price</p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by item name, SKU or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              showLowStockOnly
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
          >
            {showLowStockOnly ? "Showing Low Stock Only" : "Filter Low Stock"}
          </button>
        </div>
      </div>

      {/* Item Master Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Min Stock Level</th>
                <th className="py-3.5 px-4">Purchase Rate</th>
                <th className="py-3.5 px-4">Selling Rate</th>
                <th className="py-3.5 px-4">GST Rate</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading inventory master records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No item master records found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.minStock > 0 && item.stock <= item.minStock;

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-600" />
                          <div>
                            <p className="font-semibold text-slate-800">{item.name}</p>
                            {item.sku && <p className="text-xs text-slate-400 font-mono">SKU: {item.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{item.category || "General"}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold ${
                              isLow ? "text-amber-600" : "text-slate-800"
                            }`}
                          >
                            {item.stock} {item.unit}
                          </span>
                          {isLow && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300">
                              Low Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">₹{item.purchaseRate || 0}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">₹{item.sellingRate}</td>
                      <td className="py-3.5 px-4 text-slate-600">{item.taxRate}% GST</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/inventory/${item._id}/ledger`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md border border-blue-200 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Ledger</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Add New Product Master</h3>

            <form onSubmit={handleSubmit(onSubmitItem)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Steel Pipe 2 inch"
                  {...register("name", { required: "Item name is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.name && <p className="text-xs text-rose-600 mt-0.5">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-1001"
                    {...register("sku")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
                  <input
                    type="text"
                    {...register("unit", { required: "Unit is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                  {errors.unit && <p className="text-xs text-rose-600 mt-0.5">{errors.unit.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min={0}
                    {...register("stock", { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Min Stock (Reorder Point)</label>
                  <input
                    type="number"
                    min={0}
                    {...register("minStock", { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-bold text-amber-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Purchase Rate (Cost)</label>
                  <input
                    type="number"
                    min={0}
                    {...register("purchaseRate", { valueAsNumber: true, min: 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Selling Rate *</label>
                  <input
                    type="number"
                    min={0}
                    {...register("sellingRate", { valueAsNumber: true, min: 0, required: "Selling rate required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                  {errors.sellingRate && <p className="text-xs text-rose-600 mt-0.5">{errors.sellingRate.message}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0b2641] hover:bg-blue-900 rounded-lg shadow-sm"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
