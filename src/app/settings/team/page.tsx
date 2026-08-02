"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Trash2, Copy, Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { ASSIGNABLE_ROLES, ROLE_DEFINITIONS, type Role } from "@/lib/permissions";
import { useCompanySession } from "@/hooks/useCompanySession";

interface Member {
  _id: string;
  email: string;
  name?: string;
  role: Role;
  roleLabel: string;
  isYou: boolean;
}

interface Invite {
  _id: string;
  email: string;
  role: Role;
  roleLabel: string;
  expiresAt: string;
  isExpired: boolean;
  invitePath: string;
}

export default function TeamPage() {
  const { canManage, loading: sessionLoading } = useCompanySession();
  const canManageMembers = canManage("members");

  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [memberRes, inviteRes] = await Promise.all([
        fetch("/api/companies/members"),
        fetch("/api/companies/invites"),
      ]);
      if (memberRes.ok) setMembers(await memberRes.json());
      if (inviteRes.ok) setInvites(await inviteRes.json());
    } catch (e) {
      console.error("Failed to load team", e);
      toast.error("Failed to load the team list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/companies/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Invitation created for ${data.email}`);
        setInviteEmail("");
        copyLink(data.invitePath);
        load();
      } else {
        toast.error(data.error || "Could not create the invitation");
      }
    } catch {
      toast.error("Network error occurred");
    } finally {
      setSending(false);
    }
  }

  function copyLink(path: string) {
    const url = `${window.location.origin}${path}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Invite link copied — send it to them"))
      .catch(() => toast.error("Could not copy the link"));
  }

  async function changeRole(memberId: string, role: Role) {
    const res = await fetch("/api/companies/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success("Role updated");
      load();
    } else {
      toast.error(data.error || "Could not update the role");
    }
  }

  async function removeMember(member: Member) {
    if (!window.confirm(`Remove ${member.email}'s access to this company?`)) return;
    const res = await fetch(`/api/companies/members?memberId=${member._id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      toast.success("Access removed");
      load();
    } else {
      toast.error(data.error || "Could not remove access");
    }
  }

  async function revokeInvite(invite: Invite) {
    const res = await fetch(`/api/companies/invites?inviteId=${invite._id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Invitation revoked");
      load();
    } else {
      toast.error("Could not revoke the invitation");
    }
  }

  if (!sessionLoading && !canManageMembers) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center space-y-3">
        <ShieldCheck className="w-8 h-8 mx-auto text-slate-300" />
        <h1 className="text-xl font-bold text-[#0b2641]">Team settings are not available</h1>
        <p className="text-sm text-slate-500">Your role cannot manage who has access to this company.</p>
        <Link href="/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0b2641] hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to settings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0b2641]">Team &amp; Access</h1>
          <p className="text-sm text-slate-500">Invite people and choose what each of them can do</p>
        </div>
      </div>

      {/* Invite form */}
      <form
        onSubmit={handleInvite}
        className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4"
      >
        <h2 className="font-bold text-[#0b2641] text-base">Invite someone</h2>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px_auto] gap-3 items-end">
          <div>
            <label htmlFor="inviteEmail" className="block text-xs font-semibold text-slate-700 mb-1">
              Email
            </label>
            <input
              id="inviteEmail"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.in"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label htmlFor="inviteRole" className="block text-xs font-semibold text-slate-700 mb-1">
              Role
            </label>
            <select
              id="inviteRole"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
            >
              {ASSIGNABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_DEFINITIONS[role].label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors h-[38px]"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Invite
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          {ROLE_DEFINITIONS[inviteRole].description} · There is no mail service configured, so the
          invite link is copied to your clipboard to send yourself.
        </p>
      </form>

      {/* Members */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-[#0b2641] text-base">People with access</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-6">Person</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">What they can do</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-slate-400">
                    Loading team...
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6">
                      <p className="font-medium text-slate-800">
                        {member.name || member.email}
                        {member.isYou && (
                          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                            you
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-400">{member.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {member.role === "owner" || member.isYou ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                          {member.roleLabel}
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => changeRole(member._id, e.target.value as Role)}
                          aria-label={`Role for ${member.email}`}
                          className="px-2 py-1 bg-slate-50 border border-slate-300 rounded text-xs"
                        >
                          {ASSIGNABLE_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_DEFINITIONS[role].label}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 max-w-md">
                      {ROLE_DEFINITIONS[member.role]?.description}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {member.role !== "owner" && !member.isYou && (
                        <button
                          type="button"
                          onClick={() => removeMember(member)}
                          aria-label={`Remove ${member.email}`}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending invites */}
      {invites.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-[#0b2641] text-base">Pending invitations</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {invites.map((invite) => (
              <li key={invite._id} className="flex flex-wrap items-center gap-3 px-6 py-3.5">
                <div className="flex-1 min-w-[200px]">
                  <p className="text-sm font-medium text-slate-800">{invite.email}</p>
                  <p className="text-[11px] text-slate-400">
                    {invite.roleLabel} ·{" "}
                    {invite.isExpired
                      ? "expired"
                      : `expires ${new Date(invite.expiresAt).toLocaleDateString("en-IN")}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyLink(invite.invitePath)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy link
                </button>
                <button
                  type="button"
                  onClick={() => revokeInvite(invite)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md border border-rose-200 transition-colors"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
