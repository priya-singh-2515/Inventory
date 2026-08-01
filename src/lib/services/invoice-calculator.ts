import { InvoiceItem } from "@/lib/types/invoice";

export interface CalculationResult {
  items: InvoiceItem[];
  totalTaxable: number;
  totalTax: number;
  totalAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  roundOff: number;
  grandTotal: number;
}

export function calculateInvoiceTaxes(
  items: InvoiceItem[],
  partyState: string,
  companyState: string
): CalculationResult {
  const isIntraState =
    partyState.trim().toLowerCase() === companyState.trim().toLowerCase();

  let totalTaxable = 0;
  let totalTax = 0;
  let cgstTotal = 0;
  let sgstTotal = 0;
  let igstTotal = 0;

  const processedItems = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const discountPercent = Number(item.discountPercent) || 0;
    const taxRate = Number(item.taxRate) || 0;

    // Line total after item discount
    const grossLine = qty * rate;
    const discountAmount = (grossLine * discountPercent) / 100;
    const netLine = grossLine - discountAmount;

    let taxableAmount = 0;
    if (item.taxType === "Inclusive") {
      taxableAmount = netLine / (1 + taxRate / 100);
    } else {
      taxableAmount = netLine;
    }

    let itemCgstRate = 0;
    let itemSgstRate = 0;
    let itemIgstRate = 0;

    if (isIntraState) {
      itemCgstRate = taxRate / 2;
      itemSgstRate = taxRate / 2;
      itemIgstRate = 0;
    } else {
      itemCgstRate = 0;
      itemSgstRate = 0;
      itemIgstRate = taxRate;
    }

    const itemCgstAmount = (taxableAmount * itemCgstRate) / 100;
    const itemSgstAmount = (taxableAmount * itemSgstRate) / 100;
    const itemIgstAmount = (taxableAmount * itemIgstRate) / 100;

    cgstTotal += itemCgstAmount;
    sgstTotal += itemSgstAmount;
    igstTotal += itemIgstAmount;
    totalTaxable += taxableAmount;

    return {
      ...item,
      qty,
      rate,
      discountPercent,
      discountAmount: Number(discountAmount.toFixed(2)),
      taxableAmount: Number(taxableAmount.toFixed(2)),
      cgstRate: itemCgstRate,
      sgstRate: itemSgstRate,
      igstRate: itemIgstRate,
    };
  });

  totalTax = cgstTotal + sgstTotal + igstTotal;
  const rawTotal = totalTaxable + totalTax;
  const grandTotal = Math.round(rawTotal);
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  return {
    items: processedItems,
    totalTaxable: Number(totalTaxable.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    totalAmount: grandTotal,
    cgstTotal: Number(cgstTotal.toFixed(2)),
    sgstTotal: Number(sgstTotal.toFixed(2)),
    igstTotal: Number(igstTotal.toFixed(2)),
    roundOff,
    grandTotal,
  };
}
