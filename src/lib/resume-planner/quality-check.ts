"use strict";

/**
 * Resume quality check (§20) — actionable, plain-language issues before
 * export. Explicitly NOT an overall score: each finding stands alone and
 * tells the user what (if anything) to do.
 */

import type { QualityInput, QualityIssue } from "./types";

const MIN_BODY_FONT_PX = 9.5;

export function runQualityCheck(input: QualityInput): QualityIssue[] {
  const { resume, plan, pageCount, lastPageFill, bodyFontSize } = input;
  const issues: QualityIssue[] = [];

  /* ── Contact (§16/§20) ── */
  if (!resume.email.trim() && !resume.phone.trim()) {
    issues.push({
      id: "missing-contact",
      severity: "warn",
      message: "Add a contact email or phone number — recruiters can't reach you without one.",
      hint: "Profile → Identity",
    });
  }

  /* ── Summary ── */
  if (!resume.summary.trim()) {
    issues.push({
      id: "missing-summary",
      severity: plan.jobAware ? "warn" : "info",
      message: plan.jobAware
        ? "Add a 2–3 line summary. For a job-specific resume this is your first impression."
        : "Add a short professional summary so readers know who you are at a glance.",
      hint: "Profile → Identity → Summary",
    });
  }

  /* ── Experience presence ── */
  if (plan.jobAware && resume.experience.length === 0) {
    issues.push({
      id: "no-experience",
      severity: "warn",
      message:
        "This resume has no experience entries. Add your work history — evidence beats claims.",
      hint: "Profile → Experience",
    });
  }

  /* ── Bullet balance (positive + corrective) ── */
  const bulletCounts = resume.experience.map((e) => e.bulletPoints?.length ?? 0);
  const allCapped =
    bulletCounts.length > 0 &&
    plan.sections
      .find((s) => s.type === "experience")
      ?.maxBulletsPerItem !== undefined &&
    bulletCounts.some((c) => c > (plan.sections.find((s) => s.type === "experience")?.maxBulletsPerItem ?? 0));

  if (
    bulletCounts.length >= 2 &&
    bulletCounts.length <= 6 &&
    bulletCounts.every((c) => c >= 3 && c <= 6) &&
    !allCapped
  ) {
    issues.push({
      id: "experience-balanced",
      severity: "positive",
      message: "Your experience section is well balanced — 3–6 focused bullets per role.",
    });
  }

  if (allCapped) {
    const cap = plan.sections.find((s) => s.type === "experience")
      ?.maxBulletsPerItem;
    issues.push({
      id: "bullets-trimmed",
      severity: "info",
      message: `Some roles show only your top ${cap} bullets for this page target.`,
      hint: "The strongest, most job-relevant bullets are kept; the rest stay in your profile.",
    });
  }

  /* ── Section balance (§20 example) ── */
  const skillsChars = resume.skills.reduce((n, s) => n + s.name.length + 2, 0);
  const bulletChars = resume.experience.reduce(
    (n, e) => n + (e.bulletPoints ?? []).join(" ").length,
    0,
  );
  // ~60 chars/line for skill chips, ~60 chars/line for wrapped bullets,
  // plus one entry-header line per role.
  const skillsLines = Math.ceil(skillsChars / 60);
  const expLines = Math.ceil(bulletChars / 60) + resume.experience.length;
  if (resume.skills.length >= 18 && skillsLines >= expLines + 2) {
    issues.push({
      id: "skills-too-large",
      severity: "warn",
      message: "Your skills section is taking more space than your relevant experience.",
      hint: "Experience is what hiring teams read first. Trim the skills list or move detailed skills into role descriptions.",
    });
  }

  /* ── Page fit (§9) ── */
  if (pageCount !== undefined) {
    if (pageCount > plan.pageTarget) {
      issues.push({
        id: "over-page-target",
        severity: "info",
        message:
          plan.pageTarget === 1
            ? `Your content runs onto page ${pageCount}, but the plan targets one page.`
            : `Your content runs onto page ${pageCount}.`,
        hint:
          plan.pageTarget === 1
            ? "Either tighten spacing (density) or accept page 2 — we never shrink type below readable sizes just to force one page."
            : undefined,
      });
    }
    if (
      pageCount >= 2 &&
      lastPageFill !== undefined &&
      lastPageFill < 0.35
    ) {
      issues.push({
        id: "sparse-last-page",
        severity: "warn",
        message: `Page ${pageCount} contains only a short amount of content.`,
        hint: "Consider reducing section spacing or moving content up — or bring more relevant evidence onto page 2.",
      });
    }
    if (pageCount === 1 && plan.pageTarget === 1) {
      issues.push({
        id: "fits-one-page",
        severity: "positive",
        message: "Everything fits on one page at a readable size.",
      });
    }
  }

  /* ── Typography floor (§10/§17) ── */
  if (bodyFontSize !== undefined && bodyFontSize < MIN_BODY_FONT_PX) {
    issues.push({
      id: "font-too-small",
      severity: "warn",
      message: `Body text is ${bodyFontSize.toFixed(1)}px — below the readable minimum.`,
      hint: "Increase the font size or reduce content; we never solve overflow with tiny type.",
    });
  }

  /* ── Duplicates (§13) ── */
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const s of resume.skills) {
    const key = s.name.trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) dupes.add(s.name.trim());
    seen.add(key);
  }
  if (dupes.size > 0) {
    issues.push({
      id: "duplicate-skills",
      severity: "info",
      message: `Duplicate skill${dupes.size > 1 ? "s" : ""}: ${[...dupes].slice(0, 3).join(", ")}.`,
      hint: "Remove repeats so your skills list reads cleanly.",
    });
  }

  /* ── Job-aware positives ── */
  if (plan.jobAware && plan.highlightedSkills.length > 0) {
    issues.push({
      id: "job-emphasis-active",
      severity: "positive",
      message: `This resume emphasizes ${plan.highlightedSkills.length} skill${plan.highlightedSkills.length === 1 ? "" : "s"} the job asks for — all backed by your profile.`,
    });
  }

  return issues;
}
