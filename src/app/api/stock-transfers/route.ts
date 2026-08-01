import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StockTransferModel, ItemModel, StockLedgerModel } from "@/lib/models";
import { getNextCounterValue } from "@/lib/utils/counter-utils";

export async function GET() {
  try {
    await connectToDatabase();
    const transfers = await StockTransferModel.find().sort({ createdAt: -1 });
    return NextResponse.json(transfers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    let transferNo = body.transferNo;
    if (!transferNo) {
      transferNo = await getNextCounterValue("stock-transfer", "TRN");
    }

    const transfer = await StockTransferModel.create({
      ...body,
      transferNo,
      status: "Completed",
    });

    for (const item of body.items) {
      const dbItem = await ItemModel.findById(item.itemId);
      if (dbItem && dbItem.type === "Product") {
        // Transfer out from Source Godown
        await StockLedgerModel.create({
          date: body.date ? new Date(body.date) : new Date(),
          itemId: dbItem._id,
          itemName: dbItem.name,
          transactionType: "Godown Transfer Out",
          referenceId: transfer.transferNo,
          godown: body.sourceGodown,
          batch: item.batch,
          qtyIn: 0,
          qtyOut: item.qty,
          balanceStock: dbItem.stock,
          rate: dbItem.sellingRate,
          narration: `Transferred to ${body.destinationGodown}`,
        });

        // Transfer in to Destination Godown
        await StockLedgerModel.create({
          date: body.date ? new Date(body.date) : new Date(),
          itemId: dbItem._id,
          itemName: dbItem.name,
          transactionType: "Godown Transfer In",
          referenceId: transfer.transferNo,
          godown: body.destinationGodown,
          batch: item.batch,
          qtyIn: item.qty,
          qtyOut: 0,
          balanceStock: dbItem.stock,
          rate: dbItem.sellingRate,
          narration: `Transferred from ${body.sourceGodown}`,
        });
      }
    }

    return NextResponse.json(transfer, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
