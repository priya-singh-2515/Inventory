"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Boxes, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";

interface LoginFormInput {
  email: string;
  password: string;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInput>({
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginFormInput) {
    setSubmitting(true);
    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
      rememberMe: true,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Invalid email or password");
      return;
    }

    toast.success("Signed in");
    // Only accept same-origin relative paths — never redirect to an external URL.
    const target = searchParams.get("redirect");
    router.push(target?.startsWith("/") && !target.startsWith("//") ? target : "/inventory");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0b2641] flex items-center justify-center mb-4">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in to your inventory workspace</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5"
      >
        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email", { required: "Email is required" })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20 focus:border-[#0b2641] transition-colors"
            placeholder="you@company.in"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password", { required: "Password is required" })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20 focus:border-[#0b2641] transition-colors"
            placeholder="••••••••"
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-semibold text-[#0b2641] hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary to avoid opting the whole route
  // out of static rendering.
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
