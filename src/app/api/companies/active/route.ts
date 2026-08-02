import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyModel } from "@/lib/models";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/company-context";

/**
 * Switches which company the user is acting in.
 *
 * The choice is stored in an httpOnly cookie, but the cookie alone grants
 * nothing — resolveCompanyContext re-checks ownership on every request, so a
 * hand-edited cookie cannot reach another user's books.
 */
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await req.json();
    const company = await CompanyModel.findOne({
      _id: companyId,
      ownerId: session.user.id,
    });
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      companyId: company._id.toString(),
      tradeName: company.tradeName,
      legalName: company.legalName,
    });

    response.cookies.set(ACTIVE_COMPANY_COOKIE, company._id.toString(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
