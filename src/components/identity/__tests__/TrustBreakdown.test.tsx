"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import { createMinimalResume, createEmptyResume } from "@/services/__tests__/fixtures";
import type { ServerTrustReport } from "@/lib/trust/types";

describe("Trust Score Breakdown (T-07)", () => {
  it("renders each server-derived trust breakdown component", () => {
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

    // Simulate a server-derived TrustReport
    const report: ServerTrustReport = {
      score: 42,
      level: "Established",
      algorithmVersion: "v1",
      breakdown: [
        { label: "Verification Strength", score: 50, weight: 35, explanation: "1 of 1 claims verified." },
        { label: "Evidence Coverage", score: 0, weight: 25, explanation: "0 of 1 claims have supporting evidence." },
        { label: "Claim Completeness", score: 90, weight: 20, explanation: "1 claim(s) with average confidence 90%." },
        { label: "Evidence Diversity", score: 0, weight: 10, explanation: "No evidence has been attached." },
        { label: "Review Activity", score: 80, weight: 10, explanation: "1 verification event(s) recorded across 1 claim(s)." },
      ],
      reasons: ["1 claim(s) have been independently verified."],
      derivedAt: new Date().toISOString(),
      summary: {
        totalClaims: 1,
        verifiedClaims: 1,
        claimsWithEvidence: 0,
        claimsWithoutEvidence: 1,
        totalEvidence: 0,
        totalVerificationEvents: 1,
        evidenceCoveragePercent: 0,
        verificationRate: 100,
      },
    };

    const html = renderToString(<TrustView resume={resume} trustReport={report} />);

    for (const comp of report.breakdown) {
      const found = html.includes(comp.label) || html.includes(comp.label.replace("&", "&amp;"));
      expect(found).toBe(true);
      expect(html).toContain(comp.weight.toString());
    }
  });

  it("handles empty trust state correctly (no trustReport prop shows loading)", () => {
    const html = renderToString(<TrustView resume={createEmptyResume()} />);
    // Without a trustReport prop, TrustView enters loading state (fetches from API)
    expect(html).toContain("Loading trust data");
  });

  it("shows empty state when trustReport is provided but score is 0", () => {
    const emptyReport: ServerTrustReport = {
      score: 0,
      level: "Unrated",
      algorithmVersion: "v1",
      breakdown: [],
      reasons: [],
      derivedAt: new Date().toISOString(),
      summary: {
        totalClaims: 0,
        verifiedClaims: 0,
        claimsWithEvidence: 0,
        claimsWithoutEvidence: 0,
        totalEvidence: 0,
        totalVerificationEvents: 0,
        evidenceCoveragePercent: 0,
        verificationRate: 0,
      },
    };
    const html = renderToString(<TrustView resume={createEmptyResume()} trustReport={emptyReport} />);
    expect(html).toContain("No trust data yet");
  });
});
