"use strict";

/**
 * §4 version history — pure helper invariants:
 *  - snapshots are deep clones (later edits never mutate a stored version)
 *  - identical kind+label+content never stacks duplicate entries
 *  - content-identical "edit" captures are dropped (no junk rows)
 *  - autosave bursts coalesce within EDIT_COALESCE_MS, anchored at the
 *    FIRST capture; explicit markers are never merged away
 *  - the list is newest-first, capped, with the original pinned
 *  - restoreContent preserves live identity (resumeId/resumeName)
 */

import { describe, it, expect } from "vitest";
import {
  EDIT_COALESCE_MS,
  MAX_VERSIONS_PER_RESUME,
  makeVersion,
  pushVersion,
  restoreContent,
  type ResumeVersion,
} from "@/lib/resume-versions";
import { defaultResume } from "@/store/resume-builder";
import type { Resume } from "@/types/resume";

function resume(patch: Partial<Resume> = {}): Resume {
  return { ...structuredClone(defaultResume), ...patch };
}

function editRow(at: number, snapshot: Resume, coalesce = true): ResumeVersion {
  return {
    id: `v_${at}_${Math.random().toString(36).slice(2, 6)}`,
    kind: "edit",
    label: "Edited",
    at,
    ...(coalesce ? { coalesce: true } : {}),
    snapshot,
  };
}

describe("makeVersion", () => {
  it("deep-clones the snapshot so later edits never mutate a stored version", () => {
    const source = resume({ summary: "Before" });
    const v = makeVersion("edit", "Edited", source, { coalesce: true });
    source.summary = "After — mutated!";
    expect(v.snapshot.summary).toBe("Before");
    expect(v.kind).toBe("edit");
    expect(v.coalesce).toBe(true);
    expect(v.meta).toBeUndefined();
  });

  it("copies meta so later mutation cannot reach the version", () => {
    const meta = { accepted: 3 };
    const v = makeVersion("tailored", "Tailored version", resume(), { meta });
    meta.accepted = 99;
    expect(v.meta?.accepted).toBe(3);
  });
});

describe("pushVersion", () => {
  it("drops duplicate kind+label+content events", () => {
    const snapshot = resume({ summary: "Same" });
    const list = pushVersion([], makeVersion("export", "Exported PDF", snapshot));
    const again = pushVersion(list, makeVersion("export", "Exported PDF", snapshot));
    expect(again).toHaveLength(1);
    expect(again[0].kind).toBe("export");
  });

  it("drops an edit whose content matches the newest version (no junk rows)", () => {
    // e.g. autosave firing right after create/import/tailor-approval
    const snapshot = resume({ summary: "Identical" });
    const original = pushVersion([], makeVersion("original", "Imported resume", snapshot));
    const junk = pushVersion(
      original,
      makeVersion("edit", "Edited", snapshot, { coalesce: true }),
    );
    expect(junk).toHaveLength(1);
    expect(junk[0].kind).toBe("original");
  });

  it("coalesces a typing burst into ONE row anchored at the first capture", () => {
    const t0 = 1_000_000;
    let list = pushVersion([], editRow(t0, resume({ summary: "v1" })));
    list = pushVersion(list, editRow(t0 + 1000, resume({ summary: "v2" })));
    list = pushVersion(list, editRow(t0 + 2000, resume({ summary: "v3" })));
    expect(list).toHaveLength(1);
    expect(list[0].snapshot.summary).toBe("v3");
    // window measured from session start, not from the last capture
    expect(list[0].at).toBe(t0);
  });

  it("starts a new row once the burst outgrows the coalesce window", () => {
    const t0 = 1_000_000;
    let list = pushVersion([], editRow(t0, resume({ summary: "burst 1" })));
    list = pushVersion(
      list,
      editRow(t0 + EDIT_COALESCE_MS + 1, resume({ summary: "burst 2" })),
    );
    expect(list).toHaveLength(2);
    expect(list[0].snapshot.summary).toBe("burst 2");
  });

  it("never merges an explicit marker away", () => {
    const t0 = 1_000_000;
    const list = pushVersion([], editRow(t0, resume({ summary: "edited" })));
    const marker = pushVersion(
      list,
      editRow(t0 + 10, resume({ summary: "before restore" }), false),
    );
    expect(marker).toHaveLength(2);
    expect(marker[0].coalesce).toBeUndefined();

    // A later autosave must not swallow the marker sitting below it.
    const after = pushVersion(
      marker,
      editRow(t0 + 20, resume({ summary: "edited again" })),
    );
    expect(after).toHaveLength(3);
    expect(after.some((v) => v.snapshot.summary === "before restore")).toBe(true);
  });

  it("caps the list newest-first while pinning the original restore point", () => {
    let list = pushVersion([], makeVersion("original", "Imported resume", resume({ summary: "day one" })));
    for (let i = 1; i <= MAX_VERSIONS_PER_RESUME + 3; i++) {
      list = pushVersion(list, makeVersion("edit", `Edit ${i}`, resume({ summary: `s${i}` })));
    }
    expect(list).toHaveLength(MAX_VERSIONS_PER_RESUME);
    // pinned original survives at the end (oldest slot)
    expect(list[list.length - 1].kind).toBe("original");
    // newest-first ordering
    expect(list[0].label).toBe(`Edit ${MAX_VERSIONS_PER_RESUME + 3}`);
  });

  it("returns a NEW array — never mutates the input list", () => {
    const input = pushVersion([], makeVersion("original", "Imported resume", resume()));
    const frozenLen = input.length;
    const next = pushVersion(input, makeVersion("edit", "Edited", resume({ summary: "changed" })));
    expect(input).toHaveLength(frozenLen);
    expect(next).not.toBe(input);
  });
});

describe("restoreContent", () => {
  it("applies snapshot content but keeps live identity", () => {
    const current = resume({ resumeId: "r_live", resumeName: "Live name" });
    const snapshot = resume({
      resumeId: "r_old",
      resumeName: "Old name",
      summary: "Snapshot summary",
      templateId: "classic-ats",
    });
    const restored = restoreContent(current, snapshot);
    expect(restored.resumeId).toBe("r_live");
    expect(restored.resumeName).toBe("Live name");
    expect(restored.summary).toBe("Snapshot summary");
    expect(restored.templateId).toBe("classic-ats");
    // snapshot itself untouched (deep clone)
    expect(snapshot.summary).toBe("Snapshot summary");
  });
});
