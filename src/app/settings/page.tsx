"use client";

import Link from "next/link";
import {
  Building,
  Users,
  Hash,
  Boxes,
  Database,
  ChevronRight,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { useCompanySession } from "@/hooks/useCompanySession";
import { ROLE_DEFINITIONS, type Feature } from "@/lib/permissions";

interface SettingCard {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Feature gate — the card is hidden when the role cannot even view it. */
  feature: Feature;
  /** Shown when the role can view but not change anything here. */
  readOnlyNote?: string;
}

const CARDS: SettingCard[] = [
  {
    href: "/settings/company",
    title: "Company Profile",
    description: "GST registration, business address and bank details that print on every invoice.",
    icon: Building,
    feature: "settings",
  },
  {
    href: "/settings/invoice",
    title: "Invoice Preferences",
    description: "Document numbering prefixes, default payment terms and invoice footer notes.",
    icon: Hash,
    feature: "settings",
  },
  {
    href: "/settings/team",
    title: "Team & Access",
    description: "Invite people, set roles, and revoke access. Includes read-only guest access.",
    icon: Users,
    feature: "members",
  },
  {
    href: "/companies",
    title: "Companies",
    description: "Switch between businesses, create another, or export and import a full company.",
    icon: Boxes,
    feature: "data",
  },
];

export default function SettingsPage() {
  const { session, canView, canManage, loading } = useCompanySession();

  const visible = CARDS.filter((card) => canView(card.feature));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Settings</h1>
        <p className="text-sm text-slate-500">
          Everything about this company, its documents and who can reach them
        </p>
      </div>

      {/* Current context — which company and what this role can do. */}
      {session && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-4">
          <div className="p-3 bg-slate-50 text-[#0b2641] rounded-lg border border-slate-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-[220px]">
            <p className="text-sm font-bold text-slate-800">{session.companyName}</p>
            <p className="text-xs text-slate-500">
              Signed in as {session.email} · <span className="font-semibold">{session.roleLabel}</span>
            </p>
          </div>
          <p className="text-xs text-slate-400 max-w-sm">
            {ROLE_DEFINITIONS[session.role]?.description}
          </p>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading settings...</div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
          <h2 className="text-lg font-bold text-[#0b2641]">Nothing to configure</h2>
          <p className="text-sm text-slate-500">
            Your role does not have access to any settings area.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((card) => {
            const Icon = card.icon;
            const viewOnly = !canManage(card.feature);

            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-start gap-4"
              >
                <div className="p-3 bg-slate-50 text-[#0b2641] rounded-lg border border-slate-200 group-hover:bg-[#0b2641] group-hover:text-white transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-800">{card.title}</h2>
                    {viewOnly && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200">
                        view only
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#0b2641] transition-colors mt-1" />
              </Link>
            );
          })}
        </div>
      )}

      {/* Masters that have an API but no dedicated screen yet — stated plainly
          rather than left as a mystery gap. */}
      <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 p-5">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-slate-700">Not built yet</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Party (customer &amp; supplier), godown and batch masters have working APIs but no
              screens — they are still typed as free text on the invoice forms. Journals, payments,
              receipts and delivery challans have schemas only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
