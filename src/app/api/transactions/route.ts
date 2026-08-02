import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import {
  InvoiceModel,
  PurchaseInvoiceModel,
  CreditNoteModel,
  DebitNoteModel,
  StockAdjustmentModel,
  StockTransferModel,
} from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "reports", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const [invoices, purchases, creditNotes, debitNotes, adjustments, transfers] = await Promise.all([
      InvoiceModel.find({ companyId }).lean(),
      PurchaseInvoiceModel.find({ companyId }).lean(),
      CreditNoteModel.find({ companyId }).lean(),
      DebitNoteModel.find({ companyId }).lean(),
      StockAdjustmentModel.find({ companyId }).lean(),
      StockTransferModel.find({ companyId }).lean(),
    ]);

    const transactions = [
      ...invoices.map((i: any) => ({
        id: i._id,
        type: "Sales Invoice",
        voucherNo: i.invoiceNumber,
        date: i.date,
        partyName: i.partyName,
        amount: i.totalAmount,
        status: i.status || "Completed",
        createdAt: i.createdAt,
      })),
      ...purchases.map((p: any) => ({
        id: p._id,
        type: "Purchase Bill",
        voucherNo: p.supplierInvoiceNo || p.purchaseInvoiceNumber,
        date: p.date,
        partyName: p.supplierName,
        amount: p.totalAmount,
        status: p.status || "Completed",
        createdAt: p.createdAt,
      })),
      ...creditNotes.map((cn: any) => ({
        id: cn._id,
        type: "Credit Note",
        voucherNo: cn.creditNoteNo,
        date: cn.date,
        partyName: cn.partyName,
        amount: cn.totalAmount,
        status: cn.status || "Completed",
        createdAt: cn.createdAt,
      })),
      ...debitNotes.map((dn: any) => ({
        id: dn._id,
        type: "Debit Note",
        voucherNo: dn.debitNoteNo,
        date: dn.date,
        partyName: dn.partyName,
        amount: dn.totalAmount,
        status: dn.status || "Completed",
        createdAt: dn.createdAt,
      })),
      ...adjustments.map((adj: any) => ({
        id: adj._id,
        type: `Stock Adjustment (${adj.type})`,
        voucherNo: adj.adjustmentNo,
        date: adj.date,
        partyName: `Warehouse: ${adj.godown || "Main Warehouse"}`,
        amount: 0,
        status: adj.status || "Completed",
        createdAt: adj.createdAt,
      })),
      ...transfers.map((tr: any) => ({
        id: tr._id,
        type: "Stock Transfer",
        voucherNo: tr.transferNo,
        date: tr.date,
        partyName: `${tr.sourceGodown} → ${tr.destinationGodown}`,
        amount: 0,
        status: tr.status || "Completed",
        createdAt: tr.createdAt,
      })),
    ];

    transactions.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    return NextResponse.json(transactions);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
