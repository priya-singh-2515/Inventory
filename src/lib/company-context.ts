import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { CompanyModel, CompanyMemberModel } from "@/lib/models";
import { can, permissionsFor, type Action, type Feature, type PermissionMap, type Role } from "@/lib/permissions";

export const ACTIVE_COMPANY_COOKIE = "activeCompanyId";

/**
 * Who the request is, which company it is acting on, and what it may do there.
 *
 * Membership is re-read from the database on every request rather than trusted
 * from the cookie or session, so revoking someone takes effect immediately and
 * a hand-edited cookie cannot reach a company the user is not a member of.
 */
export interface CompanyContext {
  userId: string;
  email: string;
  companyId: string;
  role: Role;
  permissions: PermissionMap;
}

export type CompanyContextResult =
  | { ok: true; context: CompanyContext }
  | { ok: false; response: NextResponse };

export async function resolveCompanyContext(req: Request): Promise<CompanyContextResult> {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userId = session.user.id;
  const requested = readCookie(req, ACTIVE_COMPANY_COOKIE);

  // The cookie only selects among companies the user is already a member of.
  let membership = requested
    ? await CompanyMemberModel.findOne({ companyId: requested, userId })
    : null;

  // Stale or missing cookie: fall back to the earliest company they belong to.
  if (!membership) {
    membership = await CompanyMemberModel.findOne({ userId }).sort({ createdAt: 1 });
  }

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No company found. Create one before continuing.", code: "NO_COMPANY" },
        { status: 409 }
      ),
    };
  }

  // Guard against a membership left behind by a deleted company.
  const company = await CompanyModel.findOne({ _id: membership.companyId });
  if (!company) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No company found. Create one before continuing.", code: "NO_COMPANY" },
        { status: 409 }
      ),
    };
  }

  const role = membership.role as Role;
  return {
    ok: true,
    context: {
      userId,
      email: session.user.email,
      companyId: membership.companyId,
      role,
      permissions: permissionsFor(role),
    },
  };
}

/**
 * Resolves the context and enforces one permission in a single step.
 *
 * Route handlers call this instead of resolveCompanyContext so that forgetting
 * the check is not possible — there is no path that returns a context without
 * having stated what it needs.
 */
export async function requirePermission(
  req: Request,
  feature: Feature,
  action: Action
): Promise<CompanyContextResult> {
  const result = await resolveCompanyContext(req);
  if (!result.ok) return result;

  if (!can(result.context.role, feature, action)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            action === "manage"
              ? "Your role is read-only for this area."
              : "Your role cannot access this area.",
          code: "FORBIDDEN",
          feature,
          role: result.context.role,
        },
        { status: 403 }
      ),
    };
  }

  return result;
}

function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;

  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}
