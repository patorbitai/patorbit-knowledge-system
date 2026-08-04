"use strict";

/**
 * Verification Badge Deriver — Slice 2, Task 3.
 *
 * A pure function that maps a Claim + its Evidence to a single badge state.
 * The badge is NEVER decorative: every state is derived from real data and
 * carries an action. A claim with no evidence structurally cannot show
 * "verified".
 *
 * States:
 *   no-evidence     — accepted claim, zero evidence.
 *   evidence-added  — ≥1 evidence, claim not yet under review.
 *   under-review    — claim's evidence submitted for review.
 *   verified        — claim/evidence went through review (simulation in Beta).
 *   expired         — claim's evidence expired.
 *   rejected        — claim's evidence was revoked/rejected at review.
 */

import type { Claim, Evidence } from "@/types/resume";

export type BadgeState =
  | "no-evidence"
  | "evidence-added"
  | "under-review"
  | "verified"
  | "expired"
  | "rejected";

/**
 * Derive the badge state for a claim given its evidence list.
 *
 * Precedence (most severe wins):
 *   rejected  > expired  > verified  > under-review  > evidence-added  > no-evidence
 *
 * `verified` only holds if the claim itself is verified AND no evidence is
 * rejected/expired. Evidence drives the state; the claim status corroborates.
 */
export function deriveBadgeStatus(claim: Claim, evidence: Evidence[]): BadgeState {
  // A claim that was never accepted has no badge yet — treat as needing evidence.
  if (!claim.accepted) return "no-evidence";

  const rejected = evidence.filter((e) => e.status === "revoked").length;
  const expired = evidence.filter((e) => e.status === "expired").length;
  const verified = evidence.filter((e) => e.status === "verified").length;

  if (rejected > 0) return "rejected";
  if (expired > 0 && evidence.length > 0) return "expired";
  if (evidence.length === 0) return "no-evidence";

  // Claim-level corroboration:
  //   under-review → claim marked under-review OR any evidence under-review.
  //   verified     → claim verified AND all evidence verified (or claim verified with evidence present).
  if (claim.verificationStatus === "verified" && verified > 0) return "verified";
  if (
    claim.verificationStatus === "under-review" ||
    evidence.some((e) => e.status === "under-review")
  ) {
    return "under-review";
  }

  return "evidence-added";
}

export interface BadgeConfig {
  label: string;
  /** Tailwind text color class. */
  color: string;
  /** Tailwind background tint class. */
  bg: string;
  /** Tailwind border class. */
  border: string;
  /** Short tooltip shown on hover / aria-label. */
  tooltip: string;
  /** Which lucide icon (passed in by the component). */
  icon: "ShieldCheck" | "Shield" | "ShieldAlert" | "ShieldOff" | "ShieldX";
}

/** Config table — one entry per badge state. The badge renders from this ONLY. */
export const BADGE_CONFIG: Record<BadgeState, BadgeConfig> = {
  "no-evidence": {
    label: "Needs Evidence",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    tooltip: "This claim has no evidence. Add a document to start building trust.",
    icon: "ShieldAlert",
  },
  "evidence-added": {
    label: "Supported",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    tooltip: "Evidence attached. Claim is supported.",
    icon: "ShieldCheck",
  },
  "under-review": {
    label: "Under Review",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    tooltip: "Evidence submitted for review.",
    icon: "Shield",
  },
  verified: {
    label: "Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    tooltip: "Verified by review.",
    icon: "ShieldCheck",
  },
  expired: {
    label: "Expired",
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    tooltip: "Supporting evidence has expired. Renew to keep this claim strong.",
    icon: "ShieldOff",
  },
  rejected: {
    label: "Rejected",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    tooltip: "Evidence was rejected. Review the note and add a new document.",
    icon: "ShieldX",
  },
};
