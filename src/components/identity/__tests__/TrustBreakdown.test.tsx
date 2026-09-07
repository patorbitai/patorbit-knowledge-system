"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import { createMinimalResume, createEmptyResume } from "@/services/__tests__/fixtures";
import type { ServerTrustReportV2 } from "@/lib/trust/v2/types";

describe("Trust Score Breakdown (T-07)", () => {
  it("renders each per-claim trust breakdown component", () => {
    const resume = createMinimalResume("Breakdown Test User");
    resume.claims = [
      {
        id: "c1",
        assertionText: "Test claim",
        claimType: "Skill",
        sourceActivityId: "s1",
        confidence: 0.9,
        reasoning: "Reason",
        verificationStatus: "verified",
        reviewed: true,
        accepted: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // Simulate a server-derived TrustReportV2
    const report: ServerTrustReportV2 = {
      score: 76,
      level: "Strong",
      algorithmVersion: "v2",
      derivedAt: new Date().toISOString(),
      claimTrusts: [
        {
          claimId: "c1",
          claimType: "Skill",
          assertionText: "Test claim",
          score: 76,
          evidenceLevel: "verified",
          evidenceCount: 0,
          evidenceDiversity: 0,
          evidenceSupport: 0,
          verificationStrength: 30,
          verificationStatus: "verified",
          conflictPenalty: 0,
          activeConflictCount: 0,
          statusCap: 100,
          criticalConflictCap: 100,
          gateBlocked: false,
          gateReason: null,
          factors: [
            { type: "supporting", label: "Status: verified", description: "Claim is verified.", impact: 30 },
          ],
        },
      ],
      summary: {
        totalClaims: 1,
        verifiedClaims: 1,
        claimsWithEvidence: 0,
        claimsWithoutEvidence: 1,
        totalEvidence: 0,
        totalVerificationEvents: 1,
        activeConflicts: 0,
        evidenceCoveragePercent: 0,
        verificationRate: 100,
      },
      supportingFactors: [
        { type: "supporting", label: "Verified claims", description: "1 claim(s) have been independently verified." },
      ],
      reducingFactors: [],
    };

    const html = renderToString(<TrustView resume={resume} trustReport={report} />);

    // Should render the per-claim breakdown section
    expect(html).toContain("PER-CLAIM TRUST BREAKDOWN");
    expect(html).toContain("Skill");
    expect(html).toContain("76");
  });

  it("handles empty trust state correctly (no trustReport prop shows loading)", () => {
    const html = renderToString(<TrustView resume={createEmptyResume()} />);
    // Without a trustReport prop, TrustView enters loading state (fetches from API)
    expect(html).toContain("Loading trust data");
  });

  it("shows empty state when trustReport is provided but score is 0", () => {
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
      },
      supportingFactors: [],
      reducingFactors: [],
    };
    const html = renderToString(<TrustView resume={createEmptyResume()} trustReport={emptyReport} />);
    expect(html).toContain("No trust data yet");
  });
});
