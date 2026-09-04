import { describe, it, expect, beforeEach } from "vitest";
import { TrustTimelineView } from "../TrustTimelineView";
import { useResumeBuilder } from "@/store/resume-builder";
import { createEmptyResume } from "@/services/__tests__/fixtures";
import {
  renderToContainer,
  installObserverStubs,
} from "@/components/resume-builder/__tests__/gallery-test-utils";

function resumeWithExperience() {
  const r = createEmptyResume();
  r.resumeId = "timeline-test";
  r.name = "Timeline User";
  r.title = "Developer";
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

function makeTrustReport(overall: number, verifiedCount: number) {
  return {
    snapshot: { overall },
    verificationSummary: { verified: verifiedCount },
  } as any;
}

describe("TrustTimelineView — honest trust metrics", () => {
  beforeEach(() => {
    installObserverStubs();
    document.body.innerHTML = "";
  });

  it("renders real TrustReport values: verified events, trust impact, and journey start", () => {
    const r = resumeWithExperience();
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [],
      trustReport: makeTrustReport(74, 3),
    });

    const { container, unmount } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";

    expect(text).toContain("+74");
    expect(text).toMatch(/3\s*Verified Events/);
    expect(text).toContain("2020-05-01");
    expect(text).not.toContain("62");
    expect(text).not.toContain("May 2020");
    unmount();
  });

  it("reuses the store's cached trust report instead of recomputing locally", () => {
    const r = resumeWithExperience();
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [],
      trustReport: makeTrustReport(81, 7),
    });

    const { container, unmount } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("+81");
    expect(text).toMatch(/7\s*Verified Events/);
    unmount();
  });

  it("renders '—' and never 62 or an estimated verified count when no TrustReport exists", () => {
    const r = resumeWithExperience();
    useResumeBuilder.setState({ resume: r, resumes: [r], activeResumeId: r.resumeId!, evidence: [], trustReport: null });

    const { container, unmount } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("—");
    expect(text).not.toContain("62");
    expect(text).not.toMatch(/2\s*Verified Events/);
    expect(text).not.toContain("May 2020");
    unmount();
  });

  it("renders the honest empty state and never 'May 2020' when there is no timeline", () => {
    const r = createEmptyResume();
    useResumeBuilder.setState({ resume: r, resumes: [r], activeResumeId: r.resumeId || "", evidence: [], trustReport: null });

    const { container, unmount } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("No trust timeline history yet");
    expect(text).not.toContain("May 2020");
    expect(text).not.toContain("62");
    unmount();
  });

  it("does not create UPCOMING events from 2026 or 'Enterprise GenAI' text alone", () => {
    const r = createEmptyResume();
    r.resumeId = "future-test";
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
    useResumeBuilder.setState({ resume: r, resumes: [r], activeResumeId: r.resumeId!, evidence: [], trustReport: null });

    const { container, unmount } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).not.toContain("UPCOMING");
    expect(text).toContain("Enterprise GenAI Lead");
    expect(text).toContain("STARTED");
    unmount();
  });

  it("renders existing real timeline events with honest badges", () => {
    const r = resumeWithExperience();
    useResumeBuilder.setState({
      resume: r,
      resumes: [r],
      activeResumeId: r.resumeId!,
      evidence: [],
      trustReport: makeTrustReport(50, 1),
    });

    const { container, unmount } = renderToContainer(<TrustTimelineView />);
    const text = container.textContent ?? "";
    expect(text).toContain("Senior Developer");
    expect(text).toContain("Staff Engineer");
    expect(text).toContain("CURRENT");
    expect(text).not.toContain("VERIFIED");
    unmount();
  });
});
