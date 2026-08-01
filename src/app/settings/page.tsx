"use client";

import { useEffect } from "react";
import { Building, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { INDIAN_STATES } from "@/lib/constants";

interface CompanySettingsFormInput {
  gstin: string;
  legalName: string;
  tradeName: string;
  address1: string;
  location: string;
  pincode: number;
  stateCode: string;
  state: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
}

export default function SettingsPage() {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompanySettingsFormInput>({
    defaultValues: {
      gstin: "27AAACG0000A1Z5",
      legalName: "Acme Enterprises India Pvt Ltd",
      tradeName: "Acme Store",
      address1: "Unit 101, Business Park",
      location: "Mumbai",
      pincode: 400001,
      stateCode: "27",
      state: "Maharashtra",
      phone: "9876543210",
      email: "info@acmestore.in",
      bankName: "HDFC Bank",
      bankAccountNo: "50200012345678",
      bankIfsc: "HDFC0000123",
      bankBranch: "Fort Mumbai",
    },
  });

  useEffect(() => {
    async function loadCompany() {
      try {
        const res = await fetch("/api/company");
        if (res.ok) {
          const data = await res.json();
          if (data) reset(data);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadCompany();
  }, [reset]);

  async function onSubmit(formData: CompanySettingsFormInput) {
    const toastId = toast.loading("Saving company profile settings...");
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success("Company settings saved successfully!", { id: toastId });
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save settings", { id: toastId });
      }
    } catch {
      toast.error("Network error occurred", { id: toastId });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Company Settings</h1>
        <p className="text-sm text-slate-500">Configure Indian GST registration details, business address & bank accounts</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#0b2641]">
            <Building className="w-5 h-5" />
            <h3 className="font-bold text-base">GST Business Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company GSTIN *</label>
              <input
                type="text"
                placeholder="27AAACG0000A1Z5"
                {...register("gstin", { required: "GSTIN is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono uppercase"
              />
              {errors.gstin && <p className="text-xs text-rose-600 mt-0.5">{errors.gstin.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Name *</label>
              <input
                type="text"
                placeholder="Legal Business Name"
                {...register("legalName", { required: "Legal name is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.legalName && <p className="text-xs text-rose-600 mt-0.5">{errors.legalName.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Trade Name *</label>
              <input
                type="text"
                placeholder="Trade / Brand Name"
                {...register("tradeName", { required: "Trade name is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.tradeName && <p className="text-xs text-rose-600 mt-0.5">{errors.tradeName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Address *</label>
              <input
                type="text"
                placeholder="Building, street address"
                {...register("address1", { required: "Address is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.address1 && <p className="text-xs text-rose-600 mt-0.5">{errors.address1.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">State *</label>
              <select
                {...register("state", {
                  required: "State is required",
                  onChange: (e) => {
                    const selectedState = INDIAN_STATES.find((s) => s.name === e.target.value);
                    if (selectedState) setValue("stateCode", selectedState.code);
                  },
                })}
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
                type="number"
                {...register("pincode", { valueAsNumber: true, required: "Pincode is required" })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
              {errors.pincode && <p className="text-xs text-rose-600 mt-0.5">{errors.pincode.message}</p>}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-[#0b2641] text-base">Bank Account Information (Displayed on Invoices)</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
              <input
                type="text"
                placeholder="Bank Name"
                {...register("bankName")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Number</label>
              <input
                type="text"
                placeholder="Account No"
                {...register("bankAccountNo")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
              <input
                type="text"
                placeholder="HDFC0000123"
                {...register("bankIfsc")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
              <input
                type="text"
                placeholder="Branch name"
                {...register("bankBranch")}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="ml-auto flex items-center gap-2 px-6 py-3 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Company Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
