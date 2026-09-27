"use strict";

/**
 * M5B — Save Truthfulness & Recovery
 *
 * Requirement coverage (E1–E8 here; E9/E10 stay covered by
 * active-resume-hydration, resume-lifecycle, m4-version-scoping and
 * resume-lineage-versions in the regression set):
 *
 *  E1  edit → (stays Unsaved — never a local "Saved") → saving → server-confirmed saved
 *  E2  refresh after a successful save → content + "Saved" persist
 *  E3  rapid edits coalesce — only the latest state is sent
 *  E4  a stale in-flight completion can never overwrite a newer save
 *  E5  simulated failed PUT → clear failure state, edits intact, marker set,
 *      no console spam, no silent auto-retry outside policy
 *  E6  Retry → the LATEST edit persists and the marker clears
 *  E7  failed save → refresh → truthfully resumes "Unsaved" (never "Saved"),
 *      then recovery heals to server-confirmed "Saved"
 *  E8  409 → existing writeConflict workflow preserved, marked unsynced,
 *      never auto-retried (no overwrite loop)
 *
 * Plus: Offline only for actual connectivity failures (fetch throw), HTTP
 * errors are never labeled Offline, bounded auto-retry with backoff, and
 * offline-queue flush truthfulness (never claims Saved for newer local edits).
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  beforeAll,
  vi,
} from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { useResumeAutosave } from "@/hooks/useResumeAutosave";
import {
  renderToContainer,
  installObserverStubs,
  type Rendered,
} from "@/components/resume-builder/__tests__/gallery-test-utils";

installObserverStubs();

const { mockFetch, mockEnqueue, mockRemoveEntry, mockGetAll, mockAi } =
  vi.hoisted(() => ({
    mockFetch: vi.fn(),
    mockEnqueue: vi.fn(async () => undefined),
    mockRemoveEntry: vi.fn(async () => undefined),
    mockGetAll: vi.fn(async () => [] as unknown[]),
    mockAi: vi.fn(async (resume: unknown) => resume),
  }));

vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/offline-queue", () => ({
  enqueueOfflineSave: mockEnqueue,
  removeOfflineEntry: mockRemoveEntry,
  getAllOfflineEntries: mockGetAll,
}));

vi.mock("@/lib/ai/client", () => ({
  ai: new Proxy({}, { get: () => mockAi }),
}));

import {
  saveLocalResumeToServer,
  flushOfflineQueue,
  retryFailedSave,
  setAutoRetryEnabled,
  cancelSaveRetry,
  resetSaveRetryBudget,
  cancelPendingSave,
  hookWriteBackToStore,
} from "@/lib/resume-write-back";
import type { OfflineQueueEntry } from "@/lib/offline-queue";

/* ── helpers ──────────────────────────────────────────────────────────── */

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
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

/** Advance fake time and flush the promise microtasks that follow. */
const tick = async (ms: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

const flush = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });
};

const st = () => useResumeBuilder.getState();

/** Make an edit through the REAL store mutator (arms the pipeline). */
const edit = (summary: string) => {
  act(() => {
    st().updateField("summary", summary);
  });
};

function AutosaveProbe() {
  useResumeAutosave();
  return null;
}

let rendered: Rendered | null = null;
let consoleSpy: ReturnType<typeof vi.spyOn> | null = null;

beforeAll(() => {
  // Real store + real write-back: subscribe once for this test file.
  hookWriteBackToStore();
});

