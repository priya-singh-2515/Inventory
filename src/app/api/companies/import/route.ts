import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import {
  importCompany,
  ImportValidationError,
} from "@/lib/services/company-data-service";

/**
 * Restores an exported file as a NEW company owned by the caller.
 *
 * Import never overwrites: existing companies are untouched, so a wrong file
 * costs a deletion rather than a data loss.
 */
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "The file is not valid JSON." }, { status: 400 });
    }

    const result = await importCompany(payload, {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    if (error instanceof ImportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
