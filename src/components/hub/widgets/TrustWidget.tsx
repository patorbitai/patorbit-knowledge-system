"use client";

import Link from "next/link";
import { ShieldCheck, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import WidgetCard from "./WidgetCard";
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
        <div className="space-y-3">
          <div className="flex items-center gap-5">
            {/* Score placeholder */}
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
              <span className="text-xl font-bold text-gray-300 dark:text-slate-600">—</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                No score
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-gray-600 dark:text-slate-300">
                Evidence-Backed Profile
              </p>
              <p className="text-[10px] leading-relaxed text-gray-400 dark:text-slate-500">
                Built from verified credentials, claims, and evidence
              </p>
            </div>
          </div>

          {/* Empty state */}
          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-slate-300">
              No trust data yet
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 leading-relaxed">
              Verify your credentials to build a trustworthy profile
            </p>
            <Link
              href="/trust"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              Verify credentials
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
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
        {/* Live score */}
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5 dark:from-emerald-500/15 dark:to-green-500/5 text-emerald-400">
          <span className="text-xl font-bold">{score}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">
            Score / 100
          </span>
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-200">Evidence-Backed Profile</p>
          {verification ? (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {verification.verified} Verified
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {verification.pending} Pending
              </span>
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 dark:text-slate-500">Derived from your claims and evidence</p>
          )}
        </div>
      </div>
    </WidgetCard>
  );
}
