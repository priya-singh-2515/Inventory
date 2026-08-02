import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyModel, CompanyMemberModel } from "@/lib/models";

/**
 * The user's own companies. Unlike the business routes this does not go through
 * resolveCompanyContext — it is what you call when there is no active company
 * yet (fresh account, or after deleting the last one).
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Everything the user can act in, not just what they own — an invited
    // accountant has no companies of their own but must still see this list.
    const memberships = await CompanyMemberModel.find({ userId: session.user.id }).sort({
      createdAt: 1,
    });
    const companies = await CompanyModel.find({
      _id: { $in: memberships.map((m) => m.companyId) },
    });
    const roleByCompany = new Map(memberships.map((m) => [m.companyId, m.role]));

    return NextResponse.json(
      companies.map((company) => ({
        ...company.toObject(),
        role: roleByCompany.get(company._id.toString()) ?? "viewer",
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    if (!body.legalName?.trim()) {
      return NextResponse.json({ error: "Legal name is required" }, { status: 400 });
    }

    delete body._id;
    const company = await CompanyModel.create({
      ...body,
      // Ownership comes from the session, never the request body.
      ownerId: session.user.id,
    });

    // The creator is the owner member; without this the company would exist
    // but resolveCompanyContext would find no membership for it.
    await CompanyMemberModel.create({
      companyId: company._id.toString(),
      userId: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: "owner",
    });

    return NextResponse.json({ ...company.toObject(), role: "owner" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
