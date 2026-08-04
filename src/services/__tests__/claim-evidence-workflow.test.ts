"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder } from "@/store/resume-builder";
import { deriveBadgeStatus } from "@/lib/evidence/badge";
import type { Evidence, SuggestedClaim } from "@/types/resume";

/**
 * Task 1 — Claim → Evidence Workflow
 *
 * Verifies the state-machine driving the flow:
 *
 *   SuggestedClaim ─acceptClaim──▶ Claim(accepted)
 *        │
 *        └─Accept─▶ "Strengthen this claim" ─▶ AddEvidenceModal ─▶ addEvidence ─▶ Claim(evidence-added) + Evidence(evidence-added)
 *
 * The walkthrough maps directly onto store actions exercised here:
 *   1. Accepted Claim
 *   2. "Strengthen this Claim" (targets the claim by id)
 *   3. AddEvidenceModal's submit → `addEvidence(record)`
 *   4. Evidence persisted + Claim updated to `evidence-added`
 */

/** A SuggestedClaim shaped exactly as the AI detection produces it. */
function makeSuggestion(overrides: Partial<SuggestedClaim> = {}): SuggestedClaim {
  return {
    assertionText: "Led a 6-person team at Tech Corp",
    claimType: "Employment",
    sourceActivityId: "experience-0",
    confidence: 0.92,
    reasoning: "Backed by the experience entry's role and tenure.",
    ...overrides,
  };
}

/** An Evidence record as AddEvidenceModal's submit builds it. */
function makeEvidence(claimId: string, overrides: Partial<Evidence> = {}): Evidence {
  const now = new Date().toISOString();
  return {
    id: "evd_test",
    claimId,
    evidenceType: "link",
    evidenceKind: "GitHub Repository",
    content: "https://github.com/acme/repo",
    format: "link",
    metadata: { linkTitle: "github.com" },
    uploadedBy: "self",
    createdAt: now,
    updatedAt: now,
    status: "evidence-added",
    confidence: 0.7,
    notes: "",
    visibility: "private",
    consent: true,
    ...overrides,
  };
}

describe("Task 1 — Claim → Evidence Workflow", () => {
  beforeEach(() => {
    useResumeBuilder.getState().resetResume();
  });

  it("accepts a suggested claim into the Professional Identity as an accepted Claim", () => {
    const store = useResumeBuilder.getState();
    store.setSuggestedClaims([makeSuggestion()]);
    store.acceptClaim(useResumeBuilder.getState().suggestedClaims[0]);

    const { resume, suggestedClaims } = useResumeBuilder.getState();
    // Review queue drains; claim is accepted, reviewed, and present in the resume.
    expect(suggestedClaims).toHaveLength(0);
    expect(resume.claims).toHaveLength(1);
    const claim = resume.claims[0];
    expect(claim.assertionText).toBe("Led a 6-person team at Tech Corp");
    expect(claim.accepted).toBe(true);
    expect(claim.reviewed).toBe(true);
    expect(claim.verificationStatus).toBe("accepted");
  });

  it("attaches evidence to an accepted claim and advances it to evidence-added", () => {
    const store = useResumeBuilder.getState();
    store.setSuggestedClaims([makeSuggestion()]);
    store.acceptClaim(useResumeBuilder.getState().suggestedClaims[0]);
    const claimId = useResumeBuilder.getState().resume.claims[0].id;

    // "Strengthen this claim" → AddEvidenceModal submit → addEvidence(record).
    const record = makeEvidence(claimId);
    store.addEvidence(record);

    const state = useResumeBuilder.getState();
    // Evidence persisted against the claim.
    expect(state.evidence).toHaveLength(1);
    expect(state.evidence[0].claimId).toBe(claimId);
    expect(state.evidence[0].content).toBe("https://github.com/acme/repo");
    // The claim advanced from accepted → evidence-added.
    expect(state.resume.claims[0].verificationStatus).toBe("evidence-added");

    // Badge derivation reflects the advancement (no-evidence → evidence-added).
    expect(deriveBadgeStatus(state.resume.claims[0], state.evidence)).toBe("evidence-added");
  });

  it("reverts a claim to accepted when its last evidence is removed", () => {
    const store = useResumeBuilder.getState();
    store.setSuggestedClaims([makeSuggestion()]);
    store.acceptClaim(useResumeBuilder.getState().suggestedClaims[0]);
    const claimId = useResumeBuilder.getState().resume.claims[0].id;

    store.addEvidence(makeEvidence(claimId));
    expect(useResumeBuilder.getState().resume.claims[0].verificationStatus).toBe("evidence-added");

    store.removeEvidence("evd_test");
    const state = useResumeBuilder.getState();
    expect(state.evidence).toHaveLength(0);
    expect(state.resume.claims[0].verificationStatus).toBe("accepted");
    expect(deriveBadgeStatus(state.resume.claims[0], state.evidence)).toBe("no-evidence");
  });

  it("advances a claim to under-review when its evidence is submitted for review", () => {
    const store = useResumeBuilder.getState();
    store.setSuggestedClaims([makeSuggestion()]);
    store.acceptClaim(useResumeBuilder.getState().suggestedClaims[0]);
    const claimId = useResumeBuilder.getState().resume.claims[0].id;

    store.addEvidence(makeEvidence(claimId));
    store.markClaimReadyForReview(claimId);

    const state = useResumeBuilder.getState();
    expect(state.resume.claims[0].verificationStatus).toBe("under-review");
    expect(state.evidence[0].status).toBe("under-review");
  });

  it("does not attach evidence to a claim that was never accepted", () => {
    const store = useResumeBuilder.getState();
    const before = useResumeBuilder.getState().evidence.length;
    // No accepted claim exists; addEvidence must be a safe no-op.
    store.addEvidence(makeEvidence("id_does_not_exist"));
    expect(useResumeBuilder.getState().evidence.length).toBe(before);
  });
});