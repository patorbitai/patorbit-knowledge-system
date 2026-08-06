"use client";

import Link from "next/link";
import { useId, useState } from "react";

export default function ForgotPasswordPage() {
  const emailId = useId();
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email and we&apos;ll send recovery instructions when this feature is available.
        </p>
      </div>

      {submitted ? (
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-5 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 shrink-0">
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
                <path d="M1 5.5L4.5 9L13 1" stroke="#22d3ee" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-sm font-medium text-white">Request received</p>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed pl-9">
            Password recovery is not yet available. We&apos;ll notify{" "}
            <span className="text-slate-300">{email}</span> when it launches.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={emailId} className="block text-sm font-medium text-slate-300">
              Email address
            </label>
            <input
              id={emailId}
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20"
            />
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 flex items-start gap-2">
            <svg className="mt-0.5 h-4 w-4 text-slate-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <p className="text-xs text-slate-500 leading-relaxed">
              Password recovery will be available in a future update.
            </p>
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:brightness-110 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
          >
            Send recovery instructions
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
