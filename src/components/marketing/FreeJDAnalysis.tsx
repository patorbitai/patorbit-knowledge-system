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
  Loader2,
  ArrowRight,
  AlertCircle,
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

function Section({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 pb-1 pt-3 first:pt-0">
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.05] text-cyan-300">
        {icon}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
      <span className="text-[10px] font-medium text-slate-600">{count}</span>
    </div>
  );
}

function ItemRow({ text, source }: { text: string; source: { sourceRef: string; sourceText: string } }) {
  return (
    <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5">
      <p className="text-[11px] text-slate-300 leading-snug">{text}</p>
      <p className="mt-0.5 truncate text-[10px] text-slate-600" title={source.sourceText}>
        <span className="font-mono">{source.sourceRef}</span> · &ldquo;{source.sourceText}&rdquo;
      </p>
    </div>
  );
}

function SkillChips({ skills }: { skills: JobSkill[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((s, i) => (
        <span
          key={`${s.name}-${i}`}
          className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium text-cyan-300"
          title={`${s.source.sourceRef} · "${s.source.sourceText}"`}
        >
          {s.name}
        </span>
      ))}
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

  const profile = analyzed ? liveProfile : null;

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300">
          Paste the job description
        </label>
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(null);
            setAnalyzed(false);
          }}
          placeholder={`Paste the full job description here...\n\nExample:\nSenior Azure Data Engineer\n\nResponsibilities:\n- Build ETL pipelines using Azure Data Factory\n...\n\nRequirements:\n- 3+ years of data engineering experience\n- Azure Data Factory, Databricks, PySpark\n...`}
          rows={8}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] tabular-nums text-slate-600">
            {input.length.toLocaleString()} characters
          </span>
          <div className="flex items-center gap-2">
            {analyzed && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white transition-colors"
              >
                Try another job
              </button>
            )}
            <button
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[11px] font-semibold transition-all ${
                canAnalyze
                  ? "bg-cyan-600 text-white hover:bg-cyan-500"
                  : "cursor-not-allowed bg-white/[0.03] text-slate-600"
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
        <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
          <p className="text-xs text-rose-300">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {profile && (
        <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06]">
            <div className="h-8 w-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Job Profile Extracted</p>
              <p className="text-[10px] text-slate-500">Based on the information you provided</p>
            </div>
          </div>

          {profile.title && (
            <p className="text-base font-semibold text-white">{profile.title}</p>
          )}

          {profile.requirements.length > 0 && (
            <>
              <Section icon={<CheckCircle2 className="h-3 w-3" />} title="Requirements" count={profile.requirements.length} />
              <div className="space-y-1">
                {profile.requirements.slice(0, 5).map((r, i) => (
                  <ItemRow key={i} text={r.text} source={r.source} />
                ))}
                {profile.requirements.length > 5 && (
                  <p className="text-[10px] text-slate-500">+{profile.requirements.length - 5} more requirements</p>
                )}
              </div>
            </>
          )}

          {profile.responsibilities.length > 0 && (
            <>
              <Section icon={<Briefcase className="h-3 w-3" />} title="Responsibilities" count={profile.responsibilities.length} />
              <div className="space-y-1">
                {profile.responsibilities.slice(0, 5).map((r, i) => (
                  <ItemRow key={i} text={r.text} source={r.source} />
                ))}
                {profile.responsibilities.length > 5 && (
                  <p className="text-[10px] text-slate-500">+{profile.responsibilities.length - 5} more responsibilities</p>
                )}
              </div>
            </>
          )}

          {profile.qualifications.length > 0 && (
            <>
              <Section icon={<GraduationCap className="h-3 w-3" />} title="Qualifications" count={profile.qualifications.length} />
              <div className="space-y-1">
                {profile.qualifications.slice(0, 5).map((q, i) => (
                  <ItemRow key={i} text={q.text} source={q.source} />
                ))}
              </div>
            </>
          )}

          {profile.skills.length > 0 && (
            <>
              <Section icon={<Tag className="h-3 w-3" />} title="Skills" count={profile.skills.length} />
              <SkillChips skills={profile.skills} />
            </>
          )}

          {(profile.seniority.length > 0 || profile.domain.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {profile.seniority.map((s, i) => (
                <span
                  key={`sen-${i}`}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-medium text-blue-300"
                  title={`${s.source.sourceRef} · "${s.source.sourceText}"`}
                >
                  {[s.level, s.years].filter(Boolean).join(" · ") || "Seniority"}
                </span>
              ))}
              {profile.domain.map((d, i) => (
                <span
                  key={`dom-${i}`}
                  className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-300"
                  title={`${d.source.sourceRef} · "${d.source.sourceText}"`}
                >
                  <Layers className="h-2.5 w-2.5" />
                  {d.name}
                </span>
              ))}
            </div>
          )}

          {profile.implicitCompetencies.length > 0 && (
            <>
              <Section icon={<Sparkles className="h-3 w-3" />} title="Implicit Competencies" count={profile.implicitCompetencies.length} />
              <div className="space-y-1">
                {profile.implicitCompetencies.slice(0, 3).map((c, i) => (
                  <div key={i} className="rounded-lg bg-amber-500/[0.06] border border-amber-500/10 px-2.5 py-1.5">
                    <p className="text-[11px] font-medium text-amber-300">{c.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500 leading-snug">
                      from &ldquo;{c.context}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Conversion CTA */}
          <div className="mt-6 pt-4 border-t border-white/[0.06]">
            <div className="rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 p-4">
              <p className="text-sm font-semibold text-white mb-1">
                Want to see how you match this job?
              </p>
              <p className="text-xs text-slate-400 mb-3">
                Create your free Patorbit account to compare this job with your professional profile and get personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:scale-[1.02]"
                >
                  Create Free Account
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.10] bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/[0.08] hover:text-white"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!profile && !error && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.06] px-4 py-8 text-center">
          <FileSearch className="h-6 w-6 text-slate-600" />
          <p className="text-xs text-slate-500 leading-snug max-w-sm">
            Paste a job description above to extract the role, skills, requirements, seniority, and other structured signals.
          </p>
          <p className="text-[10px] text-slate-600">
            This analysis is deterministic and runs instantly in your browser.
          </p>
        </div>
      )}
    </div>
  );
}
