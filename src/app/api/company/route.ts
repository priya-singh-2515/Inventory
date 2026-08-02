import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyModel } from "@/lib/models";

/**
 * The profile of the company the user is currently acting in.
 *
 * Creating companies lives at /api/companies — this endpoint no longer
 * self-seeds a default record, because "the one company" no longer exists.
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "settings", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const company = await CompanyModel.findOne({ _id: companyId });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "settings", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId, userId } = ctx.context;

    const body = await req.json();
    // Ownership and identity are server-owned, never taken from the payload.
    delete body._id;
    delete body.ownerId;

    const company = await CompanyModel.findOneAndUpdate(
      { _id: companyId, ownerId: userId },
      body,
      { new: true }
    );
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json(company);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
