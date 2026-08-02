import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { StockAdjustmentModel, ItemModel } from "@/lib/models";
import { processStockMovement } from "@/lib/services/stock-engine-service";
import { getNextCounterValue } from "@/lib/utils/counter-utils";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const adjustments = await StockAdjustmentModel.find({ companyId }).sort({ createdAt: -1 });
    return NextResponse.json(adjustments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();

    let adjustmentNo = body.adjustmentNo;
    if (!adjustmentNo) {
      adjustmentNo = await getNextCounterValue(companyId, "stock-adjustment", "ADJ");
    }

    const adjustment = await StockAdjustmentModel.create({
      ...body,
      companyId,
      adjustmentNo,
      status: "Completed",
    });

    const isStockIn = body.type === "Stock In";
    const transactionType = isStockIn ? "Stock In Adjustment" : "Stock Out Adjustment";

    for (const item of body.items) {
      const dbItem = await ItemModel.findOne({ _id: item.itemId, companyId });
      if (dbItem && dbItem.type === "Product") {
        await processStockMovement({
          companyId,
          itemId: dbItem._id.toString(),
          itemName: dbItem.name,
          transactionType,
          referenceId: adjustment.adjustmentNo,
          qtyIn: isStockIn ? item.qty : 0,
          qtyOut: isStockIn ? 0 : item.qty,
          godown: body.godown || dbItem.location,
          batch: item.batch,
          rate: item.rate || dbItem.sellingRate,
          date: body.date,
          narration: `${body.reason}: ${body.narration || ""}`,
        });
      }
    }

    return NextResponse.json(adjustment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
