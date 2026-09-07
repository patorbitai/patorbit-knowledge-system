"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  FileSearch,
  Briefcase,
  CheckCircle2,
  Tag,
  Layers,
  GraduationCap,
  Sparkles,
  ArrowRight,
  AlertCircle,
  RotateCcw,
  Clipboard,
  Star,
  Shield,
  Zap,
  Target,
  ChevronDown,
} from "lucide-react";
import { buildJobProfile } from "@/lib/job-profile";
import type { JobProfile, JobSkill } from "@/types/job-profile";

/* ── Validation ──────────────────────────────────────────────────────────── */

const MIN_CHARS = 50;
const MAX_CHARS = 10000;

function validateInput(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return "Please paste a job description to analyze.";
  }
  if (trimmed.length < MIN_CHARS) {
    return `Job description is too short. Please paste the full posting (${MIN_CHARS}+ characters).`;
  }
  if (trimmed.length > MAX_CHARS) {
    return `Job description is too long. Maximum ${MAX_CHARS.toLocaleString()} characters.`;
  }
  return null;
}

/* ── UI Helpers ──────────────────────────────────────────────────────────── */

function SectionHeader({
  icon,
  title,
  count,
  color = "cyan",
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  color?: string;
}) {
  const colorMap: Record<string, { text: string; bg: string }> = {
    cyan: { text: "text-cyan-300", bg: "bg-cyan-500/10" },
    blue: { text: "text-blue-300", bg: "bg-blue-500/10" },
    purple: { text: "text-purple-300", bg: "bg-purple-500/10" },
    amber: { text: "text-amber-300", bg: "bg-amber-500/10" },
    emerald: { text: "text-emerald-300", bg: "bg-emerald-500/10" },
  };

  const colors = colorMap[color] || colorMap.cyan;

  return (
    <div className="flex items-center gap-2.5 pb-2 pt-5 first:pt-0">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${colors.bg} ${colors.text}`}
      >
        {icon}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </span>
      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-slate-500">
        {count}
      </span>
    </div>
  );
}

function ItemRow({ text, source }: { text: string; source: { sourceRef: string; sourceText: string } }) {
  return (
    <div className="group rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-3 transition-all duration-150 hover:bg-white/[0.05] hover:border-white/[0.10] hover:shadow-lg hover:shadow-black/10">
      <p className="text-[13px] text-slate-200 leading-relaxed">{text}</p>
      <p className="mt-1.5 truncate text-[10px] text-slate-600 group-hover:text-slate-500 transition-colors" title={source.sourceText}>
        <span className="font-mono text-slate-500">{source.sourceRef}</span>
        <span className="mx-1.5 opacity-50">·</span>
        <span className="italic text-slate-600">&ldquo;{source.sourceText}&rdquo;</span>
      </p>
    </div>
  );
}

function SkillChips({ skills }: { skills: JobSkill[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((s, i) => (
        <span
          key={`${s.name}-${i}`}
          className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 text-[11px] font-medium text-cyan-300 transition-all duration-150 hover:bg-cyan-500/15 hover:border-cyan-500/30 hover:shadow-sm"
          title={`${s.source.sourceRef} · "${s.source.sourceText}"`}
        >
          {s.name}
        </span>
      ))}
    </div>
  );
}

/* ── Results Card ────────────────────────────────────────────────────────── */

function ResultCard({ profile }: { profile: JobProfile }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-sm overflow-hidden shadow-xl shadow-black/20">
      {/* Card Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02] cursor-pointer hover:bg-white/[0.04] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
            <CheckCircle2 className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Job Profile Extracted</p>
            <p className="text-[11px] text-slate-500">Based on the information you provided</p>
          </div>
        </div>
        <ChevronDown className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {/* Card Body */}
      {expanded && (
        <div className="px-6 py-5 space-y-1">
          {/* Job Title */}
          {profile.title && (
            <div className="mb-5 pb-4 border-b border-white/[0.06]">
              <p className="text-xl font-bold text-white tracking-tight">{profile.title}</p>
            </div>
          )}

          {/* Requirements */}
          {profile.requirements.length > 0 && (
            <>
              <SectionHeader
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                title="Requirements"
                count={profile.requirements.length}
                color="emerald"
              />
              <div className="space-y-2">
                {profile.requirements.slice(0, 6).map((r, i) => (
                  <ItemRow key={i} text={r.text} source={r.source} />
                ))}
                {profile.requirements.length > 6 && (
                  <button className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors pl-1">
                    <span>+{profile.requirements.length - 6} more requirements</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Responsibilities */}
          {profile.responsibilities.length > 0 && (
            <>
              <SectionHeader
                icon={<Briefcase className="h-3.5 w-3.5" />}
                title="Responsibilities"
                count={profile.responsibilities.length}
                color="blue"
              />
              <div className="space-y-2">
                {profile.responsibilities.slice(0, 6).map((r, i) => (
                  <ItemRow key={i} text={r.text} source={r.source} />
                ))}
                {profile.responsibilities.length > 6 && (
                  <button className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors pl-1">
                    <span>+{profile.responsibilities.length - 6} more responsibilities</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </>
          )}

          {/* Qualifications */}
          {profile.qualifications.length > 0 && (
            <>
              <SectionHeader
                icon={<GraduationCap className="h-3.5 w-3.5" />}
                title="Qualifications"
                count={profile.qualifications.length}
                color="purple"
              />
              <div className="space-y-2">
                {profile.qualifications.slice(0, 5).map((q, i) => (
                  <ItemRow key={i} text={q.text} source={q.source} />
                ))}
              </div>
            </>
          )}

          {/* Skills */}
          {profile.skills.length > 0 && (
            <>
              <SectionHeader
                icon={<Tag className="h-3.5 w-3.5" />}
                title="Skills"
                count={profile.skills.length}
                color="cyan"
              />
              <SkillChips skills={profile.skills} />
            </>
          )}

          {/* Seniority + Domain */}
          {(profile.seniority.length > 0 || profile.domain.length > 0) && (
            <div className="flex flex-wrap gap-2.5 pt-4">
              {profile.seniority.map((s, i) => (
                <span
                  key={`sen-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-[11px] font-medium text-blue-300 transition-all hover:bg-blue-500/15"
                  title={`${s.source.sourceRef} · "${s.source.sourceText}"`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  {[s.level, s.years].filter(Boolean).join(" · ") || "Seniority"}
                </span>
              ))}
              {profile.domain.map((d, i) => (
                <span
                  key={`dom-${i}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-[11px] font-medium text-purple-300 transition-all hover:bg-purple-500/15"
                  title={`${d.source.sourceRef} · "${d.source.sourceText}"`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  {d.name}
                </span>
              ))}
            </div>
          )}

          {/* Implicit Competencies */}
          {profile.implicitCompetencies.length > 0 && (
            <>
              <SectionHeader
                icon={<Sparkles className="h-3.5 w-3.5" />}
                title="Implicit Competencies"
                count={profile.implicitCompetencies.length}
                color="amber"
              />
              <div className="space-y-2">
                {profile.implicitCompetencies.slice(0, 4).map((c, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-amber-500/[0.04] border border-amber-500/10 px-4 py-3 transition-all duration-150 hover:bg-amber-500/[0.08] hover:border-amber-500/20"
                  >
                    <p className="text-[12px] font-semibold text-amber-300">{c.name}</p>
                    <p className="mt-1 text-[11px] text-slate-500 leading-snug">
                      inferred from &ldquo;{c.context}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── CTA Card ────────────────────────────────────────────────────────────── */

function ConversionCTA() {
  return (
    <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] via-blue-500/[0.05] to-purple-500/[0.03] p-7 relative overflow-hidden shadow-xl shadow-cyan-500/5">
      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-cyan-500/[0.12] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-radial from-purple-500/[0.08] to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 border border-cyan-500/30">
            <Target className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white">
              Want to see how you match this job?
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-md">
          Create your free Patorbit account to compare this job with your professional profile and get personalized recommendations.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.04] px-7 py-3.5 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:border-white/[0.15] hover:text-white"
          >
            Already have an account? Sign in
          </Link>
        </div>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
          {["Free Forever", "No Credit Card", "Setup in 2 Minutes"].map((item) => (
            <span key={item} className="inline-flex items-center gap-2 text-[11px] text-slate-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/80" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────────── */

export function FreeJDAnalysis() {
  const [input, setInput] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedInput = input.trim();
  const canAnalyze = trimmedInput.length >= MIN_CHARS;

  // Live preview (deterministic, no AI, no network)
  const liveProfile = useMemo<JobProfile | null>(() => {
    if (trimmedInput.length < MIN_CHARS) return null;
    return buildJobProfile(trimmedInput);
  }, [trimmedInput]);

  const handleAnalyze = () => {
    const validationError = validateInput(input);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setAnalyzed(true);
  };

  const handleReset = () => {
    setInput("");
    setAnalyzed(false);
    setError(null);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInput(text);
        setError(null);
        setAnalyzed(false);
      }
    } catch {
      // Clipboard API not available or denied — silently ignore
    }
  };

  const profile = analyzed ? liveProfile : null;

  return (
    <div className="space-y-6">
      {/* Input Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-sm p-6 space-y-4 shadow-xl shadow-black/20">
        {/* Label row */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
              <FileSearch className="h-4 w-4 text-cyan-400" />
            </div>
            Paste the job description
          </label>
          <button
            onClick={handlePaste}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-300 hover:bg-white/[0.05] transition-all duration-150"
          >
            <Clipboard className="h-3.5 w-3.5" />
            Paste from clipboard
          </button>
        </div>

        {/* Textarea */}
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError(null);
              setAnalyzed(false);
            }}
            placeholder={`Paste the full job description here...\n\nExample:\nSenior Azure Data Engineer\n\nResponsibilities:\n- Build ETL pipelines using Azure Data Factory\n...\n\nRequirements:\n- 3+ years of data engineering experience\n- Azure Data Factory, Databricks, PySpark\n...`}
            rows={10}
            className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#070B14]/60 px-5 py-4 text-sm text-white outline-none transition-all duration-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/15 focus:shadow-[0_0_30px_-5px_rgba(6,182,212,0.12)]"
          />
          {/* Character count overlay */}
          {input.length > 0 && (
            <div className="absolute bottom-3 right-3 rounded-lg bg-[#070B14]/90 border border-white/[0.06] px-2.5 py-1 backdrop-blur-sm">
              <span className="text-[10px] tabular-nums text-slate-600">
                {input.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span>Min {MIN_CHARS} characters</span>
            {canAnalyze && (
              <span className="inline-flex items-center gap-1 text-emerald-400/80">
                <CheckCircle2 className="h-3 w-3" />
                Ready
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {analyzed && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all duration-150"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Try another
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-[12px] font-semibold transition-all duration-200 ${
                canAnalyze
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-400/30 hover:scale-[1.02] active:scale-100"
                  : "cursor-not-allowed bg-white/[0.04] text-slate-600 border border-white/[0.06]"
              }`}
            >
              <FileSearch className="h-3.5 w-3.5" />
              Analyze Job Description
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 px-5 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-[13px] text-rose-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {profile && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-400">
          <ResultCard profile={profile} />
          <ConversionCTA />
        </div>
      )}

      {/* Empty State */}
      {!profile && !error && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-8 py-14 text-center">
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.02] border border-white/[0.06]">
              <FileSearch className="h-7 w-7 text-slate-600" />
            </div>
            <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/30">
              <Zap className="h-2.5 w-2.5 text-cyan-400" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-base font-medium text-slate-300">
              Paste a job description to get started
            </p>
            <p className="text-[13px] text-slate-600 max-w-sm leading-relaxed">
              Extract the role, skills, requirements, seniority, and other structured signals instantly.
            </p>
          </div>
          <div className="flex items-center gap-5 mt-2 pt-4 border-t border-white/[0.04]">
            {[
              { icon: <Zap className="h-3.5 w-3.5" />, text: "Instant", color: "text-cyan-400" },
              { icon: <Shield className="h-3.5 w-3.5" />, text: "Private", color: "text-emerald-400" },
              { icon: <Star className="h-3.5 w-3.5" />, text: "Free", color: "text-amber-400" },
            ].map((item) => (
              <span
                key={item.text}
                className={`inline-flex items-center gap-1.5 text-[11px] ${item.color} opacity-80`}
              >
                {item.icon}
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
