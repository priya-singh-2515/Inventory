import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { InvoiceModel, PurchaseInvoiceModel, CreditNoteModel, DebitNoteModel } from "@/lib/models";

/**
 * Document totals for the active company.
 *
 * Exists because the lists are paginated: counting the rows a page returned
 * would report the page size, not the real total. `countDocuments` on the
 * (companyId, _id) index stays fast as the collections grow.
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "reports", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const [sales, purchases, creditNotes, debitNotes] = await Promise.all([
      InvoiceModel.countDocuments({ companyId }),
      PurchaseInvoiceModel.countDocuments({ companyId }),
      CreditNoteModel.countDocuments({ companyId }),
      DebitNoteModel.countDocuments({ companyId }),
    ]);

    return NextResponse.json({ sales, purchases, creditNotes, debitNotes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
