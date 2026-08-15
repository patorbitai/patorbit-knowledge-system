"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { TrustTimelineView } from "../TrustTimelineView";
import { useResumeBuilder } from "@/store/resume-builder";
import { createEmptyResume } from "@/services/__tests__/fixtures";
import {
  renderToContainer,
  installObserverStubs,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";
import type { TrustReport } from "@/types/knowledge-graph";

/**
 * Build a minimal but structurally valid TrustReport. The values are
 * intentionally arbitrary so tests can prove the VIEW renders the cached
 * report verbatim instead of recomputing or inventing numbers.
 */
function makeTrustReport(overall: number | null, verified: number): TrustReport {
  return {
    snapshot: {
      overall,
      components: [],
      calculatedAt: "2026-01-01T00:00:00.000Z",
    },
    verificationSummary: {
      total: 5,
      verified,
      pending: 0,
      unverified: Math.max(0, 5 - verified),
      disputed: 0,
      expired: 0,
      coverage: 0,
    },
    evidenceCoverage: {
      totalClaims: 5,
      claimsWithEvidence: 0,
      claimsWithoutEvidence: 5,
      coveragePercent: 0,
      evidenceByFormat: {},
      strongestAreas: [],
      weakestAreas: [],
    },
    weakClaims: [],
    generatedAt: "2026-01-01T00:00:00.000Z",
  };
}

/**
 * A resume with only experience entries — produces a deterministic timeline
 * (4 events: 2 role-starts + 2 role-ends) with the earliest real date
 * 2020-05-01.
 */
function resumeWithExperience(): Resume {
  const r = createEmptyResume();
  r.name = "Timeline User";
  r.title = "Engineer";
  r.experience = [
    {
      id: "e1",
      company: "Tech Corp",
      position: "Senior Developer",
      location: "",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2020-05-01",
      endDate: "2022-04-30",
      current: false,
      duration: "",
      description: "",
      achievements: "",
      techUsed: "",
      bulletPoints: [],
    },
    {
      id: "e2",
      company: "Cloud Inc",
      position: "Staff Engineer",
      location: "",
      employmentType: "Full-time",
      industry: "Cloud",
      startDate: "2023-01-15",
      endDate: "",
      current: true,
      duration: "",
      description: "",
      achievements: "",
      techUsed: "",
      bulletPoints: [],
    },
  ];
  return r;
}

describe("TrustTimelineView — honest trust metrics", () => {
  beforeEach(() => {
    installObserverStubs();
    useResumeBuilder.getState().resetResume();
    document.body.innerHTML = "";
  });

  it("renders real TrustReport values: verified events, trust impact, and journey start", () => {
    useResumeBuilder.setState({
      resume: resumeWithExperience(),
      trustReport: makeTrustReport(74, 3),
    });

    const { unmount, container } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";

    // Real cached-report values render.
    expect(text).toContain("+74");
    expect(text).toMatch(/3\s*Verified Events/);
    // Journey Started comes from the real earliest role start date.
    expect(text).toContain("2020-05-01");
    // The old fabricated fallbacks never appear.
    expect(text).not.toContain("62");
    expect(text).not.toContain("May 2020");
    unmount();
  });

  it("reuses the store's cached trust report instead of recomputing locally", () => {
    // This resume has ZERO claims/evidence — a local TrustService computation
    // would report verified = 0 and overall = null. The cached report wins.
    useResumeBuilder.setState({
      resume: resumeWithExperience(),
      trustReport: makeTrustReport(81, 7),
    });

    const { unmount, container } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("+81");
    expect(text).toMatch(/7\s*Verified Events/);
    unmount();
  });

  it("renders '—' and never 62 or an estimated verified count when no TrustReport exists", () => {
    // 4 timeline events — the old code estimated Math.round(4 * 0.6) = 2
    // verified events. The honest view must not show any estimate.
    useResumeBuilder.setState({ resume: resumeWithExperience(), trustReport: null });

    const { unmount, container } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("—");
    expect(text).not.toContain("62");
    expect(text).not.toMatch(/2\s*Verified Events/); // old 60%-of-4 estimate
    expect(text).not.toContain("May 2020");
    unmount();
  });

  it("renders the honest empty state and never 'May 2020' when there is no timeline", () => {
    useResumeBuilder.setState({ resume: createEmptyResume(), trustReport: null });

    const { unmount, container } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("No trust timeline history yet");
    expect(text).not.toContain("May 2020");
    expect(text).not.toContain("62");
    unmount();
  });

  it("does not create UPCOMING events from 2026 or 'Enterprise GenAI' text alone", () => {
    const r = createEmptyResume();
    r.name = "Future User";
    r.experience = [
      {
        id: "e1",
        company: "Enterprise GenAI Co",
        position: "Enterprise GenAI Lead",
        location: "",
        employmentType: "Full-time",
        industry: "AI",
        startDate: "2026-01-01",
        endDate: "2026-06-30",
        current: false,
        duration: "",
        description: "",
        achievements: "",
        techUsed: "",
        bulletPoints: [],
      },
    ];
    useResumeBuilder.setState({ resume: r, trustReport: null });

    const { unmount, container } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("UPCOMING");
    // The real event still renders, with an honest type badge.
    expect(text).toContain("Enterprise GenAI Lead");
    expect(text).toContain("STARTED");
    unmount();
  });

  it("renders existing real timeline events with honest badges", () => {
    useResumeBuilder.setState({
      resume: resumeWithExperience(),
      trustReport: makeTrustReport(50, 1),
    });

    const { unmount, container } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("Senior Developer");
    expect(text).toContain("Staff Engineer");
    expect(text).toContain("CURRENT"); // current role's real "Current —" event
    // No blanket VERIFIED badge — verification is per-claim, not per-event.
    expect(text).not.toContain("VERIFIED");
    unmount();
  });
});
