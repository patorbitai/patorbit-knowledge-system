/**
 * M5C §E — customization enters the SAME truthful save pipeline.
 *
 * The M5B save-state architecture is unchanged: a style-only store edit now
 * reaches the existing debounced write-back, the server payload carries the
 * per-resume style config (`resume.styleConfigs`, ADR-003), and only a real
 * server confirmation may claim "Saved".
 *
 *  E1   style-only edit → debounced PUT carries resume.styleConfigs
 *  E2   a newer mid-flight style edit is never claimed "Saved"
 *  E3   template changes save through the same pipeline, content preserved
 *  E4   the unload flush carries the latest style config (keepalive + queue)
 *  E5   failed customization save keeps changes and Retry succeeds (F5)
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// No IndexedDB in jsdom — stub the offline safety net (as resume-write-back
// tests do) and observe its payload instead.
vi.mock("@/lib/offline-queue", () => ({
  enqueueOfflineSave: vi.fn().mockResolvedValue(undefined),
  removeOfflineEntry: vi.fn().mockResolvedValue(undefined),
  getAllOfflineEntries: vi.fn().mockResolvedValue([]),
}));

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import { hookWriteBackToStore, forceSaveNow, retryFailedSave } from "@/lib/resume-write-back";
import { enqueueOfflineSave } from "@/lib/offline-queue";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import type { Resume } from "@/types/resume";

const RID = "m5c-e1";
const OK = () => ({ ok: true, status: 200, json: async () => ({ version: 4 }) });

function seed(): void {
  const resume = {
    ...structuredClone(defaultResume),
    resumeId: RID,
    resumeName: "M5C Save",
    templateId: "modern-clean",
    name: "Ada Lovelace",
  } as Resume;
  useResumeBuilder.setState({
    resumes: [resume],
    resume, // same reference — the self-healing subscription stays quiet
    activeResumeId: RID,
    styleConfigs: {},
    saveStatus: "saved",
    hydrated: true,
    hydratingFromServer: false,
    pendingDeletes: [],
    pendingSyncIds: [],
    serverVersions: { [RID]: 3 },
    versions: {},
    lineage: {},
  });
}

interface PutBody {
  baseVersion?: number;
  resume: {
    name?: string;
    templateId?: string;
    styleConfigs?: Record<string, Record<string, unknown>>;
  };
}

function bodyOf(callIndex: number): PutBody {
  const [, init] = fetchMock.mock.calls[callIndex];
  return JSON.parse((init as { body: string }).body) as PutBody;
}

describe("M5C — customization save integration (M5B pipeline)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    seed();
    // idempotent: the first call also runs startup recovery (no-ops here)
    hookWriteBackToStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("E1: a style-only edit triggers the debounced PUT carrying resume.styleConfigs", async () => {
    fetchMock.mockResolvedValue(OK());

    useResumeBuilder.getState().setStyleConfig(RID, { fontFamily: "playfair" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");

    await vi.advanceTimersByTimeAsync(1600); // SAVE_DEBOUNCE_MS = 1500
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/resumes/${RID}`);
    const body = bodyOf(0);
    expect(body.baseVersion).toBe(3);
    expect(body.resume.styleConfigs?.[RID]).toMatchObject({ fontFamily: "playfair" });

    await vi.advanceTimersByTimeAsync(1);
    // "Saved" only after the confirmed response (M5B truthfulness)
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");
  });

  it("E2: a newer mid-flight style edit is never claimed Saved; the follow-up carries both", async () => {
    let resolvePut!: (v: unknown) => void;
    fetchMock.mockImplementation(
      () => new Promise((r) => { resolvePut = r; }),
    );

    useResumeBuilder.getState().setStyleConfig(RID, { fontFamily: "playfair" });
    await vi.advanceTimersByTimeAsync(1600);
    expect(useResumeBuilder.getState().saveStatus).toBe("saving");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // newer customization lands while the PUT is in flight
    useResumeBuilder.getState().setStyleConfig(RID, { accentColor: "#059669" });

    resolvePut(OK());
    await vi.advanceTimersByTimeAsync(1);
    // the response only covered the FIRST config → must NOT claim "Saved"
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");

    // the next save carries BOTH edits and may reach "Saved"
    fetchMock.mockResolvedValue(OK());
    await forceSaveNow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodyOf(1).resume.styleConfigs?.[RID]).toMatchObject({
      fontFamily: "playfair",
      accentColor: "#059669",
    });
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");
  });

  it("E3: template changes save through the same pipeline with content preserved", async () => {
    fetchMock.mockResolvedValue(OK());

    useResumeBuilder.getState().applyTemplate("sidebar-elegance");
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");

    await vi.advanceTimersByTimeAsync(1600);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = bodyOf(0);
    expect(body.resume.templateId).toBe("sidebar-elegance");
    expect(body.resume.name).toBe("Ada Lovelace");

    await vi.advanceTimersByTimeAsync(1);
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");
  });

  it("E4: the unload flush carries the latest style config (keepalive + offline copy)", () => {
    fetchMock.mockResolvedValue(OK());

    useResumeBuilder.getState().setStyleConfig(RID, { density: "compact" });
    expect(useResumeBuilder.getState().saveStatus).toBe("unsaved");

    window.dispatchEvent(new Event("beforeunload"));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe(`/api/resumes/${RID}`);
    expect((fetchMock.mock.calls[0][1] as { keepalive?: boolean }).keepalive).toBe(true);
    const body = bodyOf(0);
    expect(body.baseVersion).toBe(3);
    expect(body.resume.styleConfigs?.[RID]).toMatchObject({ density: "compact" });
    // offline safety-net copy carries the SAME customization
    expect(enqueueOfflineSave).toHaveBeenCalledWith(
      RID,
      expect.objectContaining({ styleConfigs: expect.any(Object) }),
      3,
    );
  });

  it("E5/F5: a failed customization save keeps changes and Retry succeeds", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    });

    useResumeBuilder.getState().setStyleConfig(RID, { fontFamily: "playfair" });
    await vi.advanceTimersByTimeAsync(1600);
    await vi.advanceTimersByTimeAsync(1);

    const failed = useResumeBuilder.getState();
    expect(failed.saveStatus).toBe("sync-failed");
    expect(failed.lastSaveError).toBeTruthy();
    // changes preserved locally — the customization was never discarded
    expect(failed.styleConfigs[RID]).toMatchObject({ fontFamily: "playfair" });

    // explicit Retry (auto-retry stays disabled under tests, per M5B)
    fetchMock.mockResolvedValue(OK());
    await retryFailedSave();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(bodyOf(1).resume.styleConfigs?.[RID]).toMatchObject({ fontFamily: "playfair" });
    expect(useResumeBuilder.getState().saveStatus).toBe("saved");
  });
});
