"use strict";

/**
 * Layout plan (architecture step 4) — turns the content plan into the
 * concrete instructions the renderer consumes: final order, spacing density,
 * page target. Thin by design: the content plan carries the decisions; this
 * maps them onto the rendering system's vocabulary.
 */

import type {
  Density,
  ResumeContentPlan,
  ResumeLayoutPlan,
  SectionType,
} from "./types";

const SPACING_BY_DENSITY: Record<Density, "compact" | "normal" | "spacious"> = {
  compact: "compact",
  balanced: "normal",
  spacious: "spacious",
};

export function buildLayoutPlan(plan: ResumeContentPlan): ResumeLayoutPlan {
  const reasons = {} as Record<SectionType, string>;
  for (const section of plan.sections) {
    reasons[section.type] = section.reason;
  }

  return {
    version: 1,
    sectionOrder: plan.sections.map((s) => s.type),
    spacingDensity: SPACING_BY_DENSITY[plan.density],
    pageTarget: plan.pageTarget,
    reasons,
  };
}
