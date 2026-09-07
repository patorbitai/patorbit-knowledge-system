"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import WidgetCard from "./WidgetCard";
import type { ServerTrustReport } from "@/lib/trust/types";

export default function TrustWidget() {
  const [report, setReport] = useState<ServerTrustReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trust")
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.score === "number") {
          setReport(data as ServerTrustReport);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const score = report?.score ?? null;
  const summary = report?.summary;

  if (loading || score === null) {
    return (
      <WidgetCard
        title="Trust Score"
        icon={ShieldCheck}
        action={{ label: "View trust", href: "/trust" }}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
              <span className="text-xl font-bold text-gray-300 dark:text-slate-600">—</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
                {loading ? "Loading…" : "No score"}
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

          <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-4 text-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/15 dark:to-green-500/15 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            </div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-slate-300">
              Your Trust Score starts here
            </p>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 leading-relaxed">
              Your score becomes more meaningful as your professional information and supporting evidence grow.
            </p>
            <Link
              href="/trust"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              View Trust Score
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
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5 dark:from-emerald-500/15 dark:to-green-500/5 text-emerald-400">
          <span className="text-xl font-bold">{score}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400/70">
            {report?.level ?? "Unrated"}
          </span>
        </div>
        <div className="space-y-1.5 min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-200">Evidence-Backed Profile</p>
          {summary ? (
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {summary.verifiedClaims} Verified
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                {summary.totalClaims - summary.verifiedClaims} Pending
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
