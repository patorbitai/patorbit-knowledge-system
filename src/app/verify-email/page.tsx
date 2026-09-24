"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, Suspense } from "react";
import { verifyEmailAction, resendVerificationAction } from "@/actions/auth/verify";
import { track, trackOnce } from "@/lib/analytics";

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-cyan-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token
      ? "Confirming your email address…"
      : "This link is incomplete — it's missing the verification token."
  );
  const [already, setAlready] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [resendLink, setResendLink] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);

  // The verification token is single-use. React StrictMode (dev) and
  // accidental double-mounts must not fire the action twice — the second
  // call used to consume nothing and surface a false "invalid" failure
  // even though verification succeeded.
  const ranRef = useRef(false);

  // Where "Sign in" should land: the destination the user was heading to
  // when they signed up (same-browser), captured at registration time.
  const callbackHint = searchParams.get("callbackUrl") || (() => {
    try {
      const raw = sessionStorage.getItem("patorbit:pending-verification");
      if (raw) return JSON.parse(raw).callback || null;
    } catch {
      /* storage unavailable */
    }
    return null;
  })();

  const loginHref = (() => {
    const q = new URLSearchParams();
    q.set("registered", "1");
    if (status === "success") q.set("verified", "1");
    if (emailParam) q.set("email", emailParam);
    if (callbackHint) q.set("callbackUrl", callbackHint);
    return `/login?${q.toString()}`;
  })();

  useEffect(() => {
    if (!token) {
      trackOnce("verification_failed", { reason: "missing_token" });
      return;
    }
    if (ranRef.current) return;
    ranRef.current = true;

    verifyEmailAction(token, emailParam || undefined)
      .then((res) => {
        if (res.success) {
          setStatus("success");
          setMessage(
            res.already
              ? "This email is already verified — sign in to continue."
              : "Email verified — you're all set to sign in."
          );
          setAlready(!!res.already);
          track("verification_completed", { already: !!res.already });
        } else {
          setStatus("error");
          setMessage(res.message);
          track("verification_failed", {
            reason: /expired/i.test(res.message) ? "expired" : "invalid",
          });
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("We couldn't reach the server to verify. Check your connection and try again.");
        track("verification_failed", { reason: "network" });
      });
  }, [token, emailParam]);

  const handleResend = async () => {
    const target = emailParam;
    if (!target) return;
    setResendLoading(true);
    setResendMsg("");
    setResendLink(null);
    try {
      const formData = new FormData();
      formData.append("email", target);
      const res = await resendVerificationAction({ success: false, message: "" }, formData);
      setResendMsg(res.message);
      setResendLink(res.verificationUrl ?? null);
    } catch {
      setResendMsg("Failed to resend. Try again in a moment.");
    } finally {
      setResendLoading(false);
    }
  };

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
          <h1 className="text-xl font-bold text-white">
            {status === "success" ? "Email verified" : status === "error" ? "We couldn't verify this link" : "Verifying your email"}
          </h1>
          <p
            className={`text-sm ${status === "success" ? "text-emerald-300" : status === "error" ? "text-rose-300" : "text-slate-400"}`}
            role={status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
          {emailParam && (
            <p className="text-xs text-slate-500">{emailParam}</p>
          )}
          <p className="text-xs text-slate-500 leading-relaxed">
            Why we ask: Patorbit confirms your email so we can recover access and keep your professional
            identity trustworthy. Verification links expire after 24 hours.
          </p>
        </div>

        {status === "success" && (
          <div className="space-y-3 pt-1">
            <p className="text-xs text-slate-400">
              {already
                ? "Next: sign in and you'll go straight to your workspace."
                : "Next: sign in once and you'll land straight in setup — onboarding picks up where you left off."}
            </p>
            <Link
              href={loginHref}
              className="inline-flex items-center justify-center w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
            >
              Sign in to continue
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 pt-1 text-left">
            <p className="text-xs text-slate-400 leading-relaxed">
              Links can expire (24 hours), be used twice, or arrive malformed if the email was cut off.
              {emailParam
                ? " Request a fresh link below — it replaces the old one."
                : " Open the link from your email again, or sign in and we'll offer a resend."}
            </p>

            {emailParam && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? "Sending a new link…" : "Send a new verification link"}
                </button>
                {resendMsg && (
                  <p className="text-xs text-slate-400" role="status">
                    {resendMsg}
                    {resendLink && (
                      <>
                        {" "}
                        <a href={resendLink} className="text-cyan-400 underline font-medium">
                          Open the verification link directly →
                        </a>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-1">
              <Link href={loginHref} className="text-xs text-brand hover:text-cyan-300 underline transition-colors">
                Back to sign in
              </Link>
              <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 underline transition-colors">
                Use a different email
              </Link>
            </div>
          </div>
        )}

        {status === "loading" && (
          <p className="text-xs text-slate-600">This usually takes a second — don&apos;t close this tab.</p>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Verifying your email...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
