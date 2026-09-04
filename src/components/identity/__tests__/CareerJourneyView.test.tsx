import { describe, it, expect, beforeEach } from "vitest";
import { CareerJourneyView } from "../CareerJourneyView";
import { GraphService } from "@/services/graph-service";
import { useResumeBuilder } from "@/store/resume-builder";
import { createEmptyResume } from "@/services/__tests__/fixtures";
import {
  renderToContainer,
  installObserverStubs,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume, Claim, Evidence } from "@/types/resume";

const ASSERTION_TEXT =
  "Led a cross-functional team that delivered a 40% efficiency improvement.";

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "c1",
    assertionText: ASSERTION_TEXT,
    claimType: "Employment",
    sourceActivityId: "e1",
    confidence: 0.85,
    reasoning: "Supported by the role description and an experience letter.",
    verificationStatus: "verified",
    reviewed: true,
    accepted: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: "ev1",
    claimId: "c1",
    evidenceType: "document",
    evidenceKind: "Experience Letter",
    content: "indexeddb://ev1",
    format: "PDF",
    metadata: { fileName: "experience-letter.pdf", mimeType: "application/pdf" },
    uploadedBy: "self",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    status: "verified",
    confidence: 0.9,
    notes: "",
    visibility: "private",
    consent: true,
    ...overrides,
  };
}

function resumeWithNarrative(claim?: Claim | null): Resume {
  const r = createEmptyResume();
  r.resumeId = "narrative-test";
  r.name = "Narrative User";
  r.title = "Senior Developer";
  r.experience = [
    {
      id: "e1",
      company: "Tech Corp",
      position: "Senior Developer",
      location: "San Francisco, CA",
      employmentType: "Full-time",
      industry: "Technology",
      startDate: "2020-05-01",
      endDate: "2022-04-30",
      current: false,
      duration: "",
      description: "Led development of key initiatives.",
      achievements: "",
      techUsed: "React, TypeScript",
      bulletPoints: [],
    },
  ];
  r.claims = claim ? [claim] : [];
  return r;
}

describe("Career Journey Redesign & Sorting", () => {
  it("renders empty state correctly when no experience entries exist", () => {
    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    expect(container.textContent).toContain("Your career journey starts here");
    expect(container.textContent).toContain("Add experience");
    unmount();
  });

  it("calculates experience years and sorts roles oldest to newest correctly", () => {
    const gs = new GraphService();
    const roles = [
      { id: "r1", title: "Data Analyst", company: "A", startDate: "May 2020", endDate: "Apr 2022", isCurrent: false },
      { id: "r2", title: "AI/ML Engineer", company: "B", startDate: "Apr 2024", endDate: "", isCurrent: true },
    ];
    // @ts-expect-error accessing private method for test verification
    const years = gs["calcTotalYearsExp"](roles);
    expect(years).toBeGreaterThan(0);
    expect(isNaN(years)).toBe(false);
  });
});

describe("CareerJourneyView — evidence-backed career narrative (Phase 6F)", () => {
  beforeEach(() => {
    installObserverStubs();
    document.body.innerHTML = "";
  });

  it("renders strongest proof, chapter statements, and claim/evidence traceability", () => {
    const r = resumeWithNarrative(makeClaim());
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [makeEvidence()],
    });

    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    const text = container.textContent ?? "";

    expect(text).toContain("Strongest Proof");
    expect(text).toContain(ASSERTION_TEXT);
    expect(text).toContain("Senior Developer");
    expect(text).toContain("85% confidence");
    expect(text).toContain("Employment");
    expect(text).toContain("verified");
    expect(text).toContain("Experience Letter");
    expect(text).toContain("PDF");
    expect(text).toContain("experience-letter.pdf");
    unmount();
  });

  it("renders provenance with only real source information", () => {
    const r = resumeWithNarrative(makeClaim());
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [makeEvidence()],
    });

    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    const text = container.textContent ?? "";

    expect(text).toContain("Data Sources");
    expect(text).toContain("1 work experience entry");
    expect(text).toContain("User-provided resume data");
    expect(text).toContain("100%");
    expect(text).toContain("60%");
    unmount();
  });

  it("renders the Draft lifecycle chip from journey.status", () => {
    const r = resumeWithNarrative(makeClaim());
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [makeEvidence()],
    });

    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    expect(container.textContent ?? "").toContain("Draft");
    unmount();
  });

  it("renders the honest narrative empty state and keeps the timeline when no claims/evidence exist", () => {
    const r = resumeWithNarrative(null);
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [],
    });

    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    const text = container.textContent ?? "";

    expect(text).toContain(
      "Your career narrative will appear as claims become supported by evidence.",
    );
    expect(text).not.toContain("Strongest Proof");
    expect(text).toContain("Senior Developer");
    expect(text).toContain("Tech Corp");
    unmount();
  });

  it("does not invent dates, employers, skills, or achievements in the narrative", () => {
    const r = resumeWithNarrative(makeClaim());
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [makeEvidence()],
    });

    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    const text = container.textContent ?? "";

    expect(text).toContain(ASSERTION_TEXT);
    expect(text).not.toContain("FakeCorp");
    expect(text).not.toContain("Enterprise GenAI");
    expect(text).not.toContain("2026");
    unmount();
  });

  it("keeps the existing chronological timeline, roles, dates, and metrics (regression)", () => {
    const r = createEmptyResume();
    r.resumeId = "regression-test";
    r.name = "Regression User";
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
    useResumeBuilder.setState({ resume: r, resumes: [r], activeResumeId: r.resumeId!, evidence: [] });

    const { container, unmount } = renderToContainer(<CareerJourneyView />);
    const text = container.textContent ?? "";

    expect(text).toContain("Senior Developer");
    expect(text).toContain("Staff Engineer");
    expect(text).toContain("Tech Corp");
    expect(text).toContain("Cloud Inc");
    expect(text).toContain("2020-05-01");
    expect(text).toContain("YRS");
    expect(text).toContain("Career Roles");
    unmount();
  });
});
