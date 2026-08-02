import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { InvoiceModel } from "@/lib/models";
import { revertStockMovement } from "@/lib/services/stock-engine-service";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "sales", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const invoice = await InvoiceModel.findOne({ _id: id, companyId });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }
    return NextResponse.json(invoice);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "sales", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const body = await req.json();

    const updated = await InvoiceModel.findOneAndUpdate({ _id: id, companyId }, body, { new: true });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "sales", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const invoice = await InvoiceModel.findOne({ _id: id, companyId });
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Mark status Cancelled and revert stock movements
    invoice.status = "Cancelled";
    await invoice.save();

    await revertStockMovement(companyId, invoice.invoiceNumber, "Sales Invoice");

    return NextResponse.json({ message: "Invoice cancelled and stock reverted successfully", invoice });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
