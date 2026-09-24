"use strict";

/**
 * useResumeAutosave (extracted from the builder page):
 *  - unsaved → saving → saved flow with the 1200ms debounce
 *  - an "Edited" version is captured when the save lands (§4)
 *  - typing bursts coalesce into ONE history row
 *  - content-identical saves never stack junk rows
 *  - the debounced AI analysis fires at 1500ms with the live resume
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
  it("runs the unsaved → saving → saved flow and captures an Edited version", async () => {
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");

    act(() => {
      useResumeBuilder.getState().updateField("summary", "First edit");
    });
    // act() flushes effects, so the effect has already flipped to "saving"
    expect(useResumeBuilder.getState().saveStatus).toBe("saving");
    // nothing captured before the debounce lands
    expect(versions()).toHaveLength(0);

    await tick(1200);
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");
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
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");
  });

  it("never clobbers a server sync failure with a blind 'saved' (live acceptance fix)", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Edit during outage");
    });
    expect(useResumeBuilder.getState().saveStatus).toBe("saving");

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

  it("fires the debounced AI analysis with the live resume at 1500ms", async () => {
    act(() => {
      useResumeBuilder.getState().updateField("summary", "Analyze me");
    });
    await tick(1499);
    expect(mockAi).not.toHaveBeenCalled();

    await tick(1);
    expect(mockAi).toHaveBeenCalledTimes(1);
    const arg = mockAi.mock.calls[0][0];
    expect(arg.summary).toBe("Analyze me");
  });
});
