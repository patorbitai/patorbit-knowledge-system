"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  BarChart3,
  RefreshCw,
  Loader2,
  Lightbulb,
  Users,
} from "lucide-react";
import { clsx } from "clsx";

// ── Types ──────────────────────────────────────────────────────────────────────

type MemoryCategory =
  | "interview_pattern"
  | "skill_gap"
  | "outcome_trend"
  | "role_fit";

interface CareerMemoryInsight {
  id: string;
  category: string;
  insight: string;
  confidence: number;
  evidenceCount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationStats {
  total: number;
  byStatus: Record<string, number>;
  interviewRate: number;
  offerRate: number;
}

interface CareerInsightSummary {
  totalInsights: number;
  byCategory: Record<string, number>;
  topInsights: CareerMemoryInsight[];
  applicationStats: ApplicationStats;
}

// ── Category config ────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  interview_pattern: {
    label: "Interview Pattern",
    icon: Users,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
  },
  skill_gap: {
    label: "Skill Gap",
    icon: AlertTriangle,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  outcome_trend: {
    label: "Outcome Trend",
    icon: TrendingUp,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
  },
  role_fit: {
    label: "Role Fit",
    icon: Target,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return "High confidence";
  if (confidence >= 0.5) return "Moderate confidence";
  return "Low confidence — needs more data";
}

function confidenceColor(confidence: number): string {
  if (confidence >= 0.7) return "text-emerald-400";
  if (confidence >= 0.5) return "text-amber-400";
  return "text-slate-500";
}

// ── Insight Card ───────────────────────────────────────────────────────────────

function InsightCard({ insight }: { insight: CareerMemoryInsight }) {
  const config = CATEGORY_CONFIG[insight.category] || {
    label: insight.category,
    icon: Lightbulb,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
  };
  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className={clsx("h-6 w-6 rounded-lg flex items-center justify-center", config.bgColor)}>
          <Icon className={clsx("w-3.5 h-3.5", config.color)} />
        </div>
        <span className={clsx("text-[10px] font-semibold uppercase tracking-wider", config.color)}>
          {config.label}
        </span>
        <span className="ml-auto text-[10px] text-slate-600">
          {insight.evidenceCount} data point{insight.evidenceCount !== 1 ? "s" : ""}
        </span>
      </div>
      <p className="text-[12px] text-slate-300 leading-relaxed">{insight.insight}</p>
      <div className="flex items-center gap-2">
        <span className={clsx("text-[10px] font-medium", confidenceColor(insight.confidence))}>
          {confidenceLabel(insight.confidence)}
        </span>
      </div>
    </div>
  );
}

// ── Stats Row ──────────────────────────────────────────────────────────────────

function StatsRow({ stats }: { stats: ApplicationStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total Applications" value={stats.total} icon={BarChart3} color="text-cyan-400" />
      <StatCard
        label="Interview Rate"
        value={`${stats.interviewRate}%`}
        icon={TrendingUp}
        color="text-violet-400"
      />
      <StatCard label="Offer Rate" value={`${stats.offerRate}%`} icon={Target} color="text-emerald-400" />
      <StatCard
        label="Insights"
        value={Object.values(stats.byStatus).reduce((a, b) => a + b, 0) > 0 ? "Active" : "Pending"}
        icon={Brain}
        color="text-amber-400"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className={clsx("w-3 h-3", color)} />
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-slate-200">{value}</p>
    </div>
  );
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <Brain className="w-10 h-10 text-slate-600 mb-3" />
      <p className="text-sm font-medium text-slate-300 mb-1">No career insights yet</p>
      <p className="text-[11px] text-slate-500 max-w-sm">
        Career Memory learns from your application outcomes. Apply for jobs, record
        interviews, and track outcomes to start building personalized career insights.
      </p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function CareerInsightsPanel() {
  const [summary, setSummary] = useState<CareerInsightSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/career-memory");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to load career memory");
      }
      const data: CareerInsightSummary = await res.json();
      setSummary(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <Loader2 className="w-8 h-8 text-slate-500 animate-spin mb-3" />
        <p className="text-sm text-slate-400">Loading career insights...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" />
        <p className="text-sm text-slate-300 mb-1">Unable to load career insights</p>
        <p className="text-[11px] text-slate-500 mb-4">{error}</p>
        <button
          onClick={fetchInsights}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.12] transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (!summary || summary.totalInsights === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Stats overview */}
      <StatsRow stats={summary.applicationStats} />

      {/* Trust notice */}
      <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
        <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-400">About these insights:</span>{" "}
          Career Memory derives patterns from your actual application outcomes. Insights
          require multiple data points before they surface — a single interview or
          rejection never creates a broad conclusion.
        </p>
      </div>

      {/* Insights list */}
      <div className="space-y-3">
        {summary.topInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-center">
        <button
          onClick={fetchInsights}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.12] transition-all"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh insights
        </button>
      </div>
    </div>
  );
}
