"use strict";

import { prisma } from "@/lib/prisma";
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { clsx } from "clsx";

export default async function PublicTrustSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const identity = await prisma.professionalIdentity.findUnique({
    where: { trustShareToken: token },
    include: { user: true },
  });

  if (!identity || !identity.trustShareEnabled || !identity.trustReportCache) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Report Unavailable or Revoked</h1>
          <p className="text-xs text-slate-400">
            This shared trust report link is invalid, has expired, or has been disabled and revoked by the owner.
          </p>
        </div>
      </main>
    );
  }

  let report;
  try {
    report = JSON.parse(identity.trustReportCache);
  } catch {
    report = null;
  }

  if (!report) {
    return (
      <main className="min-h-screen bg-[#070911] text-slate-300 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-4">
          <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto" />
          <h1 className="text-lg font-bold text-white">Report Data Error</h1>
          <p className="text-xs text-slate-400">Unable to load the shared trust report payload.</p>
        </div>
      </main>
    );
  }

  const { snapshot, verificationSummary, evidenceCoverage } = report;

  return (
    <main className="min-h-screen bg-[#070911] text-slate-300 py-12 px-4 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Public Trust Report
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-2">Professional Trust Score</h1>
            <p className="text-xs text-slate-400 mt-1">
              Read-only verified professional identity trust breakdown for {identity.user.name}.
            </p>
          </div>
        </div>

        {/* Overview Banner */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <span className="text-3xl font-bold">{snapshot?.overall !== null && snapshot?.overall !== undefined ? snapshot.overall : "—"}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">Overall Score</span>
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-lg font-semibold text-white">Evidence-Based Trust Analysis</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              This score is derived from verification coverage across professional identity, claims, experience, skills, and attached evidence.
            </p>
            {verificationSummary && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {verificationSummary.verified} Verified</span>
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {verificationSummary.pending} Pending</span>
                <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {verificationSummary.unverified} Unverified</span>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Coverage Grid */}
        {evidenceCoverage && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Evidence Coverage</div>
              <div className="mt-2 text-2xl font-semibold text-white">{evidenceCoverage.coveragePercent}%</div>
              <p className="mt-1 text-xs text-slate-400">{evidenceCoverage.claimsWithEvidence} of {evidenceCoverage.totalClaims} claims backed by evidence</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Verification Rate</div>
              <div className="mt-2 text-2xl font-semibold text-emerald-400">{verificationSummary?.coverage ?? 0}%</div>
              <p className="mt-1 text-xs text-slate-400">Overall verification rate</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Status</div>
              <div className="mt-2 text-2xl font-semibold text-cyan-400">Active</div>
              <p className="mt-1 text-xs text-slate-400">Cryptographically secure link</p>
            </div>
          </div>
        )}

        {/* Component Breakdown */}
        {snapshot?.components && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Trust Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {snapshot.components.map((comp: { label: string; weight: number; score: number | null; maxScore: number; explanation: string }, idx: number) => (
                <div key={idx} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-sm font-medium text-white">{comp.label}</span>
                      <span className="block text-[10px] text-slate-500 uppercase tracking-wider">Weight: {comp.weight}%</span>
                    </div>
                    <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-lg", comp.score !== null ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/10 text-slate-400 border border-slate-500/20")}>
                      {comp.score !== null ? `${comp.score} / ${comp.maxScore}` : "Missing"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{comp.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
