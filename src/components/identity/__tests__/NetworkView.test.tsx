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
    expect(html).toContain("No network data yet");
    expect(html).toContain("Professional Network");
  });

  it("renders existing network data correctly", () => {
    const resume = createMinimalResume("Alex Networker");
    resume.title = "Platform Engineer";
    resume.skills = [
      { id: "skill_1", name: "TypeScript", level: "Expert", category: "Languages", years: "5" },
    ];

    const html = renderToString(<NetworkView resume={resume} />);
    expect(html).toContain("Professional Network");
    expect(html).toContain("Tech Corp");
    expect(html).toContain("Senior Developer");
    expect(html).toContain("TypeScript");
  });

  it("renders loading state correctly", () => {
    const html = renderToString(<NetworkView isLoading={true} />);
    expect(html).toContain("Loading network graph...");
  });

  it("renders error state correctly", () => {
    const html = renderToString(<NetworkView error="Database connection failed" />);
    expect(html).toContain("Failed to load network");
    expect(html).toContain("Database connection failed");
  });
});
