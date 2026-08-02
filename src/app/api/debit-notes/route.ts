import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { paginate, readPageRequest, searchFilter } from "@/lib/pagination";
import { DebitNoteModel, ItemModel } from "@/lib/models";
import { getNextCounterValue } from "@/lib/utils/counter-utils";
import { processStockMovement } from "@/lib/services/stock-engine-service";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "notes", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const page = readPageRequest(req);
    const result = await paginate(DebitNoteModel, {
      companyId,
      ...searchFilter(page.search, ["debitNoteNo", "purchaseInvoiceNumber", "partyName"]),
    }, page);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "notes", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();

    let debitNoteNo = body.debitNoteNo;
    if (!debitNoteNo) {
      debitNoteNo = await getNextCounterValue(companyId, "debit-note", "DN");
    }

    const debitNote = await DebitNoteModel.create({
      ...body,
      companyId,
      debitNoteNo,
      status: "Completed",
    });

    // Revert items stock out of inventory (qtyOut)
    if (body.items && Array.isArray(body.items)) {
      for (const lineItem of body.items) {
        if (lineItem.type === "Product") {
          let itemRecord = null;
          if (lineItem.name) {
            itemRecord = await ItemModel.findOne({ name: lineItem.name });
          }
          if (itemRecord) {
            await processStockMovement({
              companyId,
              itemId: itemRecord._id.toString(),
              itemName: itemRecord.name,
              transactionType: "Debit Note",
              referenceId: debitNoteNo,
              qtyIn: 0,
              qtyOut: Number(lineItem.qty) || 0,
              godown: lineItem.godown,
              batch: lineItem.batch,
              rate: lineItem.rate,
              narration: `Purchase Return via Debit Note ${debitNoteNo}`,
              date: body.date,
            });
          }
        }
      }
    }

    return NextResponse.json(debitNote, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
