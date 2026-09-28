"use strict";

/**
 * M5D — Terminology & surface lineage
 *
 * Canonical workflow vocabulary: Choose template → Edit → Customize →
 * Preview → Review → Export. One name per thing:
 *  - section navs (desktop sidebar + mobile tab bar) must speak the SAME
 *    labels: Profile / Certifications / Portfolio / Review
 *  - save vocabulary is the M5B canonical set everywhere, including the
 *    standalone preview page (Unsaved changes / Save failed)
 *  - the Review section's Preview CTA navigates on the CLIENT router so
 *    session-level job context survives the hop
 *  - a save conflict is lineage-scoped: it only surfaces for the resume it
 *    happened on
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/resume-builder",
  useSearchParams: () => new URLSearchParams(),
}));

import { LeftSidebar } from "@/components/resume-builder/LeftSidebar";
import MobileSectionNav from "@/components/resume-builder/MobileSectionNav";
import { ReviewSection } from "@/components/resume-builder/sections/OtherSections";
import { ConflictResolutionModal } from "@/components/resume-builder/ConflictResolutionModal";
import PreviewPage from "../preview/page";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";
import type { Resume } from "@/types/resume";

/** The one canonical section vocabulary (order = workflow order). */
const CANONICAL = [
  "Profile",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Certifications",
  "Achievements",
  "Languages",
  "Portfolio",
  "Review",
];

function mk(id: string, name: string): Resume {
  return { ...structuredClone(defaultResume), resumeId: id, resumeName: name, name: "Ada Lovelace" };
}

function sectionNavLabels(): string[] {
  const nav = document.body.querySelector('nav[aria-label="Resume sections"]');
  return Array.from(nav?.querySelectorAll("button") ?? []).map((b) => (b.textContent ?? "").trim());
}

function headingTexts(): string[] {
  return Array.from(document.body.querySelectorAll("h1, h2, h3")).map((h) => (h.textContent ?? "").trim());
}

beforeEach(() => {
  installObserverStubs();
  setFakeScrollHeight(900);
  document.body.innerHTML = "";
  mockPush.mockClear();
  const a = mk("r1", "Master CV");
  useResumeBuilder.setState({
    resumes: [a],
    activeResumeId: "r1",
    resume: a,
    styleConfigs: {},
    saveStatus: "saved",
    lastSaveError: null,
    writeConflict: null,
    pendingSyncIds: [],
    analysis: null,
    activeSection: "personal",
    hydrated: true,
  });
});

describe("M5D — one vocabulary across the section navigations", () => {
  it("desktop sidebar uses the canonical labels (no 'Links', no 'Review & Preview')", () => {
    const { unmount } = renderToContainer(<LeftSidebar />);
    expect(sectionNavLabels()).toEqual(CANONICAL);
    unmount();
  });

  it("mobile tab bar uses the SAME canonical labels (no 'Personal', no 'Certs')", () => {
    const { unmount } = renderToContainer(<MobileSectionNav />);
    expect(sectionNavLabels()).toEqual(CANONICAL);
    unmount();
  });

  it("desktop and mobile never drift apart", () => {
    const a = renderToContainer(<LeftSidebar />);
    const desktop = sectionNavLabels();
    a.unmount();
    document.body.innerHTML = "";

    const b = renderToContainer(<MobileSectionNav />);
    const mobile = sectionNavLabels();
    b.unmount();

    expect(mobile).toEqual(desktop);
  });
});

describe("M5D — Review surface", () => {
  it("Review section is titled 'Review' (not 'Review & Finalize') and its Preview CTA pushes the CLIENT route", () => {
    const { unmount } = renderToContainer(<ReviewSection />);

    expect(headingTexts()).toContain("Review");
    expect(document.body.textContent).not.toContain("Review & Finalize");

    const cta = findButton("Continue to Preview");
    expect(cta).toBeTruthy();

    mockPush.mockClear();
    const pathnameBefore = window.location.pathname;
    click(cta);
    // Client-side navigation: session-level job context (typed JD, match,
    // analysis) survives the Edit → Preview hop. A full page load would drop it.
    expect(mockPush).toHaveBeenCalledWith("/resume-builder/preview");
    expect(window.location.pathname).toBe(pathnameBefore); // no full page load

    unmount();
  });
});

describe("M5D — standalone preview save vocabulary matches M5B", () => {
  it("shows the canonical 'Unsaved changes' / 'Save failed' labels (never bare 'Unsaved'/'Failed')", () => {
    useResumeBuilder.setState({ saveStatus: "unsaved" });
    let rendered = renderToContainer(<PreviewPage />);
    expect(document.body.textContent).toContain("Unsaved changes");
    rendered.unmount();
    document.body.innerHTML = "";

    useResumeBuilder.setState({ saveStatus: "sync-failed" });
    rendered = renderToContainer(<PreviewPage />);
    expect(document.body.textContent).toContain("Save failed");
    rendered.unmount();
  });
});

describe("M5D — conflict lineage scoping", () => {
  it("a 409 recorded for one resume only surfaces when THAT resume is active", () => {
    const r1 = mk("r1", "Master CV");
    const r2 = mk("r2", "Job CV");
    useResumeBuilder.setState({
      resumes: [r1, r2],
      activeResumeId: "r2",
      resume: r2,
      writeConflict: {
        resumeId: "r1", // the conflict belongs to r1's save
        localResume: { ...r1, summary: "local edits" },
        serverResume: { ...r1, summary: "server version" },
        serverVersion: 2,
      },
    });

    const { unmount } = renderToContainer(<ConflictResolutionModal />);

    // Active is r2 → r1's conflict must not hijack this session.
    expect(document.querySelector('[class*="9999"]')).toBeNull();

    act(() => {
      useResumeBuilder.getState().switchResume("r1");
    });
    // Back on r1 → the conflict is presented for resolution.
    expect(document.querySelector('[class*="9999"]')).toBeTruthy();

    unmount();
  });
});
