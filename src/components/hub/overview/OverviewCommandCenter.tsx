"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck, FileText, Network, Briefcase, CheckCircle2 } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
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
  const professionalTitle = mounted && resume?.title ? resume.title : "Professional Identity";
  const experienceEntries: Experience[] = mounted && resume?.experience ? resume.experience : [];
  const skills: Skill[] = mounted && resume?.skills ? resume.skills : [];
  const resumeName = mounted && resume?.resumeName ? resume.resumeName : "Primary Resume";
  const templateId = mounted && resume?.templateId ? resume.templateId : "modern";

  let nextAction = {
    title: "Complete your professional profile",
    description: "Add your work history, core skills, and credentials in the Resume Builder to unlock full verification.",
    href: "/resume-builder",
    label: "Open Resume Builder",
  };

  if (mounted && resume) {
    if (experienceEntries.length === 0) {
      nextAction = {
        title: "Add your career history",
        description: "Document your professional progression and key organization roles to establish concrete career proof.",
        href: "/resume-builder",
        label: "Add Experience",
      };
    } else if (skills.length === 0) {
      nextAction = {
        title: "Add professional skills",
        description: "Highlight your technical and domain expertise to build your knowledge graph footprint.",
        href: "/resume-builder",
        label: "Add Skills",
      };
    } else if (data.verifiedCredentials === 0) {
      nextAction = {
        title: "Verify your credentials",
        description: "Connect verified achievements and evidence records to elevate your professional trust score.",
        href: "/trust",
        label: "Explore Trust Hub",
      };
    } else {
      nextAction = {
        title: "Explore your professional network",
        description: "Review your career graph, skills relationships, and verified credentials across your passport.",
        href: "/network",
        label: "Explore Network",
      };
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-12 space-y-16 text-slate-100 font-sans">
      
      {/* ── SECTION 1: HERO ── */}
      <section className="space-y-4">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Command Center</span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-white">
            Good morning, {firstName}
          </h1>
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
            Your professional identity, career and credibility at a glance.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-950 transition-all hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            Build a Resume
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3 text-xs text-slate-400 pl-2">
            <span>Identity Score: <strong className="text-white">{data.score}/100</strong></span>
            <span>•</span>
            <span>{email}</span>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: PROFESSIONAL SNAPSHOT ── */}
      <section className="rounded-2xl border border-white/[0.08] bg-[#090D1A]/90 p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-cyan-500/[0.03] blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-cyan-400/90">Professional Identity</span>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {professionalTitle}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {experienceEntries.length > 0
                ? `${experienceEntries.length} career role${experienceEntries.length === 1 ? '' : 's'} recorded across professional history.`
                : "No career history recorded yet. Add your professional roles to establish identity proof."}
            </p>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {skills.slice(0, 6).map((s, idx) => (
                  <span key={s.id || idx} className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-slate-300">
                    {s.name} {s.level ? `(${s.level})` : ""}
                  </span>
                ))}
                {skills.length > 6 && (
                  <span className="rounded-md border border-white/[0.08] bg-white/[0.02] px-2 py-1 text-xs text-slate-500">
                    +{skills.length - 6} more
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 lg:gap-8 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-white/[0.08] lg:pl-8 shrink-0">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Experience</span>
              <div className="text-2xl font-semibold text-white">{experienceEntries.length}</div>
              <span className="text-[11px] text-slate-400">Roles documented</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Skills</span>
              <div className="text-2xl font-semibold text-white">{skills.length}</div>
              <span className="text-[11px] text-slate-400">Verified domains</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Trust Score</span>
              <div className="text-2xl font-semibold text-white">{data.score}</div>
              <span className="text-[11px] text-slate-400">Out of 100</span>
            </div>
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Claims</span>
              <div className="text-2xl font-semibold text-white">{data.passportClaims}</div>
              <span className="text-[11px] text-slate-400">Passport claims</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: CAREER TIMELINE ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Trajectory</span>
            <h2 className="text-xl font-semibold tracking-tight text-white">Career Progression</h2>
          </div>
          <Link href="/resume-builder" className="text-xs font-medium text-slate-400 hover:text-white transition-colors">
            Manage in Resume Builder →
          </Link>
        </div>

        {experienceEntries.length > 0 ? (
          <div className="relative border-l border-white/[0.08] ml-3 space-y-8 pl-6 py-2">
            {experienceEntries.map((exp, idx) => (
              <div key={exp.id || idx} className="relative space-y-2 group">
                <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border border-cyan-500/50 bg-[#080C18] group-hover:bg-cyan-500 transition-colors" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h3 className="text-base font-medium text-white">{exp.position || "Role"}</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    {exp.startDate || ""} {exp.startDate && (exp.endDate || exp.current) ? "—" : ""} {exp.current ? "Present" : (exp.endDate || "")}
                  </span>
                </div>
                <div className="text-sm text-cyan-400/90 font-medium">{exp.company || "Organization"}</div>
                {exp.bulletPoints && exp.bulletPoints.length > 0 ? (
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl pt-1">
                    {exp.bulletPoints[0]}
                  </p>
                ) : exp.description ? (
                  <p className="text-xs text-slate-400 leading-relaxed max-w-3xl pt-1">
                    {exp.description}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/[0.06] bg-[#090D1A]/50 p-8 text-center space-y-3">
            <Briefcase className="h-8 w-8 text-slate-600 mx-auto" />
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-sm font-medium text-slate-300">No career history added yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Add your professional experience in the Resume Builder to construct your editorial career timeline.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-medium text-white hover:bg-white/[0.08] transition-colors"
              >
                Add Experience
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── SECTION 4: TRUST + RESUME (Balanced Two-Column) ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Professional Trust */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#090D1A]/90 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Credibility</span>
              <ShieldCheck className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Professional Trust</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Derived from verification coverage across your professional identity, claims, experience, and evidence records.
            </p>
          </div>

          <div className="space-y-4 py-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Trust Score</span>
              <span className="text-3xl font-bold text-white font-mono">{data.score}<span className="text-slate-500 text-lg">/100</span></span>
            </div>
            <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(data.score, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>{data.verifiedCredentials} Verified credentials</span>
              <span>{data.passportClaims} Passport claims</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <Link
              href="/trust"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              View Trust Hub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right: Active Resume */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#090D1A]/90 p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Document</span>
              <FileText className="h-5 w-5 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">Active Resume</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your primary professional document, formatted and optimized for modern executive evaluation.
            </p>
          </div>

          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">{resumeName}</span>
                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[11px] font-mono text-slate-300 uppercase">
                  {templateId}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Completeness: {data.resumeCompleteness}%</span>
                <span>Ready to export</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-white/[0.06]">
            <Link
              href="/resume-builder"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Open Resume Builder
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </section>

      {/* ── SECTION 5: PROFESSIONAL NETWORK ── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Knowledge Graph</span>
            <h2 className="text-xl font-semibold tracking-tight text-white">Professional Network Preview</h2>
          </div>
          <Link
            href="/network"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-cyan-400 hover:text-cyan-350 transition-colors"
          >
            Explore your professional network
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#090D1A]/90 p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[280px]">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/[0.04] via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center space-y-4">
            <div className="h-20 w-20 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Network className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-white">Interactive Career & Skills Graph</h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm">
                Connects your skills, experiences, and verified claims into a cohesive topological career map.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/network"
                className="inline-flex items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white hover:bg-white/[0.08] transition-colors"
              >
                Open Network Graph
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 6: NEXT ACTION ── */}
      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/[0.15] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            Recommended Next Action
          </div>
          <h3 className="text-lg font-semibold text-white">{nextAction.title}</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{nextAction.description}</p>
        </div>
        <div>
          <Link
            href={nextAction.href}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/20 shrink-0"
          >
            {nextAction.label}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
