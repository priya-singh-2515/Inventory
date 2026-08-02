"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Settings2 } from "lucide-react";
import toast from "react-hot-toast";
import { CompanyDetails } from "@/lib/types/settings";

/**
 * Switches which company's books the app is showing.
 *
 * The switch is a server call, not local state — the active company lives in an
 * httpOnly cookie that every API route re-validates, so the UI cannot put the
 * app into a company the user does not own.
 */
export function CompanySwitcher() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyDetails[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
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
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  async function switchTo(companyId: string) {
    if (companyId === activeId) {
      setIsOpen(false);
      return;
    }

    setSwitching(true);
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
      setActiveId(companyId);
      setIsOpen(false);
      // Every page's data belongs to the old company — reload it all.
      router.refresh();
      window.location.reload();
    } catch {
      toast.error("Network error occurred");
    } finally {
      setSwitching(false);
    }
  }

  const active = companies.find((c) => c._id === activeId);
  if (companies.length === 0) return null;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={switching}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-60 max-w-[220px]"
      >
        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 truncate">
          {active?.tradeName || active?.legalName || "Select company"}
        </span>
        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
        >
          <p className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Your companies
          </p>
          <ul className="max-h-72 overflow-y-auto py-1">
            {companies.map((company) => {
              const isActive = company._id === activeId;
              return (
                <li key={company._id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => switchTo(company._id!)}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-left transition-colors ${
                      isActive ? "bg-blue-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 mt-0.5 shrink-0 ${
                        isActive ? "text-blue-600" : "text-transparent"
                      }`}
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-slate-800 truncate">
                        {company.tradeName || company.legalName}
                      </span>
                      <span className="block text-[11px] text-slate-400 font-mono truncate">
                        {company.gstin || "No GSTIN"}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/companies"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 border-t border-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Settings2 className="w-4 h-4 text-slate-400" />
            Manage companies, export &amp; import
          </Link>
        </div>
      )}
    </div>
  );
}
