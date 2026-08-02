import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/company-context";
import { connectToDatabase } from "@/lib/mongodb";
import { CompanyMemberModel } from "@/lib/models";
import { isRole, ROLE_DEFINITIONS } from "@/lib/permissions";

/** Everyone with access to the active company. */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "members", "view");
    if (!ctx.ok) return ctx.response;
    const { companyId, userId } = ctx.context;

    const members = await CompanyMemberModel.find({ companyId }).sort({ createdAt: 1 });

    return NextResponse.json(
      members.map((m) => ({
        _id: m._id,
        userId: m.userId,
        email: m.email,
        name: m.name,
        role: m.role,
        roleLabel: ROLE_DEFINITIONS[m.role]?.label ?? m.role,
        isYou: m.userId === userId,
        createdAt: m.createdAt,
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Change a member's role. */
export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "members", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId, userId } = ctx.context;

    const { memberId, role } = await req.json();
    if (!isRole(role) || role === "owner") {
      return NextResponse.json(
        { error: "Pick one of the assignable roles." },
        { status: 400 }
      );
    }

    const member = await CompanyMemberModel.findOne({ _id: memberId, companyId });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "owner") {
      return NextResponse.json(
        { error: "The owner's role cannot be changed." },
        { status: 400 }
      );
    }
    if (member.userId === userId) {
      // Otherwise an admin could demote themselves and strand the company.
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }

    member.role = role;
    await member.save();
    return NextResponse.json({ _id: member._id, role: member.role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** Remove someone's access. */
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const ctx = await requirePermission(req, "members", "manage");
    if (!ctx.ok) return ctx.response;
    const { companyId, userId } = ctx.context;

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    const member = await CompanyMemberModel.findOne({ _id: memberId, companyId });
    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }
    if (member.role === "owner") {
      return NextResponse.json({ error: "The owner cannot be removed." }, { status: 400 });
    }
    if (member.userId === userId) {
      return NextResponse.json({ error: "You cannot remove yourself." }, { status: 400 });
    }

    await CompanyMemberModel.deleteOne({ _id: member._id });
    return NextResponse.json({ message: "Access removed" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
