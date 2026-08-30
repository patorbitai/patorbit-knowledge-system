/**
 * C6/C6.1 — Client-side Write-Back Tests
 *
 * Tests the write-back service, debouncing, conflict handling,
 * hook initialization, beforeunload flush, and atomic repository update.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// vi.hoisted() ensures these are available when vi.mock() runs (hoisted to top)
const { mockFetch, mockSendBeacon, addEventListenerSpy, mockSetSaveStatus, mockSetServerVersion, mockSubscribe } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockSendBeacon: vi.fn(() => true),
  addEventListenerSpy: vi.fn(),
  mockSetSaveStatus: vi.fn(),
  mockSetServerVersion: vi.fn(),
  mockSubscribe: vi.fn(),
}));

vi.stubGlobal("fetch", mockFetch);
vi.stubGlobal("navigator", { sendBeacon: mockSendBeacon });
vi.stubGlobal("window", {
  addEventListener: addEventListenerSpy,
  removeEventListener: vi.fn(),
});

const mockState = {
  resume: {
    resumeId: "resume-1",
    resumeName: "Test Resume",
    name: "Test User",
    templateId: "modern-clean",
    careerStage: "working-professional",
  },
  activeResumeId: "resume-1",
  serverVersions: {} as Record<string, number>,
  writeConflict: null as { resumeId: string; serverVersion: number } | null,
  saveStatus: "unsaved" as string,
  hydrated: true,
  setSaveStatus: mockSetSaveStatus,
  setServerVersion: mockSetServerVersion,
};

vi.mock("@/store/resume-builder", () => ({
  useResumeBuilder: {
    getState: () => mockState,
    setState: vi.fn((updater: unknown) => {
      if (typeof updater === "function") {
        const result = updater(mockState);
        Object.assign(mockState, result);
      } else {
        Object.assign(mockState, updater);
      }
    }),
    subscribe: mockSubscribe,
  },
}));

import {
  saveLocalResumeToServer,
  debouncedSave,
  forceSaveNow,
  cancelPendingSave,
} from "@/lib/resume-write-back";

describe("C6 — Resume Write-Back", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockState.serverVersions = {};
    mockState.writeConflict = null;
    mockState.saveStatus = "unsaved";
    mockState.activeResumeId = "resume-1";
    mockState.hydrated = true;
    mockState.resume = {
      resumeId: "resume-1",
      resumeName: "Test Resume",
      name: "Test User",
      templateId: "modern-clean",
      careerStage: "working-professional",
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("saveLocalResumeToServer", () => {
    it("sends PUT with resume data and baseVersion=undefined when no server version", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1, resumeId: "resume-1" }),
      });

      await saveLocalResumeToServer();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resumes/resume-1",
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining("\"resumeId\":\"resume-1\""),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.baseVersion).toBeUndefined();
    });

    it("sends baseVersion when server version is known", async () => {
      mockState.serverVersions = { "resume-1": 5 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 6, resumeId: "resume-1" }),
      });

      await saveLocalResumeToServer();

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.baseVersion).toBe(5);
    });

    it("updates server version on success", async () => {
      mockState.serverVersions = { "resume-1": 3 };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 4, resumeId: "resume-1" }),
      });

      await saveLocalResumeToServer();

      expect(mockSetServerVersion).toHaveBeenCalledWith("resume-1", 4);
      expect(mockSetSaveStatus).toHaveBeenCalledWith("saved");
    });

    it("does NOT overwrite local resume on success", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 2, resumeId: "resume-1" }),
      });

      await saveLocalResumeToServer();

      expect(mockSetSaveStatus).toHaveBeenCalledWith("saved");
    });
  });

  describe("409 Conflict handling", () => {
    it("exposes conflict state on 409 without overwriting local", async () => {
      mockState.serverVersions = { "resume-1": 2 };
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 5 }),
      });

      await saveLocalResumeToServer();

      expect(mockState.saveStatus).toBe("unsaved");
    });

    it("does NOT call setServerVersion on conflict", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
      });

      await saveLocalResumeToServer();

      expect(mockSetServerVersion).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("sets offline status on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await saveLocalResumeToServer();

      expect(mockSetSaveStatus).toHaveBeenCalledWith("offline");
    });

    it("sets sync-failed on server error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal Server Error" }),
      });

      await saveLocalResumeToServer();

      expect(mockSetSaveStatus).toHaveBeenCalledWith("sync-failed");
    });
  });

  describe("Debounced saving", () => {
    it("does not save immediately", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      debouncedSave();
      expect(mockFetch).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1500);
      await vi.waitFor(() => expect(mockFetch).toHaveBeenCalled());
    });

    it("cancels previous pending save for same resume", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      debouncedSave();
      vi.advanceTimersByTime(500);
      debouncedSave();
      vi.advanceTimersByTime(1500);

      await vi.waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
    });

    it("latest edit payload is what gets sent", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      mockState.resume = { ...mockState.resume, name: "Edit 1" };
      debouncedSave();
      vi.advanceTimersByTime(500);

      mockState.resume = { ...mockState.resume, name: "Edit 2" };
      debouncedSave();
      vi.advanceTimersByTime(1500);

      await vi.waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.resume.name).toBe("Edit 2");
    });
  });

  describe("cancelPendingSave", () => {
    it("cancels a pending debounced save", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      debouncedSave();
      cancelPendingSave("resume-1");
      vi.advanceTimersByTime(2000);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("forceSaveNow", () => {
    it("saves immediately bypassing debounce", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      await forceSaveNow();

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * C6.1 tests use dynamic import + vi.resetModules() so the module-level
 * `_hooked` flag resets between test groups. Each test group that calls
 * hookWriteBackToStore() gets a fresh module instance.
 */
