"use client";

/**
 * /resume-gallery — internal visual QA environment (§5).
 *
 * Renders realistic profiles through ALL 7 template families using the real
 * pipeline: Profile → Job Analysis → Content Plan → Layout Plan → Renderer.
 * Shows profile, target job, family, measured page count and quality issues
 * next to the actual paginated preview. Development reference only — not
 * linked from product navigation.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES, TEMPLATE_FAMILIES, familyIdOf } from "@/app/resume-builder/templates";
import { buildCareerProfile } from "@/lib/career-profile";
import { buildJobProfile } from "@/lib/job-profile";
import { buildQualificationMatch } from "@/lib/qualification-match";
import {
  buildContentPlan,
  buildLayoutPlan,
  runQualityCheck,
  runAtsCheck,
} from "@/lib/resume-planner";
import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import { A4 } from "@/lib/resume-design-system/geometry";
import {
  PROFILES,
  JOBS,
} from "@/lib/resume-planner/__tests__/fixtures";
import type { Resume } from "@/types/resume";

const PROFILE_CHOICES: { key: string; label: string; resume: Resume }[] = [
  { key: "A", label: "A · Early career", resume: PROFILES.early },
  { key: "B", label: "B · Mid-career", resume: PROFILES.mid },
  { key: "C", label: "C · Senior", resume: PROFILES.senior },
  { key: "D", label: "D · Technical", resume: PROFILES.technical },
  { key: "E", label: "E · Executive", resume: PROFILES.executive },
  { key: "F", label: "F · Sparse", resume: PROFILES.sparse },
];

/** One canonical template per family — the family IS the primary choice (§7). */
function canonicalTemplate(familyId: string) {
  return (
    TEMPLATES.find((t) => familyIdOf(t.id) === familyId) ?? TEMPLATES[0]
  );
}

