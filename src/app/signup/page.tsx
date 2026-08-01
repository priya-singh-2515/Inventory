"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Boxes, Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";

interface SignupFormInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<SignupFormInput>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(data: SignupFormInput) {
    setSubmitting(true);
    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not create account");
      return;
    }

    toast.success("Account created");
    router.push("/inventory");
    router.refresh();
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex flex-col items-center mb-8">
        <div className="w-12 h-12 rounded-xl bg-[#0b2641] flex items-center justify-center mb-4">
          <Boxes className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[#0b2641]">Create your account</h1>
        <p className="text-sm text-slate-500 mt-1">Get started with your inventory workspace</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5"
      >
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name", { required: "Name is required" })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20 focus:border-[#0b2641] transition-colors"
            placeholder="Priya Singh"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name.message}</p>}
        </div>

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
            autoComplete="new-password"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Password must be at least 8 characters" },
            })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20 focus:border-[#0b2641] transition-colors"
            placeholder="At least 8 characters"
          />
          {errors.password && <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: "Please confirm your password",
              validate: (value) => value === getValues("password") || "Passwords do not match",
            })}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0b2641]/20 focus:border-[#0b2641] transition-colors"
            placeholder="Re-enter your password"
          />
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0b2641] hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-[#0b2641] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
