"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ClaimCard } from "../ClaimCard";
import { DisputeClaimModal } from "../DisputeClaimModal";
import type { Claim } from "@/types/resume";

describe("ClaimCard and Dispute Flow Components", () => {
  const baseClaim: Claim = {
    id: "claim_1",
    assertionText: "Proficient in TypeScript",
    claimType: "Skill",
    sourceActivityId: "exp_1",
    confidence: 0.9,
    reasoning: "Used daily in production",
    verificationStatus: "verified",
    reviewed: true,
    accepted: true,
    createdAt: new Date().toISOString(),
  };

  it("renders verified status correctly", () => {
    const html = renderToString(<ClaimCard claim={{ ...baseClaim, verificationStatus: "verified" }} />);
    expect(html).toContain("Proficient in TypeScript");
    expect(html).toContain("Verified");
  });

  it("renders dispute action button for non-disputed claims", () => {
    const html = renderToString(<ClaimCard claim={baseClaim} />);
    expect(html).toContain("Dispute / Request Correction");
  });

  it("renders DisputeClaimModal when open", () => {
    const html = renderToString(<DisputeClaimModal claim={baseClaim} open={true} onClose={() => {}} />);
    expect(html).toContain("Dispute / Request Correction");
    expect(html).toContain("Correction / Dispute Reason");
    expect(html).toContain("Submit Dispute");
  });

  it("renders empty evidence state when no evidence is linked", () => {
    const html = renderToString(<ClaimCard claim={baseClaim} />);
    expect(html).toContain("No evidence yet");
  });
});