beforeEach(() => {
  vi.useFakeTimers();
  mockFetch.mockReset();
  mockEnqueue.mockClear();
  mockRemoveEntry.mockClear();
  mockGetAll.mockClear();
  mockGetAll.mockResolvedValue([]);
  mockAi.mockClear();
  setAutoRetryEnabled(false); // default: no timers unless a test opts in
  resetSaveRetryBudget();
  // Failure paths log once per episode — silence AND count them (F hygiene).
  consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  const r1 = {
    ...structuredClone(defaultResume),
    resumeId: "r1",
    resumeName: "R1",
    summary: "Baseline summary",
  };
  useResumeBuilder.setState({
    resumes: [r1],
    resume: r1, // same ref — mirrors the store's mutation contract
    activeResumeId: "r1",
    saveStatus: "saved",
    lastSaveError: null,
    pendingSyncIds: [],
    serverVersions: {},
    writeConflict: null,
    versions: {},
    lineage: {},
    pendingDeletes: [],
    hydrated: true,
    hydratingFromServer: false,
  });
  // The hooked write-back treats the resume-identity swap above as an edit:
  // it arms its 1500ms debounce and flips the status to "unsaved"
  // synchronously. Disarm and restore so every test starts from a clean,
  // truthful "Saved" slate with no pending timer.
  cancelPendingSave("r1");
  useResumeBuilder.setState({ saveStatus: "saved" });
  rendered = renderToContainer(<AutosaveProbe />);
});

afterEach(() => {
  rendered?.unmount();
  rendered = null;
  cancelSaveRetry();
  resetSaveRetryBudget();
  consoleSpy?.mockRestore();
  consoleSpy = null;
  vi.useRealTimers();
});

/* ── E1 — truthful state machine ──────────────────────────────────────── */

describe("E1 — edit → saving → server-confirmed saved", () => {
  it("never shows 'Saved' (or 'Saving…') from local state alone; only the server response completes the cycle", async () => {
    expect(st().saveStatus).toBe("saved");

    edit("First real edit");
    // A local change is exactly that — unsaved.
    expect(st().saveStatus).toBe("unsaved");

    // Past the 1200ms local history capture — still no persistence claim.
    await tick(1300);
    expect(st().saveStatus).toBe("unsaved");
    expect(st().versions["r1"]).toHaveLength(1); // §4 history still captured

    // Debounce fires → request in flight → genuinely "saving".
    const d = deferred<ReturnType<typeof okResponse>>();
    mockFetch.mockReturnValueOnce(d.promise);
    await tick(300); // t = 1600 > SAVE_DEBOUNCE_MS (1500)
    expect(st().saveStatus).toBe("saving");
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Response lands → ONLY NOW may it claim "Saved".
    d.resolve(okResponse(7));
    await flush();
    expect(st().saveStatus).toBe("saved");
    expect(st().serverVersions["r1"]).toBe(7);
    expect(st().pendingSyncIds).toEqual([]);
  });
});

/* ── E5 — failure truth ───────────────────────────────────────────────── */

