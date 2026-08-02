"use client";

import Link from "next/link";
import { Plus, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Primary way forward — a route to navigate to, or a handler to run. */
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  /** Set when the user's role cannot create anything here. */
  disabledReason?: string;
}

/**
 * An empty list with no next step is a dead end: the user cannot tell whether
 * the screen is broken, filtered, or genuinely empty. This states which, and
 * offers the action that fills it.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  disabledReason,
}: EmptyStateProps) {
  const buttonClass =
    "inline-flex items-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors";

  return (
    <div className="py-12 px-6 text-center">
      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">{description}</p>

      {disabledReason ? (
        <p className="text-[11px] text-amber-700 mt-3">{disabledReason}</p>
      ) : (
        actionLabel &&
        (actionHref ? (
          <Link href={actionHref} className={`${buttonClass} mt-4`}>
            <Plus className="w-3.5 h-3.5" /> {actionLabel}
          </Link>
        ) : (
          <button type="button" onClick={onAction} className={`${buttonClass} mt-4`}>
            <Plus className="w-3.5 h-3.5" /> {actionLabel}
          </button>
        ))
      )}
    </div>
  );
}
