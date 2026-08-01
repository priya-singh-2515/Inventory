import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DebitNoteModel, ItemModel } from "@/lib/models";
import { getNextCounter } from "@/lib/utils/counter-utils";
import { processStockMovement } from "@/lib/services/stock-engine-service";

export async function GET() {
  try {
    await connectToDatabase();
    const debitNotes = await DebitNoteModel.find().sort({ createdAt: -1 });
    return NextResponse.json(debitNotes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const seq = await getNextCounter("debit_note");
    const debitNoteNo = body.debitNoteNo || `DN-${String(seq).padStart(4, "0")}`;

    const debitNote = await DebitNoteModel.create({
      ...body,
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
