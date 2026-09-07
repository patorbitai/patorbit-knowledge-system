"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import { createMinimalResume } from "@/services/__tests__/fixtures";
import type { ServerTrustReportV2 } from "@/lib/trust/v2/types";

const v2Report: ServerTrustReportV2 = {
  score: 65,
  level: "Strong",
  algorithmVersion: "v2",
  derivedAt: new Date().toISOString(),
  claimTrusts: [
    {
      claimId: "c1",
      claimType: "Skill",
      assertionText: "React",
      score: 65,
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
  },
  supportingFactors: [],
  reducingFactors: [],
};

describe("Trust Share (T-11)", () => {
  it("renders TrustView with share control options", () => {
    const resume = createMinimalResume("Share Test User");
    const html = renderToString(<TrustView resume={resume} trustReport={v2Report} />);
    expect(html).toContain("Public Trust Share Link");
    expect(html).toContain("Enable Public Share");
  });
});
