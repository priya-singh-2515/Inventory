import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { GodownModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "masters", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const godowns = await GodownModel.find({ companyId }).sort({ name: 1 });
    return NextResponse.json(godowns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "masters", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();
    const godown = await GodownModel.create({ ...body, companyId });
    return NextResponse.json(godown, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
