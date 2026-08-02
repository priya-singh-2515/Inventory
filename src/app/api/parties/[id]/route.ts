import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { PartyModel } from "@/lib/models";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "masters", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const { id } = await params;
    const party = await PartyModel.findOne({ _id: id, companyId });
    if (!party) {
      return NextResponse.json({ error: "Party not found" }, { status: 404 });
    }
    return NextResponse.json(party);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "masters", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    const body = await req.json();
    const party = await PartyModel.findOneAndUpdate({ _id: id, companyId }, body, { new: true });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    return NextResponse.json(party);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "masters", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const { id } = await params;
    await PartyModel.findOneAndDelete({ _id: id, companyId });
    return NextResponse.json({ message: "Party deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
