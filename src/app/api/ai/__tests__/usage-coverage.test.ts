/**
 * M6 — usage coverage for the newly metered endpoints (check 3 + 4):
 *
 *  /api/ai/bullets           → ai_generations exactly once per dispatch
 *  /api/ai/keywords          → ai_generations exactly once per dispatch
 *  /api/ai/summary           → ai_generations exactly once per dispatch
 *  /api/ai/evidence-optimize → ai_generations exactly once per dispatch
 *  /api/import extractResume → ai_generations exactly once (AI path only)
 *
 *  A rate-limited request increments zero quota (rate runs BEFORE quota).
 *  Existing metered routes (score/match/tailor) keep their keys.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { usageMock, sessionMock, completeMock, extractResumeMock, entitlementMock } =
  vi.hoisted(() => ({
    usageMock: vi.fn(),
    sessionMock: vi.fn(),
    completeMock: vi.fn(),
    extractResumeMock: vi.fn(),
    entitlementMock: vi.fn(),
  }));

vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => sessionMock(...args),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/services/usage.service", () => ({
  usageService: { checkAndIncrementUsage: (...args: unknown[]) => usageMock(...args) },
}));
vi.mock("@/lib/ai/provider", () => ({
  getAIProvider: () => ({ complete: (...args: unknown[]) => completeMock(...args) }),
}));
vi.mock("@/lib/ai/service", () => ({
  getAIService: () => ({
    evidenceOptimize: vi.fn().mockResolvedValue({ changes: [] }),
    extractResume: (...args: unknown[]) => extractResumeMock(...args),
  }),
}));
vi.mock("@/services/entitlement.service", () => ({
  entitlementService: { getUserEntitlements: (...args: unknown[]) => entitlementMock(...args) },
}));
// Deterministic M1–M3 builders are covered by their own suites; this file
// only asserts quota behavior, so they are stubbed to keep the resume fixture
// small.
vi.mock("@/lib/career-profile", () => ({ buildCareerProfile: vi.fn().mockReturnValue({}) }));
vi.mock("@/lib/job-profile", () => ({ buildJobProfile: vi.fn().mockReturnValue({}) }));
vi.mock("@/lib/qualification-match", () => ({
  buildQualificationMatch: vi.fn().mockReturnValue({
    summary: { total: 0, proven: 0, related: 0, communicationGap: 0 },
    items: [],
  }),
}));
// Import route: force the DOCX path with a low-signal document so the AI
// fallback (extractResume) runs — deterministic parsing must stay free, but
// the AI path is metered.
vi.mock("mammoth", () => ({
  default: { extractRawText: vi.fn().mockResolvedValue({ value: "q" }) },
}));
vi.mock("@/utils/resume-parser", () => ({
  // Zero deterministic signals (< CONFIDENT_SIGNALS) → AI fallback eligible.
  rawToResume: vi.fn().mockReturnValue({}),
  withIds: vi.fn().mockImplementation((arr: object[]) => arr),
}));

import { POST as bulletsPOST } from "@/app/api/ai/bullets/route";
import { POST as keywordsPOST } from "@/app/api/ai/keywords/route";
import { POST as summaryPOST } from "@/app/api/ai/summary/route";
import { POST as evidencePOST } from "@/app/api/ai/evidence-optimize/route";

let seq = 0;
const uid = () => `usage-user-${++seq}`;

function jsonRequest(url: string, body: unknown): NextRequest {
  const raw = JSON.stringify(body);
  return new NextRequest(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": String(raw.length) },
    body: raw,
  });
}

const resume = {
  name: "Test User",
  summary: "Engineer with a decade of shipping things.",
  email: "t@example.com",
  social: { linkedin: "", github: "", website: "", portfolio: "", twitter: "", stackoverflow: "" },
  experience: [
    {
      id: "exp-1",
      position: "Engineer",
      company: "ACME",
      startDate: "2019-01-01",
      endDate: "",
      location: "Remote",
      bulletPoints: ["Shipped the billing service handling 1M requests/day."],
    },
  ],
  education: [],
  skills: [{ name: "TypeScript", level: "Expert" }],
  projects: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ user: { id: uid() } });
  usageMock.mockResolvedValue({ allowed: true, current: 1, limit: 10, remaining: 9 });
  entitlementMock.mockResolvedValue({
    tier: "Professional",
    status: "active",
    isActive: true,
    features: { careerProfileFull: true },
  });
});

describe("/api/ai/bullets — metered", () => {
  const body = { resume, entryId: "exp-1" };

  it("increments ai_generations exactly once per dispatch (check 3)", async () => {
    completeMock.mockResolvedValue({
      content: JSON.stringify([
        { bulletIndex: 0, original: "old", improved: "new", reasoning: "why" },
      ]),
    });
    const res = await bulletsPOST(jsonRequest("http://localhost/api/ai/bullets", body));
    expect(res.status).toBe(200);
    expect(usageMock).toHaveBeenCalledTimes(1);
    expect(usageMock.mock.calls[0][1]).toBe("ai_generations");
  });

  it("does not increment when quota is exhausted — returns USAGE_LIMIT_REACHED", async () => {
    usageMock.mockResolvedValue({ allowed: false, current: 10, limit: 10, remaining: 0 });
    const res = await bulletsPOST(jsonRequest("http://localhost/api/ai/bullets", body));
    expect(res.status).toBe(429);
    const b = (await res.json()) as { code: string };
    expect(b.code).toBe("USAGE_LIMIT_REACHED");
    expect(completeMock).not.toHaveBeenCalled();
  });
});

describe("/api/ai/keywords — metered", () => {
  const body = { resume, jobDescription: "We need a senior TypeScript engineer with AWS." };

  it("increments ai_generations exactly once per dispatch (check 3)", async () => {
    completeMock.mockResolvedValue({
      content: JSON.stringify({ score: 70, present: ["TypeScript"], missing: ["AWS"], recommended: [], density: {} }),
    });
    const res = await keywordsPOST(jsonRequest("http://localhost/api/ai/keywords", body));
    expect(res.status).toBe(200);
    expect(usageMock).toHaveBeenCalledTimes(1);
    expect(usageMock.mock.calls[0][1]).toBe("ai_generations");
  });
});

describe("/api/ai/summary — metered", () => {
  const body = { resume };

  it("increments ai_generations exactly once per dispatch (check 3)", async () => {
    // Provider without completeStream → non-streaming fallback path.
    completeMock.mockResolvedValue({ content: "A professional summary." });
    const res = await summaryPOST(jsonRequest("http://localhost/api/ai/summary", body));
    expect(res.status).toBe(200);
    expect(usageMock).toHaveBeenCalledTimes(1);
    expect(usageMock.mock.calls[0][1]).toBe("ai_generations");
    // drain the SSE stream so nothing leaks between tests
    await res.text();
  });

  it("does not increment when quota is exhausted", async () => {
    usageMock.mockResolvedValue({ allowed: false, current: 10, limit: 10, remaining: 0 });
    const res = await summaryPOST(jsonRequest("http://localhost/api/ai/summary", body));
    expect(res.status).toBe(429);
    const b = (await res.json()) as { code: string };
    expect(b.code).toBe("USAGE_LIMIT_REACHED");
    expect(completeMock).not.toHaveBeenCalled();
  });
});

describe("/api/ai/evidence-optimize — metered", () => {
  const body = { resume, jobDescription: "Senior engineer role requiring TypeScript and AWS." };

  it("increments ai_generations exactly once per dispatch (check 3)", async () => {
    const res = await evidencePOST(jsonRequest("http://localhost/api/ai/evidence-optimize", body));
    expect(res.status).toBe(200);
    expect(usageMock).toHaveBeenCalledTimes(1);
    expect(usageMock.mock.calls[0][1]).toBe("ai_generations");
  });

  it("returns 403 before quota when entitlement is missing", async () => {
    entitlementMock.mockResolvedValue({
      tier: "Free",
      status: "active",
      isActive: true,
      features: { careerProfileFull: false },
    });
    const res = await evidencePOST(jsonRequest("http://localhost/api/ai/evidence-optimize", body));
    expect(res.status).toBe(403);
    expect(usageMock).not.toHaveBeenCalled();
  });
});

describe("rate-before-quota ordering (check 4)", () => {
  it("a rate-limited bullets request increments zero quota", async () => {
    // Drive the REAL in-memory limiter to its cap for one user.
    const user = `rl-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionMock.mockResolvedValue({ user: { id: user } });
    completeMock.mockResolvedValue({
      content: JSON.stringify([
        { bulletIndex: 0, original: "old", improved: "new", reasoning: "why" },
      ]),
    });

    const callsBefore = usageMock.mock.calls.length;
    for (let i = 0; i < 21; i++) {
      await bulletsPOST(
        jsonRequest("http://localhost/api/ai/bullets", { resume, entryId: "exp-1" }),
      );
    }
    // 20 allowed + 1 blocked: the blocked one never touched usage.
    expect(usageMock.mock.calls.length - callsBefore).toBe(20);
  });
});

describe("/api/import — extractResume metered (AI path only)", () => {
  // jsdom's FormData/File are not undici's — undici's multipart parser rejects
  // them, so stub formData() on the request with a jsdom File instead. The route
  // only uses size/type/text()/arrayBuffer(), all implemented by jsdom's File.
  function uploadRequest(filename: string, contentType: string, content: string): NextRequest {
    const req = new NextRequest("http://localhost/api/import", { method: "POST" });
    const form = new FormData();
    form.append("file", new File([content], filename, { type: contentType }));
    Object.defineProperty(req, "formData", { value: async () => form });
    return req;
  }

  function docxRequest(): NextRequest {
    return uploadRequest(
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "fake-docx-bytes",
    );
  }

  it("charges exactly 1 ai_generations credit when AI extraction runs (check 3)", async () => {
    extractResumeMock.mockResolvedValue({ name: "AI Person", email: "a@example.com" });
    const { POST } = await import("@/app/api/import/route");
    const res = await POST(docxRequest());
    expect(res.status).toBe(200);
    expect(extractResumeMock).toHaveBeenCalledTimes(1);
    expect(usageMock).toHaveBeenCalledTimes(1);
    expect(usageMock.mock.calls[0][1]).toBe("ai_generations");
  });

  it("skips AI extraction (zero further increments) when quota is exhausted, import still succeeds", async () => {
    usageMock.mockResolvedValue({ allowed: false, current: 10, limit: 10, remaining: 0 });
    const { POST } = await import("@/app/api/import/route");
    const res = await POST(docxRequest());
    // Deterministic-first rule: quota exhaustion must not break import.
    expect(res.status).toBe(200);
    expect(extractResumeMock).not.toHaveBeenCalled();
    expect(usageMock).toHaveBeenCalledTimes(1); // the blocked check itself
  });

  it("JSON (deterministic) imports consume zero credits", async () => {
    usageMock.mockClear();
    extractResumeMock.mockClear();
    const json = JSON.stringify({ name: "Det Person", email: "d@example.com", summary: "x" });
    const req = uploadRequest("resume.json", "application/json", json);

    const { POST } = await import("@/app/api/import/route");
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(usageMock).not.toHaveBeenCalled();
    expect(extractResumeMock).not.toHaveBeenCalled();
  });
});
