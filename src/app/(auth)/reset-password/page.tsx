"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useId, Suspense } from "react";
import { resetPasswordAction, type ResetState } from "@/actions/auth/password-reset";

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const passwordId = useId();
  const confirmId = useId();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetState | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await resetPasswordAction(token, password, confirmPassword);
      setResult(res);
    } catch {
      setResult({ success: false, message: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Invalid Reset Link</h1>
          <p className="mt-2 text-sm text-rose-400">This password reset link is missing its verification token.</p>
        </div>
        <Link href="/forgot-password" className="text-cyan-400 hover:text-cyan-300 text-sm">
          Request a new password reset link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Please enter your new password below.
        </p>
      </div>

      {result?.success ? (
        <div role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 shrink-0">
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
                <path d="M1 5.5L4.5 9L13 1" stroke="#10b981" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-sm font-medium text-white">Success</p>
          </div>
          <p className="text-sm text-emerald-300 leading-relaxed pl-9">
            {result.message}
          </p>
          <div className="pl-9 pt-2">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
            >
              Sign in now
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={passwordId} className="block text-sm font-medium text-slate-300">
              New password
            </label>
            <input
              id={passwordId}
              type="password"
              required
              minLength={8}
              disabled={loading}
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor={confirmId} className="block text-sm font-medium text-slate-300">
              Confirm new password
            </label>
            <input
              id={confirmId}
              type="password"
              required
              minLength={8}
              disabled={loading}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50"
            />
          </div>

          {result && !result.success && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2.5 text-sm text-rose-400">
              {result.message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          >
            {loading ? (
              <>
                <Spinner />
                Resetting password…
              </>
            ) : (
              "Reset password"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-white text-sm">Loading reset form...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
