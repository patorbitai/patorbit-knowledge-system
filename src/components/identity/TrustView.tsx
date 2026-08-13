"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Resume, Evidence } from "@/types/resume";
import type { TrustReport } from "@/types/knowledge-graph";
import { ShieldCheck, CheckCircle2, Clock, Globe, Share2, Award, FileText, Lock } from "lucide-react";
import { clsx } from "clsx";
import { GraphService } from "@/services/graph-service";
import { TrustService } from "@/services/trust-service";
import { resumeToGraph } from "@/services/graph-mapper";

export interface TrustViewProps {
  resume?: Resume;
  evidence?: Evidence[];
  trustReport?: TrustReport | null;
}

function getScoreStatus(score: number | null): string {
  if (score === null) return "Not Evaluated";
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

function CircularScoreGauge({ score }: { score: number | null }) {
  const safeScore = score ?? 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(safeScore, 100) / 100);
  const status = getScoreStatus(score);

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
          <span className="text-3xl font-extrabold text-white leading-none font-mono">{score !== null ? score : "—"}</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">/ 100</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">OVERALL SCORE</span>
        <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
          {status}
        </span>
      </div>
    </div>
  );
}

export function TrustView({
  resume: propResume,
  evidence: propEvidence,
  trustReport: propTrustReport,
}: TrustViewProps = {}) {
  const storeTrustReport = useResumeBuilder((s) => s.trustReport);
  const storeTrustScore = useResumeBuilder((s) => s.trustScore);
  const storeResume = useResumeBuilder((s) => s.resume);
  const storeEvidence = useResumeBuilder((s) => s.evidence ?? []);

  const trustReport = propTrustReport ?? storeTrustReport;
  const trustScore = storeTrustScore;
  const resume = propResume ?? storeResume;
  const evidence = propEvidence ?? storeEvidence;

  const [shareEnabled, setShareEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  // Fallback computation if trustReport is not yet cached in store
  let report = trustReport;
  if (!report && resume) {
    try {
      const graphService = new GraphService();
      const trustService = new TrustService(graphService);
      const graph = resumeToGraph(resume, "user-input", evidence);
      graphService.setGraph(graph);
      report = trustService.calculateTrustReport();
    } catch (e) {
      console.error(e);
    }
  }

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
      body: JSON.stringify({ action, trustReport: report }),
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

  const snapshot = report?.snapshot ?? trustScore;
  const verification = report?.verificationSummary;
  const coverage = report?.evidenceCoverage;

  const isEmpty = !resume || (!resume.name && !resume.title && (resume.claims ?? []).length === 0 && evidence.length === 0);

  if (isEmpty || !snapshot) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 text-[#f8fafc] font-sans space-y-8">
        <div>
          <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">VERIFICATION & CREDIBILITY</div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Professional Trust</h1>
          <p className="text-sm text-[#a9b9cf] font-light mt-1">
            Understand and grow how trustworthy your professional profile is — backed by verifiable claims and evidence.
          </p>
        </div>
        <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-12 text-center space-y-3 shadow-xl">
          <ShieldCheck className="w-10 h-10 text-cyan-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No trust data yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Verify your credentials, add claims, and attach evidence to start building a trustworthy profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 text-[#f8fafc] font-sans selection:bg-cyan-500/30 space-y-10">
      
      {/* ── PAGE HEADER ── */}
      <div className="space-y-2">
        <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">VERIFICATION & CREDIBILITY</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-cyan-400" />
          Professional Trust
        </h1>
        <p className="text-sm text-[#a9b9cf] font-light max-w-2xl leading-relaxed">
          Understand and grow how trustworthy your professional profile is — backed by verifiable claims and evidence.
        </p>
      </div>

      {/* ── MAIN TRUST HERO (SCORE & ANALYSIS & TREND) ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-8 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_300px] gap-8 items-center">
          {/* Score Gauge */}
          <div className="flex justify-center border-b lg:border-b-0 lg:border-r border-[rgba(148,163,184,.14)] pb-6 lg:pb-0 lg:pr-8">
            <CircularScoreGauge score={snapshot.overall} />
          </div>

          {/* Analysis description & counts */}
          <div className="space-y-4">
            <div className="text-[11px] font-extrabold tracking-[0.15em] uppercase text-[#60a5fa]">EVIDENCE-BASED TRUST ANALYSIS</div>
            <h2 className="text-xl font-bold text-white tracking-tight">Profile Verification Breakdown</h2>
            <p className="text-xs sm:text-sm text-[#cbd5e1] font-light leading-relaxed">
              Your trust score is derived from verification coverage across your professional identity, claims, experience, skills, and attached evidence.
            </p>
            {verification && (
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {verification.verified} Verified
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                  <Clock className="w-3.5 h-3.5" /> {verification.pending} Pending
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-500/10 text-slate-300 border border-slate-500/20 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> {verification.unverified} Unverified
                </span>
              </div>
            )}
          </div>

          {/* Score Trend Card */}
          <div className="rounded-xl border border-[rgba(148,163,184,.14)] bg-[#070d18] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-[rgba(148,163,184,.1)] pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider">SCORE TREND</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">90 Days</span>
            </div>
            <div className="h-32 rounded-lg bg-[rgba(255,255,255,.02)] border border-[rgba(148,163,184,.08)] flex flex-col items-center justify-center text-center p-3">
              <Clock className="w-6 h-6 text-slate-500 mb-1" />
              <p className="text-xs font-medium text-white">No score history yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Your trust score history will appear as your profile develops.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── PUBLIC TRUST SHARE LINK CARD ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">PUBLIC TRUST SHARE LINK</h3>
              <p className="text-xs text-[#a9b9cf] mt-0.5">
                Generate a secure, read-only public URL to share your verified professional trust report with employers or clients.
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
            {shareEnabled ? "Revoke / Disable Public Share" : "Enable Public Share →"}
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

      {/* ── TRUST METRICS (3 CARDS) ── */}
      {coverage && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 shadow-xl space-y-2">
            <div className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">EVIDENCE COVERAGE</div>
            <div className="text-3xl font-extrabold text-white font-mono">{coverage.coveragePercent}%</div>
            <p className="text-xs text-[#a9b9cf]">{coverage.claimsWithEvidence} of {coverage.totalClaims} claims backed by evidence</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 shadow-xl space-y-2">
            <div className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">TOTAL EVIDENCE ITEMS</div>
            <div className="text-3xl font-extrabold text-white font-mono">{evidence.length}</div>
            <p className="text-xs text-[#a9b9cf]">Attached artifacts & links</p>
          </div>
          <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 shadow-xl space-y-2">
            <div className="text-[10px] text-[#71839b] font-bold uppercase tracking-wider">VERIFICATION STATUS</div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">{verification?.coverage ?? 0}%</div>
            <p className="text-xs text-[#a9b9cf]">Overall verification rate</p>
          </div>
        </section>
      )}

      {/* ── TRUST SCORE BREAKDOWN & IMPROVEMENT GUIDANCE (2 COLUMNS) ── */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left 2 Cols: Trust Score Breakdown */}
        <div className="lg:col-span-2 rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-6 shadow-xl">
          <div className="border-b border-[rgba(148,163,184,.1)] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">TRUST SCORE BREAKDOWN (FACTORS & WEIGHTS)</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {snapshot.components.map((comp, idx) => {
              const compScore = comp.score ?? 0;
              const compMax = comp.maxScore ?? 100;
              const pct = Math.min(Math.round((compScore / compMax) * 100), 100);

              return (
                <div key={idx} className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-[#070d18] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white">{comp.label}</h4>
                      <span className="text-[10px] font-extrabold text-[#71839b] uppercase tracking-wider">Weight {comp.weight}%</span>
                    </div>
                    <span className="text-xs font-bold text-white font-mono">
                      {comp.score !== null ? `${comp.score} / ${comp.maxScore}` : "0 / 100"}
                    </span>
                  </div>

                  <p className="text-xs text-[#a9b9cf] leading-relaxed">{comp.explanation}</p>

                  <div className="space-y-1 pt-1">
                    <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>{pct}%</span>
                      {comp.improvementTip && <span className="text-cyan-400 truncate max-w-[180px]" title={comp.improvementTip}>Tip: {comp.improvementTip}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: How to Improve Your Score */}
        <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 space-y-5 shadow-xl">
          <div className="border-b border-[rgba(148,163,184,.1)] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">HOW TO IMPROVE YOUR SCORE</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Verify more credentials</h4>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Add and verify degrees, certifications & licenses</p>
                </div>
                <Link href="/trust" className="text-xs font-bold text-cyan-400 hover:underline shrink-0">
                  Verify credentials →
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Add stronger evidence</h4>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Attach supporting documents, links and proof to your claims</p>
                </div>
                <Link href="/resume-builder" className="text-xs font-bold text-cyan-400 hover:underline shrink-0">
                  Add evidence →
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Grow your network</h4>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Connect with professionals and peers across your profile</p>
                </div>
                <Link href="/network/graph" className="text-xs font-bold text-cyan-400 hover:underline shrink-0">
                  Explore network →
                </Link>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[rgba(148,163,184,.12)] bg-[#070d18] space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white">Keep your profile updated</h4>
                  <p className="text-xs text-[#94a3b8] mt-0.5">Regularly update your experience, skills, and summary</p>
                </div>
                <Link href="/resume-builder" className="text-xs font-bold text-cyan-400 hover:underline shrink-0">
                  Update profile →
                </Link>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[rgba(148,163,184,.1)] text-right">
            <Link href="/docs" className="text-[11px] font-semibold text-slate-400 hover:text-white transition-colors">
              Learn more about Trust Score ↗
            </Link>
          </div>
        </div>

      </section>

    </div>
  );
}
