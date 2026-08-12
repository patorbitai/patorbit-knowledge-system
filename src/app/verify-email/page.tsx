"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { verifyEmailAction } from "@/actions/auth/verify";

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "Verifying your email address..." : "Missing verification token.");

  useEffect(() => {
    if (!token) return;

    verifyEmailAction(token)
      .then((res) => {
        if (res.success) {
          setStatus("success");
          setMessage(res.message);
        } else {
          setStatus("error");
          setMessage(res.message);
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An unexpected error occurred during verification.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0A0E1B] p-8 shadow-2xl text-center space-y-6">
        <div className="flex justify-center">
          {status === "loading" && <Spinner />}
          {status === "success" && (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              ✓
            </span>
          )}
          {status === "error" && (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400">
              ✕
            </span>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">Email Verification</h1>
          <p className={`text-sm ${status === "success" ? "text-emerald-300" : status === "error" ? "text-rose-400" : "text-slate-400"}`}>
            {message}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
          >
            Continue to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
