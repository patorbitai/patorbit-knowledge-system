"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import TrustWidget from "@/components/hub/widgets/TrustWidget";
import { validateEvidenceEntry } from "@/lib/evidence/validate";
import type { ServerTrustReportV2 } from "@/lib/trust/v2/types";

const emptyReport: ServerTrustReportV2 = {
  score: 0,
  level: "Unrated",
  algorithmVersion: "v2",
  derivedAt: new Date().toISOString(),
  claimTrusts: [],
  summary: {
    totalClaims: 0,
    verifiedClaims: 0,
    claimsWithEvidence: 0,
    claimsWithoutEvidence: 0,
    totalEvidence: 0,
    totalVerificationEvents: 0,
    activeConflicts: 0,
    evidenceCoveragePercent: 0,
    verificationRate: 0,
    insufficientData: true,
  },
  supportingFactors: [],
  reducingFactors: [],
};

const populatedReport: ServerTrustReportV2 = {
  score: 55,
  level: "Supported",
  algorithmVersion: "v2",
  derivedAt: new Date().toISOString(),
  claimTrusts: [
    {
      claimId: "c1",
      claimType: "Skill",
      assertionText: "TypeScript",
      score: 55,
      evidenceLevel: "attached",
      evidenceCount: 1,
      evidenceDiversity: 1,
      evidenceSupport: 40,
      verificationStrength: 10,
      verificationStatus: "accepted",
      conflictPenalty: 0,
      activeConflictCount: 0,
      statusCap: 100,
      criticalConflictCap: 100,
      gateBlocked: false,
      gateReason: null,
      factors: [],
    },
  ],
  summary: {
    totalClaims: 1,
    verifiedClaims: 0,
    claimsWithEvidence: 1,
    claimsWithoutEvidence: 0,
    totalEvidence: 1,
    totalVerificationEvents: 0,
    activeConflicts: 0,
    evidenceCoveragePercent: 100,
    verificationRate: 0,
    insufficientData: true,
  },
  supportingFactors: [],
  reducingFactors: [],
};

describe("Sprint 5 P0 Verification Tests", () => {
  it("renders live TrustService data on TrustView", () => {
    const html = renderToString(<TrustView trustReport={populatedReport} />);
    expect(html).toContain("Professional Trust");
  });

  it("handles empty state on TrustView cleanly", () => {
    const html = renderToString(<TrustView trustReport={emptyReport} />);
    expect(html).toContain("No trust data yet");
  });

  it("validates evidence entries (file/link types and consent)", () => {
    // Missing kind
    const err1 = validateEvidenceEntry({ kind: null, link: "", file: null, consent: true });
    expect(err1).not.toBeNull();

    // Missing consent
    const err2 = validateEvidenceEntry({ kind: "GitHub Repository", link: "https://github.com/test", file: null, consent: false });
    expect(err2).not.toBeNull();

    // Valid link evidence
    const err3 = validateEvidenceEntry({ kind: "GitHub Repository", link: "https://github.com/test", file: null, consent: true });
    expect(err3).toBeNull();
  });

  it("renders Trust Score widget on overview", () => {
    const html = renderToString(<TrustWidget />);
    expect(html).toContain("Trust Score");
  });
});
