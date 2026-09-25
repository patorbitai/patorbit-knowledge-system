/**
 * Activation: honest 0% match state.
 *
 * A genuinely thin profile (basics only) analyzes to 0% with every
 * requirement under "No evidence yet". The score must stay truthful, but the
 * state must explain that the profile lacks evidence and offer a primary CTA
 * ("Add experience") that routes to the master-resume editing flow, so the
 * user understands that adding REAL evidence changes the next analysis —
 * never AI-invented qualifications.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ApplicationDetailClient } from "../ApplicationDetailClient";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const RESUME_ID = "id_1790300000000_evid0";

const serverResumeDoc = {
  ...defaultResume,
  resumeId: RESUME_ID,
  name: "Thin User",
  summary: "Data enthusiast.",
  experience: [],
  skills: [],
};

const serverRecord = {
  resumeId: RESUME_ID,
  resumeName: "My Resume",
  templateId: "modern-clean",
  careerStage: "working-professional",
  resume: serverResumeDoc,
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function makeApp(overrides: Record<string, unknown> = {}) {
  return {
    applicationId: "app_zero_1",
    title: "Data Engineer",
    companyName: "Acme",
    jobDescription: "Requirements: Python, SQL, data pipelines, orchestration.",
    status: "saved",
    resumeId: RESUME_ID as string | null,
    matchScore: null as number | null,
    matchData: null as unknown,
    jobUrl: null,
    location: null,
    employmentType: null,
    appliedDate: null,
    followUpDate: null,
    notes: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

type App = ReturnType<typeof makeApp>;
let currentApp: App;

function makeFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    const ok = (payload: unknown) => ({ ok: true, status: 200, json: async () => payload });

    if (method === "GET" && url.replace(/\?.*$/, "") === "/api/resumes") {
      return ok({ resumes: [serverRecord] });
    }
    const resumeMatch = url.match(/^\/api\/resumes\/([^/?]+)$/);
    if (method === "GET" && resumeMatch) {
      return ok({ resume: { ...serverResumeDoc, resumeId: resumeMatch[1] } });
    }
    if (url.startsWith("/api/applications/app_zero_1")) {
      if (url.endsWith("/events")) return ok({ events: [] });
      if (method === "PATCH") {
        currentApp = { ...currentApp, ...(body as object) } as App;
        return ok(currentApp);
      }
      return ok(currentApp);
    }
    return ok({});
  });
}

async function flush(times = 8) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
}

let container: HTMLDivElement;
let root: Root | undefined;

async function render(app: App) {
  currentApp = app;
  container = document.createElement("div");
  document.body.appendChild(container);
  const created = createRoot(container);
  root = created;
  await act(async () => {
    created.render(<ApplicationDetailClient application={currentApp} userName="Test" />);
  });
  await flush();
}

function cta(): HTMLElement | null {
  return container.querySelector('[data-testid="zero-evidence-cta"]');
}

describe("ApplicationDetailClient — honest 0% match state (§activation)", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", makeFetchMock());
    useResumeBuilder.setState({
      resumes: [{ ...defaultResume, resumeId: "id_local", resumeName: "My Resume" }],
      activeResumeId: "id_local",
      resume: { ...defaultResume, resumeId: "id_local" },
      styleConfigs: {},
    });
    document.body.innerHTML = "";
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root!.unmount();
      });
    }
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("0% keeps the truthful score and offers the Add experience CTA", async () => {
    await render(
      makeApp({
        matchScore: 0,
        matchData: { matched: [], partial: [], missing: ["Python", "SQL", "Orchestration"] },
      }),
    );

    // Score is NOT softened or hidden.
    expect(container.textContent).toContain("0% match");
    // Evidence-honesty section still present.
    expect(container.textContent).toContain("No evidence yet");

    const block = cta();
    expect(block).not.toBeNull();
    expect(block!.textContent).toContain("no evidence for these requirements");
    expect(block!.textContent).toContain("not that you are unqualified");
    expect(block!.textContent).toContain("Patorbit will not add qualifications you don't have");

    const link = block!.querySelector("a") as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    expect(link!.getAttribute("href")).toBe("/resume-builder");
    expect(link!.textContent).toContain("Add experience");
  });

  it("no CTA when the analysis is not 0% (score preserved both ways)", async () => {
    await render(
      makeApp({
        matchScore: 79,
        matchData: { matched: ["Python", "SQL"], partial: ["Docker"], missing: ["Kubernetes"] },
      }),
    );

    expect(cta()).toBeNull();
    expect(container.textContent).toContain("79% match");
    expect(container.textContent).toContain("Strong matches");
  });

  it("no CTA before any analysis exists", async () => {
    await render(makeApp());
    expect(cta()).toBeNull();
  });
});
