import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemModel } from "@/lib/models";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const item = await ItemModel.findOne({ _id: id, companyId });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const body = await req.json();

    const minStock = Number(body.minStock) || 0;
    const stock = Number(body.stock) || 0;
    body.isLowStock = minStock > 0 ? stock <= minStock : false;

    const item = await ItemModel.findOneAndUpdate({ _id: id, companyId }, body, { new: true });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    await ItemModel.findOneAndDelete({ _id: id, companyId });
    return NextResponse.json({ message: "Item deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
