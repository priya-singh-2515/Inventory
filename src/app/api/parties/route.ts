import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { PartyModel } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    const parties = await PartyModel.find().sort({ name: 1 });
    return NextResponse.json(parties);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const party = await PartyModel.create(body);
    return NextResponse.json(party, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
