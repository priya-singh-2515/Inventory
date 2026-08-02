import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyInviteModel, CompanyMemberModel } from "@/lib/models";
import { ASSIGNABLE_ROLES, isRole, ROLE_DEFINITIONS, type Role } from "@/lib/permissions";

const INVITE_TTL_DAYS = 14;

/** Outstanding invitations for the active company. */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "members", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const invites = await CompanyInviteModel.find({
      companyId,
      acceptedAt: null,
      revokedAt: null,
    }).sort({ createdAt: -1 });

    return NextResponse.json(
      invites.map((invite) => ({
        _id: invite._id,
        email: invite.email,
        role: invite.role,
        roleLabel: ROLE_DEFINITIONS[invite.role]?.label ?? invite.role,
        expiresAt: invite.expiresAt,
        isExpired: invite.expiresAt.getTime() < Date.now(),
        createdAt: invite.createdAt,
        // The link is shown once here so it can be copied and sent manually —
        // there is no mail transport configured in this app.
        invitePath: `/invite/${invite.token}`,
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Invite someone by email at a given role. */
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "members", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId, userId } = ctx.context;

    const body = await req.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const role = body.role as Role;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }
    if (!isRole(role) || !ASSIGNABLE_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${ASSIGNABLE_ROLES.join(", ")}.` },
        { status: 400 }
      );
    }

    const alreadyMember = await CompanyMemberModel.findOne({ companyId, email });
    if (alreadyMember) {
      return NextResponse.json(
        { error: "That person already has access to this company." },
        { status: 409 }
      );
    }

    // Re-inviting the same address supersedes the previous pending invite so
    // an old link cannot still be redeemed at the old role.
    await CompanyInviteModel.updateMany(
      { companyId, email, acceptedAt: null, revokedAt: null },
      { revokedAt: new Date() }
    );

    const invite = await CompanyInviteModel.create({
      companyId,
      email,
      role,
      token: randomBytes(32).toString("base64url"),
      invitedBy: userId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    });

    return NextResponse.json(
      {
        _id: invite._id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
        invitePath: `/invite/${invite.token}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Revoke a pending invitation. */
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "members", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId } = ctx.context;

    const { searchParams } = new URL(req.url);
    const inviteId = searchParams.get("inviteId");

    const invite = await CompanyInviteModel.findOne({ _id: inviteId, companyId });
    if (!invite) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    invite.revokedAt = new Date();
    await invite.save();
    return NextResponse.json({ message: "Invitation revoked" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
