import type { jsPDF } from "jspdf";
import { Invoice, InvoiceItem } from "@/lib/types/invoice";
import { CompanyDetails } from "@/lib/types/settings";
import { isIntraState } from "@/lib/utils/invoice-format";

/*
 * The invoice PDF is drawn with jsPDF's vector text API rather than by
 * rasterising the page.
 *
 * html2canvas (the usual screenshot approach) cannot parse the `lab()` /
 * `oklch()` colours Tailwind 4 emits and throws outright; it has had no release
 * since 2022. Drawing directly also gives selectable, searchable text, a file
 * measured in kilobytes rather than megabytes, and output that stays crisp when
 * printed — all of which matter for a document that gets filed and sent on.
 *
 * Note: the built-in Helvetica font has no rupee glyph, so amounts are written
 * as plain numbers under an "All amounts in INR" note.
 */

const PAGE_WIDTH = 210;
const MARGIN = 12;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_HEIGHT = 297;
const BOTTOM_LIMIT = PAGE_HEIGHT - 25;

interface Column {
  key: string;
  header: string;
  width: number;
  align: "left" | "right";
}

const INTRA_STATE_COLUMNS: Column[] = [
  { key: "index", header: "#", width: 7, align: "left" },
  { key: "name", header: "Description", width: 44, align: "left" },
  { key: "hsn", header: "HSN/SAC", width: 18, align: "left" },
  { key: "qty", header: "Qty", width: 16, align: "right" },
  { key: "rate", header: "Rate", width: 20, align: "right" },
  { key: "taxable", header: "Taxable", width: 22, align: "right" },
  { key: "cgst", header: "CGST", width: 18, align: "right" },
  { key: "sgst", header: "SGST", width: 18, align: "right" },
  { key: "amount", header: "Amount", width: 23, align: "right" },
];

const INTER_STATE_COLUMNS: Column[] = [
  { key: "index", header: "#", width: 7, align: "left" },
  { key: "name", header: "Description", width: 52, align: "left" },
  { key: "hsn", header: "HSN/SAC", width: 20, align: "left" },
  { key: "qty", header: "Qty", width: 18, align: "right" },
  { key: "rate", header: "Rate", width: 22, align: "right" },
  { key: "taxable", header: "Taxable", width: 25, align: "right" },
  { key: "igst", header: "IGST", width: 20, align: "right" },
  { key: "amount", header: "Amount", width: 22, align: "right" },
];

