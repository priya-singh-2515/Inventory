"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Building2,
  Plus,
  Download,
  Upload,
  Check,
  Loader2,
  X,
  ShieldCheck,
} from "lucide-react";
import { INDIAN_STATES } from "@/lib/constants";
import { CompanyDetails } from "@/lib/types/settings";

interface CompanyRow extends CompanyDetails {
  role?: string;
}

interface NewCompanyInput {
  legalName: string;
  tradeName: string;
  gstin: string;
  address1: string;
  location: string;
  pincode: string;
  state: string;
  phone: string;
  email: string;
}

const ROLE_STYLES: Record<string, string> = {
  owner: "bg-blue-50 text-blue-700 border-blue-200",
  admin: "bg-violet-50 text-violet-700 border-violet-200",
  manager: "bg-teal-50 text-teal-700 border-teal-200",
  accountant: "bg-amber-50 text-amber-800 border-amber-300",
  viewer: "bg-slate-50 text-slate-600 border-slate-200",
};

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busy, setBusy] = useState<"export" | "import" | "switch" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewCompanyInput>({
    defaultValues: {
      legalName: "",
      tradeName: "",
      gstin: "",
      address1: "",
      location: "",
      pincode: "",
      state: "Maharashtra",
      phone: "",
      email: "",
    },
  });

  async function load() {
    setLoading(true);
    try {
      const [listRes, activeRes] = await Promise.all([
        fetch("/api/companies"),
        fetch("/api/company"),
      ]);
      if (listRes.ok) setCompanies(await listRes.json());
      if (activeRes.ok) {
        const active = await activeRes.json();
        setActiveId(active?._id ?? null);
      }
    } catch (e) {
      console.error("Failed to load companies", e);
      toast.error("Failed to load companies");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSwitch(companyId: string) {
    if (companyId === activeId) return;
    setBusy("switch");
    try {
      const res = await fetch("/api/companies/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Could not switch company");
        return;
      }
      toast.success("Switched company");
      window.location.reload();
    } catch {
      toast.error("Network error occurred");
    } finally {
      setBusy(null);
    }
  }

  async function onCreate(data: NewCompanyInput) {
    const toastId = toast.loading("Creating company...");
    try {
      // stateCode must agree with the state name — derive it rather than
      // asking for it, so the GST state code can never drift from the state.
      const stateCode =
        INDIAN_STATES.find((s) => s.name === data.state)?.code ?? "";

      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tradeName: data.tradeName.trim() || data.legalName.trim(),
          stateCode,
          pincode: Number(data.pincode) || 0,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create company", { id: toastId });
        return;
      }
      toast.success("Company created", { id: toastId });
      setShowCreate(false);
      reset();
      load();
      router.refresh();
    } catch {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  /** Exports the ACTIVE company — the API scopes to whatever is currently set. */
  async function handleExport() {
    setBusy("export");
    const toastId = toast.loading("Preparing export...");
    try {
      const res = await fetch("/api/companies/export");
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Export failed", { id: toastId });
        return;
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const suggested = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "company-export.json";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = suggested;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Export downloaded", { id: toastId });
    } catch {
      toast.error("Network error occurred", { id: toastId });
    } finally {
      setBusy(null);
    }
  }

  async function handleImportFile(file: File) {
    setBusy("import");
    const toastId = toast.loading("Importing company data...");
    try {
      const text = await file.text();
      const res = await fetch("/api/companies/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: text,
      });
      const payload = await res.json();

      if (!res.ok) {
        toast.error(payload.error || "Import failed", { id: toastId });
        return;
      }

      const total = Object.values(payload.counts ?? {}).reduce(
        (sum: number, n) => sum + Number(n || 0),
        0
      );
      toast.success(`Imported as a new company — ${total} records restored`, { id: toastId });
      load();
    } catch {
      toast.error("Could not read that file", { id: toastId });
    } finally {
      setBusy(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const activeCompany = companies.find((c) => c._id === activeId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Companies</h1>
          <p className="text-sm text-slate-500">
            Switch between businesses, and back up or restore a company&apos;s full books
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Company</span>
        </button>
      </div>

      {/* Backup / restore */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h2 className="font-bold text-[#0b2641] text-base">Data backup &amp; restore</h2>
        <p className="text-sm text-slate-500 mt-1">
          Export writes one JSON file containing the active company&apos;s profile, masters,
          documents and stock ledger.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={handleExport}
            disabled={busy !== null || !activeCompany}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-lg border border-emerald-300 transition-colors disabled:opacity-60"
          >
            {busy === "export" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export {activeCompany?.tradeName || activeCompany?.legalName || "active company"}
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy !== null}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg border border-slate-300 transition-colors disabled:opacity-60"
          >
            {busy === "import" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import from file
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />
        </div>

        <p className="flex items-start gap-2 text-[11px] text-slate-500 mt-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-px" />
          <span>
            Import always creates a <strong>new</strong> company. Nothing existing is
            overwritten, so a wrong file costs a deletion rather than your live books.
          </span>
        </p>
      </div>

      {/* Company list */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">GSTIN</th>
                <th className="py-3 px-4">State</th>
                <th className="py-3 px-4">Your role</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Loading companies...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No companies yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                companies.map((company) => {
                  const isActive = company._id === activeId;
                  return (
                    <tr key={company._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-800">
                              {company.tradeName || company.legalName}
                            </p>
                            <p className="text-[11px] text-slate-400">{company.legalName}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {company.gstin || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{company.state}</td>
                      <td className="py-3.5 px-4">
                        {company.role && (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${
                              ROLE_STYLES[company.role] ?? ROLE_STYLES.viewer
                            }`}
                          >
                            {company.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-200">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSwitch(company._id!)}
                            disabled={busy !== null}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition-colors disabled:opacity-60"
                          >
                            Switch to
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create company modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-[#0b2641] text-lg">New Company</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                aria-label="Close"
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ethara AI Solutions Pvt Ltd"
                  {...register("legalName", { required: "Legal name is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
                {errors.legalName && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.legalName.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Trade Name
                  </label>
                  <input
                    type="text"
                    placeholder="Shown across the app"
                    {...register("tradeName")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="27ABCDE1234F1Z5"
                    {...register("gstin", { required: "GSTIN is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  {...register("address1", { required: "Address is required" })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    {...register("location", { required: "City is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    {...register("pincode", { required: "Pincode is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
                  <select
                    {...register("state", { required: true })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    {...register("phone", { required: "Phone is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                  {errors.phone && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="accounts@company.in"
                    {...register("email", { required: "Email is required" })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                  />
                  {errors.email && (
                    <p className="text-xs text-rose-600 mt-0.5">{errors.email.message}</p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                The state set here decides CGST/SGST versus IGST on every invoice this company
                issues.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
