// apps/web/src/app/(auth)/reset-password/page.tsx
"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense,useState } from "react";

import { api } from "../../../lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    router.replace("/forgot-password");
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch {
      setError("This link may be invalid or expired. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="p-8 text-center space-y-4">
        <h1 className="text-2xl font-bold">Password reset!</h1>
        <p className="text-muted-foreground">
          Your password has been updated. You can now sign in.
        </p>
        <Link
          href="/sign-in"
          className="inline-block bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a new strong password
        </p>
      </div>
      {error && (
        <div
          className="p-3 text-sm bg-destructive/10 text-destructive rounded border border-destructive/20"
          role="alert"
        >
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1"
          >
            New Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-2 bg-background"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must be at least 8 characters
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground py-2 rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? "Resetting…" : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Loading…</p>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
