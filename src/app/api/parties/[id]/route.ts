import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PartyModel } from "@/lib/models";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const party = await PartyModel.findByIdAndUpdate(id, body, { new: true });
    if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });
    return NextResponse.json(party);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await PartyModel.findByIdAndDelete(id);
    return NextResponse.json({ message: "Party deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
