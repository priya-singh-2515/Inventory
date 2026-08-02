"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Party, PartyType } from "@/lib/types/common";

interface PartySelectProps {
  partyType: PartyType;
  /** Called with the chosen party, or null when cleared for manual entry. */
  onSelect: (party: Party | null) => void;
  label?: string;
}

/**
 * Picks a saved customer/supplier and fills the address block from it.
 *
 * This is the fix for a real correctness risk: the state field decides whether
 * GST is charged as CGST + SGST or as IGST, and typing it by hand on every
 * invoice means a typo silently produces the wrong tax treatment on a filed
 * document. Selecting a saved party copies the state that was verified once.
 */
export function PartySelect({ partyType, onSelect, label }: PartySelectProps) {
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/parties?all=true&partyType=${partyType}`);
        if (res.ok && !cancelled) {
          const payload = await res.json();
          setParties(payload.data ?? payload);
        }
      } catch (e) {
        console.error("Failed to load parties", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [partyType]);

  function handleChange(id: string) {
    setSelectedId(id);
    onSelect(parties.find((p) => p._id === id) ?? null);
  }

  const noun = partyType === "Supplier" ? "supplier" : "customer";

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1">
        {label ?? `Saved ${noun}`}
      </label>
      <select
        value={selectedId}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        aria-label={`Select a saved ${noun}`}
        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm disabled:text-slate-400"
      >
        <option value="">
          {loading ? "Loading…" : `— Type ${noun} details manually —`}
        </option>
        {parties.map((party) => (
          <option key={party._id} value={party._id}>
            {party.name}
            {party.state ? ` · ${party.state}` : ""}
            {party.gstin ? ` · ${party.gstin}` : ""}
          </option>
        ))}
      </select>
      <p className="text-[11px] text-slate-400 mt-1">
        {parties.length === 0 && !loading ? (
          <>
            No saved {noun}s yet —{" "}
            <Link href="/parties" className="text-[#0b2641] font-semibold hover:underline">
              add one
            </Link>{" "}
            to stop retyping GSTIN and state.
          </>
        ) : (
          <>Selecting a {noun} fills their address, GSTIN and state — the state sets the GST split.</>
        )}
      </p>
    </div>
  );
}
