import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";

/**
 * Replaces the bare Next.js 404, which offers no way back into the app.
 */
export default function NotFound() {
  const destinations = [
    { href: "/inventory", label: "Inventory Master" },
    { href: "/sales", label: "Sales Invoices" },
    { href: "/purchases", label: "Purchase Bills" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-6">
      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto">
        <Compass className="w-6 h-6 text-slate-400" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Page not found</h1>
        <p className="text-sm text-slate-500 mt-1">
          That address does not exist. It may have been removed, or the link may be out of date.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 text-left">
        {destinations.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group"
          >
            <span className="text-sm font-medium text-slate-700">{d.label}</span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#0b2641] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
