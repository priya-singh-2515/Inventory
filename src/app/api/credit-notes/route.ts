import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { paginate, readPageRequest, searchFilter } from "@/lib/pagination";
import { CreditNoteModel, ItemModel } from "@/lib/models";
import { getNextCounterValue } from "@/lib/utils/counter-utils";
import { processStockMovement } from "@/lib/services/stock-engine-service";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "notes", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const page = readPageRequest(req);
    const result = await paginate(CreditNoteModel, {
      companyId,
      ...searchFilter(page.search, ["creditNoteNo", "invoiceNumber", "partyName"]),
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

    let creditNoteNo = body.creditNoteNo;
    if (!creditNoteNo) {
      creditNoteNo = await getNextCounterValue(companyId, "credit-note", "CN");
    }

    const creditNote = await CreditNoteModel.create({
      ...body,
      companyId,
      creditNoteNo,
      status: "Completed",
    });

    // Revert items stock back into inventory (qtyIn)
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
              transactionType: "Credit Note",
              referenceId: creditNoteNo,
              qtyIn: Number(lineItem.qty) || 0,
              qtyOut: 0,
              godown: lineItem.godown,
              batch: lineItem.batch,
              rate: lineItem.rate,
              narration: `Sales Return via Credit Note ${creditNoteNo}`,
              date: body.date,
            });
          }
        }
      }
    }

    return NextResponse.json(creditNote, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
