import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CreditNoteModel, ItemModel } from "@/lib/models";
import { getNextCounter } from "@/lib/utils/counter-utils";
import { processStockMovement } from "@/lib/services/stock-engine-service";

export async function GET() {
  try {
    await connectToDatabase();
    const creditNotes = await CreditNoteModel.find().sort({ createdAt: -1 });
    return NextResponse.json(creditNotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const seq = await getNextCounter("credit_note");
    const creditNoteNo = body.creditNoteNo || `CN-${String(seq).padStart(4, "0")}`;

    const creditNote = await CreditNoteModel.create({
      ...body,
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