function FamilyCard({
  resume,
  familyId,
  plan,
}: {
  resume: Resume;
  familyId: string;
  plan: ReturnType<typeof buildContentPlan>;
}) {
  const template = useMemo(() => canonicalTemplate(familyId), [familyId]);
  const family = TEMPLATE_FAMILIES.find((f) => f.id === familyId)!;
  const measuredRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [lastPageFill, setLastPageFill] = useState<number | undefined>(undefined);

  const issues = useMemo(
    () => [
      ...runQualityCheck({
        resume,
        plan,
        pageCount: pageCount ?? undefined,
        // Real geometry from the rendered pages — lets sparse-last-page /
        // over-page-target fire here the same way they do in the builder.
        lastPageFill,
      }),
      ...runAtsCheck({ templateId: template.id, familyId, layout: template.layout }),
    ],
    [resume, plan, pageCount, lastPageFill, familyId, template],
  );

  // Count the real .rs-page sheets the paginator produced + measure the last
  // page's content fill (rect-based so the preview transform cancels out).
  useEffect(() => {
    const el = measuredRef.current;
    if (!el) return;
    const count = () => {
      const pages = [...el.querySelectorAll<HTMLElement>(".rs-page, [data-rs-page]")].filter(
        (p) => p.offsetHeight > 0,
      );
      if (pages.length > 0) {
        setPageCount(pages.length);
        const last = pages[pages.length - 1];
        const lr = last.getBoundingClientRect();
        // LEAF elements only — a stretched full-height wrapper would
        // otherwise report fill = 1 and hide real sparse pages.
        let bottom = lr.top;
        for (const leaf of last.querySelectorAll("p, li, h1, h2, h3, span, a, div")) {
          if (leaf.children.length > 0) continue;
          const kr = leaf.getBoundingClientRect();
          if (kr.height > 0 && kr.height < lr.height) bottom = Math.max(bottom, kr.bottom);
        }
        if (lr.height > 0) {
          setLastPageFill(Math.min(1, Math.max(0, (bottom - lr.top) / lr.height)));
        }
      }
    };
    count();
    const ro = new ResizeObserver(count);
    ro.observe(el);
    const t = window.setTimeout(count, 600);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, [resume, plan, template]);

  const scale = 0.34;

  return (
    <div className="flex flex-col rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
      {/* Meta */}
      <div className="px-4 py-3 border-b border-white/[0.06] space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white">{family.name}</span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300">
            {pageCount !== null
              ? `${pageCount} page${pageCount > 1 ? "s" : ""}`
              : "measuring…"}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">{family.purpose}</p>
        <p className="text-[10px] text-slate-600">
          via <span className="text-slate-400">{template.name}</span> ({template.id})
          {plan.jobAware && (
            <span className="text-emerald-500"> · optimized for {plan.targetRole}</span>
          )}
        </p>
      </div>

      {/* Quality issues */}
      <ul className="px-4 py-2 space-y-1 border-b border-white/[0.06] min-h-[52px]">
        {issues.length === 0 && (
          <li className="text-[10px] text-slate-500">No issues flagged.</li>
        )}
        {issues.slice(0, 4).map((i) => (
          <li
            key={i.id}
            className={
              "text-[10px] leading-snug " +
              (i.severity === "warn"
                ? "text-amber-400"
                : i.severity === "positive"
                  ? "text-emerald-400"
                  : "text-slate-500")
            }
          >
            {i.severity === "warn" ? "▲ " : i.severity === "positive" ? "✓ " : "· "}
            {i.message}
          </li>
        ))}
      </ul>

      {/* Actual paginated preview */}
      <div className="p-4 bg-[#05070d]" ref={measuredRef}>
        <div
          aria-hidden="true"
          className="origin-top-left"
          style={{
            width: A4.widthPx,
            transform: `scale(${scale})`,
            height: "auto",
          }}
        >
          <PaginatedResumeSheet
            resume={resume}
            template={template}
            plan={plan}
          />
        </div>
        <div style={{ height: 480 * 1.14 }} className="pointer-events-none" />
      </div>
    </div>
  );
}

export default function ResumeGalleryPage() {
  const [profileKey, setProfileKey] = useState("B");
  const [jobIdx, setJobIdx] = useState<number>(0); // -1 = no job

  const profile =
    PROFILE_CHOICES.find((p) => p.key === profileKey) ?? PROFILE_CHOICES[1];
  const job = jobIdx >= 0 ? JOBS[jobIdx] : null;

  const plan = useMemo(() => {
    const resume = profile.resume;
    if (!job) {
      return buildContentPlan(resume, { jobAware: false });
    }
    // Real deterministic pipeline — no hand-made match data.
    const cp = buildCareerProfile(resume);
    const jp = buildJobProfile(job.text);
    const match = buildQualificationMatch(cp, jp);
    return buildContentPlan(resume, {
      qualificationMatch: match,
      jobTitle: job.title,
      jobCompany: job.company,
    });
  }, [profile, job]);

  const layout = useMemo(() => buildLayoutPlan(plan), [plan]);

  return (
    <main className="min-h-screen bg-[#070a12] text-slate-200 px-6 py-8">
      <header className="max-w-[1400px] mx-auto mb-6 space-y-3">
        <h1 className="text-xl font-semibold text-white">Resume Gallery — Visual QA</h1>
        <p className="text-xs text-slate-400">
          Profile → Job Analysis → Content Plan → Layout Plan → Family → Renderer.
          Inspect actual pages before shipping template changes.
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5" role="group" aria-label="Profile">
            {PROFILE_CHOICES.map((p) => (
              <button
                key={p.key}
                onClick={() => setProfileKey(p.key)}
                className={
                  "px-2.5 py-1.5 rounded-lg border transition-all " +
                  (profileKey === p.key
                    ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                    : "border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04]")
                }
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5" role="group" aria-label="Target job">
            <button
              onClick={() => setJobIdx(-1)}
              className={
                "px-2.5 py-1.5 rounded-lg border " +
                (jobIdx === -1
                  ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                  : "border-white/[0.08] text-slate-400 hover:text-white")
              }
            >
              No job (master)
            </button>
            {JOBS.map((j, i) => (
              <button
                key={j.title}
                onClick={() => setJobIdx(i)}
                className={
                  "px-2.5 py-1.5 rounded-lg border " +
                  (jobIdx === i
                    ? "border-cyan-500/50 bg-cyan-500/10 text-white"
                    : "border-white/[0.08] text-slate-400 hover:text-white")
                }
              >
                {j.title}
              </button>
            ))}
          </div>
        </div>

        {/* Plan summary (§10 — honest, presentation-only) */}
        <div
          className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-4 py-2.5 text-xs text-slate-400 flex flex-wrap gap-x-6 gap-y-1"
          data-testid="gallery-plan-summary"
        >
          {job && plan.jobAware ? (
            <span className="text-emerald-400 font-medium">
              Optimized presentation for {plan.targetRole} — {plan.targetCompany}
            </span>
          ) : (
            <span className="text-slate-500">Master presentation (no target job)</span>
          )}
          <span>
            Strategy: <strong className="text-slate-200">{plan.roleStrategy}</strong>
          </span>
          <span>
            Sections:{" "}
            <strong className="text-slate-200">
              {layout.sectionOrder.join(" → ")}
            </strong>
          </span>
          <span>
            Page target: <strong className="text-slate-200">{plan.pageTarget}</strong>
          </span>
          <span>
            Density: <strong className="text-slate-200">{plan.density}</strong>
          </span>
          <span>
            Highlighted skills:{" "}
            <strong className="text-slate-200">{plan.highlightedSkills.length}</strong>
          </span>
        </div>
      </header>

      <section className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5">
        {TEMPLATE_FAMILIES.map((f) => (
          <FamilyCard
            key={f.id}
            resume={profile.resume}
            familyId={f.id}
            plan={plan}
          />
        ))}
      </section>
    </main>
  );
}
