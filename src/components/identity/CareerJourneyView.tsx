"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Briefcase, ArrowRight, Building2, Calendar, CheckCircle2, Sparkles, ShieldCheck, FileCheck2 } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { parseTimelineDate } from "@/utils/timeline-sort";
import { synthesizeCareerJourney, buildJourneyProvenance } from "@/services/journey-service";
import type { Experience } from "@/types/resume";

export function CareerJourneyView() {
  const resume = useResumeBuilder((s) => s.resume);
  const evidence = useResumeBuilder((s) => s.evidence);
  const experience: Experience[] = resume?.experience ?? [];

  // Evidence-backed career narrative (ADR-006), derived from the trusted
  // identity: resume → claims → evidence. Deterministic, no store writes.
  const journey = useMemo(
    () => synthesizeCareerJourney(resume, resume?.claims ?? [], evidence),
    [resume, evidence],
  );
  const provenance = useMemo(() => buildJourneyProvenance(resume), [resume]);

  const narrativeStatements = journey.chapters.flatMap((c) => c.statements);
  const hasNarrative = narrativeStatements.length > 0;

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
      <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8 space-y-8 font-sans">
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
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-12 font-sans space-y-10">
      
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

      {/* ── CAREER NARRATIVE (ADR-006 evidence-backed synthesis) ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-[rgba(34,211,238,.30)] bg-[#22d3ee]/5 grid place-items-center text-[#22d3ee] shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Career Narrative</h2>
              <p className="text-xs text-[#9fb0c6] font-light">Evidence-backed synthesis of your professional story</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border bg-amber-500/10 text-amber-300 border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            {journey.status.charAt(0).toUpperCase() + journey.status.slice(1)}
          </span>
        </div>

        <div className="px-6 py-4 space-y-4">
          {hasNarrative ? (
            <>
              {journey.strongestProof && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-300 text-[11px] font-extrabold uppercase tracking-widest mb-2">
                    <ShieldCheck className="w-4 h-4" />
                    Strongest Proof
                  </div>
                  <p className="text-sm text-[#cbd5e1] font-light leading-relaxed">
                    {journey.strongestProof.statement}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold">
                      {Math.round(journey.strongestProof.confidence * 100)}% confidence
                    </span>
                    <span className="px-2 py-0.5 rounded-md border border-[rgba(148,163,184,.15)] bg-[#0f172a]/70 text-[#94a3b8] text-[10px] font-bold">
                      {journey.strongestProof.evidence.length} evidence item{journey.strongestProof.evidence.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              )}

              {journey.chapters.filter((c) => c.statements.length > 0).map((chapter) => (
                <div key={chapter.id} className="rounded-xl border border-[rgba(148,163,184,.1)] bg-[#070d18]/60 p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="w-6 h-6 rounded-lg border border-[rgba(34,211,238,.3)] bg-[#22d3ee]/5 grid place-items-center text-[#22d3ee] text-[10px] font-extrabold shrink-0">
                      {chapter.sequence}
                    </span>
                    <h3 className="text-sm font-bold text-white tracking-tight">{chapter.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {chapter.statements.map((stmt) => (
                      <div key={stmt.id} className="rounded-lg border border-[rgba(148,163,184,.08)] bg-[#0b1220]/80 p-3">
                        <p className="text-sm text-[#e2e8f0] font-normal leading-relaxed">{stmt.statement}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[#94a3b8]">
                          <span className="font-mono">{Math.round(stmt.confidence * 100)}% confidence</span>
                          <span>{stmt.claims.length} claim{stmt.claims.length === 1 ? "" : "s"}</span>
                          <span>{stmt.evidence.length} evidence item{stmt.evidence.length === 1 ? "" : "s"}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-[rgba(148,163,184,.08)] space-y-1">
                          {stmt.claims.map((c) => (
                            <div key={c.id} className="flex flex-wrap items-center gap-2 text-[10px]">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-blue-500/25 bg-blue-500/10 text-blue-300 font-semibold">
                                <FileCheck2 className="w-3 h-3" />
                                {c.claimType}
                              </span>
                              <span className="text-[#94a3b8]">{c.verificationStatus}</span>
                            </div>
                          ))}
                          {stmt.evidence.map((e) => (
                            <div key={e.id} className="flex flex-wrap items-center gap-2 text-[10px]">
                              <span className="px-1.5 py-0.5 rounded border border-cyan-500/25 bg-cyan-500/10 text-cyan-300 font-semibold">
                                {e.evidenceKind}
                              </span>
                              <span className="text-[#94a3b8]">{e.format}{e.metadata?.fileName ? ` · ${e.metadata.fileName}` : ""} · {e.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="rounded-xl border border-[rgba(148,163,184,.1)] bg-[#070d18]/60 p-6 text-center">
              <p className="text-sm text-[#9fb0c6] font-light leading-relaxed">
                Your career narrative will appear as claims become supported by evidence.
              </p>
            </div>
          )}

          {/* ── Provenance (ADR-006 traceability) ── */}
          <div className="rounded-xl border border-[rgba(148,163,184,.1)] bg-[#070d18]/60 p-4">
            <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-[#60a5fa] mb-3">Data Sources</h3>
            <div className="space-y-1.5">
              {provenance.sources.map((src, idx) => (
                <div key={`${src.type}-${idx}`} className="flex items-center gap-3 text-xs">
                  <span className="w-24 shrink-0 capitalize text-[#cbd5e1] font-semibold">{src.type}</span>
                  <span className="flex-1 text-[#94a3b8] truncate text-right">{src.description}</span>
                  <span className="font-mono text-[#22d3ee] shrink-0">{Math.round(src.impactFactor * 100)}%</span>
                </div>
              ))}
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
