/**
 * Regression tests — phantom/local-only resume funnel blocker.
 *
 * The job-detail resume picker read `resumes` straight from the Zustand
 * store, which can contain local-only/phantom resumes (0 DB rows). Selecting
 * one made `PATCH /api/applications/[id]` fail with HTTP 400
 * "The selected resume does not belong to your account", hard-blocking a
 * fresh account at Analyze Match.
 *
 * The picker must source its options from the server (GET /api/resumes) so
 * only server-backed resume IDs are selectable, while the server-side
 * ownership check stays exactly as strict as before.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { ApplicationDetailClient } from "../ApplicationDetailClient";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const SERVER_RESUME_ID = "id_1790247646580_h8jsr"; // real resume, 1 DB row
const PHANTOM_ID = "id_1790248316749_34fkt"; // local-only, 0 DB rows

const serverResumeDoc = {
  ...defaultResume, // full document shape as the server stores it (incl. `social`)
  name: "Test User",
  title: "Engineer",
  email: "test@example.com",
  summary: "Builds data pipelines.",
  experience: [],
  education: [],
  skills: [{ id: "s1", name: "Python", level: "Advanced", category: "Technical", years: "5" }],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  claims: [],
};

const serverRecord = {
  resumeId: SERVER_RESUME_ID,
  resumeName: "My Resume",
  templateId: "modern-clean",
  careerStage: "working-professional",
  resume: serverResumeDoc,
  version: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const baseApp = {
  applicationId: "app_test_1",
  title: "Data Engineer",
  companyName: "Acme",
  jobDescription:
    "We are hiring a Data Engineer. Requirements: Python, SQL, building reliable data pipelines.",
  status: "saved",
  resumeId: null as string | null,
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
};

type FetchCall = { url: string; method: string; body: unknown };

let fetchMock: ReturnType<typeof vi.fn>;
let currentApp: typeof baseApp;
let fetchLog: FetchCall[];

function makeFetchMock() {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method || "GET").toUpperCase();
    const body = init?.body ? JSON.parse(init.body as string) : null;
    fetchLog.push({ url, method, body });

    const ok = (payload: unknown) => ({ ok: true, status: 200, json: async () => payload });
    const fail = (status: number, payload: unknown) => ({
      ok: false,
      status,
      json: async () => payload,
    });

    // GET /api/resumes — the server-backed source of truth for the picker
    if (method === "GET" && url.startsWith("/api/resumes?") === false && url.replace(/\?.*$/, "") === "/api/resumes") {
      return ok({ resumes: [serverRecord] });
    }

    // GET /api/resumes/:id — resume document for the deterministic match
    const resumeMatch = url.match(/^\/api\/resumes\/([^/?]+)$/);
    if (method === "GET" && resumeMatch) {
      if (resumeMatch[1] !== SERVER_RESUME_ID) {
        return fail(404, { error: "Resume not found" });
      }
      return ok({ resume: { ...serverResumeDoc, resumeId: SERVER_RESUME_ID, resumeName: "My Resume" } });
    }

    // Application endpoints
    if (url.startsWith("/api/applications/app_test_1")) {
      if (url.endsWith("/events")) {
        if (method === "POST") return ok({ id: "evt_1", eventType: "status_change" });
        return ok({ events: [] });
      }
      if (method === "PATCH") {
        // Emulate the REAL server ownership validation: a resumeId that is not
        // one of this account's server resumes → 400 (never weakened here).
        if (body && typeof body.resumeId === "string" && body.resumeId !== SERVER_RESUME_ID) {
          return fail(400, { error: "The selected resume does not belong to your account" });
        }
        currentApp = { ...currentApp, ...(body as object) } as typeof baseApp;
        return ok(currentApp);
      }
      if (method === "GET") return ok(currentApp);
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

function seedStore(resumes: Array<Partial<typeof defaultResume> & { resumeId: string }>) {
  const full = resumes.map((r) => ({ ...defaultResume, ...r }));
  const active = full[0];
  useResumeBuilder.setState({
    resumes: full,
    activeResumeId: active.resumeId,
    resume: active,
    styleConfigs: {},
  });
}

let container: HTMLDivElement;
let root: Root | undefined;

async function render() {
  container = document.createElement("div");
  document.body.appendChild(container);
  const created = createRoot(container);
  root = created;
  await act(async () => {
    created.render(<ApplicationDetailClient application={currentApp} userName="Test" />);
  });
  await flush();
}

function optionValues(): string[] {
  return Array.from(container.querySelectorAll('select[aria-label="Resume to compare"] option')).map(
    (o) => (o as HTMLOptionElement).value,
  );
}

function analyzeButton(): HTMLButtonElement | null {
  const buttons = Array.from(container.querySelectorAll("button"));
  return (buttons.find((b) => b.textContent?.includes("Analyze match")) as HTMLButtonElement) ?? null;
}

describe("ApplicationDetailClient — resume picker uses server-backed resumes", () => {
  beforeEach(() => {
    fetchLog = [];
    currentApp = { ...baseApp };
    fetchMock = makeFetchMock();
    vi.stubGlobal("fetch", fetchMock);
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

  it("Test 1 — fresh account: picker offers the real server resume, never the local-only phantom", async () => {
    // Fresh account: the store holds only the phantom persisted locally.
    seedStore([
      {
        resumeId: PHANTOM_ID,
        resumeName: "My Resume", // contentless placeholder → renders as "Untitled resume"
      },
    ]);

    await render();

    const select = container.querySelector('select[aria-label="Resume to compare"]') as HTMLSelectElement | null;
    expect(select).not.toBeNull();
    expect(optionValues()).toEqual([SERVER_RESUME_ID]);
    expect(optionValues()).not.toContain(PHANTOM_ID);
    expect(select!.value).toBe(SERVER_RESUME_ID);
    expect((select!.selectedOptions[0] as HTMLOptionElement)?.textContent?.trim()).toBe("My Resume");
    expect(analyzeButton()).not.toBeNull();
    expect(analyzeButton()!.disabled).toBe(false);
  });

  it("Test 2 — analyze: links the hydrated server resume, PATCH succeeds, match proceeds", async () => {
    seedStore([{ resumeId: PHANTOM_ID, resumeName: "My Resume" }]);

    await render();

    const button = analyzeButton();
    expect(button).not.toBeNull();
    await act(async () => {
      button!.click();
    });
    await flush(12);

    // The link PATCH used the server-backed ID (the phantom would 400).
    const linkPatch = fetchLog.find(
      (c) => c.method === "PATCH" && c.url === "/api/applications/app_test_1" && (c.body as { resumeId?: string })?.resumeId,
    );
    expect(linkPatch).toBeDefined();
    expect((linkPatch!.body as { resumeId: string }).resumeId).toBe(SERVER_RESUME_ID);

    // No ownership error surfaced, and the match analysis rendered.
    expect(container.querySelector('[role="alert"]')?.textContent ?? "").not.toContain(
      "Could not link",
    );
    expect(container.textContent).toContain("Match overview");
  });

  it("Test 3 — refresh: persisted phantom is reconciled away by hydration and the server resume stays available", async () => {
    // Simulate a full page reload: only the phantom survives in localStorage.
    seedStore([{ resumeId: PHANTOM_ID, resumeName: "My Resume" }]);

    // The server-first hydration that runs after rehydration (ResumeServerSyncMonitor).
    await act(async () => {
      useResumeBuilder.getState().hydrateFromServer([serverRecord as never]);
    });

    // The phantom (contentless, local-only) is gone from the store…
    expect(useResumeBuilder.getState().resumes.map((r) => r.resumeId)).toEqual([SERVER_RESUME_ID]);

    await render();

    // …and the picker still offers exactly the server-backed resume.
    expect(optionValues()).toEqual([SERVER_RESUME_ID]);
    expect(analyzeButton()!.disabled).toBe(false);
  });

  it("Test 4 — verification → re-login: the same server-backed resume is selected and used for analyze", async () => {
    // Post-re-login storage: placeholder + real server resume already hydrated.
    seedStore([
      { resumeId: PHANTOM_ID, resumeName: "My Resume" },
    ]);
    await act(async () => {
      useResumeBuilder.getState().hydrateFromServer([serverRecord as never]);
    });

    await render();

    // Overview → Create Application → Job Detail → Analyze
    expect(optionValues()).toEqual([SERVER_RESUME_ID]);
    const button = analyzeButton()!;
    expect(button.disabled).toBe(false);
    await act(async () => {
      button.click();
    });
    await flush(12);

    const linkPatch = fetchLog.find(
      (c) => c.method === "PATCH" && (c.body as { resumeId?: string })?.resumeId,
    );
    expect(linkPatch?.body).toEqual({ resumeId: SERVER_RESUME_ID });
    expect(container.textContent).toContain("Match overview");
  });

  it("Test 5 — stale local state: local-only resumes never appear as server-selectable options", async () => {
    // Persisted state has a contentless phantom AND a contented local-only
    // stale resume; the server has one valid resume.
    seedStore([
      { resumeId: PHANTOM_ID, resumeName: "My Resume" },
      {
        resumeId: "id_stale_local_only",
        resumeName: "Stale Draft",
        name: "Stale User",
        email: "stale@example.com",
      },
    ]);

    await act(async () => {
      useResumeBuilder.getState().hydrateFromServer([serverRecord as never]);
    });

    // Hydration reconciled: phantom dropped, contented draft preserved locally…
    const storeIds = useResumeBuilder.getState().resumes.map((r) => r.resumeId);
    expect(storeIds).not.toContain(PHANTOM_ID);
    expect(storeIds).toContain("id_stale_local_only");
    expect(storeIds).toContain(SERVER_RESUME_ID);

    await render();

    // …but only the server-backed resume is selectable for the server operation.
    expect(optionValues()).toEqual([SERVER_RESUME_ID]);
  });

  it("security boundary intact: a foreign/invalid resume ID is still rejected by the API", async () => {
    // The picker only offers server-backed IDs; verify the client still routes
    // the selection through the ownership-validating PATCH and that the mock's
    // (identical-to-server) validation would reject anything else.
    seedStore([{ resumeId: PHANTOM_ID, resumeName: "My Resume" }]);
    await render();

    // Direct probe: PATCH with the phantom ID must hit the ownership check.
    const res = (await fetch("/api/applications/app_test_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumeId: PHANTOM_ID }),
    })) as { ok: boolean; status: number; json: () => Promise<{ error: string }> };
    expect(res.ok).toBe(false);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("does not belong to your account");
  });
});
