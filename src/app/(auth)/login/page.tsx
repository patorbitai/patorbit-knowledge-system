"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useId, useEffect } from "react";
import { signIn } from "next-auth/react";
import { resendVerificationAction } from "@/actions/auth/verify";

// C55.2: Social providers — only show providers that are configured via env vars.
// The server tells us which providers are available via /api/auth/providers.
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = "/solutions";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);

  const emailId = useId();
  const passwordId = useId();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setResendMessage("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("No account found with this email, or the password is incorrect.");
        } else {
          setError(result.error);
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Unable to connect. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResendLoading(true);
    setResendMessage("");
    try {
      const formData = new FormData();
      formData.append("email", email);
      const res = await resendVerificationAction({ success: false, message: "" }, formData);
      setResendMessage(res.message);
    } catch {
      setResendMessage("Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Sign in to Patorbit
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Access your verified Professional Identity.
        </p>
      </div>

      {registered && (
        <div
          role="status"
          className="mb-6 flex items-start gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3"
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <p className="text-sm text-emerald-300">
            Account created successfully. Please sign in.
          </p>
        </div>
      )}

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
                  signIn(p.id, { callbackUrl });
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
            <span className="text-xs text-slate-500 shrink-0">or continue with email</span>
            <div className="h-px flex-1 bg-white/[0.08]" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            placeholder="you@example.com"
            aria-describedby={error ? "auth-error" : undefined}
            className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={passwordId} className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <Link
              href="/forgot-password"
              tabIndex={loading ? -1 : undefined}
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-400"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className="w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 pr-11 text-sm text-white placeholder:text-slate-600 transition-colors duration-150 outline-none focus-visible:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={loading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-400 disabled:cursor-not-allowed"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        {error && error.includes("verify your email") ? (
          <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-slate-900/90 to-[#0A0E1B]/95 p-6 md:p-8 shadow-2xl space-y-6 my-4">
            {/* Ambient glow behind icon */}
            <div className="absolute -top-12 -left-12 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 shadow-inner">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight text-white">
                  Verify your email
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
                  Please verify your email address before signing in to Patorbit.
                </p>
                <p className="text-xs text-slate-400">
                  We&apos;ll send you a fresh verification link if you need one.
                </p>
              </div>

              <div className="w-full pt-2 space-y-3" aria-live="polite">
                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={handleResend}
                  className="w-full inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
                >
                  {resendLoading ? (
                    <>
                      <Spinner />
                      <span className="ml-2">Sending...</span>
                    </>
                  ) : (
                    "Resend verification email"
                  )}
                </button>

                {resendMessage ? (
                  <p className="text-xs text-emerald-400 font-medium pt-1">
                    {resendMessage}
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">
                    If an account with this email exists, we&apos;ve sent a new verification link.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : error ? (
          <p
            id="auth-error"
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/[0.08] px-3 py-2.5 text-sm text-rose-400"
          >
            <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-150 hover:shadow-cyan-400/30 hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:brightness-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50"
        >
          {loading ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors duration-150 focus-visible:outline-none focus-visible:text-cyan-300">
          Create your Professional Identity
        </Link>
      </p>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-8 space-y-2">
        <div className="h-7 w-48 rounded-md bg-white/[0.06]" />
        <div className="h-4 w-64 rounded-md bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-white/[0.04] border border-white/[0.08]" />
        ))}
      </div>
      <div className="h-px bg-white/[0.08] mb-6" />
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded bg-white/[0.06]" />
          <div className="h-10 rounded-lg bg-white/[0.04] border border-white/[0.08]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-4 w-16 rounded bg-white/[0.06]" />
          <div className="h-10 rounded-lg bg-white/[0.04] border border-white/[0.08]" />
        </div>
        <div className="mt-2 h-10 rounded-lg bg-white/[0.08]" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </Suspense>
  );
}