/** Plain-number money formatting — no glyph the core fonts cannot render. */
function money(value: number | undefined | null): string {
  return (Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function lineTax(line: InvoiceItem) {
  const taxable = Number(line.taxableAmount) || 0;
  const cgst = (taxable * (Number(line.cgstRate) || 0)) / 100;
  const sgst = (taxable * (Number(line.sgstRate) || 0)) / 100;
  const igst = (taxable * (Number(line.igstRate) || 0)) / 100;
  return { taxable, cgst, sgst, igst, total: taxable + cgst + sgst + igst };
}

function drawHeader(
  doc: jsPDF,
  invoice: Invoice,
  company: CompanyDetails | null,
  intraState: boolean
): number {
  let y = MARGIN + 4;

  doc.setFont("helvetica", "bold").setFontSize(14).setTextColor(11, 38, 65);
  doc.text(company?.tradeName || company?.legalName || "Your Company", MARGIN, y);

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(80, 90, 105);
  const companyLines = company
    ? [
        company.address1,
        company.address2,
        `${company.location} - ${company.pincode}, ${company.state}`,
        `GSTIN: ${company.gstin}`,
        `${company.phone}  |  ${company.email}`,
      ].filter((entry): entry is string => Boolean(entry))
    : [];
  companyLines.forEach((entry, index) => doc.text(entry, MARGIN, y + 5 + index * 4));

  // Right-hand invoice meta
  const right = PAGE_WIDTH - MARGIN;
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(140, 150, 165);
  doc.text("TAX INVOICE", right, y - 4, { align: "right" });

  doc.setFontSize(13).setTextColor(11, 38, 65);
  doc.text(invoice.invoiceNumber, right, y + 2, { align: "right" });

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(80, 90, 105);
  const meta = [
    `Date: ${invoice.date}`,
    invoice.dueDate ? `Due: ${invoice.dueDate}` : null,
    `Supply: ${intraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)"}`,
    invoice.status === "Cancelled" ? "STATUS: CANCELLED" : null,
  ].filter((entry): entry is string => Boolean(entry));
  meta.forEach((entry, index) => doc.text(entry, right, y + 8 + index * 4, { align: "right" }));

  y += Math.max(companyLines.length * 4 + 8, meta.length * 4 + 10);

  doc.setDrawColor(215, 222, 230).line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 6;
}

function drawParties(doc: jsPDF, invoice: Invoice, startY: number): number {
  let y = startY;
  const columnWidth = CONTENT_WIDTH / 2;

  doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(140, 150, 165);
  doc.text("BILL TO", MARGIN, y);
  if (invoice.shipToName) doc.text("SHIP TO", MARGIN + columnWidth, y);

  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(30, 41, 59);
  doc.text(invoice.partyName, MARGIN, y + 5);
  if (invoice.shipToName) doc.text(invoice.shipToName, MARGIN + columnWidth, y + 5);

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(80, 90, 105);
  const billTo = [
    invoice.partyAddress,
    `${invoice.partyPlace ?? ""} ${invoice.partyPincode ? `- ${invoice.partyPincode}` : ""}, ${invoice.partyState}`,
    invoice.partyGstin ? `GSTIN: ${invoice.partyGstin}` : null,
    invoice.partyPhone,
  ].filter((entry): entry is string => Boolean(entry));

  const shipTo = invoice.shipToName
    ? [
        invoice.shipToAddress,
        `${invoice.shipToPlace ?? ""} ${invoice.shipToPincode ? `- ${invoice.shipToPincode}` : ""}${invoice.shipToState ? `, ${invoice.shipToState}` : ""}`,
        invoice.shipToGstin ? `GSTIN: ${invoice.shipToGstin}` : null,
      ].filter((entry): entry is string => Boolean(entry))
    : [];

  billTo.forEach((entry, index) => {
    doc.text(doc.splitTextToSize(entry, columnWidth - 6), MARGIN, y + 10 + index * 4);
  });
  shipTo.forEach((entry, index) => {
    doc.text(doc.splitTextToSize(entry, columnWidth - 6), MARGIN + columnWidth, y + 10 + index * 4);
  });

  y += 12 + Math.max(billTo.length, shipTo.length) * 4;
  doc.setDrawColor(215, 222, 230).line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  return y + 6;
}

function drawTableHeader(doc: jsPDF, columns: Column[], y: number): number {
  doc.setFillColor(244, 247, 250).rect(MARGIN, y - 4, CONTENT_WIDTH, 7, "F");
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(90, 100, 115);

  let x = MARGIN;
  columns.forEach((column) => {
    const isRight = column.align === "right";
    doc.text(column.header, isRight ? x + column.width - 1.5 : x + 1.5, y, {
      align: isRight ? "right" : "left",
    });
    x += column.width;
  });
  return y + 6;
}

function drawRows(
  doc: jsPDF,
  invoice: Invoice,
  columns: Column[],
  intraState: boolean,
  startY: number
): number {
  let y = startY;

  (invoice.items ?? []).forEach((line, index) => {
    if (y > BOTTOM_LIMIT) {
      doc.addPage();
      y = drawTableHeader(doc, columns, MARGIN + 8);
    }

    const tax = lineTax(line);
    const nameColumn = columns.find((column) => column.key === "name")!;
    const nameLines = doc.splitTextToSize(line.name, nameColumn.width - 3) as string[];

    const values: Record<string, string> = {
      index: String(index + 1),
      name: "",
      hsn: line.hsnCode || line.sacCode || "-",
      qty: `${line.qty} ${line.unit}`,
      rate: money(line.rate),
      taxable: money(tax.taxable),
      cgst: `${money(tax.cgst)} (${line.cgstRate}%)`,
      sgst: `${money(tax.sgst)} (${line.sgstRate}%)`,
      igst: `${money(tax.igst)} (${line.igstRate}%)`,
      amount: money(tax.total),
    };

    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(50, 60, 75);

    let x = MARGIN;
    columns.forEach((column) => {
      if (column.key === "name") {
        doc.text(nameLines, x + 1.5, y);
      } else {
        const isRight = column.align === "right";
        doc.text(values[column.key], isRight ? x + column.width - 1.5 : x + 1.5, y, {
          align: isRight ? "right" : "left",
        });
      }
      x += column.width;
    });

    y += Math.max(nameLines.length * 4, 5) + 2;
    doc.setDrawColor(235, 240, 245).line(MARGIN, y - 2.5, PAGE_WIDTH - MARGIN, y - 2.5);
  });

  void intraState;
  return y + 2;
}

function drawTotals(
  doc: jsPDF,
  invoice: Invoice,
  company: CompanyDetails | null,
  startY: number
): void {
  let y = startY;
  if (y > BOTTOM_LIMIT - 40) {
    doc.addPage();
    y = MARGIN + 10;
  }

  const boxLeft = PAGE_WIDTH - MARGIN - 62;
  const rows: Array<[string, string, boolean]> = [
    ["Taxable Value", money(invoice.totalTaxable), false],
    ["Total Tax", money(invoice.totalTax), false],
  ];
  if (invoice.roundOff) rows.push(["Round Off", money(invoice.roundOff), false]);
  rows.push(["Grand Total", money(invoice.totalAmount), true]);

  rows.forEach(([label, value, emphasis]) => {
    if (emphasis) {
      doc.setDrawColor(200, 210, 220).line(boxLeft, y - 3.5, PAGE_WIDTH - MARGIN, y - 3.5);
      doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(11, 38, 65);
    } else {
      doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(80, 90, 105);
    }
    doc.text(label, boxLeft, y);
    doc.text(value, PAGE_WIDTH - MARGIN, y, { align: "right" });
    y += emphasis ? 7 : 5;
  });

  // Bank details and terms sit alongside the totals block.
  let leftY = startY;
  doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(140, 150, 165);
  if (company?.bankName) {
    doc.text("BANK DETAILS", MARGIN, leftY);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(80, 90, 105);
    [
      company.bankName,
      `A/C: ${company.bankAccountNo ?? "-"}`,
      `IFSC: ${company.bankIfsc ?? "-"}`,
      company.bankBranch,
    ]
      .filter((entry): entry is string => Boolean(entry))
      .forEach((entry, index) => doc.text(entry, MARGIN, leftY + 5 + index * 4));
    leftY += 24;
  }

  if (invoice.term) {
    doc.setFont("helvetica", "bold").setFontSize(7).setTextColor(140, 150, 165);
    doc.text("TERMS", MARGIN, leftY);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(80, 90, 105);
    doc.text(doc.splitTextToSize(invoice.term, 90), MARGIN, leftY + 5);
    leftY += 14;
  }

  if (invoice.notesText) {
    doc.setFont("helvetica", "italic").setFontSize(8).setTextColor(110, 120, 135);
    doc.text(doc.splitTextToSize(invoice.notesText, 90), MARGIN, leftY + 3);
  }

  const footerY = Math.max(y, leftY) + 16;
  doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(150, 158, 170);
  doc.text("All amounts in INR. This is a computer-generated invoice.", MARGIN, footerY);
  doc.setDrawColor(200, 210, 220).line(PAGE_WIDTH - MARGIN - 48, footerY - 2, PAGE_WIDTH - MARGIN, footerY - 2);
  doc.setTextColor(80, 90, 105);
  doc.text("Authorised Signatory", PAGE_WIDTH - MARGIN, footerY + 2, { align: "right" });
}

/** Builds the invoice PDF and triggers a download. */
export async function downloadInvoicePdf(
  invoice: Invoice,
  company: CompanyDetails | null
): Promise<void> {
  // Loaded on demand — jsPDF is heavy and only needed on this action.
  const { jsPDF: JsPdf } = await import("jspdf");
  const doc = new JsPdf({ unit: "mm", format: "a4", orientation: "portrait" });

  const intraState = isIntraState(invoice.partyState, company?.state);
  const columns = intraState ? INTRA_STATE_COLUMNS : INTER_STATE_COLUMNS;

  if (invoice.status === "Cancelled") {
    doc.setFont("helvetica", "bold").setFontSize(40).setTextColor(240, 200, 200);
    doc.text("CANCELLED", PAGE_WIDTH / 2, 150, { align: "center", angle: 30 });
  }

  let y = drawHeader(doc, invoice, company, intraState);
  y = drawParties(doc, invoice, y);
  y = drawTableHeader(doc, columns, y);
  y = drawRows(doc, invoice, columns, intraState, y);
  drawTotals(doc, invoice, company, y + 4);

  doc.save(`${invoice.invoiceNumber || "invoice"}.pdf`);
}
