"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Resume, Evidence } from "@/types/resume";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Globe,
  Award,
  FileText,
  Sparkles,
  Users,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { IdentityNav } from "./IdentityNav";
import { clsx } from "clsx";
import type { ServerTrustReportV2, ClaimTrust } from "@/lib/trust/v2/types";

export interface TrustViewProps {
  resume?: Resume;
  evidence?: Evidence[];
  trustReport?: ServerTrustReportV2 | null;
}

function getScoreStatus(score: number | null): string {
  if (score === null) return "Not Evaluated";
  if (score >= 90) return "Highly Supported";
  if (score >= 70) return "Strong";
  if (score >= 40) return "Supported";
  if (score > 0) return "Developing";
  return "Unrated";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 40) return "text-amber-400";
  if (score > 0) return "text-orange-400";
  return "text-slate-500";
}

function getScoreBg(score: number): string {
  if (score >= 90) return "bg-emerald-500/10 border-emerald-500/30";
  if (score >= 70) return "bg-cyan-500/10 border-cyan-500/30";
  if (score >= 40) return "bg-amber-500/10 border-amber-500/30";
  if (score > 0) return "bg-orange-500/10 border-orange-500/30";
  return "bg-slate-500/10 border-slate-500/30";
}

function getFactorColor(label: string): { bg: string; text: string; gradient: string } {
  const l = label.toLowerCase();
  if (l.includes("cert") || l.includes("credential")) {
    return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", text: "text-emerald-400", gradient: "from-emerald-400 to-cyan-400" };
  }
  if (l.includes("claim") || l.includes("evidence")) {
    return { bg: "bg-amber-500/10 text-amber-400 border-amber-500/20", text: "text-amber-400", gradient: "from-amber-400 to-yellow-500" };
  }
  if (l.includes("experience") || l.includes("work")) {
    return { bg: "bg-blue-500/10 text-blue-400 border-blue-500/20", text: "text-blue-400", gradient: "from-blue-400 to-indigo-500" };
  }
  if (l.includes("portfolio") || l.includes("network")) {
    return { bg: "bg-teal-500/10 text-teal-400 border-teal-500/20", text: "text-teal-400", gradient: "from-teal-400 to-cyan-400" };
  }
  if (l.includes("skill")) {
    return { bg: "bg-purple-500/10 text-purple-400 border-purple-500/20", text: "text-purple-400", gradient: "from-purple-400 to-indigo-500" };
  }
  if (l.includes("identity") || l.includes("engagement") || l.includes("activity")) {
    return { bg: "bg-pink-500/10 text-pink-400 border-pink-500/20", text: "text-pink-400", gradient: "from-pink-400 to-rose-500" };
  }
  return { bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", text: "text-cyan-400", gradient: "from-cyan-400 to-blue-500" };
}

function getFactorIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("cert") || l.includes("credential")) return <Award className="w-4 h-4 text-emerald-400" />;
  if (l.includes("claim") || l.includes("evidence")) return <FileText className="w-4 h-4 text-amber-400" />;
  if (l.includes("experience") || l.includes("work")) return <Briefcase className="w-4 h-4 text-blue-400" />;
  if (l.includes("portfolio") || l.includes("network")) return <Globe className="w-4 h-4 text-teal-400" />;
  if (l.includes("skill")) return <Sparkles className="w-4 h-4 text-purple-400" />;
  if (l.includes("reference")) return <Users className="w-4 h-4 text-teal-400" />;
  return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
}

function getEvidenceLevelBadge(level: string) {
  switch (level) {
    case "verified":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" /> Verified
        </span>
      );
    case "reviewed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          <FileText className="w-3 h-3" /> Reviewed
        </span>
      );
    case "attached":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
          <Award className="w-3 h-3" /> Attached
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
          <Clock className="w-3 h-3" /> Self-asserted
        </span>
      );
  }
}

