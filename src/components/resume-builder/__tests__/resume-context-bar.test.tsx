"use strict";

/**
 * §2 + §5 context bar:
 *  - master resume shows the "Master profile — source of truth" badge
 *  - job version shows lineage ("derived from …"), Open master and the
 *    EXPLICIT whole-resume promote (confirmed dialog)
 *  - unsupported findings render with BOTH resolution paths and clear on
 *    resolution; the master is only ever written by the promote path
 */

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { ResumeContextBar } from "../ResumeContextBar";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
} from "./gallery-test-utils";
import type { Resume, Skill } from "@/types/resume";

installObserverStubs();

function skill(name: string): Skill {
  return { id: `s_${name}`, name, level: "Intermediate", category: "", years: "" };
}

function master(): Resume {
  return {
    ...structuredClone(defaultResume),
    resumeId: "r_master",
    resumeName: "Master Resume",
    summary: "Master summary",
    skills: [skill("Python")],
  };
}

function tailored(): Resume {
  const t = master();
  t.resumeId = "r_tailored";
  t.resumeName = "Master Resume — Tailored";
  t.summary = "Tailored summary";
  t.skills = [skill("Python"), skill("Kubernetes")];
  return t;
}

beforeEach(() => {
  const m = master();
  const t = tailored();
  useResumeBuilder.setState({
    resumes: [m, t],
    activeResumeId: "r_tailored",
    resume: structuredClone(t),
    lineage: {
      r_tailored: {
        sourceResumeId: "r_master",
        sourceResumeName: "Master Resume",
        tailoredAt: 1,
      },
    },
    versions: {},
    saveStatus: "saved",
    serverVersions: {},
    pendingDeletes: [],
  });
});

const get = () => useResumeBuilder.getState();

describe("ResumeContextBar", () => {
  it("marks a master resume as the source of truth, with no job-version UI", () => {
    useResumeBuilder.setState({
      activeResumeId: "r_master",
      resume: get().resumes.find((r) => r.resumeId === "r_master")!,
    });
    const { container, unmount } = renderToContainer(<ResumeContextBar />);
    const text = container.textContent ?? "";
    expect(text).toContain("Master profile");
    expect(text).toContain("source of truth");
    expect(text).not.toContain("Job version");
    expect(text).not.toContain("Promote edits to master");
    expect(container.querySelector('[data-testid="context-safety-panel"]')).toBeNull();
    // master content can never be "unsupported" against itself
    expect(container.querySelector('[data-testid="safety-findings"]')).toBeNull();
    unmount();
  });

  it("shows lineage + resolution paths for a job version", () => {
    const { container, unmount } = renderToContainer(<ResumeContextBar />);
    const text = container.textContent ?? "";
    expect(text).toContain("Job version");
    expect(text).toContain("derived from");
    expect(text).toContain("Master Resume");
    expect(findButton("Open master")).not.toBeNull();
    expect(findButton("Promote edits to master…")).not.toBeNull();

    // the unsupported item + both paths
    expect(text).toContain("Kubernetes");
    expect(findButton("Remove from this version")).not.toBeNull();
    expect(findButton("Add to master")).not.toBeNull();
    // mobile save state (header indicator is hidden on small screens)
    expect(
      container.querySelector('[data-testid="mobile-save-state"]')?.textContent,
    ).toContain("Saved");
    unmount();
  });

  it("'Open master' switches to the master resume", () => {
    renderToContainer(<ResumeContextBar />);
    click(findButton("Open master"));
    expect(get().activeResumeId).toBe("r_master");
    expect(get().resume.summary).toBe("Master summary");
  });

  it("'Add to master' resolves the finding by writing ONLY the master", () => {
    const { container, unmount } = renderToContainer(<ResumeContextBar />);
    const tailoredBefore = structuredClone(get().resume);

    click(findButton("Add to master"));

    const st = get();
    expect(
      st.resumes.find((r) => r.resumeId === "r_master")?.skills?.map((s) => s.name),
    ).toContain("Kubernetes");
    expect(st.resume).toEqual(tailoredBefore); // job version untouched
    expect(st.versions["r_master"][0]?.label).toBe("Added to master: Kubernetes");
    // finding cleared → panel gone
    expect(container.querySelector('[data-testid="context-safety-panel"]')).toBeNull();
    expect(container.textContent).not.toContain("Remove from this version");
    unmount();
  });

  it("'Remove from this version' strips the item from the job version only", () => {
    const { container, unmount } = renderToContainer(<ResumeContextBar />);
    const masterBefore = structuredClone(
      get().resumes.find((r) => r.resumeId === "r_master"),
    );

    click(findButton("Remove from this version"));

    const st = get();
    expect(st.resume.skills?.map((s) => s.name)).toEqual(["Python"]);
    expect(
      st.resumes.find((r) => r.resumeId === "r_master"),
    ).toEqual(masterBefore);
    expect(container.querySelector('[data-testid="context-safety-panel"]')).toBeNull();
    unmount();
  });

  it("whole-resume promote runs through a confirmation and keeps master identity", () => {
    const { unmount } = renderToContainer(<ResumeContextBar />);

    click(findButton("Promote edits to master…"));
    expect(findButton("Promote to master")).not.toBeNull();
    expect(document.body.textContent).toContain(
      "the only way edits from a job version reach your master",
    );
    click(findButton("Promote to master"));

    const st = get();
    const m = st.resumes.find((r) => r.resumeId === "r_master")!;
    expect(m.summary).toBe("Tailored summary");
    expect(m.resumeName).toBe("Master Resume"); // identity preserved
    expect(m.templateId).toBe(defaultResume.templateId);
    expect(st.versions["r_master"][0]?.label).toMatch(/^Promoted from/);
    // the job version is still active and untouched
    expect(st.activeResumeId).toBe("r_tailored");
    expect(st.resume.summary).toBe("Tailored summary");
    expect(st.lineage["r_tailored"]?.sourceResumeId).toBe("r_master");
    unmount();
  });
});