describe("E5 — failed PUT is truthful", () => {
  it("sets sync-failed (not Offline) with the server reason, keeps edits, marks unsynced, logs once, and does not flail", async () => {
    edit("Content that never made it");
    mockFetch.mockResolvedValueOnce(failResponse(500, "Internal Server Error"));
    await tick(1600);
    await flush();

    expect(st().saveStatus).toBe("sync-failed");
    expect(st().lastSaveError).toBe("Internal Server Error");
    // Edits are intact locally.
    expect(st().resume.summary).toBe("Content that never made it");
    // Persisted marker: a refresh must not claim "Saved".
    expect(st().pendingSyncIds).toContain("r1");
    // An HTTP failure is NOT a connectivity failure.
    expect(st().saveStatus).not.toBe("offline");
    // Console hygiene: exactly one log for the episode.
    expect(
      (consoleSpy as unknown as { mock: { calls: unknown[] } }).mock.calls,
    ).toHaveLength(1);

    // Default (production policy off under tests): no stray retries.
    await tick(10000);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("labels an actual connectivity failure Offline and queues the device-local copy", async () => {
    edit("Offline edit");
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await tick(1600);
    await flush();

    expect(st().saveStatus).toBe("offline");
    expect(st().pendingSyncIds).toContain("r1");
    expect(mockEnqueue).toHaveBeenCalledWith(
      "r1",
      expect.objectContaining({ summary: "Offline edit" }),
      undefined,
    );
  });

  it("never calls a rate-limit rejection 'Offline' — 429 is Save failed", async () => {
    edit("Rate limited");
    mockFetch.mockResolvedValueOnce(failResponse(429, "Too many requests"));
    await tick(1600);
    await flush();

    expect(st().saveStatus).toBe("sync-failed");
    expect(st().lastSaveError).toBe("Too many requests");
  });
});

/* ── E3/E4 — sequencing ───────────────────────────────────────────────── */

describe("B — save sequencing", () => {
  it("E3: rapid edits coalesce — only the latest state is sent, once", async () => {
    edit("v1");
    await tick(500);
    edit("v2 latest");

    mockFetch.mockResolvedValueOnce(okResponse(1));
    await tick(1700); // first debounce cancelled; second fires
    await flush();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.resume.summary).toBe("v2 latest");
    expect(st().saveStatus).toBe("saved");
  });

  it("E4: a stale in-flight completion can never overwrite the newer save's status or version", async () => {
    const d1 = deferred<ReturnType<typeof okResponse>>();
    const d2 = deferred<ReturnType<typeof okResponse>>();
    mockFetch
      .mockReturnValueOnce(d1.promise)
      .mockReturnValueOnce(d2.promise);

    edit("v1");
    await tick(1600); // save #1 in flight (seq 1)
    expect(st().saveStatus).toBe("saving");

    edit("v2"); // newer local edit while #1 is in flight
    expect(st().saveStatus).toBe("unsaved"); // pending, not saved, not saving
    await tick(1600); // save #2 starts (seq 2)
    expect(st().saveStatus).toBe("saving");
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // The OLDER request completes late — it must be discarded entirely.
    d1.resolve(okResponse(1));
    await flush();
    expect(st().saveStatus).toBe("saving"); // seq 2 still owns the state
    expect(st().serverVersions["r1"]).toBeUndefined();

    // The LATEST request completes → the truth.
    d2.resolve(okResponse(2));
    await flush();
    expect(st().saveStatus).toBe("saved");
    expect(st().serverVersions["r1"]).toBe(2);

    const body1 = JSON.parse(mockFetch.mock.calls[0][1].body);
    const body2 = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body1.resume.summary).toBe("v1");
    expect(body2.resume.summary).toBe("v2");
  });

  it("E4b: success with newer edits landed mid-flight leaves 'Unsaved' — never a false 'Saved'", async () => {
    const d = deferred<ReturnType<typeof okResponse>>();
    mockFetch.mockReturnValueOnce(d.promise);

    edit("in-flight content");
    await tick(1600);
    expect(st().saveStatus).toBe("saving");

    edit("newer content"); // lands while PUT is still open
    d.resolve(okResponse(1));
    await flush();

    // The server confirmed the OLD snapshot; the newer edit is pending its
    // own cycle — the indicator must not claim it is saved.
    expect(st().saveStatus).toBe("unsaved");
    expect(st().resume.summary).toBe("newer content");
  });
});

/* ── E6 — explicit Retry ──────────────────────────────────────────────── */

describe("E6 — explicit Retry", () => {
  it("retries the LATEST local content, succeeds, and clears the failure + marker", async () => {
    edit("first attempt content");
    mockFetch.mockResolvedValueOnce(failResponse(503, "Service Unavailable"));
    await tick(1600);
    await flush();
    expect(st().saveStatus).toBe("sync-failed");
    expect(st().pendingSyncIds).toContain("r1");

    // User keeps editing while failed — Retry must send THIS, not a snapshot.
    edit("latest content before retry");

    mockFetch.mockResolvedValueOnce(okResponse(3));
    await retryFailedSave();
    await flush();

    expect(st().saveStatus).toBe("saved");
    expect(st().pendingSyncIds).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.resume.summary).toBe("latest content before retry");
    expect(st().serverVersions["r1"]).toBe(3);
  });
});

/* ── C — bounded automatic retry ──────────────────────────────────────── */

