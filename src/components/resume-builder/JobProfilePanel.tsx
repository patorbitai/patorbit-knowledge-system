"use client";

import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { FileSearch, Briefcase, CheckCircle2, Tag, Layers, GraduationCap, Sparkles, Loader2 } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { buildJobProfile } from "@/lib/job-profile";
import type { JobProfile, JobSkill } from "@/types/job-profile";

function Section({ icon, title, count }: { icon: React.ReactNode; title: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5 pb-1 pt-2">
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/[0.06] px-4 py-6 text-center">
      <FileSearch className="h-5 w-5 text-slate-600" />
      <p className="text-[11px] text-slate-500 leading-snug">
        Paste a job description to build a structured Job Profile
        (requirements, responsibilities, skills, seniority, domain, qualifications).
      </p>
    </div>
  );
}

export function JobProfilePanel() {
  const jobDescription = useResumeBuilder((s) => s.jobDescription);
  const setJobDescription = useResumeBuilder((s) => s.setJobDescription);
  const jobProfile = useResumeBuilder((s) => s.jobProfile);
  const setJobProfile = useResumeBuilder((s) => s.setJobProfile);
  const [analyzing, setAnalyzing] = useState(false);

  const canAnalyze = jobDescription.trim().length > 0;

  // Live preview from local input (deterministic, no AI, no network).
  const live = useMemo<JobProfile | null>(() => {
    if (!jobDescription.trim()) return null;
    return buildJobProfile(jobDescription);
  }, [jobDescription]);

  const handleAnalyze = () => {
    if (!canAnalyze) return;
    setAnalyzing(true);
    // Defer so the spinner paints; the build itself is synchronous + deterministic.
    requestAnimationFrame(() => {
      setJobProfile(live);
      setAnalyzing(false);
    });
  };

  const profile = jobProfile ?? live;

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          rows={5}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-xs text-white outline-none transition-all placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] tabular-nums text-slate-600">
            {jobDescription.length.toLocaleString()} chars
          </span>
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze || analyzing}
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-semibold transition-all",
              canAnalyze && !analyzing
                ? "bg-cyan-600/80 text-white hover:bg-cyan-600"
                : "cursor-not-allowed bg-white/[0.03] text-slate-600",
            )}
          >
            {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Briefcase className="h-3 w-3" />}
            {analyzing ? "Analyzing..." : "Analyze Job"}
          </button>
        </div>
      </div>

      {!profile ? (
        <EmptyState />
      ) : (
        <div className="space-y-1">
          {profile.title && (
            <p className="text-xs font-semibold text-white">{profile.title}</p>
          )}

          {profile.requirements.length > 0 && (
            <>
              <Section icon={<CheckCircle2 className="h-3 w-3" />} title="Requirements" count={profile.requirements.length} />
              <div className="space-y-1">
                {profile.requirements.map((r, i) => (
                  <ItemRow key={i} text={r.text} source={r.source} />
                ))}
              </div>
            </>
          )}

          {profile.responsibilities.length > 0 && (
            <>
              <Section icon={<Briefcase className="h-3 w-3" />} title="Responsibilities" count={profile.responsibilities.length} />
              <div className="space-y-1">
                {profile.responsibilities.map((r, i) => (
                  <ItemRow key={i} text={r.text} source={r.source} />
                ))}
              </div>
            </>
          )}

          {profile.qualifications.length > 0 && (
            <>
              <Section icon={<GraduationCap className="h-3 w-3" />} title="Qualifications" count={profile.qualifications.length} />
              <div className="space-y-1">
                {profile.qualifications.map((q, i) => (
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
                {profile.implicitCompetencies.map((c, i) => (
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
        </div>
      )}
    </div>
  );
}
