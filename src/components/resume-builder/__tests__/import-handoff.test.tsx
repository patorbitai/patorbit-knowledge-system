"use strict";

/**
 * End-to-end CLIENT-SIDE handoff test for resume import:
 *
 *   ImportButton.handleImport (fetch /api/import)
 *     → response.json()
 *     → setPending({ resume, meta })
 *     → ImportReviewScreen renders the IMPORTED values
 *     → click "Continue to Builder"
 *     → canonical store updated (same resumeId, template preserved)
 *     → Resume Builder reads the imported data
 *
 * This is the exact chain DevTools showed as "import request → 200 → no further
 * request". There is intentionally no second network request: the apply step is
 * a synchronous Zustand store write. The Review screen must display the API
 * response's resume — NOT the current store resume, NOT placeholders.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { act } from "react";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));
vi.mock("@/components/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));
const routerPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/resume-builder",
  useSearchParams: () => new URLSearchParams(),
}));

import { ImportButton } from "../ImportButton";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { renderToContainer, installObserverStubs, setFakeScrollHeight } from "./gallery-test-utils";
import type { Resume } from "@/types/resume";

const CURRENT_RESUME: Resume = {
  ...defaultResume,
  resumeId: "real-resume-1",
  resumeName: "My Resume",
  templateId: "executive-pro",
  name: "Alex Johnson",
  title: "Senior Software Engineer",
  email: "alex@example.com",
  summary: "Existing summary.",
  social: { linkedin: "", github: "", website: "", twitter: "", portfolio: "", stackoverflow: "" },
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  achievements: [],
  references: [],
  portfolio: [],
  careerStage: "working-professional",
  claims: [],
};

/** The shape /api/import returns (route.ts: `{ resume, meta, ... }`). */
const API_RESPONSE = {
  resume: {
    ...defaultResume,
    templateId: "template-1", // schema default — not a real template
    name: "IMPORT_TEST_USER",
    title: "IMPORT_TEST_ENGINEER",
    email: "import-test@example.com",
    summary: "IMPORT_TEST_SUMMARY",
    experience: [
      {
        id: "exp-1",
        company: "IMPORT_TEST_COMPANY",
        position: "Engineer",
        location: "",
        employmentType: "",
        industry: "",
        startDate: "",
        endDate: "",
        current: false,
        duration: "Jan 2020 – Present",
        description: "",
        achievements: "",
        techUsed: "",
        bulletPoints: [],
      },
    ],
    education: [
      { id: "edu-1", school: "IMPORT_TEST_UNIVERSITY", degree: "B.S.", year: "", field: "", gpa: "", minor: "", honors: "", activities: "", location: "" },
    ],
    skills: [{ id: "skill-1", name: "IMPORT_TEST_SKILL", level: "Intermediate", category: "", years: "" }],
    projects: [],
    certifications: [],
    languages: [],
    interests: [],
    achievements: [],
    references: [],
    portfolio: [],
    careerStage: "working-professional",
    claims: [],
  },
  meta: { path: "regex", truncated: false, charCount: 10, rawText: "raw" },
};

function seedCurrentResume(): void {
  useResumeBuilder.setState({
    resumes: [CURRENT_RESUME],
    activeResumeId: "real-resume-1",
    resume: CURRENT_RESUME,
    styleConfigs: {},
    saveStatus: "saved",
  });
}

/** Simulate selecting a file on the hidden input (jsdom has no DataTransfer). */
function dispatchFilePick(): void {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(["{}"], "import-test.json", { type: "application/json" });
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  act(() => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

/** Wait for the async import promise + the review screen's 200ms settle. */
async function flushImport(): Promise<void> {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 100));
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 250));
  });
}

function inputValues(): string[] {
  return Array.from(document.querySelectorAll("input, textarea")).map((i) => (i as HTMLInputElement).value);
}

function reviewVisible(): boolean {
  return document.body.textContent?.includes("Review Imported Resume") ?? false;
}

function clickContinue(): void {
  const btn = Array.from(document.querySelectorAll("button")).find((b) =>
    b.textContent?.includes("Continue to Builder"),
  ) as HTMLButtonElement;
  act(() => btn.click());
}

describe("client-side import handoff: fetch → review → apply → builder store", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    seedCurrentResume();
    document.body.innerHTML = "";
    routerPush.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(API_RESPONSE), { status: 200, headers: { "Content-Type": "application/json" } }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the Review screen with the API response's resume (not the store resume)", async () => {
    const { unmount } = renderToContainer(<ImportButton />);
    dispatchFilePick();
    await flushImport();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/import", expect.objectContaining({ method: "POST" }));
    expect(reviewVisible()).toBe(true);

    // The review screen shows the IMPORTED values — never the current resume
    // (Alex Johnson) and never placeholders.
    const vals = inputValues();
    expect(vals).toContain("IMPORT_TEST_USER");
    expect(vals).toContain("IMPORT_TEST_ENGINEER");
    expect(vals).toContain("import-test@example.com");
    expect(vals).not.toContain("Alex Johnson");
    unmount();
  });

  it("Continue to Builder writes the imported values into the canonical resume (same resumeId, template preserved)", async () => {
    const { unmount } = renderToContainer(<ImportButton />);
    dispatchFilePick();
    await flushImport();

    clickContinue();
    await act(async () => {});

    const state = useResumeBuilder.getState();
    const r = state.resumes.find((x) => x.resumeId === state.activeResumeId);

    expect(state.activeResumeId).toBe("real-resume-1");
    expect(r?.resumeId).toBe("real-resume-1");
    expect(r?.resumeName).toBe("My Resume");
    expect(r?.name).toBe("IMPORT_TEST_USER");
    expect(r?.title).toBe("IMPORT_TEST_ENGINEER");
    expect(r?.email).toBe("import-test@example.com");
    expect(r?.summary).toBe("IMPORT_TEST_SUMMARY");
    expect(r?.experience[0]?.company).toBe("IMPORT_TEST_COMPANY");
    expect(r?.education[0]?.school).toBe("IMPORT_TEST_UNIVERSITY");
    expect(r?.skills.map((s) => s.name)).toContain("IMPORT_TEST_SKILL");
    // The schema default must never reach the real resume.
    expect(r?.templateId).toBe("executive-pro");
    expect(r?.templateId).not.toBe("template-1");
    // Builder's live binding is the same updated object.
    expect(state.resume.name).toBe("IMPORT_TEST_USER");
    unmount();
  });

  it("does not make a second network request or unnecessary navigation — apply is a synchronous store write", async () => {
    const { unmount } = renderToContainer(<ImportButton />);
    dispatchFilePick();
    await flushImport();
    clickContinue();
    await act(async () => {});

    // Exactly one request (the import POST). No save/update request exists —
    // the apply step is the Zustand setResume write. No router.push is needed
    // because the builder is already on /resume-builder.
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(routerPush).not.toHaveBeenCalled();
    unmount();
  });
});
