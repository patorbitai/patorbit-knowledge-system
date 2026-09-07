"use strict";

import type { PlanFeatures, SubscriptionTier } from "@/services/entitlement.service";

/* ── Restriction Types ────────────────────────────────────────────────────── */

export type RestrictionType =
  | "template"
  | "resume-limit"
  | "ai-feature"
  | "export"
  | "evidence"
  | "trust"
  | "passport"
  | "knowledge-graph"
  | "career-timeline"
  | "career-insights"
  | "ats-advanced"
  | "qualification-match"
  | "general";

export interface RestrictionContext {
  type: RestrictionType;
  /** Human-readable name of the feature the user tried to access. */
  featureName?: string;
  /** The plan required for this feature. */
  requiredPlan?: SubscriptionTier;
  /** Specific detail about the restriction (e.g., "2 of 2 resumes used"). */
  detail?: string;
}

export interface RestrictionMessage {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

/* ── Message Registry ─────────────────────────────────────────────────────── */

const MESSAGES: Record<RestrictionType, (ctx: RestrictionContext) => RestrictionMessage> = {
  template: (ctx) => ({
    title: "Pro Template",
    description: ctx.featureName
      ? `"${ctx.featureName}" is available with Patorbit Pro. Upgrade to access all 29+ professional templates.`
      : "This template is available with Patorbit Pro. Upgrade to access all 29+ professional templates.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  "resume-limit": (ctx) => ({
    title: "Resume Limit Reached",
    description: ctx.detail
      ? `${ctx.detail} Upgrade your plan to create unlimited resumes.`
      : "You've reached the maximum number of resumes on your current plan. Upgrade to create unlimited resumes.",
    actionLabel: "Upgrade Plan",
    actionHref: "/pricing",
  }),

  "ai-feature": (ctx) => ({
    title: "AI Feature Unavailable",
    description: ctx.featureName
      ? `"${ctx.featureName}" requires Patorbit Pro. This advanced AI capability isn't included in your current plan.`
      : "This AI feature requires Patorbit Pro. Advanced AI capabilities aren't included in your current plan.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  export: (ctx) => ({
    title: "Premium Export",
    description: ctx.featureName
      ? `${ctx.featureName} is available on a higher plan. Upgrade to unlock advanced export options.`
      : "This export option is available on a higher plan. Upgrade to unlock advanced export options.",
    actionLabel: "View Plans",
    actionHref: "/pricing",
  }),

  evidence: () => ({
    title: "Evidence Management",
    description: "Evidence management requires Patorbit Pro. Attach supporting documents to strengthen your professional claims.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  trust: () => ({
    title: "Trust Score",
    description: "Trust Score requires Patorbit Pro. See how your professional claims are supported by evidence and verification.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  passport: () => ({
    title: "Professional Passport",
    description: "Professional Passport requires Patorbit Pro. Share your verified professional identity with employers.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  "knowledge-graph": () => ({
    title: "Knowledge Graph",
    description: "Knowledge Graph requires Patorbit Pro. Visualize your professional network and career connections.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  "career-timeline": () => ({
    title: "Career Timeline",
    description: "Career Timeline requires Patorbit Pro. Track your professional journey and milestones.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  "career-insights": () => ({
    title: "Career Insights",
    description: "Career Insights require Patorbit Pro. Get personalized recommendations for your career growth.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  "ats-advanced": () => ({
    title: "Advanced ATS Analysis",
    description: "Advanced ATS analysis requires Patorbit Pro. Get deeper insights into how your resume performs against applicant tracking systems.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  "qualification-match": () => ({
    title: "Full Qualification Match",
    description: "Full qualification matching requires Patorbit Pro. See detailed comparisons between your profile and job requirements.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),

  general: (ctx) => ({
    title: "Premium Feature",
    description: ctx.featureName
      ? `"${ctx.featureName}" requires a Patorbit Pro subscription.`
      : "This feature requires a Patorbit Pro subscription.",
    actionLabel: "Upgrade to Pro",
    actionHref: "/pricing",
  }),
};

/* ── Public API ───────────────────────────────────────────────────────────── */

/**
 * Get a user-friendly restriction message for a given restriction type.
 */
export function getRestrictionMessage(ctx: RestrictionContext): RestrictionMessage {
  const factory = MESSAGES[ctx.type] || MESSAGES.general;
  return factory(ctx);
}

/**
 * Check if a feature is available for the given plan features.
 * Returns true if the feature IS available.
 */
export function isFeatureAvailable(
  features: PlanFeatures,
  featureKey: keyof PlanFeatures,
): boolean {
  const value = features[featureKey];
  if (typeof value === "number") {
    return value === -1 || value > 0;
  }
  return value === true;
}

/**
 * Determine the restriction type for a given feature key.
 */
export function restrictionTypeForFeature(featureKey: keyof PlanFeatures): RestrictionType {
  const mapping: Partial<Record<keyof PlanFeatures, RestrictionType>> = {
    allTemplates: "template",
    aiAdvanced: "ai-feature",
    aiBasic: "ai-feature",
    evidence: "evidence",
    trustScore: "trust",
    passport: "passport",
    knowledgeGraph: "knowledge-graph",
    careerTimeline: "career-timeline",
    careerInsights: "career-insights",
    atsAdvanced: "ats-advanced",
    qualificationMatchFull: "qualification-match",
    qualificationMatchBasic: "qualification-match",
    jobAnalysisAdvanced: "ai-feature",
    pdfExport: "export",
  };
  return mapping[featureKey] || "general";
}
