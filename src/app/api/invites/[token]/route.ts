import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyInviteModel, CompanyMemberModel, CompanyModel } from "@/lib/models";
import { ACTIVE_COMPANY_COOKIE } from "@/lib/company-context";
import { ROLE_DEFINITIONS } from "@/lib/permissions";

/**
 * Look up an invitation by token.
 *
 * Deliberately readable while signed out so the invite page can say what is
 * being offered before asking the person to sign in. Only the company name and
 * role are exposed — never the books.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectToDatabase();
    const { token } = await params;

    const invite = await CompanyInviteModel.findOne({ token });
    if (!invite) {
      return NextResponse.json({ error: "This invitation link is not valid." }, { status: 404 });
    }
    if (invite.revokedAt) {
      return NextResponse.json({ error: "This invitation has been revoked." }, { status: 410 });
    }
    if (invite.acceptedAt) {
      return NextResponse.json({ error: "This invitation has already been used." }, { status: 410 });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
    }

    const company = await CompanyModel.findOne({ _id: invite.companyId });

    return NextResponse.json({
      email: invite.email,
      role: invite.role,
      roleLabel: ROLE_DEFINITIONS[invite.role]?.label ?? invite.role,
      roleDescription: ROLE_DEFINITIONS[invite.role]?.description ?? "",
      companyName: company?.tradeName || company?.legalName || "a company",
      expiresAt: invite.expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Accept the invitation as the signed-in user. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await connectToDatabase();
    const { token } = await params;

    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
      return NextResponse.json(
        { error: "Sign in to accept this invitation.", code: "SIGN_IN_REQUIRED" },
        { status: 401 }
      );
    }

    const invite = await CompanyInviteModel.findOne({ token });
    if (!invite || invite.revokedAt || invite.acceptedAt) {
      return NextResponse.json({ error: "This invitation is no longer valid." }, { status: 410 });
    }
    if (invite.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "This invitation has expired." }, { status: 410 });
    }

    // The invite is addressed to one mailbox — a forwarded link must not let a
    // different account in.
    if (invite.email.toLowerCase() !== session.user.email.toLowerCase()) {
      return NextResponse.json(
        {
          error: `This invitation was sent to ${invite.email}. Sign in with that account to accept it.`,
          code: "EMAIL_MISMATCH",
        },
        { status: 403 }
      );
    }

    const existing = await CompanyMemberModel.findOne({
      companyId: invite.companyId,
      userId: session.user.id,
    });
    if (!existing) {
      await CompanyMemberModel.create({
        companyId: invite.companyId,
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: invite.role,
        invitedBy: invite.invitedBy,
      });
    }

    invite.acceptedAt = new Date();
    invite.acceptedBy = session.user.id;
    await invite.save();

    // Drop them straight into the company they just joined.
    const response = NextResponse.json({
      companyId: invite.companyId,
      role: invite.role,
    });
    response.cookies.set(ACTIVE_COMPANY_COOKIE, invite.companyId, {
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
