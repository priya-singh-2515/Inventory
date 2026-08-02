import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { MAX_PAGE_SIZE, readPageRequest, searchFilter } from "@/lib/pagination";
import { PartyModel } from "@/lib/models";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "masters", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const page = readPageRequest(req);
    const { searchParams } = new URL(req.url);
    // Narrowed rather than cast: an arbitrary ?partyType= value must not reach
    // the query, and the schema only knows these two.
    const requestedType = searchParams.get("partyType");
    const partyType =
      requestedType === "Customer" || requestedType === "Supplier" ? requestedType : null;
    // Invoice pickers want every customer at once; the master screen pages.
    const wantsAll = searchParams.get("all") === "true";

    const filter = {
      companyId,
      ...(partyType ? { partyType } : {}),
      ...searchFilter(page.search, ["name", "gstin", "city", "state"]),
    } as Record<string, unknown>;

    if (wantsAll) {
      const rows = await PartyModel.find(filter).sort({ name: 1 }).limit(MAX_PAGE_SIZE).lean();
      return NextResponse.json({ data: rows, hasMore: false, nextCursor: null, limit: rows.length });
    }

    // Parties sort by name, so the cursor is the last name seen.
    const after = searchParams.get("after");
    const rows = await PartyModel.find({ ...filter, ...(after ? { name: { $gt: after } } : {}) })
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
    const ctx = await requirePermission(req, "masters", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;
    const body = await req.json();
    const party = await PartyModel.create({ ...body, companyId });
    return NextResponse.json(party, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
