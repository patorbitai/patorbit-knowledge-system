"use client";

/**
 * Store-bound selector for the resume content plan. Used by the builder
 * preview, the export modal and the print target so every surface renders
 * from the SAME deliberate plan (preview ↔ export parity).
 */

import { useMemo } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { buildContentPlan } from "./content-plan";
import type { ResumeContentPlan } from "./types";

export function useResumePlan(): ResumeContentPlan {
  const resume = useResumeBuilder((s) => s.resume);
  const qualificationMatch = useResumeBuilder((s) => s.qualificationMatch);
  const activeApplication = useResumeBuilder((s) => s.activeJobApplication);
  const jobAwarePref = useResumeBuilder((s) => s.previewJobAware);

  const jobTitle = activeApplication?.title ?? "";
  const jobCompany = activeApplication?.companyName ?? "";

  return useMemo(
    () =>
      buildContentPlan(resume, {
        qualificationMatch,
        jobTitle,
        jobCompany,
        // User toggle wins; otherwise auto (job-aware when a match exists).
        jobAware: jobAwarePref && !!qualificationMatch,
      }),
    [resume, qualificationMatch, jobTitle, jobCompany, jobAwarePref],
  );
}
