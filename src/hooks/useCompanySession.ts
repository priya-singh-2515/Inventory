"use client";

import { useEffect, useState } from "react";
import type { AccessLevel, Feature, PermissionMap, Role } from "@/lib/permissions";

export interface CompanySession {
  companyId: string;
  companyName: string;
  email: string;
  role: Role;
  roleLabel: string;
  roleDescription: string;
  isReadOnly: boolean;
  permissions: PermissionMap;
}

/**
 * The signed-in user's role in the active company.
 *
 * Use this to hide actions a role cannot perform. It is presentation only —
 * every API route re-checks the same permission server-side, so a stale or
 * tampered client can't gain access by rendering a button.
 */
export function useCompanySession() {
  const [session, setSession] = useState<CompanySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/companies/session");
        if (res.ok && !cancelled) setSession(await res.json());
      } catch (e) {
        console.error("Failed to load company session", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function level(feature: Feature): AccessLevel {
    return session?.permissions?.[feature] ?? "none";
  }

  return {
    session,
    loading,
    role: session?.role,
    isReadOnly: session?.isReadOnly ?? false,
    /** Can the user see this area at all? */
    canView: (feature: Feature) => level(feature) !== "none",
    /** Can the user change things in this area? */
    canManage: (feature: Feature) => level(feature) === "manage",
  };
}
