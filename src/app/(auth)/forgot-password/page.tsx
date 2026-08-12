"use client";

import Link from "next/link";
import { useId, useActionState } from "react";
import { requestPasswordResetAction, type ResetState } from "@/actions/auth/password-reset";

const initialState: ResetState = { success: false, message: "" };

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const emailId = useId();
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email address and we&apos;ll send you a secure link to reset your password.
        </p>
      </div>

      {state.success ? (
        <div role="status" className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-5 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 shrink-0">
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
                <path d="M1 5.5L4.5 9L13 1" stroke="#22d3ee" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-sm font-medium text-white">Request received</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed pl-9">
            {state.message}
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              disabled={isPending}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {state.message && !state.success && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2.5 text-sm text-rose-400">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          >
            {isPending ? (
              <>
                <Spinner />
                Sending reset link…
              </>
            ) : (
              "Send password reset link"
            )}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered your password?{" "}
        <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
