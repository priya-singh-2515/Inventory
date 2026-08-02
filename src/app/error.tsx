"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, ArrowLeft } from "lucide-react";

/**
 * Route-level error boundary.
 *
 * Without this a render error drops the user on the bare Next.js error screen
 * with no way to retry or navigate — the worst kind of dead end, because the
 * rest of the app is still perfectly usable.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled page error", error);
  }, [error]);

  return (
    <div className="max-w-lg mx-auto py-16 text-center space-y-6">
      <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-6 h-6 text-rose-500" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Something went wrong</h1>
        <p className="text-sm text-slate-500 mt-1">
          This screen failed to load. Your data is unaffected — nothing was saved or changed.
        </p>
      </div>

      {error.digest && (
        <p className="text-[11px] font-mono text-slate-400">Reference: {error.digest}</p>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
        >
          <RotateCw className="w-4 h-4" /> Try again
        </button>
        <Link
          href="/inventory"
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to inventory
        </Link>
      </div>
    </div>
  );
}