function CircularScoreGauge({ score }: { score: number | null }) {
  const safeScore = score ?? 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(safeScore, 100) / 100);
  const status = getScoreStatus(score);
  const scoreColor = getScoreColor(safeScore);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90" aria-hidden="true">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" className="stroke-white/[0.06]" />
          <circle
            cx="50" cy="50" r={radius} fill="none" strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
            style={{ stroke: "url(#trustGradient)" }}
          />
          <defs>
            <linearGradient id="trustGradient" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={clsx("text-3xl font-extrabold leading-none font-mono", scoreColor)}>
              {score !== null ? score : "—"}
            </span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">/ 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">OVERALL SCORE</span>
        <span className={clsx("inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold border", getScoreBg(safeScore), getScoreColor(safeScore))}>
          {status}
        </span>
      </div>
    </div>
  );
}

function ClaimTrustCard({ ct }: { ct: ClaimTrust }) {
  const pct = Math.min(ct.score, 100);

  return (
    <div className="rounded-xl border border-[rgba(148,163,184,.14)] bg-[#070d18] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-white truncate">{ct.claimType}</h4>
            {getEvidenceLevelBadge(ct.evidenceLevel)}
          </div>
          {ct.assertionText && (
            <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">{ct.assertionText}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={clsx("text-lg font-extrabold font-mono", getScoreColor(ct.score))}>
            {ct.score}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={clsx("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all duration-500", getFactorColor(ct.claimType).gradient)}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Factors */}
      <div className="space-y-1.5">
        {ct.factors.map((factor, idx) => (
          <div key={idx} className={clsx(
            "text-[11px] flex items-start gap-1.5",
            factor.type === "supporting" ? "text-emerald-400/80" : factor.type === "reducing" ? "text-rose-400/80" : "text-slate-500"
          )}>
            {factor.type === "supporting" ? (
              <TrendingUp className="w-3 h-3 mt-0.5 shrink-0" />
            ) : factor.type === "reducing" ? (
              <TrendingDown className="w-3 h-3 mt-0.5 shrink-0" />
            ) : (
              <span className="w-3 h-3 shrink-0" />
            )}
            <span>{factor.label}: {factor.description}</span>
          </div>
        ))}
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
        <span>Evidence: {ct.evidenceCount} ({ct.evidenceDiversity} type{ct.evidenceDiversity !== 1 ? "s" : ""})</span>
        <span>Verification: {ct.verificationStatus}</span>
        {ct.activeConflictCount > 0 && (
          <span className="text-rose-400">{ct.activeConflictCount} conflict{ct.activeConflictCount !== 1 ? "s" : ""}</span>
        )}
        {ct.gateBlocked && ct.gateReason && (
          <span className="text-amber-400">⚠ {ct.gateReason}</span>
        )}
      </div>
    </div>
  );
}

export function TrustView({
  resume: propResume,
  evidence: propEvidence,
  trustReport: propTrustReport,
}: TrustViewProps = {}) {
  const storeResume = useResumeBuilder((s) => s.resume);
  const storeEvidence = useResumeBuilder((s) => s.evidence ?? []);

  const resume = propResume ?? storeResume;
  const evidence = propEvidence ?? storeEvidence;

  const [serverTrustReport, setServerTrustReport] = useState<ServerTrustReportV2 | null>(null);
  const [loading, setLoading] = useState(!propTrustReport);
  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  // Fetch server-derived Trust v2 on mount
  useEffect(() => {
    if (propTrustReport) return;
    setLoading(true);
    fetch("/api/trust")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.score === "number" && data.algorithmVersion === "v2") {
          setServerTrustReport(data as ServerTrustReportV2);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [propTrustReport]);

  const report = propTrustReport ?? serverTrustReport;

  useEffect(() => {
    fetch("/api/trust/share")
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setShareEnabled(true);
          setShareUrl(data.shareUrl);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleShare = async () => {
    const action = shareEnabled ? "disable" : "enable";
    const res = await fetch("/api/trust/share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (res.ok) {
      setShareEnabled(data.enabled);
      setShareUrl(data.shareUrl ?? null);
    }
  };

  const handleCopyLink = () => {
    if (!shareUrl) return;
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  const summary = report?.summary;
  const verification = summary ? {
    total: summary.totalClaims,
    verified: summary.verifiedClaims,
    pending: 0,
    unverified: summary.totalClaims - summary.verifiedClaims,
    coverage: summary.verificationRate,
  } : null;
  const coverage = summary ? {
    totalClaims: summary.totalClaims,
    claimsWithEvidence: summary.claimsWithEvidence,
    claimsWithoutEvidence: summary.claimsWithoutEvidence,
    coveragePercent: summary.evidenceCoveragePercent,
  } : null;

  const isEmpty = !report || (!resume?.name && !resume?.title && (resume?.claims ?? []).length === 0 && evidence.length === 0 && report.claimTrusts.length === 0);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 font-sans space-y-8">
        <IdentityNav />
        <div className="rounded-2xl border border-gray-200 dark:border-[rgba(148,163,184,.14)] bg-white dark:bg-gradient-to-br dark:from-[rgba(10,18,32,0.96)] dark:to-[rgba(7,14,26,0.92)] p-12 text-center space-y-3 shadow-xl">
          <ShieldCheck className="w-10 h-10 text-cyan-500 dark:text-cyan-400 mx-auto animate-pulse" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Loading trust data…</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            Deriving trust from your claims, evidence, verification history, and conflicts.
          </p>
        </div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 font-sans space-y-8">
        <IdentityNav />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mt-1">Professional Trust</h1>
          <p className="text-sm text-[#a9b9cf] font-light mt-1">
            Understand how strongly your professional claims are supported by evidence and verification history.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-[rgba(148,163,184,.14)] bg-white dark:bg-gradient-to-br dark:from-[rgba(10,18,32,0.96)] dark:to-[rgba(7,14,26,0.92)] p-12 text-center space-y-3 shadow-xl">
          <ShieldCheck className="w-10 h-10 text-cyan-500 dark:text-cyan-400 mx-auto" />
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">No trust data yet</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
            Your Trust Score will become more meaningful as you add professional claims, attach evidence, and request verification.
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500 max-w-md mx-auto">
            Start by building your professional identity in the Resume Builder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 font-sans space-y-10">
      <IdentityNav />
      {/* PAGE HEADER */}
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
          Professional Trust
        </h1>
        <p className="text-sm text-[#a9b9cf] font-light max-w-2xl leading-relaxed">
          Understand how strongly your professional claims are supported by evidence, verification history, and conflict resolution.
        </p>
        <p className="text-[10px] text-slate-500 font-mono">
          Algorithm v{report?.algorithmVersion ?? "v2"} • Derived {report?.derivedAt ? new Date(report.derivedAt).toLocaleString() : "—"}
        </p>
      </div>

      {/* MAIN TRUST HERO (SCORE & ANALYSIS) */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-8 items-center relative z-10">

          {/* Left: Trust Score Gauge */}
          <div className="flex justify-center border-b lg:border-b-0 lg:border-r border-[rgba(148,163,184,.14)] pb-6 lg:pb-0 lg:pr-8">
            <CircularScoreGauge score={report?.score ?? null} />
          </div>

          {/* Center: Summary & Factors */}
          <div className="space-y-4">
            <div className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#60a5fa]">EVIDENCE-BASED TRUST ANALYSIS</div>
            <h2 className="text-xl font-bold text-white tracking-tight">Trust Breakdown</h2>
            <p className="text-xs sm:text-sm text-[#cbd5e1] font-light leading-relaxed">
              Your trust score is derived from per-claim evidence strength, verification status, active conflicts, and the aggregate support across all professional claims.
            </p>
            {verification && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {verification.verified} Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold shadow-sm">
                  <Clock className="w-3.5 h-3.5 text-amber-400" /> {verification.pending} Pending
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20 font-semibold shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> {verification.unverified} Unverified
                </span>
              </div>
            )}

            {/* Supporting & Reducing Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {report?.supportingFactors && report.supportingFactors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Supporting
                  </div>
                  {report.supportingFactors.map((f, i) => (
                    <p key={i} className="text-[11px] text-emerald-400/70 leading-relaxed">{f.description}</p>
                  ))}
                </div>
              )}
              {report?.reducingFactors && report.reducingFactors.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> Reducing
                  </div>
                  {report.reducingFactors.map((f, i) => (
                    <p key={i} className="text-[11px] text-rose-400/70 leading-relaxed">{f.description}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PUBLIC TRUST SHARE LINK CARD */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Public Trust Share Link</h3>
              <p className="text-xs text-[#a9b9cf] mt-0.5">
                Generate a secure, read-only public URL to share your professional trust report with employers or clients.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-[rgba(148,163,184,.1)]">
          <button
            onClick={handleToggleShare}
            className={clsx(
              "px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer",
              shareEnabled
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-blue-500/20 hover:brightness-110"
            )}
          >
            {shareEnabled ? "Revoke / Disable Public Share" : "Enable Public Share"}
          </button>
          {shareEnabled && shareUrl && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}${shareUrl}`}
                className="bg-[#070d18] border border-[rgba(148,163,184,.2)] rounded-xl px-3 py-2 text-xs text-slate-300 w-full sm:w-80 select-all font-mono"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-white transition-colors shrink-0 cursor-pointer"
              >
                {copying ? "Copied!" : "Copy Link"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* TRUST METRICS (3 CARDS) */}
      {coverage && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">EVIDENCE COVERAGE</div>
              <FileText className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{coverage.coveragePercent}%</div>
            <p className="text-xs text-[#a9b9cf]">{coverage.claimsWithEvidence} of {coverage.totalClaims} claims backed by evidence</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">TOTAL EVIDENCE</div>
              <Award className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">{summary?.totalEvidence ?? 0}</div>
            <p className="text-xs text-[#a9b9cf]">Attached artifacts & links</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">ACTIVE CONFLICTS</div>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className={clsx("text-3xl font-extrabold font-mono", (summary?.activeConflicts ?? 0) > 0 ? "text-rose-400" : "text-emerald-400")}>
              {summary?.activeConflicts ?? 0}
            </div>
            <p className="text-xs text-[#a9b9cf]">Unresolved professional conflicts</p>
          </div>
        </section>
      )}

      {/* PER-CLAIM TRUST BREAKDOWN */}
      {report?.claimTrusts && report.claimTrusts.length > 0 && (
        <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-6 shadow-xl">
          <div className="border-b border-[rgba(148,163,184,.1)] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">PER-CLAIM TRUST BREAKDOWN</h3>
            <p className="text-[11px] text-[#94a3b8] mt-1">
              Each claim is scored independently based on its evidence support, verification status, and active conflicts.
            </p>
          </div>
          <div className="space-y-3">
            {report.claimTrusts.map((ct) => (
              <ClaimTrustCard key={ct.claimId} ct={ct} />
            ))}
          </div>
        </section>
      )}

      {/* HOW TO IMPROVE */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-5 shadow-xl">
        <div className="border-b border-[rgba(148,163,184,.1)] pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">HOW TO IMPROVE YOUR TRUST</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
            <h4 className="text-xs font-bold text-white">Verify credentials</h4>
            <p className="text-[11px] text-[#94a3b8]">Request verification for your claims to increase verification strength.</p>
            <Link href="/trust" className="text-xs font-bold text-cyan-400 hover:underline">Verify claims →</Link>
          </div>
          <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
            <h4 className="text-xs font-bold text-white">Add diverse evidence</h4>
            <p className="text-[11px] text-[#94a3b8]">Attach multiple types of evidence to strengthen your claims.</p>
            <Link href="/resume-builder" className="text-xs font-bold text-cyan-400 hover:underline">Add evidence →</Link>
          </div>
          <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
            <h4 className="text-xs font-bold text-white">Resolve conflicts</h4>
            <p className="text-[11px] text-[#94a3b8]">Review and resolve active professional conflicts.</p>
            <Link href="/trust" className="text-xs font-bold text-cyan-400 hover:underline">View conflicts →</Link>
          </div>
          <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
            <h4 className="text-xs font-bold text-white">Grow your profile</h4>
            <p className="text-[11px] text-[#94a3b8]">Add more professional claims backed by evidence.</p>
            <Link href="/resume-builder" className="text-xs font-bold text-cyan-400 hover:underline">Update profile →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
