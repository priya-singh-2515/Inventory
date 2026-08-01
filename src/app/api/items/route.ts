import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemModel } from "@/lib/models";

export async function GET() {
  try {
    await connectToDatabase();
    const items = await ItemModel.find().sort({ name: 1 });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const minStock = Number(body.minStock) || 0;
    const stock = Number(body.stock) || 0;
    const isLowStock = minStock > 0 ? stock <= minStock : false;

    const item = await ItemModel.create({
      ...body,
      isLowStock,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
