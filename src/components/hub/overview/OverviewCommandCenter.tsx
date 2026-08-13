"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, FileText, Network, Briefcase, CheckCircle2, Sparkles, Award, Cpu, Globe } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ImportButton } from "@/components/resume-builder/ImportButton";
import type { IdentityScoreData } from "@/lib/identity-score";
import type { Experience, Skill } from "@/types/resume";

type Props = {
  name: string;
  email: string;
  data: IdentityScoreData;
};

export function OverviewCommandCenter({ name, email, data }: Props) {
  const [mounted, setMounted] = useState(false);
  const resume = useResumeBuilder((s) => s.resume);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const firstName = name.split(" ")[0] || "there";
  const userInitials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const professionalTitle = mounted && resume?.title ? resume.title : "Professional Identity";
  const experienceEntries: Experience[] = mounted && resume?.experience ? resume.experience : [];
  const skills: Skill[] = mounted && resume?.skills ? resume.skills : [];
  const resumeName = mounted && resume?.resumeName ? resume.resumeName : "Primary Resume";
  const resumeSummary = mounted && resume?.summary ? resume.summary : "";

  const hasActiveResume = mounted && resume && (
    (resume.resumeName && resume.resumeName !== "My Resume" && resume.resumeName !== "Default Resume") ||
    !!resume.name ||
    !!resume.email ||
    !!resume.summary ||
    resume.experience.length > 0 ||
    resume.education.length > 0 ||
    resume.skills.length > 0 ||
    resume.projects.length > 0 ||
    resume.certifications.length > 0
  );

  const actualCompleteness = mounted ? useResumeBuilder.getState().progress() : (data.resumeCompleteness || 0);
  const actualResumeName = mounted && resume?.resumeName ? resume.resumeName : "My Resume";
  const lastUpdatedDate = mounted ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today";

  let nextAction = {
    title: "Verify your credentials",
    description: "Connect verified achievements and evidence records to elevate your professional trust score.",
    href: "/trust",
    label: "Verify credentials →",
  };

  if (mounted && resume) {
    if (experienceEntries.length === 0) {
      nextAction = {
        title: "Build your resume",
        description: "Add your work history, core skills, and credentials in the Resume Builder to unlock full verification.",
        href: "/resume-builder",
        label: "Build your resume →",
      };
    } else if (data.verifiedCredentials === 0) {
      nextAction = {
        title: "Verify your credentials",
        description: "Connect verified achievements and evidence records to elevate your professional trust score.",
        href: "/trust",
        label: "Verify credentials →",
      };
    } else {
      nextAction = {
        title: "Explore your professional network",
        description: "Review your career graph, skills relationships, and verified credentials across your passport.",
        href: "/network/graph",
        label: "Explore Network →",
      };
    }
  }

  const scorePercentage = Math.min(Math.max(data.score, 0), 100);
  const circleCircumference = 2 * Math.PI * 42;
  const strokeDashoffset = circleCircumference - (scorePercentage / 100) * circleCircumference;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 text-[#f8fafc] font-sans selection:bg-cyan-500/30 space-y-8">
      
      {/* ── HERO SECTION & IDENTITY SCORE ── */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_285px] gap-8 items-center min-h-[260px] pb-4">
        <div className="space-y-3.5">
          <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">OVERVIEW</div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#f8fafc] leading-[1.05]">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-base text-[#a9b9cf] font-light leading-relaxed max-w-xl">
            Build, verify and grow your professional identity.
          </p>
          <div className="pt-2">
            <Link
              href="/resume-builder"
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-[#0ea5e9] via-[#2563eb] to-[#9333ea] text-sm font-semibold text-white shadow-xl shadow-blue-500/20 hover:brightness-110 active:scale-[0.99] transition-all group"
            >
              Build your professional identity →
            </Link>
          </div>
        </div>

        {/* Circular Identity Score Ring */}
        <div className="flex items-center justify-center">
          <div className="w-[205px] h-[205px] rounded-full grid place-items-center relative bg-[conic-gradient(from_220deg,#22d3ee,#3b82f6,#8b5cf6,#22d3ee)] shadow-[0_0_50px_rgba(34,211,238,0.1)] p-[2px]">
            <div className="absolute inset-[7px] rounded-full bg-[#070d18] flex flex-col items-center justify-center text-center z-10">
              <b className="text-5xl font-extrabold leading-none text-white font-mono">{data.score}</b>
              <span className="text-xs text-[#94a3b8] mt-1">/ 100</span>
              <small className="text-[10px] text-[#cbd5e1] tracking-[0.12em] uppercase mt-2 font-bold">IDENTITY SCORE</small>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BLOCK ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[rgba(148,163,184,.14)]">
          <div className="flex items-center gap-4 py-5 px-6">
            <div className="w-11 h-11 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0">♢</div>
            <div>
              <b className="text-3xl font-extrabold text-white font-mono">{data.verifiedCredentials}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Verified credentials</span>
            </div>
          </div>
          <div className="flex items-center gap-4 py-5 px-6">
            <div className="w-11 h-11 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0">▣</div>
            <div>
              <b className="text-3xl font-extrabold text-white font-mono">{data.passportClaims}</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Passport claims</span>
            </div>
          </div>
          <div className="flex items-center gap-4 py-5 px-6">
            <div className="w-11 h-11 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 shrink-0">◔</div>
            <div>
              <b className="text-3xl font-extrabold text-white font-mono">{data.resumeCompleteness}%</b>
              <span className="block text-[#9fb0c6] text-xs mt-0.5">Resume completeness</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROFESSIONAL SNAPSHOT ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-[#60a5fa] text-[11px] font-extrabold tracking-[0.15em] uppercase">PROFESSIONAL IDENTITY</div>
            <h2 className="text-2xl font-bold tracking-tight text-white mt-1">Your professional snapshot</h2>
          </div>
          <Link href="/resume-builder" className="text-[#22d3ee] text-xs font-bold hover:underline mt-1.5">Edit profile →</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_270px] gap-10 mt-7 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full grid place-items-center bg-gradient-to-br from-[#2563eb] to-[#7c3aed] text-white text-base font-extrabold shadow-lg shadow-blue-500/20">
                {userInitials}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{professionalTitle}</h3>
                <p className="text-[#94a3b8] text-xs">
                  {experienceEntries.length > 0 ? `${experienceEntries.length}+ years of professional experience` : "Professional identity profile"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-11 gap-y-7">
              <div>
                <div className="text-[#71839b] text-[10px] font-extrabold tracking-[0.12em] uppercase mb-2">Domains</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.length > 0 ? (
                    skills.slice(0, 4).map((s, i) => (
                      <span key={i} className="px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,.13)] bg-[#0f172a]/62 text-[#cbd5e1] text-xs">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,.13)] bg-[#0f172a]/62 text-[#cbd5e1] text-xs">Engineering · SaaS</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[#71839b] text-[10px] font-extrabold tracking-[0.12em] uppercase mb-2">Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {skills.length > 0 ? (
                    skills.slice(0, 5).map((s, i) => (
                      <span key={i} className="px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,.13)] bg-[#0f172a]/62 text-[#cbd5e1] text-xs">
                        {s.name}
                      </span>
                    ))
                  ) : (
                    <span className="px-2.5 py-1.5 rounded-lg border border-[rgba(148,163,184,.13)] bg-[#0f172a]/62 text-[#cbd5e1] text-xs">TypeScript · React</span>
                  )}
                </div>
              </div>

              <div className="col-span-1 sm:col-span-2 border-t border-[rgba(148,163,184,.09)] pt-5 mt-1">
                <div className="text-[#71839b] text-[10px] font-extrabold tracking-[0.12em] uppercase mb-2">Professional summary</div>
                <p className="max-w-[790px] text-[#aebdce] text-xs sm:text-sm leading-[1.75]">
                  {resumeSummary || professionalTitle + " building intelligent systems and verified professional identity credentials across organizational history."}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-[300px] relative flex items-center justify-center">
            <div className="absolute w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,.12),transparent_66%)] blur-md pointer-events-none" />
            <div className="w-[110px] h-[135px] border border-[rgba(34,211,238,.88)] rounded-[20px] relative z-10 bg-gradient-to-br from-[rgba(15,35,60,.72)] to-[rgba(8,17,31,.70)] shadow-[0_0_28px_rgba(34,211,238,.14),inset_0_0_28px_rgba(59,130,246,.08)] flex items-center justify-center text-[rgba(34,211,238,.62)] text-2xl font-extrabold">
              P
            </div>
            <div className="absolute w-[240px] h-[75px] border border-[rgba(34,211,238,.23)] rounded-[50%] transform perspective-[350px] rotateX-[62deg] top-[195px]" />
            <div className="absolute bottom-2 text-[#64748b] text-[10px] tracking-[0.12em] uppercase">Identity node</div>
          </div>
        </div>
      </section>

      {/* ── CAREER JOURNEY ── */}
      <section className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] overflow-hidden shadow-xl">
        <div className="flex justify-between items-center px-8 pt-7 pb-2">
          <h2 className="text-xl font-bold tracking-tight text-white">Career Journey</h2>
          <Link href="/network/journey" className="text-[#22d3ee] text-xs font-bold hover:underline">View full timeline →</Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_310px] gap-8 px-8 pb-8 pt-4">
          <div>
            {experienceEntries.length > 0 ? (
              <div className="space-y-4">
                {experienceEntries.map((exp, idx) => (
                  <div key={exp.id || idx} className="grid grid-cols-[20px_145px_minmax(0,1fr)] gap-3 min-h-[75px]">
                    <div className="relative mt-1">
                      <div className="w-3 h-3 rounded-full bg-[#22d3ee] shadow-[0_0_12px_rgba(34,211,238,.65)]" />
                      {idx !== experienceEntries.length - 1 && (
                        <div className="absolute left-[5px] top-3 w-px h-[65px] bg-gradient-to-b from-[#22d3ee] to-transparent" />
                      )}
                    </div>
                    <div className="text-xs text-[#7f92aa] pt-0.5 font-mono">
                      {exp.startDate || ""} {exp.startDate && (exp.endDate || exp.current) ? "—" : ""} {exp.current ? "Present" : (exp.endDate || "")}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white">{exp.position || "Role"}</div>
                      <div className="text-xs text-[#7dd3fc] mt-1">{exp.company || "Organization"}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-sm text-[#94a3b8]">
                No career history added yet. Build your resume to populate your timeline.
              </div>
            )}
          </div>

          <div className="min-h-[220px] rounded-xl bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,.22),transparent_45%),#080d18] relative overflow-hidden border border-[rgba(139,92,246,.12)]">
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-tr from-transparent via-[rgba(76,29,149,.4)] to-transparent" />
          </div>
        </div>
      </section>

      {/* ── THREE FEATURE PANELS ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <article className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 relative min-h-[210px] flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-11 h-11 border border-[rgba(34,211,238,.30)] rounded-xl grid place-items-center text-[#22d3ee] bg-[#22d3ee]/5 mb-4">♢</div>
            <h3 className="text-base font-bold text-white mb-2">Professional Trust</h3>
            <p className="text-[#94a3b8] text-xs leading-relaxed mb-6">Build trust by verifying your credentials and experience.</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[rgba(148,163,184,.1)]">
            <span className="inline-block px-2.5 py-1 rounded-full bg-[#101b2c] text-[#cbd5e1] text-[10px] font-semibold">● Score {data.score}/100</span>
            <Link href="/trust" className="text-[#22d3ee] text-xs font-bold hover:underline">Explore Trust →</Link>
          </div>
        </article>

        <article className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 relative min-h-[210px] flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-11 h-11 border border-[rgba(167,139,250,.28)] rounded-xl grid place-items-center text-[#a78bfa] bg-[#a78bfa]/5 mb-4">▤</div>
            <h3 className="text-base font-bold text-white mb-2">Active Resume</h3>
            {hasActiveResume ? (
              <p className="text-[#94a3b8] text-xs leading-relaxed mb-6">
                <span className="font-semibold text-white">{actualResumeName}</span><br />
                {actualCompleteness}% complete · Last updated {lastUpdatedDate}
              </p>
            ) : (
              <p className="text-[#94a3b8] text-xs leading-relaxed mb-6">
                No resume imported yet.<br />
                Import your existing resume and we&apos;ll use it to build your professional identity.
              </p>
            )}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[rgba(148,163,184,.1)]">
            {hasActiveResume ? (
              <>
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#101b2c] text-[#cbd5e1] text-[10px] font-semibold">Completeness {actualCompleteness}%</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#22d3ee] font-bold hover:underline">
                    <ImportButton variant="sidebar" label="Import / Replace Resume →" />
                  </span>
                  <Link href="/resume-builder" className="text-[#22d3ee] text-xs font-bold hover:underline">Open Resume →</Link>
                </div>
              </>
            ) : (
              <>
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#101b2c] text-[#cbd5e1] text-[10px] font-semibold">No resume</span>
                <span className="text-xs text-[#22d3ee] font-bold hover:underline">
                  <ImportButton variant="sidebar" label="Import Resume →" />
                </span>
              </>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-[rgba(148,163,184,.14)] bg-gradient-to-br from-[rgba(10,18,32,0.96)] to-[rgba(7,14,26,0.92)] p-6 relative min-h-[210px] flex flex-col justify-between shadow-xl">
          <div>
            <div className="w-11 h-11 border border-[rgba(96,165,250,.30)] rounded-xl grid place-items-center text-[#60a5fa] bg-[#60a5fa]/5 mb-4">♧</div>
            <h3 className="text-base font-bold text-white mb-2">Professional Network</h3>
            <p className="text-[#94a3b8] text-xs leading-relaxed mb-6">See how your experience, skills, credentials and professional relationships connect.</p>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[rgba(148,163,184,.1)]">
            <span className="inline-block px-2.5 py-1 rounded-full bg-[#101b2c] text-[#cbd5e1] text-[10px] font-semibold">Identity network</span>
            <Link href="/network/graph" className="text-[#22d3ee] text-xs font-bold hover:underline">Explore Network →</Link>
          </div>
        </article>
      </section>

      {/* ── NEXT STEP ── */}
      <section className="rounded-2xl border border-[rgba(34,211,238,.24)] bg-gradient-to-r from-[rgba(7,27,42,.96)] to-[rgba(19,12,45,.92)] p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1 max-w-2xl">
          <div className="text-[#60a5fa] text-[10px] font-extrabold tracking-[0.15em] uppercase">NEXT STEP</div>
          <h2 className="text-xl font-bold text-white">{nextAction.title}</h2>
          <p className="text-[#a7b8cd] text-xs sm:text-sm leading-relaxed">{nextAction.description}</p>
        </div>
        <div className="shrink-0">
          <Link
            href={nextAction.href}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] text-xs sm:text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
          >
            {nextAction.label}
          </Link>
        </div>
      </section>

    </div>
  );
}
