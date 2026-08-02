"use client";

import { UNIT_OPTIONS } from "@/lib/constants";

interface UnitSelectProps {
  value: string;
  onChange: (unit: string) => void;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

/**
 * Unit-of-measure picker backed by the GST standard UoM codes.
 *
 * Records created before this existed hold free-text units ("pcs", "Pcs", ...)
 * that are not in the code list. Those are preserved as an extra option rather
 * than silently rewritten to the first entry when the row renders.
 */
export function UnitSelect({ value, onChange, className, id, ...rest }: UnitSelectProps) {
  const isKnown = UNIT_OPTIONS.some((option) => option.code === value);

  return (
    <select
      id={id}
      aria-label={rest["aria-label"] ?? "Unit of measure"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
    >
      {!isKnown && value && (
        <option value={value}>{value} (non-standard)</option>
      )}
      {UNIT_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.code} — {option.label}
        </option>
      ))}
    </select>
  );
}
