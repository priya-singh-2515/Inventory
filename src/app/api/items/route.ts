import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { MAX_PAGE_SIZE, readPageRequest, searchFilter } from "@/lib/pagination";
import { ItemModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const page = readPageRequest(req);
    const { searchParams } = new URL(req.url);
    // The item picker on the invoice forms needs the whole master list;
    // the item master screen pages through it.
    const wantsAll = searchParams.get("all") === "true";

    const filter = {
      companyId,
      ...searchFilter(page.search, ["name", "sku", "category"]),
    };

    if (wantsAll) {
      const items = await ItemModel.find(filter).sort({ name: 1 }).limit(MAX_PAGE_SIZE).lean();
      return NextResponse.json({ data: items, hasMore: false, nextCursor: null, limit: items.length });
    }

    // Items sort by name, so the cursor is the last name seen rather than _id.
    const after = searchParams.get("after");
    const rows = await ItemModel.find({ ...filter, ...(after ? { name: { $gt: after } } : {}) })
      .sort({ name: 1 })
      .limit(page.limit + 1)
      .lean();

    const hasMore = rows.length > page.limit;
    const data = hasMore ? rows.slice(0, page.limit) : rows;
    return NextResponse.json({
      data,
      hasMore,
      nextCursor: hasMore && data.length ? String(data[data.length - 1].name) : null,
      limit: page.limit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "inventory", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();
    const minStock = Number(body.minStock) || 0;
    const stock = Number(body.stock) || 0;
    const isLowStock = minStock > 0 ? stock <= minStock : false;

    const item = await ItemModel.create({
      companyId,
      ...body,
      isLowStock,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
