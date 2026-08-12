"use client";

import { useState, useEffect } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import type { Resume, Evidence } from "@/types/resume";
import type { TrustReport } from "@/types/knowledge-graph";
import { ShieldCheck, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { clsx } from "clsx";
import { GraphService } from "@/services/graph-service";
import { TrustService } from "@/services/trust-service";
import { resumeToGraph } from "@/services/graph-mapper";

export interface TrustViewProps {
  resume?: Resume;
  evidence?: Evidence[];
  trustReport?: TrustReport | null;
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
  const weakClaims = report?.weakClaims ?? [];

  const isEmpty = !resume || (!resume.name && !resume.title && (resume.claims ?? []).length === 0 && evidence.length === 0);

  if (isEmpty || !snapshot) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Professional Trust</h1>
          <p className="text-sm text-slate-400 mt-1">
            Understand and grow how trustworthy your professional profile is — backed by verifiable claims and evidence.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center space-y-3">
          <ShieldCheck className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No trust data yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Verify your credentials, add claims, and attach evidence to start building a trustworthy profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Professional Trust</h1>
        <p className="text-sm text-slate-400 mt-1">
          Understand and grow how trustworthy your professional profile is — backed by verifiable claims and evidence.
        </p>
      </div>

      {/* Overview Banner / Score Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <span className="text-3xl font-bold">{snapshot.overall !== null ? snapshot.overall : "—"}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">Overall Score</span>
        </div>
        <div className="space-y-2 text-center sm:text-left">
          <h2 className="text-lg font-semibold text-white">Evidence-Based Trust Analysis</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your trust score is derived from verification coverage across your professional identity, claims, experience, skills, and attached evidence.
          </p>
          {verification && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> {verification.verified} Verified</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> {verification.pending} Pending</span>
              <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5 text-slate-400" /> {verification.unverified} Unverified</span>
            </div>
          )}
        </div>
      </div>

      {/* Public Share Link Control */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Public Trust Share Link</h3>
        <p className="text-xs text-slate-400">
          Generate a secure, read-only public URL to share your verified professional trust report with employers or clients.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleToggleShare}
            className={clsx(
              "px-4 py-2 rounded-xl text-xs font-semibold transition-colors",
              shareEnabled
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20"
                : "bg-blue-600 hover:bg-blue-500 text-white"
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
                className="bg-slate-900 border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-300 w-full sm:w-80 select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white transition-colors shrink-0"
              >
                {copying ? "Copied!" : "Copy Link"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Evidence Coverage & Summary Grid */}
      {coverage && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Evidence Coverage</div>
            <div className="mt-2 text-2xl font-semibold text-white">{coverage.coveragePercent}%</div>
            <p className="mt-1 text-xs text-slate-400">{coverage.claimsWithEvidence} of {coverage.totalClaims} claims backed by evidence</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Total Evidence Items</div>
            <div className="mt-2 text-2xl font-semibold text-white">{evidence.length}</div>
            <p className="mt-1 text-xs text-slate-400">Attached artifacts & links</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Verification Status</div>
            <div className="mt-2 text-2xl font-semibold text-emerald-400">{verification?.coverage ?? 0}%</div>
            <p className="mt-1 text-xs text-slate-400">Overall verification rate</p>
          </div>
        </div>
      )}

      {/* Component Breakdown / Scoring Factors */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Trust Score Breakdown (Factors & Weights)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshot.components.map((comp, idx) => (
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
              {comp.improvementTip && (
                <p className="text-[11px] text-blue-400/90 italic">Tip: {comp.improvementTip}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Weak Claims / Action Items */}
      {weakClaims.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recommendations & Weak Claims</h3>
          <div className="space-y-3">
            {weakClaims.map((wc, idx) => (
              <div key={idx} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-200 font-medium">{wc.claim.assertion}</p>
                  <p className="text-xs text-amber-300/80">{wc.reasons.join(" · ")}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {wc.priority} priority
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