describe("C — bounded automatic retry/backoff", () => {
  it("retries transient 5xx with backoff and STOPS at the bound", async () => {
    setAutoRetryEnabled(true);
    mockFetch.mockResolvedValue(failResponse(500, "boom"));

    edit("keep failing");
    await tick(1600); // failure #1 → retry scheduled (+2000)
    await flush();
    expect(st().saveStatus).toBe("sync-failed");

    await tick(2000); // failure #2 → +4000
    await tick(4000); // failure #3 → +8000
    await tick(8000); // failure #4 → budget exhausted (3 retries)
    await flush();
    expect(mockFetch).toHaveBeenCalledTimes(4);

    await tick(60000); // no runaway retries beyond the bound
    expect(mockFetch).toHaveBeenCalledTimes(4);
    expect(st().saveStatus).toBe("sync-failed");
  });

  it("auto-retry succeeds → Saved, and the budget resets for the next episode", async () => {
    setAutoRetryEnabled(true);
    mockFetch
      .mockResolvedValueOnce(failResponse(500, "blip"))
      .mockResolvedValueOnce(okResponse(5));

    edit("transient outage content");
    await tick(1600); // fail → schedule +2000
    await flush();
    expect(st().saveStatus).toBe("sync-failed");

    await tick(2000); // auto-retry → success
    await flush();
    expect(st().saveStatus).toBe("saved");
    expect(st().serverVersions["r1"]).toBe(5);
    expect(st().pendingSyncIds).toEqual([]);

    // Budget reset: the next episode may retry again.
    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(failResponse(500, "again"))
      .mockResolvedValueOnce(okResponse(6));
    edit("second episode");
    await tick(1600);
    await flush();
    expect(st().saveStatus).toBe("sync-failed");
    await tick(2000); // fresh budget: auto-retry fires again
    await flush();
    expect(mockFetch).toHaveBeenCalledTimes(2); // fail + auto-retry
    expect(st().saveStatus).toBe("saved");
  });
});

/* ── E8 — 409 conflict truth ──────────────────────────────────────────── */

describe("E8 — conflict handling preserved", () => {
  it("409 → writeConflict + unsaved + unsynced marker, and is NEVER auto-retried", async () => {
    setAutoRetryEnabled(true);
    useResumeBuilder.setState({ serverVersions: { r1: 5 } });
    mockFetch
      .mockResolvedValueOnce(failResponse(409, "CONFLICT"))
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ resume: { resumeId: "r1", summary: "Server" } }),
      });

    edit("conflicting local edit");
    await tick(1600);
    await flush();

    const conflict = st().writeConflict;
    expect(conflict).not.toBeNull();
    expect(conflict?.resumeId).toBe("r1");
    expect(conflict?.serverVersion).toBe(5);
    expect(conflict?.localResume.summary).toBe("conflicting local edit");
    expect(st().saveStatus).toBe("unsaved"); // existing contract (C7 suite)
    expect(st().pendingSyncIds).toContain("r1");
    // Local content was NOT overwritten.
    expect(st().resume.summary).toBe("conflicting local edit");

    // 409 is terminal for retries — no overwrite loop.
    await tick(60000);
    expect(mockFetch).toHaveBeenCalledTimes(2); // PUT + snapshot GET only
  });
});

/* ── E2/E7 — refresh truthfulness ─────────────────────────────────────── */

describe("E2/E7 — refresh and new-session truth", () => {
  it("E2: refresh after a successful save resumes with the content and 'Saved'", async () => {
    edit("persisted after success");
    mockFetch.mockResolvedValueOnce(okResponse(2));
    await tick(1600);
    await flush();
    expect(st().saveStatus).toBe("saved");

    // localStorage carries the truth (persist middleware).
    const raw = localStorage.getItem("patorbit-resume-v2");
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw as string);
    expect(persisted.state.pendingSyncIds ?? []).not.toContain("r1");

    vi.resetModules();
    const fresh = await import("@/store/resume-builder");
    await tick(50); // hydration safety-net (setTimeout 0) + job restore

    expect(fresh.useResumeBuilder.getState().resume.summary).toBe(
      "persisted after success",
    );
    expect(fresh.useResumeBuilder.getState().saveStatus).toBe("saved");
  });

  it("E7: refresh after a FAILED save resumes truthfully as 'Unsaved' (never 'Saved'), and startup recovery heals it", async () => {
    edit("never reached the server");
    mockFetch.mockResolvedValueOnce(failResponse(500, "server said no"));
    await tick(1600);
    await flush();
    expect(st().saveStatus).toBe("sync-failed");

    const raw = localStorage.getItem("patorbit-resume-v2");
    expect(raw).toBeTruthy();
    const persisted = JSON.parse(raw as string);
    expect(persisted.state.pendingSyncIds).toContain("r1"); // marker persisted

    vi.resetModules();
    const freshStore = await import("@/store/resume-builder");
    await tick(50); // hydration reconciliation
    const freshState = freshStore.useResumeBuilder.getState();

    // The bug this milestone fixes: hydration used to claim "Saved".
    expect(freshState.saveStatus).toBe("unsaved");
    expect(freshState.resume.summary).toBe("never reached the server");
    expect(freshState.pendingSyncIds).toContain("r1");

    // Startup recovery (WriteBackBootstrap → recoverFromOffline) re-saves.
    const freshWb = await import("@/lib/resume-write-back");
    mockFetch.mockResolvedValueOnce(okResponse(9));
    await freshWb.recoverFromOffline();
    await flush();

    const healed = freshStore.useResumeBuilder.getState();
    expect(healed.saveStatus).toBe("saved");
    expect(healed.pendingSyncIds).toEqual([]);
    expect(healed.serverVersions["r1"]).toBe(9);
    const body = JSON.parse(mockFetch.mock.calls.at(-1)?.[1].body);
    expect(body.resume.summary).toBe("never reached the server");
  });
});

