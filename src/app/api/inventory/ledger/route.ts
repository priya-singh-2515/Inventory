import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { StockLedgerModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const transactionType = searchParams.get("transactionType");

    const query: any = {};
    if (itemId) query.itemId = itemId;
    if (transactionType) query.transactionType = transactionType;

    const ledgers = await StockLedgerModel.find(query).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(ledgers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
