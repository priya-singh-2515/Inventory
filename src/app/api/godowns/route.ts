import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { GodownModel } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    const godowns = await GodownModel.find().sort({ name: 1 });
    return NextResponse.json(godowns);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const godown = await GodownModel.create(body);
    return NextResponse.json(godown, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
