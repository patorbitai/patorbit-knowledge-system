"use strict";

/**
 * §2 + §4 + §5 store integration:
 *  - lineage: explicit tailor-time recording, cleanup on delete, survives
 *    the persist merge (reload)
 *  - version history: capture / coalesce / restore with identity preserved
 *    and a "Before restore" undo point
 *  - MASTER ISOLATION: editing, removing findings and restoring on a
 *    tailored resume never touch the master; the master only changes via
 *    the explicit promote actions
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useResumeBuilder,
  defaultResume,
  mergePersistedResumeState,
} from "../resume-builder";
import type { Resume, Skill } from "@/types/resume";

function skill(name: string): Skill {
  return { id: `s_${name}`, name, level: "Intermediate", category: "", years: "" };
}

function mkResume(id: string, name: string, summary: string): Resume {
  return { ...structuredClone(defaultResume), resumeId: id, resumeName: name, summary };
}

function master(): Resume {
  const r = mkResume("r_master", "Master", "Master summary");
  r.skills = [skill("Python")];
  return r;
}

function tailored(): Resume {
  const r = mkResume("r_tailored", "Master — Tailored", "Tailored summary");
  r.skills = [skill("Python"), skill("Kubernetes")];
  return r;
}

const K8S_FINDING = {
  kind: "skill" as const,
  value: "Kubernetes",
  label: "Skill: Kubernetes",
};

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
        sourceResumeName: "Master",
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
const findResume = (id: string) => get().resumes.find((r) => r.resumeId === id)!;

describe("master-profile isolation (§2)", () => {
  it("editing a tailored resume never touches the master", () => {
    const masterBefore = structuredClone(findResume("r_master"));
    get().updateField("summary", "Edited tailored summary");
    const st = get();
    expect(st.resume.summary).toBe("Edited tailored summary");
    expect(findResume("r_master")).toEqual(masterBefore);
    expect(st.lineage["r_tailored"]?.sourceResumeId).toBe("r_master");
  });

  it("removeUnsupportedFinding strips the active version only", () => {
    const masterBefore = structuredClone(findResume("r_master"));
    get().removeUnsupportedFinding(K8S_FINDING);
    const st = get();
    expect(st.resume.skills?.map((s) => s.name)).toEqual(["Python"]);
    expect(findResume("r_master")).toEqual(masterBefore);
    expect(st.saveStatus).toBe("unsaved");
  });

  it("promoteFindingToMaster writes ONLY the master, explicitly", () => {
    const tailoredBefore = structuredClone(get().resume);
    const ok = get().promoteFindingToMaster(K8S_FINDING);
    expect(ok).toBe(true);

    const st = get();
    // master adopted the item…
    expect(findResume("r_master").skills?.map((s) => s.name)).toContain("Kubernetes");
    // …the job version is untouched…
    expect(st.resume).toEqual(tailoredBefore);
    // …and the master records an explicit promote version
    const masterVersions = st.versions["r_master"] ?? [];
    expect(masterVersions[0]?.kind).toBe("edit");
    expect(masterVersions[0]?.label).toBe("Added to master: Kubernetes");
  });

  it("promoteFindingToMaster returns false without lineage", () => {
    useResumeBuilder.setState({ activeResumeId: "r_master", resume: findResume("r_master") });
    expect(get().promoteFindingToMaster(K8S_FINDING)).toBe(false);
    expect(findResume("r_master").skills?.map((s) => s.name)).toEqual(["Python"]);
  });

  it("promoteResumeToMaster adopts content but keeps master identity", () => {
    get().updateField("summary", "Improved tailored summary");
    const ok = get().promoteResumeToMaster("r_tailored");
    expect(ok).toBe(true);

    const m = findResume("r_master");
    expect(m.summary).toBe("Improved tailored summary");
    expect(m.resumeId).toBe("r_master");
    expect(m.resumeName).toBe("Master");
    expect(m.templateId).toBe(findResume("r_tailored").templateId);
    // lineage of the job version survives — it still points at the master
    expect(get().lineage["r_tailored"]?.sourceResumeId).toBe("r_master");
    expect(get().versions["r_master"][0]?.label).toMatch(/^Promoted from/);
  });

  it("promoteResumeToMaster refuses a resume without lineage", () => {
    expect(get().promoteResumeToMaster("r_master")).toBe(false);
    expect(findResume("r_master").summary).toBe("Master summary");
  });
});

describe("lineage bookkeeping (§2)", () => {
  it("setLineage records and null removes the entry", () => {
    get().setLineage("r_master", { sourceResumeId: "none", tailoredAt: 2 });
    expect(get().lineage["r_master"]?.sourceResumeId).toBe("none");
    get().setLineage("r_master", null);
    expect(get().lineage["r_master"]).toBeUndefined();
    // untouched entry stays
    expect(get().lineage["r_tailored"]?.sourceResumeId).toBe("r_master");
  });

  it("deleteResume cleans up that resume's lineage and versions", () => {
    get().captureVersion("r_tailored", "tailored", "Tailored version", {
      meta: { accepted: 1, edited: 0, rejected: 0, blocked: 0 },
    });
    expect(get().versions["r_tailored"]).toHaveLength(1);

    get().deleteResume("r_tailored");

    expect(get().resumes).toHaveLength(1);
    expect(get().lineage["r_tailored"]).toBeUndefined();
    expect(get().versions["r_tailored"]).toBeUndefined();
    expect(get().activeResumeId).toBe("r_master");
  });

  it("lineage and versions survive the persist merge (reload)", () => {
    const merged = mergePersistedResumeState(
      {
        lineage: { r_tailored: { sourceResumeId: "r_master", tailoredAt: 5 } },
        versions: { r_master: [] },
      } as never,
      get() as never,
    ) as ReturnType<typeof get>;
    expect(merged.lineage["r_tailored"].sourceResumeId).toBe("r_master");
    expect(merged.versions["r_master"]).toEqual([]);
    // current actions survive the merge too
    expect(typeof merged.captureVersion).toBe("function");
  });
});

describe("version history (§4)", () => {
  it("captures kinds at the right moments", () => {
    const st = get();
    st.captureVersion("r_master", "original", "Imported resume");
    st.captureVersion(
      "r_tailored",
      "tailored",
      "Tailored for Software Engineer",
      { meta: { accepted: 3, edited: 1, rejected: 2, blocked: 1 } },
    );
    st.captureVersion("r_tailored", "export", "Exported PDF", {
      meta: { format: "pdf" },
    });
    const s = get();
    expect(s.versions["r_master"][0]).toMatchObject({ kind: "original", label: "Imported resume" });
    expect(s.versions["r_tailored"].map((v) => v.kind)).toEqual(["export", "tailored"]);
    expect(s.versions["r_tailored"][1].meta).toEqual({
      accepted: 3,
      edited: 1,
      rejected: 2,
      blocked: 1,
    });
    // snapshots are content, deep-cloned at capture time
    expect(s.versions["r_master"][0].snapshot.summary).toBe("Master summary");
  });

  it("captures nothing for an unknown resume id", () => {
    get().captureVersion("ghost", "edit", "Edited");
    expect(get().versions["ghost"]).toBeUndefined();
  });

  it("restoreVersion re-applies content, preserves identity, and keeps an undo point", () => {
    // The history panel always restores the ACTIVE resume — mirror that.
    get().switchResume("r_master");
    const st = get();
    st.captureVersion("r_master", "original", "Imported resume");

    // change content AND name — only content should be restorable
    get().updateField("summary", "Changed v1");
    get().captureVersion("r_master", "edit", "Edited", { coalesce: true });
    get().updateField("summary", "Changed v2 (uncaptured)");
    useResumeBuilder.setState((s) => ({
      resumes: s.resumes.map((r) =>
        r.resumeId === "r_master" ? { ...r, resumeName: "Renamed master" } : r,
      ),
      resume: s.activeResumeId === "r_master" ? { ...s.resume, resumeName: "Renamed master" } : s.resume,
    }));

    const originalId = get().versions["r_master"].find((v) => v.kind === "original")!.id;
    const ok = get().restoreVersion("r_master", originalId);
    expect(ok).toBe(true);

    const s = get();
    const m = findResume("r_master");
    // content restored…
    expect(m.summary).toBe("Master summary");
    expect(s.resume.summary).toBe("Master summary");
    // …identity NOT rolled back
    expect(m.resumeId).toBe("r_master");
    expect(m.resumeName).toBe("Renamed master");
    // undo point captured first (newest)
    expect(s.versions["r_master"][0]).toMatchObject({
      kind: "edit",
      label: "Before restore",
    });
    expect(s.versions["r_master"][0].snapshot.summary).toBe("Changed v2 (uncaptured)");
    expect(s.versions["r_master"][0].snapshot.resumeName).toBe("Renamed master");
    expect(s.versions["r_master"]).toHaveLength(3);
    expect(s.saveStatus).toBe("unsaved");
  });

  it("restoreVersion keeps a currently-valid template when the snapshot's is invalid", () => {
    const st = get();
    st.captureVersion("r_master", "original", "Imported resume");
    // corrupt the stored snapshot's template id
    useResumeBuilder.setState((s) => {
      const list = [...(s.versions["r_master"] ?? [])];
      list[0] = { ...list[0], snapshot: { ...list[0].snapshot, templateId: "ghost-template" } };
      return { versions: { ...s.versions, "r_master": list } };
    });
    const originalId = get().versions["r_master"][0].id;
    const validTemplate = findResume("r_master").templateId;
    expect(get().restoreVersion("r_master", originalId)).toBe(true);
    expect(findResume("r_master").templateId).toBe(validTemplate);
  });

  it("restoreVersion returns false for a missing version", () => {
    expect(get().restoreVersion("r_master", "nope")).toBe(false);
    expect(findResume("r_master").summary).toBe("Master summary");
  });
});
