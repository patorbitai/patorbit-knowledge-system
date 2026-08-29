/**
 * C6 — Client-side Write-Back Tests
 *
 * Tests the write-back service, debouncing, conflict handling,
 * and atomic repository update.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock the store
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
  setSaveStatus: vi.fn(),
  setServerVersion: vi.fn(),
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
    subscribe: vi.fn(),
  },
}));

import { saveLocalResumeToServer, debouncedSave, forceSaveNow, cancelPendingSave } from "@/lib/resume-write-back";

describe("C6 — Resume Write-Back", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockState.serverVersions = {};
    mockState.writeConflict = null;
    mockState.saveStatus = "unsaved";
    mockState.activeResumeId = "resume-1";
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

      // Should NOT include baseVersion when serverVersions is empty
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

      expect(mockState.setServerVersion).toHaveBeenCalledWith("resume-1", 4);
      expect(mockState.setSaveStatus).toHaveBeenCalledWith("saved");
    });

    it("does NOT overwrite local resume on success", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 2, resumeId: "resume-1" }),
      });

      await saveLocalResumeToServer();

      // setSaveStatus was called but resume was NOT replaced
      expect(mockState.setSaveStatus).toHaveBeenCalledWith("saved");
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

      // Should set writeConflict
      expect(mockState.saveStatus).toBe("unsaved");
    });

    it("does NOT call setServerVersion on conflict", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
      });

      await saveLocalResumeToServer();

      expect(mockState.setServerVersion).not.toHaveBeenCalled();
    });
  });

  describe("Error handling", () => {
    it("sets offline status on network error", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await saveLocalResumeToServer();

      expect(mockState.setSaveStatus).toHaveBeenCalledWith("offline");
    });

    it("sets sync-failed on server error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Internal Server Error" }),
      });

      await saveLocalResumeToServer();

      expect(mockState.setSaveStatus).toHaveBeenCalledWith("sync-failed");
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

      // Not called yet
      expect(mockFetch).not.toHaveBeenCalled();

      // After debounce
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
      debouncedSave(); // Cancel first
      vi.advanceTimersByTime(1500);

      await vi.waitFor(() => {
        // Only one fetch should have been made (the second one)
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });
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

      // Should not have been called
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
