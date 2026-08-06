"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useId } from "react";
import { signIn } from "next-auth/react";
import { registerUser, type RegisterState } from "@/actions/auth/register";

const initialState: RegisterState = { success: false, message: "" };

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score as StrengthLevel;
}

const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Strong",
  4: "Very strong",
};

const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: "bg-white/[0.08]",
  1: "bg-rose-500",
  2: "bg-amber-400",
  3: "bg-emerald-400",
  4: "bg-emerald-400",
};

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1.5" aria-live="polite" aria-atomic="true">
      <div className="flex gap-1" role="img" aria-label={`Password strength: ${STRENGTH_LABELS[strength]}`}>
        {([1, 2, 3, 4] as StrengthLevel[]).map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-200 ${
              level <= strength ? STRENGTH_COLORS[strength] : "bg-white/[0.08]"
            }`}
          />
        ))}
      </div>
      {strength > 0 && (
        <p className={`text-xs ${
          strength <= 1 ? "text-rose-400" : strength === 2 ? "text-amber-400" : "text-emerald-400"
        }`}>
          {STRENGTH_LABELS[strength]}
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(registerUser, initialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const termsId = useId();

  useEffect(() => {
    if (!state.success) return;
    signIn("credentials", { email, password, redirect: false }).then((result) => {
      if (!result?.error) {
        router.push("/overview");
        router.refresh();
      }
    });
  }, [state.success, email, password, router]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Create your Professional Identity
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Start building a verified professional profile that grows with your career.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor={nameId} className="block text-sm font-medium text-slate-300">
            Full name
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            required
            autoComplete="name"
            autoFocus
            disabled={isPending}
            placeholder="Alex Johnson"
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={emailId} className="block text-sm font-medium text-slate-300">
            Email address
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            required
            autoComplete="email"
            disabled={isPending}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={passwordId} className="block text-sm font-medium text-slate-300">
            Password
          </label>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={isPending}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isPending}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-400 disabled:cursor-not-allowed"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
          <PasswordStrengthBar password={password} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={confirmId} className="block text-sm font-medium text-slate-300">
            Confirm password
          </label>
          <div className="relative">
            <input
              id={confirmId}
              name="confirmPassword"
              type={showConfirm ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              disabled={isPending}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              disabled={isPending}
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-400 disabled:cursor-not-allowed"
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-1">
          <input
            id={termsId}
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            disabled={isPending}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/[0.15] bg-white/[0.04] accent-cyan-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500/40 disabled:cursor-not-allowed"
          />
          <label htmlFor={termsId} className="text-xs text-slate-400 leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-150">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-150">
              Privacy Policy
            </Link>
          </label>
        </div>

        {state.message && (
          <p
            role="alert"
            className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
              state.success
                ? "border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-400"
                : "border-rose-500/20 bg-rose-500/[0.08] text-rose-400"
            }`}
          >
            {state.success ? (
              <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            ) : (
              <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            )}
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending || !agreed}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:shadow-cyan-400/30 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        >
          {isPending ? (
            <>
              <Spinner />
              Creating your identity…
            </>
          ) : (
            "Create my Professional Identity"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
