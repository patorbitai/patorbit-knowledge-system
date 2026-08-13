"use strict";

import { useResumeBuilder } from "@/store/resume-builder";
import { ClaimCard } from "@/components/identity/ClaimCard";
import { ShieldCheck } from "lucide-react";

export function VerificationView() {
  const resume = useResumeBuilder((s) => s.resume);
  const claims = resume?.claims ?? [];

  if (!resume || claims.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Credential Verification</h1>
          <p className="text-sm text-slate-400 mt-1">
            Verify your professional credentials, experience claims, and certifications.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No credential verifications yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Add claims, experience, and credentials in your Resume Builder to start verifying your professional profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Credential Verification</h1>
        <p className="text-sm text-slate-400 mt-1">
          Verify your professional credentials, experience claims, and certifications.
        </p>
      </div>
      <div className="space-y-4">
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    </div>
  );
}
