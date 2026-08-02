import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { paginate, readPageRequest } from "@/lib/pagination";
import { StockLedgerModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get("itemId");
    const transactionType = searchParams.get("transactionType");

    const query: any = { companyId };
    if (itemId) query.itemId = itemId;
    if (transactionType) query.transactionType = transactionType;

    const page = readPageRequest(req);
    const result = await paginate(StockLedgerModel, query, page);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
