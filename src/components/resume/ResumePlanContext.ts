"use client";

/**
 * ResumePlanContext — carries the active ResumeContentPlan from the
 * ResumePreview (the one place that knows which resume it is drawing) into
 * the template components, WITHOUT touching each of the 32 template files.
 *
 * Templates that ignore the context still receive the materialized view
 * model (budgeted data); the factory-based templates and the four bespoke
 * templates (modern-clean, engineering-clean, executive-pro, patorbit-modern)
 * additionally honor the plan's section ORDER and INCLUSION, so hierarchy
 * adapts to the target role.
 */

import { createContext, useContext } from "react";
import type { ResumeContentPlan } from "@/lib/resume-planner";

export const ResumePlanContext = createContext<ResumeContentPlan | null>(null);

/** Plan for the current ResumePreview subtree; null outside a preview. */
export function useResumePlanContext(): ResumeContentPlan | null {
  return useContext(ResumePlanContext);
}
