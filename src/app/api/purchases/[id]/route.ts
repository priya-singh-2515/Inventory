import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PurchaseInvoiceModel } from "@/lib/models";
import { revertStockMovement } from "@/lib/services/stock-engine-service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const purchase = await PurchaseInvoiceModel.findById(id);
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
    const { id } = await params;
    const purchase = await PurchaseInvoiceModel.findById(id);
    if (!purchase) {
      return NextResponse.json({ error: "Purchase invoice not found" }, { status: 404 });
    }

    purchase.status = "Cancelled";
    await purchase.save();

    await revertStockMovement(purchase.purchaseInvoiceNumber, "Purchase Invoice");

    return NextResponse.json({ message: "Purchase invoice cancelled and stock reverted", purchase });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
