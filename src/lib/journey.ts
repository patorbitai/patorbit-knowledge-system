/**
 * Activation Journey (§2)
 *
 * The core user journey, expressed as six explicit steps:
 *
 *   1 Build your Professional Profile
 *   2 Add your experience
 *   3 Paste a job description
 *   4 See your match
 *   5 Tailor your resume
 *   6 Export
 *
 * Pure derivation from existing product state — no new persistence.
 * Unit tested in src/lib/__tests__/journey.test.ts.
 */

export interface JourneyInput {
  /** Professional Profile has been created (onboarding completed / identity saved). */
  profileComplete: boolean;
  /** The active resume carries real experience (experience, skills or education). */
  experienceAdded: boolean;
  /** A job description has been analyzed (job profile or application exists). */
  jobAdded: boolean;
  /** A qualification match has been produced. */
  matchReady: boolean;
  /** A tailored resume version exists. */
  tailored: boolean;
  /** The resume has been exported. */
  exported: boolean;
}

export interface JourneyStepDef {
  id: "profile" | "experience" | "job" | "match" | "tailor" | "export";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export interface JourneyStepState extends JourneyStepDef {
  complete: boolean;
}

export interface JourneyState {
  steps: JourneyStepState[];
  completedCount: number;
  total: number;
  /** 0–100, rounded. */
  percent: number;
  /** First incomplete step, or null when everything is done. */
  current: JourneyStepState | null;
  complete: boolean;
}

export const JOURNEY_STEP_DEFS: JourneyStepDef[] = [
  {
    id: "profile",
    title: "Build your Professional Profile",
    description: "Add your name, headline and contact details — this is the anchor Patorbit tailors everything from.",
    actionLabel: "Open profile",
    actionHref: "/settings",
  },
  {
    id: "experience",
    title: "Add your experience",
    description: "Upload your resume and Patorbit extracts your experience, skills and education automatically.",
    actionLabel: "Upload resume",
    actionHref: "/resume-builder",
  },
  {
    id: "job",
    title: "Paste a job description",
    description: "Add the role you are targeting. Patorbit reads the requirements line by line.",
    actionLabel: "Add a job",
    actionHref: "/jobs/new",
  },
  {
    id: "match",
    title: "See your match",
    description: "Get a requirement-by-requirement breakdown: strong matches, partial matches and gaps.",
    actionLabel: "View match",
    actionHref: "/resume-builder",
  },
  {
    id: "tailor",
    title: "Tailor your resume",
    description: "Generate a version tuned to this job — every change is shown, explained, and yours to approve.",
    actionLabel: "Tailor resume",
    actionHref: "/resume-builder",
  },
  {
    id: "export",
    title: "Export",
    description: "Download the tailored resume as PDF or DOCX and send your application.",
    actionLabel: "Export resume",
    actionHref: "/resume-builder",
  },
];

const COMPLETE_MAP: Record<JourneyStepDef["id"], keyof JourneyInput> = {
  profile: "profileComplete",
  experience: "experienceAdded",
  job: "jobAdded",
  match: "matchReady",
  tailor: "tailored",
  export: "exported",
};

export function deriveJourney(input: JourneyInput): JourneyState {
  const steps: JourneyStepState[] = JOURNEY_STEP_DEFS.map((def) => ({
    ...def,
    complete: input[COMPLETE_MAP[def.id]],
  }));

  const completedCount = steps.filter((s) => s.complete).length;
  const current = steps.find((s) => !s.complete) ?? null;

  return {
    steps,
    completedCount,
    total: steps.length,
    percent: Math.round((completedCount / steps.length) * 100),
    current,
    complete: completedCount === steps.length,
  };
}
