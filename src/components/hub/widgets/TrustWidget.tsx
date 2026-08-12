"use client";

import { ShieldCheck, CheckCircle2, Clock } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";
import { useResumeBuilder } from "@/store/resume-builder";
import { GraphService } from "@/services/graph-service";
import { TrustService } from "@/services/trust-service";
import { resumeToGraph } from "@/services/graph-mapper";

export default function TrustWidget() {
  const trustScore = useResumeBuilder((s) => s.trustScore);
  const trustReport = useResumeBuilder((s) => s.trustReport);
  const resume = useResumeBuilder((s) => s.resume);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);

  let score = trustScore?.overall ?? trustReport?.snapshot?.overall ?? null;
  let verification = trustReport?.verificationSummary;

  if (score === null && resume) {
    try {
      const graphService = new GraphService();
      const trustService = new TrustService(graphService);
      const graph = resumeToGraph(resume, "user-input", evidence);
      graphService.setGraph(graph);
      const report = trustService.calculateTrustReport();
      score = report.snapshot.overall;
      verification = report.verificationSummary;
    } catch (e) {
      console.error(e);
    }
  }

  const isEmpty = !resume || (!resume.name && !resume.title && (resume.claims ?? []).length === 0 && evidence.length === 0 && score === null);

  if (isEmpty || score === null) {
    return (
      <WidgetCard
        title="Trust Score"
        icon={ShieldCheck}
        action={{ label: "View trust", href: "/trust" }}
      >
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <span className="text-2xl font-bold text-slate-600">—</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              No score
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Your trust score is built from verified credentials, claims, and
            evidence. Complete verification to establish your score.
          </p>
        </div>
        <div className="mt-4">
          <EmptyState
            title="No trust data yet"
            description="Verify your credentials to start building a trustworthy profile."
            cta={{ label: "Verify credentials", href: "/trust" }}
          />
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard
      title="Trust Score"
      icon={ShieldCheck}
      action={{ label: "View trust", href: "/trust" }}
    >
      <div className="flex items-center gap-5">
        <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">
            Score / 100
          </span>
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-200">Evidence-Backed Profile</p>
          {verification ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> {verification.verified} Verified</span>
              <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3 text-amber-400" /> {verification.pending} Pending</span>
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">Derived from your claims and attached evidence.</p>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
