/** Formats a number as Indian-grouped rupees, e.g. 125000 -> "₹1,25,000.00". */
export function formatInr(value: number | undefined | null): string {
  const amount = Number(value) || 0;
  return `₹${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Whether a supply is intra-state, and therefore split into CGST + SGST rather
 * than charged as IGST. Mirrors the comparison in `invoice-calculator`.
 */
export function isIntraState(partyState?: string, companyState?: string): boolean {
  if (!partyState || !companyState) return false;
  return partyState.trim().toLowerCase() === companyState.trim().toLowerCase();
}