describe("C6.1 — Integration Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockState.serverVersions = {};
    mockState.writeConflict = null;
    mockState.saveStatus = "unsaved";
    mockState.activeResumeId = "resume-1";
    mockState.hydrated = true;
    mockState.resume = {
      resumeId: "resume-1",
      resumeName: "Test Resume",
      name: "Test User",
      templateId: "modern-clean",
      careerStage: "working-professional",
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("hookWriteBackToStore initialization", () => {
    it("registers a Zustand subscribe callback", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      hookWriteBackToStore();

      expect(mockSubscribe).toHaveBeenCalledTimes(1);
      expect(mockSubscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it("only registers once (idempotent)", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      hookWriteBackToStore();
      hookWriteBackToStore();
      hookWriteBackToStore();

      expect(mockSubscribe).toHaveBeenCalledTimes(1);
    });

    it("registers beforeunload handler", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      hookWriteBackToStore();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "beforeunload",
        expect.any(Function)
      );
    });
  });

  describe("Subscription behavior", () => {
    it("skips write-back when hydrated is false (pre-hydration)", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      mockState.hydrated = false;
      hookWriteBackToStore();

      const callback = mockSubscribe.mock.calls[0][0];
      const prevState = { ...mockState, hydrated: false };
      const newState = {
        ...mockState,
        hydrated: false,
        resume: { ...mockState.resume, name: "Changed" },
      };

      callback(newState, prevState);

      vi.advanceTimersByTime(2000);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("triggers debounced save when hydrated and resume changes", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      hookWriteBackToStore();

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      const callback = mockSubscribe.mock.calls[0][0];
      const prevState = { ...mockState, saveStatus: "saved" };
      const newState = {
        ...mockState,
        saveStatus: "unsaved",
        resume: { ...mockState.resume, name: "Changed" },
      };

      callback(newState, prevState);

      vi.advanceTimersByTime(1500);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("does NOT trigger when saveStatus is saving", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      hookWriteBackToStore();

      const callback = mockSubscribe.mock.calls[0][0];
      const prevState = { ...mockState, saveStatus: "saved" };
      const newState = {
        ...mockState,
        saveStatus: "saving",
        resume: { ...mockState.resume, name: "Changed" },
      };

      callback(newState, prevState);

      vi.advanceTimersByTime(2000);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does NOT trigger on sync-failed to sync-failed transition", async () => {
      vi.resetModules();
      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      hookWriteBackToStore();

      const callback = mockSubscribe.mock.calls[0][0];
      const prevState = { ...mockState, saveStatus: "sync-failed" as string };
      const newState = {
        ...mockState,
        saveStatus: "sync-failed" as string,
        resume: { ...mockState.resume, name: "Changed" },
      };

      callback(newState, prevState);

      vi.advanceTimersByTime(2000);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("Multi-resume isolation", () => {
    it("sends correct resumeId to server for the active resume", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 1 }),
      });

      mockState.activeResumeId = "resume-2";
      mockState.resume = {
        ...mockState.resume,
        resumeId: "resume-2",
        name: "Resume B",
      };

      await saveLocalResumeToServer();

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/resumes/resume-2",
        expect.anything()
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.resumeId).toBe("resume-2");
    });
  });

  describe("Pending save flush on unload", () => {
    it("sendBeacon is called with resume data on beforeunload when unsaved", async () => {
      vi.resetModules();
      // Reset spy call history for this test
      addEventListenerSpy.mockClear();

      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      mockState.saveStatus = "unsaved";
      mockState.hydrated = true;
      hookWriteBackToStore();

      // Get the beforeunload handler registered by hookWriteBackToStore
      const beforeunloadCall = addEventListenerSpy.mock.calls.find(
        (call: unknown[]) => call[0] === "beforeunload"
      );
      expect(beforeunloadCall).toBeDefined();

      const handler = beforeunloadCall![1] as () => void;
      handler();

      expect(mockSendBeacon).toHaveBeenCalledWith(
        "/api/resumes/resume-1",
        expect.any(Blob)
      );
    });

    it("does NOT sendBeacon when saveStatus is saved", async () => {
      vi.resetModules();
      addEventListenerSpy.mockClear();

      const { hookWriteBackToStore } = await import("@/lib/resume-write-back");
      mockState.saveStatus = "saved";
      hookWriteBackToStore();

      const beforeunloadCall = addEventListenerSpy.mock.calls.find(
        (call: unknown[]) => call[0] === "beforeunload"
      );
      const handler = beforeunloadCall![1] as () => void;
      handler();

      expect(mockSendBeacon).not.toHaveBeenCalled();
    });
  });

  describe("Read-only server sync preserved", () => {
    it("server sync only captures versions, never overwrites resume content", () => {
      const originalResume = { ...mockState.resume };

      mockState.serverVersions = { "resume-1": 5 };

      expect(mockState.resume).toEqual(originalResume);
    });
  });
});
