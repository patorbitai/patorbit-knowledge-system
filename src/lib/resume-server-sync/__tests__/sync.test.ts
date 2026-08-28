import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { fetchServerResumesMock } = vi.hoisted(() => ({
  fetchServerResumesMock: vi.fn(),
}));

vi.mock("../client", () => ({
  fetchServerResumes: fetchServerResumesMock,
}));

import { runServerResumeSync } from "../sync";
import type { ServerResumeRecord } from "../client";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import type { Resume } from "@/types/resume";

const LOCAL_RESUME: Resume = {
  ...defaultResume,
  resumeId: "local-1",
  resumeName: "Local Resume",
  name: "Local User",
  title: "Engineer",
  email: "local@example.com",
  templateId: "modern-clean",
  careerStage: "working-professional",
  claims: [],
};

const SERVER_RESUME: ServerResumeRecord = {
  resumeId: "server-1",
  resumeName: "Server Resume",
  templateId: "executive-pro",
  careerStage: "working-professional",
  resume: { name: "Server Only", templateId: "executive-pro", careerStage: "working-professional" },
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

describe("runServerResumeSync", () => {
  beforeEach(() => {
    fetchServerResumesMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    // Restore a clean store state for the next test.
    useResumeBuilder.setState({
      resumes: [LOCAL_RESUME],
      activeResumeId: "local-1",
      resume: LOCAL_RESUME,
      styleConfigs: {},
    });
  });

  it("returns an ok outcome with a parity report on success", async () => {
    fetchServerResumesMock.mockResolvedValue([SERVER_RESUME]);
    const outcome = await runServerResumeSync([{ resumeId: "local-1", resumeName: "Local Resume", templateId: "modern-clean", careerStage: "working-professional", document: LOCAL_RESUME, styleConfig: null }]);

    expect(outcome.status).toBe("ok");
    if (outcome.status !== "ok") return;
    expect(outcome.report.entries.map((e) => [e.resumeId, e.status])).toEqual([
      ["local-1", "LOCAL_ONLY"],
      ["server-1", "SERVER_ONLY"],
    ]);
  });

  it("fails closed: network failure → error outcome, local state untouched", async () => {
    fetchServerResumesMock.mockRejectedValue(new TypeError("Network request failed"));

    const before = useResumeBuilder.getState();
    const outcome = await runServerResumeSync([]);

    expect(outcome).toEqual({ status: "error", error: "Network request failed" });
    const after = useResumeBuilder.getState();
    expect(after.resumes).toEqual(before.resumes);
    expect(after.activeResumeId).toBe(before.activeResumeId);
    expect(after.resume).toEqual(before.resume);
  });

  it("fails closed: API 500 → error outcome, local state untouched", async () => {
    fetchServerResumesMock.mockRejectedValue(Object.assign(new Error("Failed to load server resumes (500)"), { status: 500 }));

    const before = useResumeBuilder.getState();
    const outcome = await runServerResumeSync([]);

    expect(outcome.status).toBe("error");
    expect(useResumeBuilder.getState().resumes).toEqual(before.resumes);
  });

  it("disabled flag → disabled outcome and the client is never called", async () => {
    vi.stubEnv("NEXT_PUBLIC_RESUME_SERVER_SYNC", "false");

    const outcome = await runServerResumeSync([]);

    expect(outcome).toEqual({ status: "disabled" });
    expect(fetchServerResumesMock).not.toHaveBeenCalled();
  });

  it("safety invariant: a SERVER_ONLY resume never appears in Zustand", async () => {
    fetchServerResumesMock.mockResolvedValue([SERVER_RESUME]);
    const before = useResumeBuilder.getState().resumes;

    await runServerResumeSync([
      { resumeId: "local-1", resumeName: "Local Resume", templateId: "modern-clean", careerStage: "working-professional", document: LOCAL_RESUME, styleConfig: null },
    ]);

    const after = useResumeBuilder.getState();
    expect(after.resumes).toEqual(before);
    expect(after.resumes.some((r) => r.resumeId === "server-1")).toBe(false);
    expect(after.activeResumeId).toBe("local-1");
  });

  it("safety invariant: LOCAL_ONLY resumes are never uploaded", async () => {
    fetchServerResumesMock.mockResolvedValue([]);
    await runServerResumeSync([
      { resumeId: "local-1", resumeName: "Local Resume", templateId: "modern-clean", careerStage: "working-professional", document: LOCAL_RESUME, styleConfig: null },
    ]);

    // The client helper is GET-only; nothing was POSTed.
    expect(fetchServerResumesMock).toHaveBeenCalledTimes(1);
  });

  it("safety invariant: a locally modified resume remains the visible one (no server overwrite)", async () => {
    // Server has the same resumeId with different content.
    const sameIdServer: ServerResumeRecord = {
      ...SERVER_RESUME,
      resumeId: "local-1",
      resumeName: "Server Copy",
      resume: { name: "Server Overwrote This", templateId: "modern-clean", careerStage: "working-professional" },
    };
    fetchServerResumesMock.mockResolvedValue([sameIdServer]);

    await runServerResumeSync([
      { resumeId: "local-1", resumeName: "Local Resume", templateId: "modern-clean", careerStage: "working-professional", document: LOCAL_RESUME, styleConfig: null },
    ]);

    const after = useResumeBuilder.getState();
    expect(after.resumes[0].resumeId).toBe("local-1");
    expect(after.resumes[0].name).toBe("Local User");
    expect(after.resumes[0].name).not.toBe("Server Overwrote This");
    expect(after.activeResumeId).toBe("local-1");
  });
});