/* ── Offline-queue flush truthfulness ─────────────────────────────────── */

describe("offline-queue flush never lies about newer edits", () => {
  const queueEntry = (summary: string): OfflineQueueEntry => ({
    id: "off_1",
    resumeId: "r1",
    resume: {
      ...structuredClone(defaultResume),
      resumeId: "r1",
      resumeName: "R1",
      summary,
    } as unknown as Record<string, unknown>,
    baseVersion: 1,
    timestamp: new Date().toISOString(),
  });

  it("flush success with NEWER local edits does not claim Saved and keeps the marker", async () => {
    // Local is ahead of what the queue holds.
    useResumeBuilder.setState({
      saveStatus: "unsaved",
      pendingSyncIds: ["r1"],
    });
    mockGetAll.mockResolvedValueOnce([queueEntry("older queued content")]);
    mockFetch.mockResolvedValueOnce(okResponse(4));

    await flushOfflineQueue();
    await flush();

    // Server persisted the queued snapshot; local has NEWER content.
    expect(st().saveStatus).toBe("unsaved");
    expect(st().pendingSyncIds).toContain("r1");
  });

  it("flush success whose content matches local resolves to Saved and clears the marker", async () => {
    const local = st().resume; // baseline content (same ref in resumes[])
    useResumeBuilder.setState({
      saveStatus: "unsaved",
      pendingSyncIds: ["r1"],
    });
    mockGetAll.mockResolvedValueOnce([
      { ...queueEntry(local.summary), resume: JSON.parse(JSON.stringify(local)) },
    ]);
    mockFetch.mockResolvedValueOnce(okResponse(4));

    await flushOfflineQueue();
    await flush();

    expect(st().saveStatus).toBe("saved");
    expect(st().pendingSyncIds).toEqual([]);
    expect(st().serverVersions["r1"]).toBe(4);
  });
});

/* ── A — SaveStatus semantics guard ───────────────────────────────────── */

describe("A — status vocabulary guard", () => {
  it("saveLocalResumeToServer transitions follow: unsaved → saving → (saved | sync-failed | offline)", async () => {
    const seen: string[] = [];
    const unsubscribe = useResumeBuilder.subscribe((s) => {
      if (seen[seen.length - 1] !== s.saveStatus) seen.push(s.saveStatus);
    });

    edit("observe me");
    mockFetch.mockResolvedValueOnce(failResponse(500, "nope"));
    await tick(1600);
    await flush();
    unsubscribe();

    expect(seen[0]).toBe("unsaved");
    expect(seen).toContain("saving");
    expect(seen.at(-1)).toBe("sync-failed");
    // No forbidden local-only hop.
    expect(seen.indexOf("saved")).toBe(-1);
  });
});

// saveLocalResumeToServer is exercised through the hooked pipeline above;
// exported directly for targeted background-save callers.
void saveLocalResumeToServer;
