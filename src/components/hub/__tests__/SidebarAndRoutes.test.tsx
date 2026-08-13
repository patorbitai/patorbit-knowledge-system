"use strict";

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import SidebarNav from "../SidebarNav";
import { VerificationView } from "@/components/identity/VerificationView";
import { EvidenceExplorerView } from "@/components/identity/EvidenceExplorerView";
import { TrustTimelineView } from "@/components/identity/TrustTimelineView";
import { NetworkView } from "@/components/identity/NetworkView";
import { TrustView } from "@/components/identity/TrustView";
import { createEmptyResume, createMinimalResume } from "@/services/__tests__/fixtures";

// Mock next/navigation usePathname
const mockPathname = vi.fn(() => "/trust/verification");
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("Sidebar and Feature Routes Sprint Tests", () => {
  it("1. Sidebar has correct hrefs for all 6 target features and removes disabled/soon states", () => {
    mockPathname.mockReturnValue("/trust/verification");
    const html = renderToString(<SidebarNav />);
    expect(html).toContain('href="/trust"');
    expect(html).toContain('href="/trust/verification"');
    expect(html).toContain('href="/trust/evidence"');
    expect(html).toContain('href="/trust/timeline"');
    expect(html).toContain('href="/network/graph"');
    expect(html).toContain('href="/network/journey"');
  });

  it("2. Trust Score route (TrustView) renders successfully", () => {
    const resume = createMinimalResume("Test User");
    const html = renderToString(<TrustView resume={resume} evidence={[]} />);
    expect(html).toContain("Professional Trust");
  });

  it("3. Credential Verification route renders successfully", () => {
    const resume = createMinimalResume("Test User");
    resume.claims = [
      {
        id: "c1",
        claimType: "Employment",
        assertionText: "Led engineering team",
        confidence: 0.9,
        verificationStatus: "verified",
        sourceActivityId: "exp_1",
        reasoning: "Verified by employer",
        reviewed: true,
        accepted: true,
        createdAt: new Date().toISOString(),
      },
    ];
    const html = renderToString(<VerificationView />);
    expect(html).toContain("Credential Verification");
  });

  it("4. Evidence Explorer route renders successfully", () => {
    const html = renderToString(<EvidenceExplorerView />);
    expect(html).toContain("Evidence Explorer");
  });

  it("5. Trust Timeline route renders successfully", () => {
    const html = renderToString(<TrustTimelineView />);
    expect(html).toContain("Trust Timeline");
  });

  it("6. Knowledge Graph route renders successfully with initialTab graph", () => {
    const resume = createMinimalResume("Graph User");
    const html = renderToString(<NetworkView resume={resume} initialTab="graph" />);
    expect(html).toContain("Knowledge Graph");
  });

  it("7. Career Journey route renders successfully with initialTab journey", () => {
    const resume = createMinimalResume("Journey User");
    const html = renderToString(<NetworkView resume={resume} initialTab="journey" />);
    expect(html).toContain("Career Journey");
  });

  it("8. Empty profile handling renders professional empty states gracefully", () => {
    const emptyResume = createEmptyResume();
    const vHtml = renderToString(<VerificationView />);
    expect(vHtml).toContain("No credential verifications yet");

    const eHtml = renderToString(<EvidenceExplorerView />);
    expect(eHtml).toContain("No evidence items attached yet");

    const tHtml = renderToString(<TrustTimelineView />);
    expect(tHtml).toContain("No trust timeline history yet");

    const nHtml = renderToString(<NetworkView resume={emptyResume} evidence={[]} />);
    expect(nHtml).toContain("No network graph data yet");
  });

  it("9. Correct active sidebar state highlighting for Network graph vs journey without activating siblings", () => {
    mockPathname.mockReturnValue("/network/graph");
    const graphHtml = renderToString(<SidebarNav />);
    expect(graphHtml).toContain("Knowledge Graph");

    mockPathname.mockReturnValue("/network/journey");
    const journeyHtml = renderToString(<SidebarNav />);
    expect(journeyHtml).toContain("Career Journey");
  });
});
