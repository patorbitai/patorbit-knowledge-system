"use strict";

/**
 * useResumeAutosave (extracted from the builder page):
 *  - M5B: this hook NEVER writes saveStatus — local state changes are not
 *    persistence. After an edit the status stays "unsaved" until the
 *    write-back actually sends a request (only server responses may reach
 *    "saving" → "saved"; see m5b-save-truthfulness.test.ts).
 *  - an "Edited" version is still captured at 1200ms (§4 local history)
 *  - typing bursts coalesce into ONE history row
 *  - content-identical saves never stack junk rows
 *  - M6: editing alone NEVER calls ai.* — passive analyzeResume/
 *    generateClaims were removed; only explicit user actions dispatch AI
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { useResumeAutosave } from "../useResumeAutosave";
import {
  renderToContainer,
  installObserverStubs,
  type Rendered,
} from "@/components/resume-builder/__tests__/gallery-test-utils";

installObserverStubs();

const { mockAi } = vi.hoisted(() => ({
  mockAi: vi.fn(async (resume: { summary?: string }) => ({ ...resume })),
}));

vi.mock("@/lib/ai/client", () => ({
  ai: new Proxy({}, { get: () => mockAi }),
}));

function Probe() {
  useResumeAutosave();
  return null;
}

let rendered: Rendered | null = null;

beforeEach(() => {
  vi.useFakeTimers();
  mockAi.mockClear();
  const r1 = {
    ...structuredClone(defaultResume),
    resumeId: "r1",
    resumeName: "R1",
    summary: "S0",
  };
  useResumeBuilder.setState({
    resumes: [structuredClone(r1)],
    activeResumeId: "r1",
    resume: structuredClone(r1),
    versions: {},
    lineage: {},
    saveStatus: "saved",
    serverVersions: {},
    pendingDeletes: [],
  });
  rendered = renderToContainer(<Probe />);
});

afterEach(() => {
  rendered?.unmount();
  rendered = null;
  vi.useRealTimers();
});

const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const versions = () => useResumeBuilder.getState().versions["r1"] ?? [];

describe("useResumeAutosave", () => {
  it("never claims server persistence locally — edit stays 'unsaved' while history capture still runs", async () => {
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");

    act(() => {
      useResumeBuilder.getState().updateField("summary", "First edit");
    });
    // M5B: a local change must NOT flip to "saving"/"saved" — only the
    // write-back transitions those, and only from real server responses.
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");
    // nothing captured before the debounce lands
    expect(versions()).toHaveLength(0);

    await tick(1200);
    // §4 history capture still works — but the STATUS is untouched: there
    // was no server response, so "Saved" must not appear.
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");
    const rows = versions();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ kind: "edit", label: "Edited" });
    expect(rows[0].snapshot.summary).toBe("First edit");
  });

  it("coalesces a typing burst into one history row anchored at the first capture", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Burst v1");
    });
    await tick(1200);
    const firstAt = versions()[0]?.at;
    expect(versions()).toHaveLength(1);

    act(() => {
      useResumeBuilder.getState().updateField("summary", "Burst v2");
    });
    await tick(1200);

    const rows = versions();
    expect(rows).toHaveLength(1);
    expect(rows[0].snapshot.summary).toBe("Burst v2");
    expect(rows[0].at).toBe(firstAt);
  });

  it("never stacks a junk row when the save has no content delta", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Only real edit");
    });
    await tick(1200);
    expect(versions()).toHaveLength(1);

    // metadata-only "unsaved" (e.g. template flip on untouched content)
    act(() => {
      useResumeBuilder.setState({ saveStatus: "unsaved" });
    });
    await tick(1200);
    expect(versions()).toHaveLength(1);
    // M5B: no local "saved" flip — the write-back owns the transition.
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");
  });

  it("never clobbers a server sync failure with a blind 'saved' (live acceptance fix)", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Edit during outage");
    });
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");

    // write-back reports the failure while the local debounce is pending
    act(() => {
      useResumeBuilder.setState({
        saveStatus: "sync-failed",
        lastSaveError: "Free plan allows up to 2 resumes.",
      });
    });
    await tick(1200);

    expect(useResumeBuilder.getState().saveStatus).toBe("sync-failed");
    expect(useResumeBuilder.getState().lastSaveError).toContain("Free plan");
  });

  it("M6: editing alone never calls any ai.* action (passive AI removed)", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Edit that must cost zero AI");
    });
    await tick(1499);
    expect(mockAi).not.toHaveBeenCalled();

    // well past the former 1500ms analysis + 2500ms claim-gen debounces
    await tick(3000);
    expect(mockAi).not.toHaveBeenCalled();
    // history capture (M5B) still runs — editing is not dead, only AI is
    expect(versions().length).toBeGreaterThan(0);
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");
  });

  it("M6: claims are never generated by editing (only via Suggest claims)", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Claims must not auto-generate");
    });
    act(() => {
      useResumeBuilder.getState().updateField("name", "Changed Name");
    });
    await tick(5000); // past both former debounces

    expect(mockAi).not.toHaveBeenCalled();
    expect(useResumeBuilder.getState().suggestedClaims).toHaveLength(0);
  });
});
