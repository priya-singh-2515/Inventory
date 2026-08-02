import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { PurchaseInvoiceModel } from "@/lib/models";
import { revertStockMovement } from "@/lib/services/stock-engine-service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "purchases", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const purchase = await PurchaseInvoiceModel.findOne({ _id: id, companyId });
    if (!purchase) {
      return NextResponse.json({ error: "Purchase invoice not found" }, { status: 404 });
    }
    return NextResponse.json(purchase);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "purchases", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const purchase = await PurchaseInvoiceModel.findOne({ _id: id, companyId });
    if (!purchase) {
      return NextResponse.json({ error: "Purchase invoice not found" }, { status: 404 });
    }

    purchase.status = "Cancelled";
    await purchase.save();

    await revertStockMovement(companyId, purchase.purchaseInvoiceNumber, "Purchase Invoice");

    return NextResponse.json({ message: "Purchase invoice cancelled and stock reverted", purchase });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
