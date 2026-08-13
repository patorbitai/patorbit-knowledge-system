"use client";

import { useResumeBuilder } from "@/store/resume-builder";
import { History, Clock } from "lucide-react";
import { useMemo } from "react";
import { GraphService } from "@/services/graph-service";
import { resumeToGraph } from "@/services/graph-mapper";

export function TrustTimelineView() {
  const resume = useResumeBuilder((s) => s.resume);
  const evidence = useResumeBuilder((s) => s.evidence ?? []);

  const graph = useMemo(() => {
    try {
      if (!resume) return null;
      return resumeToGraph(resume, "user-input", evidence);
    } catch {
      return null;
    }
  }, [resume, evidence]);

  const graphService = useMemo(() => {
    const gs = new GraphService();
    if (graph) gs.setGraph(graph);
    return gs;
  }, [graph]);

  const timeline = graphService.getCareerTimeline();

  if (!resume || timeline.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Trust Timeline</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track verification history, trust score updates, and professional milestones over time.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-12 text-center space-y-3">
          <History className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-medium text-white">No trust timeline history yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Verification events, professional milestones, and trust score evolutions will appear here as your profile evolves.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Trust Timeline</h1>
        <p className="text-sm text-slate-400 mt-1">
          Track verification history, trust score updates, and professional milestones over time.
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Verification & Career Timeline ({timeline.length} events)
          </h3>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/[0.08]">
          {timeline.map((event, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#070911]" />
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{event.label}</span>
                  <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                    {event.date.slice(0, 10)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 capitalize">Event Type: {event.type.replace("-", " ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
