/**
 * C7 — Conflict Resolution Tests
 *
 * Tests the 409 conflict flow, server snapshot fetching,
 * and the conflict diff utility integration.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const { mockFetch, mockSetSaveStatus, mockSetServerVersion, mockSubscribe } = vi.hoisted(() => ({
  mockFetch: vi.fn(),
  mockSetSaveStatus: vi.fn(),
  mockSetServerVersion: vi.fn(),
  mockSubscribe: vi.fn(),
}));

vi.stubGlobal("fetch", mockFetch);

const mockState: Record<string, unknown> = {
  resume: {
    resumeId: "resume-1",
    resumeName: "Test Resume",
    name: "Test User",
    title: "",
    email: "",
    phone: "",
    address: "",
    nationality: "",
    pronouns: "",
    summary: "",
    templateId: "modern-clean",
    careerStage: "working-professional",
    fontPreference: "inter",
    palettePreference: "slate",
    exportFormat: "pdf",
    pageSize: "letter",
    social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
    experience: [{ id: "e1", company: "ACME", position: "Dev", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] }],
    skills: [{ id: "s1", name: "Python", level: "Intermediate", category: "", years: "" }],
    education: [],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
    achievements: [],
    references: [],
    portfolio: [],
    claims: [],
  },
  activeResumeId: "resume-1",
  serverVersions: {} as Record<string, number>,
  writeConflict: null as Record<string, unknown> | null,
  saveStatus: "unsaved" as string,
  hydrated: true,
  resumes: [] as unknown[],
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

import { saveLocalResumeToServer } from "@/lib/resume-write-back";

describe("C7 — Conflict Resolution", () => {
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
      title: "",
      email: "",
      phone: "",
      address: "",
      nationality: "",
      pronouns: "",
      summary: "",
      templateId: "modern-clean",
      careerStage: "working-professional",
      fontPreference: "inter",
      palettePreference: "slate",
      exportFormat: "pdf",
      pageSize: "letter",
      social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
      experience: [{ id: "e1", company: "ACME", position: "Dev", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] }],
      skills: [{ id: "s1", name: "Python", level: "Intermediate", category: "", years: "" }],
      education: [],
      projects: [],
      certifications: [],
      languages: [],
      interests: [],
      achievements: [],
      references: [],
      portfolio: [],
      claims: [],
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("409 creates writeConflict with server snapshot", () => {
    it("sets writeConflict on 409 with both local and server resume", async () => {
      mockState.serverVersions = { "resume-1": 3 };

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 5 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            resume: {
              name: "Server User",
              experience: [
                { id: "e1", company: "ACME", position: "Dev", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] },
                { id: "e2", company: "Beta", position: "PM", location: "", employmentType: "", industry: "", startDate: "", endDate: "", current: false, duration: "", description: "", achievements: "", techUsed: "", bulletPoints: [] },
              ],
            },
            version: 5,
          }),
        });

      await saveLocalResumeToServer();

      expect(mockState.writeConflict).not.toBeNull();
      const wc = mockState.writeConflict as { resumeId: string; serverVersion: number };
      expect(wc.resumeId).toBe("resume-1");
      expect(wc.serverVersion).toBe(5);
    });

    it("preserves local resume data in writeConflict", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 4 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ resume: { name: "Server" }, version: 4 }),
        });

      await saveLocalResumeToServer();

      const wc2 = mockState.writeConflict as { localResume: { name: string; experience: unknown[] } };
      expect(wc2.localResume.name).toBe("Test User");
      expect(wc2.localResume.experience).toHaveLength(1);
    });

    it("fetches server snapshot for the conflict review UI", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            resume: { name: "Server User", summary: "Server summary" },
            version: 3,
          }),
        });

      await saveLocalResumeToServer();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch).toHaveBeenNthCalledWith(1, "/api/resumes/resume-1", expect.anything());
      expect(mockFetch).toHaveBeenNthCalledWith(2, "/api/resumes/resume-1");
    });

    it("sets saveStatus to unsaved on conflict", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ resume: {}, version: 3 }),
        });

      await saveLocalResumeToServer();

      expect(mockState.saveStatus).toBe("unsaved");
    });

    it("does NOT overwrite local resume content on 409", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ resume: { name: "Completely Different" }, version: 3 }),
        });

      await saveLocalResumeToServer();

      const localResume = mockState.resume as { name: string; experience: unknown[] };
      expect(localResume.name).toBe("Test User");
      expect(localResume.experience).toHaveLength(1);
    });
  });

  describe("Server snapshot fetch failure", () => {
    it("still creates writeConflict with empty serverResume", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
        })
        .mockRejectedValueOnce(new Error("Network error"));

      await saveLocalResumeToServer();

      expect(mockState.writeConflict).not.toBeNull();
      const wc3 = mockState.writeConflict as { serverVersion: number };
      expect(wc3.serverVersion).toBe(3);
    });
  });

  describe("Normal save (no conflict)", () => {
    it("succeeds and updates server version", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ version: 2, resumeId: "resume-1" }),
      });

      await saveLocalResumeToServer();

      expect(mockState.writeConflict).toBeNull();
      expect(mockSetSaveStatus).toHaveBeenCalledWith("saved");
      expect(mockSetServerVersion).toHaveBeenCalledWith("resume-1", 2);
    });
  });

  describe("Multi-resume isolation", () => {
    it("conflict only affects the active resume", async () => {
      mockState.activeResumeId = "resume-a";
      mockState.resume = {
        ...(mockState.resume as Record<string, unknown>),
        resumeId: "resume-a",
        name: "Alice",
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 409,
          json: () => Promise.resolve({ error: "CONFLICT", currentVersion: 3 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ resume: { name: "Server Alice" }, version: 3 }),
        });

      await saveLocalResumeToServer();

      const wc4 = mockState.writeConflict as { resumeId: string };
      expect(wc4.resumeId).toBe("resume-a");
    });
  });
});
