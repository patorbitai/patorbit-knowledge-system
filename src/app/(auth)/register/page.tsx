"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { registerUser, type RegisterState } from "@/actions/auth/register";
import Input from "@/components/ui/Input";

const initialState: RegisterState = { success: false, message: "" };

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    registerUser,
    initialState
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Auto sign-in after successful registration
  useEffect(() => {
    if (!state.success) return;
    signIn("credentials", { email, password, redirect: false }).then(
      (result) => {
        if (!result?.error) {
          router.push("/overview");
          router.refresh();
        }
      }
    );
  }, [state.success, email, password, router]);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8">
      <h1 className="mb-2 text-xl font-semibold text-white">
        Create your account
      </h1>
      <p className="mb-6 text-sm text-slate-400">
        Start building your professional identity.
      </p>

      <form action={formAction} className="space-y-4">
        <Input
          name="name"
          type="text"
          placeholder="Full name"
          required
          autoComplete="name"
        />
        <Input
          name="email"
          type="email"
          placeholder="Email address"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          name="password"
          type="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          required
          minLength={8}
          autoComplete="new-password"
        />

        {state.message && (
          <p
            className={`text-sm ${state.success ? "text-emerald-400" : "text-rose-400"}`}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-400/40 hover:scale-[1.02] active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
