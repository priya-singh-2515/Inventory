"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, Loader2, ShieldCheck, XCircle } from "lucide-react";
import toast from "react-hot-toast";

interface InviteDetails {
  email: string;
  roleLabel: string;
  roleDescription: string;
  companyName: string;
  expiresAt: string;
}

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        const data = await res.json();
        if (res.ok) setInvite(data);
        else setError(data.error || "This invitation is not valid.");
      } catch {
        setError("Could not load this invitation.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${token}`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        toast.success(`You now have access to ${invite?.companyName}`);
        router.push("/inventory");
        router.refresh();
        return;
      }

      if (data.code === "SIGN_IN_REQUIRED") {
        // Come back here after signing in so the invite is not lost.
        router.push(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`);
        return;
      }
      toast.error(data.error || "Could not accept this invitation");
    } catch {
      toast.error("Network error occurred");
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading invitation...
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xs p-8 text-center space-y-3">
        <XCircle className="w-8 h-8 mx-auto text-rose-400" />
        <h1 className="text-xl font-bold text-[#0b2641]">Invitation unavailable</h1>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          href="/login"
          className="inline-block px-4 py-2 bg-[#0b2641] hover:bg-blue-900 text-white text-sm font-semibold rounded-lg"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0b2641] flex items-center justify-center mb-4">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#0b2641] text-center">
          Join {invite.companyName}
        </h1>
        <p className="text-sm text-slate-500 mt-1 text-center">
          Invitation sent to <span className="font-semibold">{invite.email}</span>
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-[#0b2641] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-slate-800">{invite.roleLabel}</p>
            <p className="text-xs text-slate-500 mt-0.5">{invite.roleDescription}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAccept}
          disabled={accepting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          {accepting && <Loader2 className="w-4 h-4 animate-spin" />}
          {accepting ? "Joining..." : "Accept invitation"}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          You must be signed in as {invite.email} to accept. Expires{" "}
          {new Date(invite.expiresAt).toLocaleDateString("en-IN")}.
        </p>
      </div>
    </div>
  );
}
