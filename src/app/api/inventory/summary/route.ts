import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const items = await ItemModel.find({ companyId, type: "Product" });

    const totalItemsCount = items.length;
    let lowStockItemsCount = 0;
    let totalStockQuantity = 0;
    let totalValueAtCost = 0;
    let totalValueAtSelling = 0;

    for (const item of items) {
      const stock = Number(item.stock) || 0;
      const minStock = Number(item.minStock) || 0;
      const purchaseRate = Number(item.purchaseRate) || Number(item.sellingRate) || 0;
      const sellingRate = Number(item.sellingRate) || 0;

      if (minStock > 0 && stock <= minStock) {
        lowStockItemsCount++;
      }

      totalStockQuantity += stock;
      totalValueAtCost += stock * purchaseRate;
      totalValueAtSelling += stock * sellingRate;
    }

    return NextResponse.json({
      totalItemsCount,
      lowStockItemsCount,
      totalStockQuantity,
      totalValueAtCost: Number(totalValueAtCost.toFixed(2)),
      totalValueAtSelling: Number(totalValueAtSelling.toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
