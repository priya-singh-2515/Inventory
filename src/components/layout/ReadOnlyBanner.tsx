"use client";

import { Eye } from "lucide-react";
import { useCompanySession } from "@/hooks/useCompanySession";

/**
 * Standing notice for guest / view-only roles.
 *
 * Without it a viewer just finds buttons missing and assumes the app is broken;
 * this explains why, once, at the top of every page.
 */
export function ReadOnlyBanner() {
  const { session, isReadOnly } = useCompanySession();

  if (!isReadOnly || !session) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-2.5 px-4 py-2.5 mb-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 print:hidden"
    >
      <Eye className="w-4 h-4 shrink-0 text-amber-600" />
      <p className="text-xs">
        <span className="font-bold">{session.roleLabel}</span> — you are viewing{" "}
        <span className="font-semibold">{session.companyName}</span> in read-only mode. Ask an
        admin if you need to make changes.
      </p>
    </div>
  );
}
