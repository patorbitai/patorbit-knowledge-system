"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { NetworkView } from "../NetworkView";
import { createMinimalResume, createEmptyResume } from "@/services/__tests__/fixtures";

describe("NetworkView Component", () => {
  it("renders empty state cleanly when no network data is present", () => {
    const emptyResume = createEmptyResume();
    const html = renderToString(<NetworkView resume={emptyResume} evidence={[]} />);
    expect(html).toContain("No network graph data yet");
    expect(html).toContain("Knowledge Graph");
  });

  it("renders existing network data correctly", () => {
    const resume = createMinimalResume("Alex Networker");
    resume.title = "Platform Engineer";
    resume.skills = [
      { id: "skill_1", name: "TypeScript", level: "Expert", category: "Languages", years: "5" },
    ];

    const html = renderToString(<NetworkView resume={resume} />);
    expect(html).toContain("Knowledge Graph");
    expect(html).toContain("Tech Corp");
    expect(html).toContain("Senior Developer");
    expect(html).toContain("TypeScript");
  });

  it("renders CareerJourneyView on the journey tab even when the graph has no data", () => {
    const emptyResume = createEmptyResume();
    const html = renderToString(
      <NetworkView resume={emptyResume} evidence={[]} initialTab="journey" />,
    );
    // The graph empty state must NOT suppress the Career Journey tab.
    expect(html).not.toContain("No network graph data yet");
    // CareerJourneyView's own (honest) empty state renders instead.
    expect(html).toContain("Your career journey starts here");
    // The tab shell is preserved so users can still reach the graph.
    expect(html).toContain("Knowledge Graph");
  });

  it("renders loading state correctly", () => {
    const html = renderToString(<NetworkView isLoading={true} />);
    expect(html).toContain("Loading knowledge graph...");
  });

  it("renders error state correctly", () => {
    const html = renderToString(<NetworkView error="Database connection failed" />);
    expect(html).toContain("Failed to load network");
    expect(html).toContain("Database connection failed");
  });

  it("renders knowledge graph nodes and career journey timeline elements", () => {
    const resume = createMinimalResume("Jordan Graph");
    resume.experience = [
      {
        id: "exp_1",
        company: "Acme Cloud",
        position: "Staff Engineer",
        location: "Remote",
        employmentType: "Full-time",
        industry: "Cloud",
        startDate: "2023-01-01",
        endDate: "",
        current: true,
        duration: "2 yrs",
        description: "Leading cloud architecture.",
        achievements: "",
        techUsed: "Kubernetes, Go",
        bulletPoints: [],
      },
    ];

    const html = renderToString(<NetworkView resume={resume} />);
    expect(html).toContain("Knowledge Graph");
    expect(html).toContain("Career Journey");
    expect(html).toContain("Acme Cloud");
    expect(html).toContain("Staff Engineer");
  });
});
