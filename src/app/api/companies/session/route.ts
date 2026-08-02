import { NextResponse } from "next/server";
import { resolveCompanyContext } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyModel } from "@/lib/models";
import { isReadOnly, ROLE_DEFINITIONS } from "@/lib/permissions";

/**
 * What the current user may do in the active company.
 *
 * The UI reads this to hide actions it cannot perform. It is a convenience, not
 * a control — every route still enforces its own permission server-side.
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await resolveCompanyContext(req);
    if (!ctx.ok) return ctx.response;

    const { companyId, role, permissions, email } = ctx.context;
    const company = await CompanyModel.findOne({ _id: companyId });

    return NextResponse.json({
      companyId,
      companyName: company?.tradeName || company?.legalName || "",
      email,
      role,
      roleLabel: ROLE_DEFINITIONS[role].label,
      roleDescription: ROLE_DEFINITIONS[role].description,
      isReadOnly: isReadOnly(role),
      permissions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
