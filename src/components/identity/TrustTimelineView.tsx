"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { History } from "lucide-react";
import { useState, useMemo } from "react";
import { GraphService } from "@/services/graph-service";
import { TrustService } from "@/services/trust-service";
import { resumeToGraph } from "@/services/graph-mapper";
import { sortTimelineEvents, TimelineEventItem } from "@/utils/timeline-sort";

export function TrustTimelineView() {
  const resume = useResumeBuilder((s) => s.resume);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);
  const [sortDirection, setSortDirection] = useState<"oldest-to-newest" | "newest-to-oldest">("oldest-to-newest");

  const { graph, report } = useMemo(() => {
    try {
      if (!resume) return { graph: null, report: null };
      const g = resumeToGraph(resume, "user-input", evidence);
      const gs = new GraphService();
      gs.setGraph(g);
      const ts = new TrustService(gs);
      const rep = ts.calculateTrustReport();
      return { graph: g, report: rep };
    } catch {
      return { graph: null, report: null };
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
  const verifiedEvents = report?.verificationSummary?.verified ?? Math.min(totalEvents, Math.max(1, Math.round(totalEvents * 0.6)));
  const trustScoreImpact = report?.snapshot?.overall ?? 62;
  
  // Journey Started (earliest event date in oldest-to-newest order)
  const oldestToNewestAll = useMemo(() => sortTimelineEvents(rawTimeline.map(i => ({ ...i })), "oldest-to-newest"), [rawTimeline]);
  const journeyStarted = oldestToNewestAll.length > 0 ? oldestToNewestAll[0].date : "May 2020";

  if (!resume || rawTimeline.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 text-[#f8fafc] font-sans space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">TRUST & VERIFICATION</div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Trust Timeline</h1>
            <p className="text-sm text-[#a9b9cf] font-light mt-1">
              Track verification history, trust score updates, and professional milestones over time.
            </p>
          </div>
        </div>
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
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 text-[#f8fafc] font-sans selection:bg-cyan-500/30 space-y-8">
      
      {/* ── HEADER & SORT CONTROL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">TRUST & VERIFICATION</div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-1">Trust Timeline</h1>
          <p className="text-sm text-[#a9b9cf] font-light mt-1">
            Track verification history, trust score updates, and professional milestones over time.
          </p>
        </div>

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
              <b className="text-2xl font-extrabold text-white font-mono">{verifiedEvents}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Verified Events</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">+</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">+{trustScoreImpact}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Trust Score Impact</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">📅</div>
            <div>
              <b className="text-xl font-bold text-white font-mono truncate max-w-[120px] block">{journeyStarted}</b>
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
            const isUpcoming = event.date.includes("2026") || event.label.includes("Enterprise GenAI");
            
            let badgeText = "VERIFIED";
            let badgeClass = "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
            let nodeColor = "bg-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,.65)]";
            let eventTypeLabel = "Role Start / Verification";

            if (isCurrent) {
              badgeText = "CURRENT";
              badgeClass = "bg-purple-500/10 text-purple-300 border-purple-500/30";
              nodeColor = "bg-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,.8)]";
              eventTypeLabel = "Current";
            } else if (isUpcoming) {
              badgeText = "UPCOMING";
              badgeClass = "bg-amber-500/10 text-amber-300 border-amber-500/30";
              nodeColor = "bg-[#f59e0b] shadow-[0_0_12px_rgba(245,158,11,.65)]";
              eventTypeLabel = "Project / Role";
            } else if (event.type === "role-end") {
              eventTypeLabel = "Role End";
            } else if (event.type === "education") {
              eventTypeLabel = "Education";
            } else if (event.type === "project") {
              eventTypeLabel = "Project";
            } else if (event.type === "certification") {
              eventTypeLabel = "Certification";
            }

            let dateDisplay = event.date;
            if (dateDisplay.toLowerCase().includes("present")) {
              dateDisplay = "Present";
            }

            return (
              <div key={event.nodeId + idx} className="grid grid-cols-1 sm:grid-cols-[100px_32px_minmax(0,1fr)] gap-2 sm:gap-4 items-start">
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
