import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { exportCompany } from "@/lib/services/company-data-service";

/** Downloads the active company and all of its documents as one JSON file. */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "data", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const payload = await exportCompany(companyId);
    if (!payload) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const slug =
      String(payload.company.tradeName || payload.company.legalName || "company")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "company";
    const stamp = payload.exportedAt.slice(0, 10);

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${slug}-${stamp}.json"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
