"use client";

import { useState } from "react";
import { Plus, Search, Pencil, Trash2, Users, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Party, PartyType } from "@/lib/types/common";
import { INDIAN_STATES } from "@/lib/constants";
import { GSTIN_REGEX, PINCODE_REGEX, PHONE_REGEX } from "@/common/regex";
import { usePagedList } from "@/hooks/usePagedList";
import { useCompanySession } from "@/hooks/useCompanySession";
import { EmptyState } from "@/components/EmptyState";
import { useDialogA11y } from "@/hooks/useDialogA11y";

type PartyFilter = "ALL" | PartyType;

interface PartyFormInput {
  name: string;
  partyType: PartyType;
  gstin: string;
  gstRegType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  creditPeriod: string;
  creditLimit: string;
}

const EMPTY: PartyFormInput = {
  name: "",
  partyType: "Customer",
  gstin: "",
  gstRegType: "Regular",
  address: "",
  city: "",
  state: "Maharashtra",
  pincode: "",
  phone: "",
  email: "",
  creditPeriod: "",
  creditLimit: "",
};

export default function PartiesPage() {
  const { canManage } = useCompanySession();
  const canEdit = canManage("masters");

  const [filter, setFilter] = useState<PartyFilter>("ALL");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Party | null>(null);
  const [saving, setSaving] = useState(false);

  const dialogRef = useDialogA11y({ isOpen, onClose: () => setIsOpen(false) });

  const {
    rows: parties,
    search,
    setSearch,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    reload,
  } = usePagedList<Party>({
    endpoint: "/api/parties",
    cursorParam: "after",
    params: { partyType: filter === "ALL" ? undefined : filter },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PartyFormInput>({ defaultValues: EMPTY });

  function openCreate() {
    setEditing(null);
    reset(EMPTY);
    setIsOpen(true);
  }

  function openEdit(party: Party) {
    setEditing(party);
    reset({
      name: party.name,
      partyType: party.partyType,
      gstin: party.gstin ?? "",
      gstRegType: party.gstRegType ?? "Regular",
      address: party.address ?? "",
      city: party.city ?? "",
      state: party.state ?? "Maharashtra",
      pincode: party.pincode ?? "",
      phone: party.phone ?? "",
      email: party.email ?? "",
      creditPeriod: party.creditPeriod ?? "",
      creditLimit: party.creditLimit ?? "",
    });
    setIsOpen(true);
  }

  async function onSubmit(data: PartyFormInput) {
    setSaving(true);
    const isEdit = Boolean(editing);
    const toastId = toast.loading(isEdit ? "Updating party..." : "Saving party...");
    try {
      const res = await fetch(isEdit ? `/api/parties/${editing?._id}` : "/api/parties", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(isEdit ? "Party updated" : "Party saved", { id: toastId });
        setIsOpen(false);
        setEditing(null);
        reset(EMPTY);
        reload();
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not save the party", { id: toastId });
      }
    } catch {
      toast.error("Network error occurred", { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(party: Party) {
    if (
      !window.confirm(
        `Delete "${party.name}"?\n\nDocuments already issued to them keep their own copy of the name and address, so history is unaffected.`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/parties/${party._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Party deleted");
      reload();
    } else {
      toast.error("Could not delete the party");
    }
  }

  const inputClass =
    "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Customers &amp; Suppliers</h1>
          <p className="text-sm text-slate-500">
            Save a party once — their state then sets the GST treatment on every invoice automatically
          </p>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Party
          </button>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, GSTIN, city or state..."
            data-search="true"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {(["ALL", "Customer", "Supplier"] as PartyFilter[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filter === option
                  ? "bg-[#0b2641] text-white border-[#0b2641]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              {option === "ALL" ? "All" : `${option}s`}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    Loading parties...
                  </td>
                </tr>
              ) : parties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyState
                      icon={Users}
                      title={search ? "No parties match that search" : "No customers or suppliers yet"}
                      description={
                        search
                          ? "Search matches the start of a name, GSTIN, city or state."
                          : "Adding a party once stops you retyping their GSTIN and state on every invoice — and a mistyped state silently changes the GST treatment."
                      }
                      actionLabel={search || !canEdit ? undefined : "Add Party"}
                      onAction={openCreate}
                      disabledReason={canEdit ? undefined : "Your role cannot add parties."}
                    />
                  </td>
                </tr>
              ) : (
                parties.map((party) => (
                  <tr key={party._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800">{party.name}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          party.partyType === "Supplier"
                            ? "bg-violet-50 text-violet-700 border-violet-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {party.partyType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {party.gstin || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{party.city || "—"}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{party.state}</td>
                    <td className="py-3.5 px-4 text-slate-500 text-xs">
                      {party.phone || party.email || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {canEdit && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(party)}
                            aria-label={`Edit ${party.name}`}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(party)}
                            aria-label={`Delete ${party.name}`}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
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
              {loadingMore ? "Loading..." : "Load more parties"}
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={editing ? `Edit ${editing.name}` : "Add party"}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-[#0b2641] text-lg">
                {editing ? `Edit ${editing.name}` : "Add Customer or Supplier"}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name *</label>
                  <input
                    {...register("name", { required: "Name is required" })}
                    className={inputClass}
                    placeholder="Reliance Retail Ltd"
                  />
                  {errors.name && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type *</label>
                  <select {...register("partyType")} className={inputClass}>
                    <option value="Customer">Customer</option>
                    <option value="Supplier">Supplier</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    {...register("gstin", {
                      validate: (v) => !v || GSTIN_REGEX.test(v) || "Invalid 15-character GSTIN",
                    })}
                    className={`${inputClass} font-mono uppercase`}
                    placeholder="27ABCDE1234F1Z5"
                  />
                  {errors.gstin && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.gstin.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Type
                  </label>
                  <select {...register("gstRegType")} className={inputClass}>
                    <option>Regular</option>
                    <option>Composition</option>
                    <option>Unregistered</option>
                    <option>SEZ</option>
                    <option>Overseas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
                <input
                  {...register("address", { required: "Address is required" })}
                  className={inputClass}
                  placeholder="12 Commerce Road"
                />
                {errors.address && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.address.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input {...register("city")} className={inputClass} placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State *{" "}
                    <span className="font-normal text-slate-400">— sets the GST split</span>
                  </label>
                  <select {...register("state", { required: true })} className={inputClass}>
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    {...register("pincode", {
                      validate: (v) => !v || PINCODE_REGEX.test(v) || "Pincode must be 6 digits",
                    })}
                    className={inputClass}
                    placeholder="400001"
                  />
                  {errors.pincode && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.pincode.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    {...register("phone", {
                      validate: (v) => !v || PHONE_REGEX.test(v) || "10 digits starting 6–9",
                    })}
                    className={inputClass}
                    placeholder="9876543210"
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" {...register("email")} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Period (days)
                  </label>
                  <input {...register("creditPeriod")} className={inputClass} placeholder="30" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Credit Limit (₹)
                  </label>
                  <input {...register("creditLimit")} className={inputClass} placeholder="100000" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editing ? "Save changes" : "Save party"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
