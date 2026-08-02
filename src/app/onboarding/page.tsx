"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Boxes, Loader2, ArrowRight, Building2, Landmark, Check } from "lucide-react";
import toast from "react-hot-toast";
import { INDIAN_STATES } from "@/lib/constants";
import { GSTIN_REGEX, PINCODE_REGEX, PHONE_REGEX } from "@/common/regex";

interface OnboardingForm {
  legalName: string;
  tradeName: string;
  gstin: string;
  address1: string;
  location: string;
  pincode: string;
  state: string;
  phone: string;
  email: string;
  bankName: string;
  bankAccountNo: string;
  bankIfsc: string;
  bankBranch: string;
}

const STEPS = [
  { id: 1, label: "Business", icon: Building2 },
  { id: 2, label: "Bank", icon: Landmark },
] as const;

/**
 * First-run setup.
 *
 * A company must exist before any business screen works — it supplies the home
 * state the GST engine compares against and the tenancy key every document is
 * filed under. Without this screen a new account just hits NO_COMPANY errors.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(true);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<OnboardingForm>({
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
      bankName: "",
      bankAccountNo: "",
      bankIfsc: "",
      bankBranch: "",
    },
  });

  // Someone who already has a company should not see first-run setup again.
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const companies = await res.json();
          if (Array.isArray(companies) && companies.length > 0) {
            router.replace("/inventory");
            return;
          }
        }
      } catch {
        // Fall through and let them create one.
      } finally {
        setChecking(false);
      }
    }
    check();
  }, [router]);

  async function goToBankStep() {
    // Validate step 1 before advancing so errors surface on the right screen.
    const valid = await trigger([
      "legalName",
      "gstin",
      "address1",
      "location",
      "pincode",
      "state",
      "phone",
      "email",
    ]);
    if (valid) setStep(2);
  }

  async function onSubmit(data: OnboardingForm) {
    setSaving(true);
    const toastId = toast.loading("Creating your company...");
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          tradeName: data.tradeName.trim() || data.legalName.trim(),
          pincode: Number(data.pincode),
          stateCode:
            INDIAN_STATES.find((s) => s.name === data.state)?.code ?? "27",
        }),
      });
      const created = await res.json();

      if (!res.ok) {
        toast.error(created.error || "Could not create the company", { id: toastId });
        return;
      }

      // Make it the active company so the app opens straight into it.
      await fetch("/api/companies/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: created._id }),
      });

      toast.success(`${created.tradeName} is ready`, { id: toastId });
      router.push("/inventory");
      router.refresh();
    } catch {
      toast.error("Network error occurred", { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Checking your account...
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20 focus:border-[#0b2641] transition-colors";

  return (
    <div className="w-full max-w-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0b2641] flex items-center justify-center mb-4">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Set up your business</h1>
        <p className="text-sm text-slate-500 mt-1 text-center max-w-md">
          These details appear on every invoice you issue, and your state decides whether GST is
          charged as CGST + SGST or IGST.
        </p>
      </div>

      {/* Step rail */}
      <ol className="flex items-center justify-center gap-3 mb-6">
        {STEPS.map(({ id, label, icon: Icon }) => {
          const done = step > id;
          const active = step === id;
          return (
            <li key={id} className="flex items-center gap-2">
              <span
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? "bg-[#0b2641] text-white border-[#0b2641]"
                    : done
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                      : "bg-white text-slate-400 border-slate-200"
                }`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                {label}
              </span>
              {id !== STEPS.length && <span className="w-6 h-px bg-slate-200" />}
            </li>
          );
        })}
      </ol>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5"
      >
        {step === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Name *
                </label>
                <input
                  {...register("legalName", { required: "Legal name is required" })}
                  placeholder="Acme Enterprises India Pvt Ltd"
                  className={inputClass}
                />
                {errors.legalName && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.legalName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Trade Name
                </label>
                <input
                  {...register("tradeName")}
                  placeholder="Acme Store (defaults to legal name)"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN *</label>
                <input
                  {...register("gstin", {
                    required: "GSTIN is required",
                    pattern: { value: GSTIN_REGEX, message: "Invalid 15-character GSTIN" },
                  })}
                  placeholder="27ABCDE1234F1Z5"
                  className={`${inputClass} font-mono uppercase`}
                />
                {errors.gstin && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.gstin.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State *{" "}
                  <span className="font-normal text-slate-400">— decides the GST split</span>
                </label>
                <select {...register("state", { required: true })} className={inputClass}>
                  {INDIAN_STATES.map((s) => (
                    <option key={s.code} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Address *</label>
              <input
                {...register("address1", { required: "Address is required" })}
                placeholder="Unit 101, Business Park"
                className={inputClass}
              />
              {errors.address1 && (
                <p className="text-xs text-rose-600 mt-0.5">{errors.address1.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                <input
                  {...register("location", { required: "City is required" })}
                  placeholder="Mumbai"
                  className={inputClass}
                />
                {errors.location && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.location.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode *</label>
                <input
                  {...register("pincode", {
                    required: "Pincode is required",
                    pattern: { value: PINCODE_REGEX, message: "Pincode must be 6 digits" },
                  })}
                  placeholder="400001"
                  className={inputClass}
                />
                {errors.pincode && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.pincode.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                <input
                  {...register("phone", {
                    required: "Phone is required",
                    pattern: { value: PHONE_REGEX, message: "10 digits starting 6–9" },
                  })}
                  placeholder="9876543210"
                  className={inputClass}
                />
                {errors.phone && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  {...register("email", { required: "Email is required" })}
                  placeholder="accounts@company.in"
                  className={inputClass}
                />
                {errors.email && (
                  <p className="text-xs text-rose-600 mt-0.5">{errors.email.message}</p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={goToBankStep}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-slate-500">
              Bank details print on the invoice so customers know where to pay. You can skip this and
              add it later under Settings.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                <input {...register("bankName")} placeholder="HDFC Bank" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                <input {...register("bankBranch")} placeholder="Fort Mumbai" className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Number
                </label>
                <input
                  {...register("bankAccountNo")}
                  placeholder="50200012345678"
                  className={`${inputClass} font-mono`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC</label>
                <input
                  {...register("bankIfsc")}
                  placeholder="HDFC0000123"
                  className={`${inputClass} font-mono uppercase`}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {saving ? "Creating..." : "Create company"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
