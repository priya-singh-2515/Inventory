"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save, Hash, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useCompanySession } from "@/hooks/useCompanySession";

interface InvoicePrefsForm {
  invoicePrefix: string;
  purchasePrefix: string;
  creditNotePrefix: string;
  debitNotePrefix: string;
  defaultPaymentTerms: string;
  defaultNotes: string;
}

const SERIES = [
  { field: "invoicePrefix" as const, label: "Sales Invoice", fallback: "INV" },
  { field: "purchasePrefix" as const, label: "Purchase Bill", fallback: "PUR" },
  { field: "creditNotePrefix" as const, label: "Credit Note", fallback: "CN" },
  { field: "debitNotePrefix" as const, label: "Debit Note", fallback: "DN" },
];

export default function InvoiceSettingsPage() {
  const { canManage, loading: sessionLoading } = useCompanySession();
  const readOnly = !sessionLoading && !canManage("settings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch } = useForm<InvoicePrefsForm>({
    defaultValues: {
      invoicePrefix: "INV",
      purchasePrefix: "PUR",
      creditNotePrefix: "CN",
      debitNotePrefix: "DN",
      defaultPaymentTerms: "",
      defaultNotes: "",
    },
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/company");
        if (res.ok) {
          const company = await res.json();
          reset({
            invoicePrefix: company.invoicePrefix || "INV",
            purchasePrefix: company.purchasePrefix || "PUR",
            creditNotePrefix: company.creditNotePrefix || "CN",
            debitNotePrefix: company.debitNotePrefix || "DN",
            defaultPaymentTerms: company.defaultPaymentTerms || "",
            defaultNotes: company.defaultNotes || "",
          });
        }
      } catch (e) {
        console.error("Failed to load invoice settings", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reset]);

  async function onSubmit(data: InvoicePrefsForm) {
    setSaving(true);
    const toastId = toast.loading("Saving invoice preferences...");
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Invoice preferences saved", { id: toastId });
      } else {
        const err = await res.json();
        toast.error(err.error || "Could not save", { id: toastId });
      }
    } catch {
      toast.error("Network error occurred", { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading preferences...
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm disabled:bg-slate-100 disabled:text-slate-500";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Invoice Preferences</h1>
          <p className="text-sm text-slate-500">
            Document numbering and the defaults that appear on new invoices
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#0b2641]">
            <Hash className="w-4 h-4" />
            <h2 className="font-bold text-base">Document Numbering</h2>
          </div>
          <p className="text-xs text-slate-500">
            Each company runs its own series. Changing a prefix affects only future documents —
            numbers already issued are never rewritten.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERIES.map(({ field, label, fallback }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    {...register(field)}
                    disabled={readOnly}
                    placeholder={fallback}
                    className={`${inputClass} font-mono uppercase w-28`}
                  />
                  <span className="text-xs text-slate-400 font-mono">
                    → {(watch(field) || fallback).toUpperCase()}-001
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-[#0b2641] text-base">Defaults on New Invoices</h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default payment terms
            </label>
            <input
              {...register("defaultPaymentTerms")}
              disabled={readOnly}
              placeholder="e.g. Net 30 days from invoice date"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default notes / footer
            </label>
            <textarea
              {...register("defaultNotes")}
              disabled={readOnly}
              rows={3}
              placeholder="e.g. Goods once sold will not be taken back."
              className={inputClass}
            />
          </div>
        </div>

        {!readOnly && (
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save preferences"}
          </button>
        )}
      </form>
    </div>
  );
}
