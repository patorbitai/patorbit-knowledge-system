/**
 * Workflow State Derivation
 *
 * Derives Resume → Job → Match → Tailor → Export state from existing
 * authoritative data. No new persistence — purely derived from what exists.
 */

import type { Resume } from "@/types/resume";
import type { JobProfile } from "@/types/job-profile";
import type { QualificationMatch } from "@/types/qualification-match";

export type WorkflowStepId = "resume" | "job" | "match" | "tailor" | "export";

export interface WorkflowState {
  resume: boolean;
  job: boolean;
  match: boolean;
  tailor: boolean;
  export: boolean;
}

/**
 * Check if a resume has meaningful content (not just an empty shell).
 */
function hasResumeContent(resume: Resume | null | undefined): boolean {
  if (!resume) return false;
  return !!(
    resume.name ||
    resume.title ||
    resume.summary ||
    (resume.experience && resume.experience.length > 0) ||
    (resume.skills && resume.skills.length > 0) ||
    (resume.education && resume.education.length > 0)
  );
}

/**
 * Check if a resume is a tailored version (created by TailorResumeModal).
 * TailorResumeModal names resumes: "${originalName} — Tailored"
 */
function isTailoredResume(resume: Resume | null | undefined): boolean {
  if (!resume) return false;
  const name = resume.resumeName || resume.name || "";
  return name.includes("— Tailored") || name.includes("– Tailored");
}

/**
 * Derive the complete workflow state from existing data.
 *
 * All state is derived — no additional flags or persistence needed.
 */
export function deriveWorkflowState(
  resume: Resume | null | undefined,
  jobProfile: JobProfile | null | undefined,
  qualificationMatch: QualificationMatch | null | undefined,
  hasExported: boolean,
): WorkflowState {
  return {
    resume: hasResumeContent(resume),
    job: !!jobProfile,
    match: !!qualificationMatch,
    tailor: isTailoredResume(resume),
    export: hasExported,
  };
}

/**
 * Get the current workflow step (first incomplete step).
 */
export function getCurrentStep(state: WorkflowState): WorkflowStepId | "complete" {
  const steps: WorkflowStepId[] = ["resume", "job", "match", "tailor", "export"];
  for (const step of steps) {
    if (!state[step]) return step;
  }
  return "complete";
}

/**
 * Get a human-readable description of what each step means.
 */
export function getStepDescription(step: WorkflowStepId, state: WorkflowState): string {
  if (state[step]) {
    switch (step) {
      case "resume": return "Resume ready";
      case "job": return "Job analyzed";
      case "match": return "Match complete";
      case "tailor": return "Resume tailored";
      case "export": return "Resume exported";
    }
  }
  switch (step) {
    case "resume": return "Build your resume";
    case "job": return "Add a job description";
    case "match": return "Analyze your fit";
    case "tailor": return "Tailor your resume";
    case "export": return "Export final resume";
  }
}

/**
 * Get the "next step" recommendation for the Overview dashboard.
 */
export function getNextStepRecommendation(
  state: WorkflowState,
  resumeName: string | undefined,
): { title: string; description: string; actionLabel: string; actionHref: string } | null {
  const step = getCurrentStep(state);

  if (step === "complete") {
    return {
      title: "Ready to apply",
      description: `Your tailored resume "${resumeName || "Resume"}" is ready. Export it and apply.`,
      actionLabel: "Export Resume",
      actionHref: "/resume-builder",
    };
  }

  switch (step) {
    case "resume":
      return {
        title: "Start with your resume",
        description: "Create or import your resume to begin the application workflow.",
        actionLabel: "Open Resume Builder",
        actionHref: "/resume-builder",
      };
    case "job":
      return {
        title: "Analyze a job",
        description: "Paste a job description to see how well your resume matches the role.",
        actionLabel: "Tailor to Job",
        actionHref: "/resume-builder",
      };
    case "match":
      return {
        title: "Check your match",
        description: "Review how your skills and experience align with the job requirements.",
        actionLabel: "View Match",
        actionHref: "/resume-builder",
      };
    case "tailor":
      return {
        title: "Tailor your resume",
        description: "Generate a version of your resume optimized for this specific role.",
        actionLabel: "Tailor Resume",
        actionHref: "/resume-builder",
      };
    case "export":
      return {
        title: "Export your resume",
        description: "Download your final resume as a PDF and apply to the role.",
        actionLabel: "Export PDF",
        actionHref: "/resume-builder",
      };
    default:
      return null;
  }
}
