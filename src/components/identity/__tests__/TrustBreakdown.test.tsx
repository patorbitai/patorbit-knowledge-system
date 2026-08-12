"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import { GraphService } from "@/services/graph-service";
import { TrustService } from "@/services/trust-service";
import { resumeToGraph } from "@/services/graph-mapper";
import { createMinimalResume, createEmptyResume } from "@/services/__tests__/fixtures";

describe("Trust Score Breakdown (T-07)", () => {
  it("renders each existing score factor and matches TrustService calculation", () => {
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

    const graphService = new GraphService();
    const trustService = new TrustService(graphService);
    const graph = resumeToGraph(resume, "user-input", []);
    graphService.setGraph(graph);
    const report = trustService.calculateTrustReport();

    const html = renderToString(<TrustView resume={resume} trustReport={report} />);

    for (const comp of report.snapshot.components) {
      const found = html.includes(comp.label) || html.includes(comp.label.replace("&", "&amp;"));
      expect(found).toBe(true);
      expect(html).toContain(comp.weight.toString());
    }
  });

  it("handles empty trust state correctly", () => {
    const html = renderToString(<TrustView resume={createEmptyResume()} />);
    expect(html).toContain("No trust data yet");
  });
});
