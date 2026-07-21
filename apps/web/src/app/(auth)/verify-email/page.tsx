// apps/web/src/app/(auth)/verify-email/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "verified" | "error">("verifying");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); return; }
    api.post("auth/verify-email", { token })
      .then(() => setStatus("verified"))
      .catch(() => setStatus("error"));
  }, [searchParams]);

  if (status === "verifying") return <p className="p-8 text-center">Verifying your email…</p>;
  if (status === "verified") return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Email Verified</h1>
      <p className="mt-4">You can now sign in.</p>
    </div>
  );
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold text-destructive">Verification Failed</h1>
      <p className="mt-4">The link is invalid or expired.</p>
    </div>
  );
}
