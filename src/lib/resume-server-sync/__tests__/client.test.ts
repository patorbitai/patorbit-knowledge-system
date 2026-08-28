import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchServerResumes, ResumeServerClientError } from "../client";

const RECORD = {
  resumeId: "resume-A",
  resumeName: "Ada's Resume",
  templateId: "modern-clean",
  careerStage: "working-professional",
  resume: { name: "Ada Lovelace" },
  createdAt: "2026-08-16T00:00:00.000Z",
  updatedAt: "2026-08-16T00:00:00.000Z",
};

function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}): ReturnType<typeof vi.fn> {
  const fn = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("fetchServerResumes", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns typed server resume records on success", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ resumes: [RECORD] }),
    });
    const result = await fetchServerResumes();
    expect(result).toEqual([RECORD]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/resumes",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("returns [] for an empty server", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ resumes: [] }) });
    await expect(fetchServerResumes()).resolves.toEqual([]);
  });

  it("returns [] (fail closed) for a malformed body", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });
    await expect(fetchServerResumes()).resolves.toEqual([]);
  });

  it("throws ResumeServerClientError with status 401 for unauthenticated", async () => {
    mockFetchOnce({ ok: false, status: 401, json: async () => ({ error: "Unauthorized" }) });
    await expect(fetchServerResumes()).rejects.toMatchObject({
      name: "ResumeServerClientError",
      status: 401,
    });
  });

  it("throws ResumeServerClientError for an API 500", async () => {
    mockFetchOnce({ ok: false, status: 500, json: async () => ({ error: "boom" }) });
    await expect(fetchServerResumes()).rejects.toMatchObject({
      name: "ResumeServerClientError",
      status: 500,
    });
  });

  it("propagates network failures (fail closed)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Network request failed")));
    await expect(fetchServerResumes()).rejects.toThrow("Network request failed");
  });

  it("exposes the HTTP status on ResumeServerClientError", () => {
    const err = new ResumeServerClientError("Unavailable", 503);
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(503);
    expect(err.message).toBe("Unavailable");
  });
});
