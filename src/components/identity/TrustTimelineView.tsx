"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { History } from "lucide-react";
import { useState, useMemo } from "react";
import { GraphService } from "@/services/graph-service";
import { resumeToGraph } from "@/services/graph-mapper";
import { sortTimelineEvents, TimelineEventItem } from "@/utils/timeline-sort";

export function TrustTimelineView({
  embedded = false,
}: {
  /** Compact, headerless variant for embedding inside a workspace (e.g. Professional Preview). */
  embedded?: boolean;
} = {}) {
  const resume = useResumeBuilder((s) => s.resume);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);
  // Reuse the pipeline's cached trust report (set by IdentityPipelineBootstrap
  // on mount and on claim/evidence change). Trust numbers are never computed
  // or invented here — missing data renders honestly as "—".
  const trustReport = useResumeBuilder((s) => s.trustReport);
  const [sortDirection, setSortDirection] = useState<"oldest-to-newest" | "newest-to-oldest">("oldest-to-newest");

  // The timeline is real, derived data — build the graph only to read it.
  // No TrustService is constructed here; the cached pipeline report above is
  // the single source of trust numbers.
  const graph = useMemo(() => {
    try {
      if (!resume) return null;
      return resumeToGraph(resume, "user-input", evidence);
    } catch {
      return null;
    }
  }, [resume, evidence]);

  const rawTimeline = useMemo(() => {
    if (!graph) return [];
    const gs = new GraphService();
    gs.setGraph(graph);
    return gs.getCareerTimeline();
  }, [graph]);

  const timeline = useMemo(() => {
    const items: TimelineEventItem[] = rawTimeline.map((item) => ({
      ...item,
      isCurrent: item.type === "role-end" && item.label.startsWith("Current"),
    }));
    return sortTimelineEvents(items, sortDirection);
  }, [rawTimeline, sortDirection]);

  const totalEvents = timeline.length;

  // Real metrics only — from the pipeline's cached report. Missing data
  // renders as "—" (below); no fallback/estimated values are ever presented.
  const verifiedEvents: number | null = trustReport?.verificationSummary?.verified ?? null;
  const trustScoreImpact: number | null = trustReport?.snapshot?.overall ?? null;

  // Journey Started — the earliest actual timeline event date. The metrics
  // panel only renders when a timeline exists, so this is always real here.
  const oldestToNewestAll = useMemo(
    () => sortTimelineEvents(rawTimeline.map((i) => ({ ...i })), "oldest-to-newest"),
    [rawTimeline],
  );
  const journeyStarted: string | null =
    oldestToNewestAll.length > 0 ? oldestToNewestAll[0].date : null;

  if (!resume || rawTimeline.length === 0) {
    return (
      <div className={`${embedded ? "max-w-6xl px-4 py-6 space-y-8" : "mx-auto max-w-6xl px-4 py-8 lg:px-12"} font-sans space-y-8`}>
        {!embedded && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">TRUST & VERIFICATION</div>
              <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Trust Timeline</h1>
              <p className="text-sm text-[#a9b9cf] font-light mt-1">
                Track verification history, trust score updates, and professional milestones over time.
              </p>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-12 text-center space-y-3 shadow-xl">
          <History className="w-10 h-10 text-cyan-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">No trust timeline history yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Verification events, professional milestones, and trust score evolutions will appear here as your profile evolves.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${embedded ? "max-w-6xl px-4 sm:px-6 py-6 lg:px-8" : "mx-auto max-w-6xl px-4 py-8 lg:px-12"} font-sans space-y-8`}>
      
      {/* ── HEADER & SORT CONTROL (title hidden when embedded — the host workspace provides it) ── */}
      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 pb-2 ${embedded ? "sm:justify-end" : "justify-between"}`}>
        {!embedded && (
          <div>
            <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">TRUST & VERIFICATION</div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">Trust Timeline</h1>
            <p className="text-sm text-[#a9b9cf] font-light mt-1">
              Track verification history, trust score updates, and professional milestones over time.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-[#94a3b8] font-medium">Sort by</span>
          <select
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value as any)}
            className="rounded-xl border border-[rgba(148,163,184,.2)] bg-[#070d18] px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer"
            aria-label="Sort timeline events"
          >
            <option value="oldest-to-newest">Oldest to Newest</option>
            <option value="newest-to-oldest">Newest to Oldest</option>
          </select>
        </div>
      </div>

      {/* ── SUMMARY METRICS PANEL ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl p-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(148,163,184,.14)]">
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">#</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{totalEvents}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Total Events</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">✓</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{verifiedEvents !== null ? verifiedEvents : "—"}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Verified Events</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">+</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{trustScoreImpact !== null ? `+${trustScoreImpact}` : "—"}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Trust Score Impact</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">📅</div>
            <div>
              <b className="text-xl font-bold text-white font-mono truncate max-w-[120px] block">{journeyStarted ?? "—"}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Journey Started</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CHRONOLOGICAL TIMELINE ── */}
      <section className="relative pt-4 pb-8 space-y-6">
        {/* Continuous timeline line */}
        <div className="absolute left-[88px] sm:left-[112px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#22d3ee] via-[#3b82f6] to-[#a855f7] opacity-40 pointer-events-none hidden sm:block" />

        <div className="space-y-6">
          {timeline.map((event, idx) => {
            const isCurrent = event.isCurrent || event.label.includes("Current");

            // Honest per-type badges — no "UPCOMING" heuristics and no blanket
            // "VERIFIED" label (verification is per-claim, not per-event).
            let badgeText = "MILESTONE";
            let badgeClass = "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
            let nodeColor = "bg-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,.65)]";
            let eventTypeLabel = "Milestone";

            if (isCurrent) {
              badgeText = "CURRENT";
              badgeClass = "bg-purple-500/10 text-purple-300 border-purple-500/30";
              nodeColor = "bg-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,.8)]";
              eventTypeLabel = "Current";
            } else {
              switch (event.type) {
                case "role-start":
                  badgeText = "STARTED";
                  eventTypeLabel = "Role Start";
                  break;
                case "role-end":
                  badgeText = "COMPLETED";
                  eventTypeLabel = "Role End";
                  break;
                case "education":
                  badgeText = "EDUCATION";
                  eventTypeLabel = "Education";
                  break;
                case "project":
                  badgeText = "PROJECT";
                  eventTypeLabel = "Project";
                  break;
                case "certification":
                  badgeText = "CERTIFICATION";
                  eventTypeLabel = "Certification";
                  break;
              }
            }

            let dateDisplay = event.date;
            if (dateDisplay.toLowerCase().includes("present")) {
              dateDisplay = "Present";
            }

            return (
              <div key={`${event.nodeId}-${event.type}-${idx}`} className="grid grid-cols-1 sm:grid-cols-[100px_32px_minmax(0,1fr)] gap-2 sm:gap-4 items-start">
                {/* Left: Date */}
                <div className="text-xs text-[#7f92aa] font-mono pt-4 sm:text-right hidden sm:block">
                  {dateDisplay}
                </div>
                <div className="text-xs text-[#7f92aa] font-mono sm:hidden font-bold text-cyan-400">
                  {dateDisplay}
                </div>

                {/* Center: Node */}
                <div className="relative hidden sm:flex items-center justify-center pt-5">
                  <div className={`w-3.5 h-3.5 rounded-full ${nodeColor} border-2 border-[#070d18] z-10`} />
                </div>

                {/* Right: Event Card */}
                <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-cyan-500/30">
                  <div className="space-y-1 min-w-0">
                    <h3 className="text-sm font-bold text-white tracking-tight leading-snug">{event.label}</h3>
                    <p className="text-xs text-[#71839b] font-medium">{eventTypeLabel}</p>
                  </div>
                  <div className="shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <div className="pt-4 border-t border-[rgba(148,163,184,.1)] text-center sm:text-left text-xs text-[#94a3b8]">
        Showing events from {sortDirection === "oldest-to-newest" ? "oldest to newest" : "newest to oldest"}
      </div>

    </div>
  );
}
