"use strict";

import type {
  CareerJourney,
  JourneyChapter,
  JourneyStatement,
  JourneyProvenance,
  JourneySource,
} from "@/types/careerjourney";
import type {
  Claim,
  Evidence,
} from "@/types/resume";

/** Build a minimal valid JourneyStatement. */
export function makeStatement(overrides: Partial<JourneyStatement> = {}): JourneyStatement {
  return {
    id: "stmt_1",
    statement: "Led migration of the payment platform.",
    confidence: 0.9,
    evidence: [makeEvidence("ev_1")],
    claims: [makeClaim("cl_1")],
    ...overrides,
  };
}

/** Build a minimal valid JourneyChapter. */
export function makeChapter(overrides: Partial<JourneyChapter> = {}): JourneyChapter {
  return {
    id: "ch_1",
    title: "Early Career",
    sequence: 1,
    statements: [makeStatement()],
    ...overrides,
  };
}

/** Build a minimal valid CareerJourney. */
export function makeJourney(overrides: Partial<CareerJourney> = {}): CareerJourney {
  return {
    id: "journey_1",
    identityId: "identity_1",
    version: 1,
    status: "draft",
    lastRegeneratedAt: "2026-01-01T00:00:00.000Z",
    chapters: [makeChapter()],
    strongestProof: makeStatement(),
    ...overrides,
  };
}

/** Build a minimal valid JourneyProvenance. */
export function makeProvenance(overrides: Partial<JourneyProvenance> = {}): JourneyProvenance {
  return {
    id: "prov_1",
    journeyId: "journey_1",
    createdAt: "2026-01-01T00:00:00.000Z",
    sources: [makeSource()],
    ...overrides,
  };
}

/** Build a minimal valid JourneySource. */
export function makeSource(overrides: Partial<JourneySource> = {}): JourneySource {
  return {
    type: "resume",
    description: "Resume input",
    impactFactor: 0.8,
    ...overrides,
  };
}

/** Build a resume-domain Claim (minimal). */
export function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "cl_1",
    assertionText: "Led migration of the payment platform.",
    claimType: "Project",
    sourceActivityId: "project-0",
    confidence: 0.9,
    reasoning: "Backed by project evidence.",
    verificationStatus: "accepted",
    reviewed: true,
    accepted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** Build a resume-domain Evidence (minimal). */
export function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "ev_1",
    claimId: "cl_1",
    evidenceType: "file",
    evidenceKind: "Screenshots",
    content: "evd_blob_key",
    format: "image/png",
    metadata: { fileName: "payment-migration.png" },
    uploadedBy: "self",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    status: "evidence-added",
    confidence: 0.8,
    notes: "",
    visibility: "private",
    consent: true,
    ...overrides,
  };
}
