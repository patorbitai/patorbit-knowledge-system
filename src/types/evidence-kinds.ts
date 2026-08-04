"use strict";

/**
 * Evidence Kind Taxonomy — Beta (PKS-SRS-PIP-1 §2.4).
 *
 * A closed, curated set of evidence kinds a user can attach to a Claim, grouped
 * by category. Each kind declares:
 *   - its transport (`evidenceType`: "file" | "link" | "document"),
 *   - the graph `EvidenceNode.format` it should map to
 *     ("document" | "artifact" | "link" in knowledge-graph terms),
 *   - which ClaimType(s) each kind legitimately supports.
 *
 * This is the SINGLE source of truth for the Add Evidence UI. The user picks a
 * kind; `evidenceType` is auto-derived so the form never asks about transport.
 */

import type { ClaimType, EvidenceKind, EvidenceType } from "./resume";

export type EvidenceCategory =
  | "Employment"
  | "Education"
  | "Projects"
  | "Skills"
  | "Portfolio";

/** Graph `EvidenceNode.format` values used by TrustService/GraphService. */
export type EvidenceGraphFormat = "document" | "artifact" | "link";

export interface EvidenceKindDefinition {
  /** The kind, exactly as stored in `Evidence.evidenceKind`. */
  kind: EvidenceKind;
  /** User-facing group for the picker UI. */
  category: EvidenceCategory;
  /** Auto-derived transport. */
  transport: EvidenceType;
  /** Chart format when this kind becomes an EvidenceNode. */
  graphFormat: EvidenceGraphFormat;
  /** Claim types this kind can support. */
  supports: ClaimType[];
  /** Short helper shown in the picker. */
  hint: string;
}

/** The full Beta taxonomy — 16 kinds. Keep in sync with the `EvidenceKind` union. */
export const EVIDENCE_KIND_DEFINITIONS: EvidenceKindDefinition[] = [
  // Employment
  { kind: "Experience Letter", category: "Employment", transport: "document", graphFormat: "document", supports: ["Employment"], hint: "A letter from your employer confirming your role and dates." },
  { kind: "Offer Letter", category: "Employment", transport: "document", graphFormat: "document", supports: ["Employment"], hint: "The original offer confirming you were hired." },
  { kind: "Payslip", category: "Employment", transport: "document", graphFormat: "document", supports: ["Employment"], hint: "A pay stub substantiating employment dates and role." },
  { kind: "Company Email", category: "Employment", transport: "file", graphFormat: "document", supports: ["Employment"], hint: "An email from a company address confirming your tenure." },
  // Education
  { kind: "Degree", category: "Education", transport: "document", graphFormat: "document", supports: ["Education"], hint: "Your degree certificate." },
  { kind: "Transcript", category: "Education", transport: "document", graphFormat: "document", supports: ["Education"], hint: "An official academic transcript." },
  { kind: "Student ID", category: "Education", transport: "file", graphFormat: "document", supports: ["Education"], hint: "A student identity card or enrollment proof." },
  // Projects
  { kind: "GitHub Repository", category: "Projects", transport: "link", graphFormat: "artifact", supports: ["Project", "Skill"], hint: "A public repository URL showing your work." },
  { kind: "Live Demo", category: "Projects", transport: "link", graphFormat: "artifact", supports: ["Project"], hint: "A deployed demo URL." },
  { kind: "Screenshots", category: "Projects", transport: "file", graphFormat: "artifact", supports: ["Project"], hint: "Screenshots of the project in use." },
  { kind: "Demo Video", category: "Projects", transport: "file", graphFormat: "artifact", supports: ["Project"], hint: "A short video demonstrating the project." },
  // Skills
  { kind: "Certificate", category: "Skills", transport: "document", graphFormat: "document", supports: ["Skill", "Certification"], hint: "A course or certification certificate." },
  { kind: "Assessment", category: "Skills", transport: "document", graphFormat: "document", supports: ["Skill", "Certification"], hint: "A skills assessment result." },
  { kind: "Portfolio", category: "Skills", transport: "link", graphFormat: "artifact", supports: ["Project", "Contribution"], hint: "A portfolio link evidencing your skills." },
  // Portfolio
  { kind: "Website", category: "Portfolio", transport: "link", graphFormat: "link", supports: ["Project", "Contribution"], hint: "A personal or project website." },
  { kind: "Behance", category: "Portfolio", transport: "link", graphFormat: "artifact", supports: ["Project", "Contribution"], hint: "A Behance project URL." },
  { kind: "Dribbble", category: "Portfolio", transport: "link", graphFormat: "artifact", supports: ["Project", "Contribution"], hint: "A Dribbble shot URL." },
];

/* ── Lookups & derived values ── */

const BY_KIND = new Map<EvidenceKind, EvidenceKindDefinition>(
  EVIDENCE_KIND_DEFINITIONS.map((d) => [d.kind, d]),
);
const BY_CATEGORY = new Map<EvidenceCategory, EvidenceKindDefinition[]>();
for (const d of EVIDENCE_KIND_DEFINITIONS) {
  const list = BY_CATEGORY.get(d.category) ?? [];
  list.push(d);
  BY_CATEGORY.set(d.category, list);
}

export function getEvidenceKind(kind: EvidenceKind): EvidenceKindDefinition {
  const d = BY_KIND.get(kind);
  if (!d) throw new Error(`Unknown evidence kind: ${kind}`);
  return d;
}

/** The union of every valid evidence kind (for iteration). */
export const ALL_EVIDENCE_KINDS: EvidenceKind[] = EVIDENCE_KIND_DEFINITIONS.map((d) => d.kind);

/** Evidence kinds grouped by category, in display order. */
export function evidenceKindsByCategory(): { category: EvidenceCategory; kinds: EvidenceKindDefinition[] }[] {
  return [...BY_CATEGORY.entries()].map(([category, kinds]) => ({ category, kinds }));
}

/** Auto-derive the transport ("file"|"link"|"document") from the chosen kind. */
export function kindToTransport(kind: EvidenceKind): EvidenceType {
  return getEvidenceKind(kind).transport;
}

/** Auto-derive the graph `EvidenceNode.format` from the chosen kind. */
export function kindToGraphFormat(kind: EvidenceKind): EvidenceGraphFormat {
  return getEvidenceKind(kind).graphFormat;
}

/** Kinds that legitimately support a given claim type (for picker filtering). */
export function kindsForClaimType(claimType: ClaimType): EvidenceKind[] {
  return EVIDENCE_KIND_DEFINITIONS.filter((d) => d.supports.includes(claimType)).map((d) => d.kind);
}