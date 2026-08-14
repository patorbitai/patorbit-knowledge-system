"use client";

import React from "react";
import Link from "next/link";
import { Briefcase, ArrowRight, Building2, Calendar, CheckCircle2 } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { parseTimelineDate } from "@/utils/timeline-sort";
import type { Experience } from "@/types/resume";

export function CareerJourneyView() {
  const resume = useResumeBuilder((s) => s.resume);
  const experience: Experience[] = resume?.experience ?? [];

  // Sort experience entries oldest -> newest
  const sortedExperience = [...experience].sort((a, b) => {
    const timeA = parseTimelineDate(a.startDate);
    const timeB = parseTimelineDate(b.startDate);
    if (timeA !== timeB) return timeA - timeB;
    // Same date tie-breaker: completed/ended before current or start
    if (a.current !== b.current) return a.current ? 1 : -1;
    return 0;
  });

  const totalRoles = sortedExperience.length;
  const uniqueOrgs = new Set(sortedExperience.map((e) => e.company?.trim()).filter(Boolean)).size;
  
  // Calculate total years of experience
  let totalMs = 0;
  for (const exp of sortedExperience) {
    if (!exp.startDate) continue;
    const start = parseTimelineDate(exp.startDate);
    const end = exp.current ? Date.now() : exp.endDate ? parseTimelineDate(exp.endDate) : Date.now();
    if (!isNaN(start) && !isNaN(end) && start > 0 && end > start) {
      totalMs += Math.max(0, end - start);
    }
  }
  const totalYears = isFinite(totalMs) && totalMs > 0 ? Math.round((totalMs / (365.25 * 24 * 60 * 60 * 1000)) * 10) / 10 : 0;
  const experienceDisplay = totalYears > 0 ? `${totalYears}+` : (sortedExperience.length > 0 ? "1+" : "0");

  // Career Start
  const careerStart = sortedExperience.length > 0 && sortedExperience[0].startDate ? sortedExperience[0].startDate : "Not available";

  if (sortedExperience.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-8 text-[#f8fafc] font-sans">
        <div>
          <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">CAREER JOURNEY</div>
          <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Your professional evolution</h1>
          <p className="text-sm text-[#a9b9cf] font-light mt-1">
            A chronological view of your roles, experience and career progression.
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-12 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-white">Your career journey starts here</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Add your professional experience to build your career timeline.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/resume-builder"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
            >
              Add experience →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-12 text-[#f8fafc] font-sans selection:bg-cyan-500/30 space-y-10">
      
      {/* ── HEADER ── */}
      <div className="space-y-2">
        <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">CAREER JOURNEY</div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Your professional evolution</h1>
        <p className="text-sm text-[#a9b9cf] font-light max-w-2xl leading-relaxed">
          A chronological view of your roles, experience and career progression.
        </p>
      </div>

      {/* ── SUMMARY METRICS PANEL ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl p-2">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(148,163,184,.14)]">
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">⏳</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{experienceDisplay} YRS</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Professional Experience</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">💼</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{totalRoles}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Career Roles</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">🏢</div>
            <div>
              <b className="text-2xl font-extrabold text-white font-mono">{uniqueOrgs}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Organizations</span>
            </div>
          </div>
          <div className="flex items-center gap-3 py-4 px-5">
            <div className="w-10 h-10 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0 text-sm font-bold">🚀</div>
            <div>
              <b className="text-lg font-bold text-white font-mono truncate max-w-[130px] block">{careerStart}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Career Start</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CAREER PROGRESSION TIMELINE ── */}
      <section className="relative pt-4 pb-12 space-y-8">
        {/* Progression Connector Line */}
        <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-0.5 bg-gradient-to-b from-[#22d3ee] via-[#3b82f6] to-[#a855f7] opacity-40 pointer-events-none hidden sm:block" />

        <div className="space-y-6">
          {sortedExperience.map((exp, idx) => {
            const isCurrent = exp.current;
            const skillsList = exp.techUsed
              ? exp.techUsed.split(/[,·|]/).map((s) => s.trim()).filter(Boolean)
              : [];

            const durationText = `${exp.startDate || ""} — ${exp.current ? "Present" : (exp.endDate || "")}`;

            return (
              <div key={`${exp.id || "exp"}-${idx}`} className="relative pl-0 sm:pl-16">
                {/* Node marker on timeline */}
                <div className="absolute left-6 sm:left-7 top-6 hidden sm:flex items-center justify-center">
                  <div className={`w-3.5 h-3.5 rounded-full ${isCurrent ? "bg-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,.8)]" : "bg-[#22d3ee] shadow-[0_0_10px_rgba(34,211,238,.6)]"} border-2 border-[#070d18] z-10`} />
                </div>

                {/* Role Card */}
                <div
                  className={`rounded-2xl border p-6 shadow-xl transition-all ${
                    isCurrent
                      ? "border-cyan-500/40 bg-gradient-to-br from-[rgba(14,35,60,0.96)] to-[rgba(7,14,26,0.92)] shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                      : "border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] hover:border-cyan-500/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-lg font-bold text-white tracking-tight">{exp.position || "Role"}</h3>
                        {isCurrent && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border bg-purple-500/10 text-purple-300 border-purple-500/30">
                            CURRENT
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#7dd3fc] mt-0.5">{exp.company || "Organization"}{exp.location ? ` · ${exp.location}` : ""}</p>
                    </div>
                    <div className="text-xs font-mono text-[#94a3b8] px-3 py-1 rounded-lg bg-[#070d18]/75 border border-[rgba(148,163,184,.1)] self-start sm:self-auto">
                      {durationText}
                    </div>
                  </div>

                  {exp.description && (
                    <p className="text-xs sm:text-sm text-[#cbd5e1] font-light leading-relaxed mb-4">
                      {exp.description}
                    </p>
                  )}

                  {skillsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[rgba(148,163,184,.08)]">
                      {skillsList.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-1 rounded-lg border border-[rgba(148,163,184,.13)] bg-[#0f172a]/62 text-[#cbd5e1] text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
