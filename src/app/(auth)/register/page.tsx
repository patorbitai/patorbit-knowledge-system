"use client";

import Link from "next/link";
import { useActionState, useState, useId, useEffect } from "react";
import { signIn } from "next-auth/react";
import { registerUser, type RegisterState } from "@/actions/auth/register";
import { resendVerificationAction } from "@/actions/auth/verify";

const initialState: RegisterState = { success: false, message: "" };
const resendInitialState = { success: false, message: "" };

// C55.2: Social providers — shared with Login page
const SOCIAL_PROVIDERS = [
  {
    id: "google",
    name: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
    ),
  },
  {
    id: "github",
    name: "GitHub",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
      </svg>
    ),
  },
];

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
  const [state, formAction, isPending] = useActionState(registerUser, initialState);
  const [resendState, resendAction, isResendPending] = useActionState(resendVerificationAction, resendInitialState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmId = useId();
  const termsId = useId();

  // C55.2: Fetch available providers from NextAuth on mount
  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((providers) => {
        if (providers) {
          setAvailableProviders(Object.keys(providers));
        }
      })
      .catch(() => {
        // Silently handle — social buttons will remain hidden
      });
  }, []);

  const handleSubmit = (e: React.BaseSyntheticEvent) => {
    let hasError = false;
    if (confirm !== password) {
      setConfirmError("Passwords do not match.");
      hasError = true;
    } else {
      setConfirmError("");
    }
    if (!agreed) {
      setTermsError(true);
      hasError = true;
    } else {
      setTermsError(false);
    }
    if (hasError) e.preventDefault();
  };

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

      {state.success ? (
        <div role="status" className="rounded-lg border border-cyan-500/20 bg-cyan-500/[0.06] px-4 py-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/10 border border-cyan-500/20 shrink-0">
              <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden="true">
                <path d="M1 5.5L4.5 9L13 1" stroke="#22d3ee" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <p className="text-sm font-medium text-white">Check your email</p>
          </div>
          <div className="space-y-1.5 pl-9 text-sm text-slate-400">
            <p className="font-medium text-white">Account created successfully.</p>
            <p>We sent a verification link to your email address ({email}).</p>
            <p>The link expires in 24 hours.</p>
          </div>

          <div className="pl-9 pt-2 space-y-3">
            <form action={resendAction} className="space-y-2">
              <input type="hidden" name="email" value={email} />
              <p className="text-xs text-slate-400">Didn&apos;t receive the email?</p>
              <button
                type="submit"
                disabled={isResendPending}
                className="inline-flex items-center justify-center rounded-lg bg-white/[0.08] hover:bg-white/[0.12] px-4 py-2 text-xs font-medium text-cyan-400 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
              >
                {isResendPending ? "Resending..." : "Resend verification email"}
              </button>
              {resendState.message && (
                <p className={`text-xs ${resendState.success ? "text-emerald-400" : "text-rose-400"}`}>
                  {resendState.message}
                </p>
              )}
            </form>

            <div>
              <Link
                href="/login"
                className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-150 underline"
              >
                Return to Sign in
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* C55.2: Social providers — only show configured providers */}
          {availableProviders.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-2.5 mb-6">
                {SOCIAL_PROVIDERS.filter((p) => availableProviders.includes(p.id)).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={!!socialLoading}
                    onClick={() => {
                      setSocialLoading(p.id);
                      signIn(p.id, { callbackUrl: "/solutions" });
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/[0.06] hover:border-white/[0.15] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={`Continue with ${p.name}`}
                  >
                    {socialLoading === p.id ? (
                      <Spinner />
                    ) : (
                      p.icon
                    )}
                    <span>{socialLoading === p.id ? `Signing in...` : `Continue with ${p.name}`}</span>
                  </button>
                ))}
              </div>

              <div className="relative flex items-center gap-3 mb-6">
                <div className="h-px flex-1 bg-white/[0.08]" />
                <span className="text-xs text-slate-400 shrink-0">or continue with email</span>
                <div className="h-px flex-1 bg-white/[0.08]" />
              </div>
            </>
          )}

          <form action={formAction} noValidate onSubmit={handleSubmit} className="space-y-4">
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
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); if (confirmError) setConfirmError(""); }}
                  aria-describedby={confirmError ? "confirm-error" : undefined}
                  aria-invalid={!!confirmError}
                  className={`w-full rounded-lg border bg-white/[0.04] px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${confirmError ? "border-rose-500/60 focus-visible:border-rose-500/60" : "border-white/[0.1] focus-visible:border-cyan-500/60"}`}
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
              {confirmError && (
                <p id="confirm-error" role="alert" className="text-xs text-rose-400 flex items-center gap-1.5">
                  <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {confirmError}
                </p>
              )}
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                id={termsId}
                type="checkbox"
                checked={agreed}
                onChange={(e) => { setAgreed(e.target.checked); if (termsError) setTermsError(false); }}
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
            {termsError && (
              <p role="alert" className="text-xs text-rose-400 flex items-center gap-1.5">
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                You must agree to the Terms of Service to continue.
              </p>
            )}

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
              disabled={isPending}
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
        </>
      )}
    </div>
  );
}
