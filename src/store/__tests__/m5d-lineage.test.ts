"use strict";

/**
 * M5D — Lineage across the builder workflow (store level)
 *
 * Identities preserved through navigation/state transitions:
 *  - resume identity: save status follows the resume it belongs to — never
 *    inherited across switch/delete/rename (reopening restores ITS truth)
 *  - template/style attachment: customization stays keyed to the resume it
 *    was made on; reopening restores the right one
 *  - job context (application id + typed JD) survives resume switches
 *  - deleting a resume deletes its whole identity (style, share, marker)
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";
import type { Resume } from "@/types/resume";

const st = () => useResumeBuilder.getState();

function mk(id: string, name: string): Resume {
  return { ...structuredClone(defaultResume), resumeId: id, resumeName: name };
}

const findR = (id: string) => st().resumes.find((r) => r.resumeId === id);

beforeEach(() => {
  const a = mk("r1", "Master CV");
  const b = mk("r2", "Job CV");
  useResumeBuilder.setState({
    resumes: [a, b],
    activeResumeId: "r1",
    resume: a,
    saveStatus: "saved",
    lastSaveError: null,
    pendingSyncIds: [],
    styleConfigs: {},
    shareStates: {},
    lineage: {},
    versions: {},
    serverVersions: {},
    pendingDeletes: [],
    writeConflict: null,
    activeJobApplicationId: null,
    jobDescription: "",
  });
});

describe("M5D — save-status lineage (status belongs to the resume)", () => {
  it("switching restores the TARGET resume's truth — a failure is never inherited across the switch", () => {
    // r1 failed to sync: marker + failure state belong to r1.
    useResumeBuilder.setState({
      saveStatus: "sync-failed",
      lastSaveError: "HTTP 400",
      pendingSyncIds: ["r1"],
    });

    st().switchResume("r2");
    expect(st().activeResumeId).toBe("r2");
    expect(st().resume.resumeId).toBe("r2");
    expect(st().saveStatus).toBe("saved"); // r2 has no marker
    expect(st().saveStatus).not.toBe("sync-failed");
    expect(st().lastSaveError).toBeNull(); // the failure reason belonged to r1

    st().switchResume("r1");
    expect(st().saveStatus).toBe("unsaved"); // marker truth: not on server
    expect(st().saveStatus).not.toBe("saved"); // never claim Saved

    st().switchResume("r2");
    expect(st().saveStatus).toBe("saved");
  });

  it("re-selecting the already-active resume keeps its status (no clobber)", () => {
    useResumeBuilder.setState({ saveStatus: "unsaved" });
    st().switchResume("r1");
    expect(st().saveStatus).toBe("unsaved");
  });

  it("deleting a BACKGROUND resume never touches the active resume's indicator", () => {
    expect(st().saveStatus).toBe("saved");
    st().deleteResume("r2");
    expect(st().activeResumeId).toBe("r1");
    expect(st().saveStatus).toBe("saved"); // was "unsaved" before M5D — false claim
  });

  it("deleting the ACTIVE resume re-truths a marked survivor as Unsaved", () => {
    useResumeBuilder.setState({ pendingSyncIds: ["r1"] });
    st().switchResume("r2"); // r2 unmarked → saved
    expect(st().saveStatus).toBe("saved");
    st().deleteResume("r2");
    expect(st().activeResumeId).toBe("r1");
    expect(st().saveStatus).toBe("unsaved"); // r1 carries the pendingSync marker
  });

  it("deleting the ACTIVE resume lets a server-confirmed survivor claim Saved", () => {
    st().switchResume("r2");
    st().deleteResume("r2");
    expect(st().activeResumeId).toBe("r1");
    expect(st().saveStatus).toBe("saved");
  });

  it("renaming a BACKGROUND resume keeps the active resume's indicator truthful", () => {
    expect(st().saveStatus).toBe("saved");
    st().renameResume("r2", "Renamed Job CV");
    expect(st().saveStatus).toBe("saved"); // renaming another resume is not an edit here
    expect(findR("r2")?.resumeName).toBe("Renamed Job CV");
  });
});

describe("M5D — identity cleanup on delete (attachment lineage hygiene)", () => {
  it("deleting a resume purges its style config, share state and pendingSync marker — and leaves the survivor's alone", () => {
    useResumeBuilder.setState({
      styleConfigs: {
        r1: DEFAULT_STYLE_CONFIG,
        r2: { ...DEFAULT_STYLE_CONFIG, accentColor: "#ff0000" },
      },
      shareStates: {} as ReturnType<typeof useResumeBuilder.getState>["shareStates"],
      pendingSyncIds: ["r2"],
      lineage: { r2: { sourceResumeId: "r1", sourceResumeName: "Master CV", tailoredAt: 1 } },
    });
    useResumeBuilder.setState((s) => ({
      shareStates: {
        ...s.shareStates,
        r1: {} as (typeof s.shareStates)[string],
        r2: {} as (typeof s.shareStates)[string],
      },
    }));

    st().deleteResume("r2");

    const s = st();
    expect(s.styleConfigs["r2"]).toBeUndefined(); // orphan config must not outlive the resume
    expect(s.styleConfigs["r1"]).toBeDefined();
    expect(s.shareStates["r2"]).toBeUndefined();
    expect(s.shareStates["r1"]).toBeDefined();
    expect(s.pendingSyncIds).not.toContain("r2");
    expect(s.lineage["r2"]).toBeUndefined(); // existing §2 behavior, kept
  });
});

describe("M5D — template & style stay attached to the right resume", () => {
  it("applyTemplate changes ONLY the active resume; switching back shows the original choice", () => {
    const r2TemplateBefore = findR("r2")?.templateId;

    st().applyTemplate("executive");
    expect(st().resume.templateId).toBe("executive");
    expect(findR("r1")?.templateId).toBe("executive");
    expect(findR("r2")?.templateId).toBe(r2TemplateBefore);

    st().switchResume("r2");
    st().applyTemplate("minimal-ats");
    expect(st().resume.templateId).toBe("minimal-ats");
    expect(findR("r2")?.templateId).toBe("minimal-ats");
    // The first resume's choice is untouched by the second change.
    expect(findR("r1")?.templateId).toBe("executive");
  });

  it("style configs are keyed per resume — reopening restores the right one", () => {
    st().setStyleConfig("r1", { fontScale: 1.1 });
    st().setStyleConfig("r2", { fontScale: 0.9 });
    expect(st().styleConfigs["r1"]?.fontScale).toBe(1.1);
    expect(st().styleConfigs["r2"]?.fontScale).toBe(0.9);

    st().switchResume("r2");
    expect(st().styleConfigs[st().activeResumeId]?.fontScale).toBe(0.9);
    st().switchResume("r1");
    expect(st().styleConfigs[st().activeResumeId]?.fontScale).toBe(1.1);
  });
});

describe("M5D — job context & reopen restore", () => {
  it("job context (application id + typed JD) survives resume switches in both directions", () => {
    useResumeBuilder.setState({
      activeJobApplicationId: "app-42",
      jobDescription: "Frontend engineer — React, TypeScript, design systems.",
    });

    st().switchResume("r2");
    expect(st().activeJobApplicationId).toBe("app-42");
    expect(st().jobDescription).toContain("Frontend engineer");

    st().switchResume("r1");
    expect(st().activeJobApplicationId).toBe("app-42");
    expect(st().jobDescription).toContain("design systems");
  });

  it("reopening a tailored resume restores its lineage entry; the master stays lineage-free", () => {
    useResumeBuilder.setState({
      lineage: {
        r2: {
          sourceResumeId: "r1",
          sourceResumeName: "Master CV",
          tailoredAt: 1,
          jobTitle: "Frontend Engineer",
        },
      },
    });

    st().switchResume("r2");
    expect(st().lineage["r2"]?.sourceResumeId).toBe("r1");
    expect(st().lineage["r2"]?.jobTitle).toBe("Frontend Engineer");

    // Navigate away and back — the tie to the source version survives.
    st().switchResume("r1");
    st().switchResume("r2");
    expect(st().lineage["r2"]?.sourceResumeId).toBe("r1");
    // The master is never treated as derived from anything.
    expect(st().lineage["r1"]).toBeUndefined();
  });
});
