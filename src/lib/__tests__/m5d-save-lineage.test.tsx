"use strict";

/**
 * M5D — Background save lineage (write-back level)
 *
 * The pendingSync marker is RESUME-scoped truth, not view state:
 *  - a failed save of resume A while resume B is on screen must still mark A
 *    (reopening/refreshing must never claim "Saved" for rejected content)
 *  - the failure reason belongs to A — it may never overwrite B's indicator
 *  - a server-confirmed save of A clears A's marker; newer local edits keep it
 *
 * The active-resume indicator stays exactly as M5B defined it (gated).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import type { Resume } from "@/types/resume";

const { mockFetch, mockEnqueue, mockRemoveEntry, mockGetAll } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockEnqueue: vi.fn(async () => undefined),
  mockRemoveEntry: vi.fn(async () => undefined),
  mockGetAll: vi.fn(async () => [] as unknown[]),
}));

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/offline-queue", () => ({
  enqueueOfflineSave: mockEnqueue,
  removeOfflineEntry: mockRemoveEntry,
  getAllOfflineEntries: mockGetAll,
}));

import {
  saveLocalResumeToServer,
  setAutoRetryEnabled,
  cancelSaveRetry,
  resetSaveRetryBudget,
} from "@/lib/resume-write-back";

const st = () => useResumeBuilder.getState();

function mk(id: string, name: string): Resume {
  return { ...structuredClone(defaultResume), resumeId: id, resumeName: name, summary: `Content ${id}` };
}

const okResponse = (version = 1) => ({
  ok: true,
  status: 200,
  json: async () => ({ version }),
});

const failResponse = (status: number, error = `HTTP ${status}`) => ({
  ok: false,
  status,
  json: async () => ({ error }),
});

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

let consoleSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeEach(() => {
  mockFetch.mockReset();
  mockEnqueue.mockClear();
  mockRemoveEntry.mockClear();
  mockGetAll.mockClear();
  mockGetAll.mockResolvedValue([]);
  setAutoRetryEnabled(false); // default: no retry timers unless a test opts in
  resetSaveRetryBudget();
  consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const a = mk("r1", "Background CV");
  const b = mk("r2", "Active CV");
  useResumeBuilder.setState({
    resumes: [a, b],
    activeResumeId: "r2", // r1's save runs IN THE BACKGROUND of r2's session
    resume: b,
    saveStatus: "saved",
    lastSaveError: null,
    pendingSyncIds: [],
    serverVersions: {},
    styleConfigs: {},
    writeConflict: null,
    pendingDeletes: [],
    versions: {},
    lineage: {},
  });
});

afterEach(() => {
  cancelSaveRetry();
  resetSaveRetryBudget();
  consoleSpy?.mockRestore();
  consoleSpy = null;
});

describe("M5D — a background failure marks THAT resume", () => {
  it("records the inactive resume's pendingSync marker and never touches the active indicator or error", async () => {
    mockFetch.mockResolvedValueOnce(failResponse(400, "Bad content"));

    await saveLocalResumeToServer("r1");

    expect(st().pendingSyncIds).toContain("r1"); // reopening must never claim Saved
    expect(st().saveStatus).toBe("saved"); // r2's indicator untouched
    expect(st().lastSaveError).toBeNull(); // no failure reason leaked onto r2
    expect(st().writeConflict).toBeNull();
  });

  it("a connectivity failure marks + queues the device copy without flipping the ACTIVE status to Offline", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    await saveLocalResumeToServer("r1");

    expect(st().pendingSyncIds).toContain("r1");
    expect(mockEnqueue).toHaveBeenCalledWith("r1", expect.objectContaining({ summary: "Content r1" }), undefined);
    expect(st().saveStatus).toBe("saved"); // r2 stays truthful — not "offline"
  });

  it("never overwrites the ACTIVE resume's own failure reason with the background one", async () => {
    useResumeBuilder.setState({
      saveStatus: "sync-failed",
      lastSaveError: "R2's own error",
      pendingSyncIds: ["r2"],
    });
    mockFetch.mockResolvedValueOnce(failResponse(400, "R1 rejected"));

    await saveLocalResumeToServer("r1");

    expect(st().lastSaveError).toBe("R2's own error");
    expect(st().saveStatus).toBe("sync-failed");
    expect(st().pendingSyncIds).toEqual(expect.arrayContaining(["r1", "r2"]));
  });
});

describe("M5D — a background success clears THAT resume's marker", () => {
  it("server-confirmed save clears the marker for the saved resume and leaves the active indicator alone", async () => {
    useResumeBuilder.setState({ pendingSyncIds: ["r1"] });
    mockFetch.mockResolvedValueOnce(okResponse(5));

    await saveLocalResumeToServer("r1");

    expect(st().pendingSyncIds).not.toContain("r1");
    expect(st().serverVersions["r1"]).toBe(5);
    expect(st().saveStatus).toBe("saved"); // r2 untouched
  });

  it("a confirmed save with NEWER local edits for that resume KEEPS the marker (never false-clears)", async () => {
    useResumeBuilder.setState({ pendingSyncIds: ["r1"] });
    const d = deferred<ReturnType<typeof okResponse>>();
    mockFetch.mockReturnValueOnce(d.promise);

    const pending = saveLocalResumeToServer("r1");
    // A newer local edit for r1 lands while the PUT is still in flight.
    useResumeBuilder.setState((s) => ({
      resumes: s.resumes.map((r) => (r.resumeId === "r1" ? { ...r, summary: "newer content" } : r)),
    }));
    d.resolve(okResponse(6));
    await pending;

    expect(st().pendingSyncIds).toContain("r1"); // old snapshot confirmed, newer content not
    expect(st().saveStatus).toBe("saved"); // r2's indicator is r2's business
  });
});
