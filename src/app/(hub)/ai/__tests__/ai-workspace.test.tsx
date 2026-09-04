"use strict";

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";

// Mocks required by the workspace components
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Test User" } }, status: "authenticated" }),
  signOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/ai",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
  useTheme: () => ({ theme: "dark", setTheme: vi.fn(), toggleTheme: vi.fn() }),
}));

// Mock fetch for /api/applications
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ applications: [] }),
});
vi.stubGlobal("fetch", mockFetch);

import AIWorkspaceClient from "@/components/hub/ai/AIWorkspaceClient";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import {
  renderToContainer,
  installObserverStubs,
  setFakeScrollHeight,
} from "@/components/resume-builder/__tests__/gallery-test-utils";

const USER_RESUME = {
  ...defaultResume,
  resumeId: "r1",
  resumeName: "Software Engineer Resume",
  templateId: "modern-clean",
  name: "Ada Lovelace",
  title: "Software Engineer",
  email: "ada@example.com",
  phone: "555-0100",
  summary: "Experienced software engineer.",
  experience: [
    {
      ...defaultResume.experience[0],
      id: "e1",
      company: "TechCorp",
      position: "Senior Engineer",
      startDate: "2020-01",
      endDate: "2024-01",
      bulletPoints: ["Built scalable systems"],
    },
  ],
  skills: [
    { id: "s1", name: "TypeScript", level: "Expert" as const, category: "Languages", years: "5" },
    { id: "s2", name: "React", level: "Advanced" as const, category: "Frameworks", years: "4" },
  ],
};

function seedResumes() {
  useResumeBuilder.setState({
    resumes: [USER_RESUME],
    activeResumeId: "r1",
    resume: USER_RESUME,
    styleConfigs: {},
  });
}

function seedEmpty() {
  useResumeBuilder.setState({
    resumes: [],
    activeResumeId: "",
    resume: defaultResume,
    styleConfigs: {},
  });
}

describe("AI Workspace", () => {
  beforeEach(() => {
    installObserverStubs();
    setFakeScrollHeight(900);
    document.body.innerHTML = "";
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ applications: [] }),
    });
  });

  it("shows empty state when no resumes exist", () => {
    seedEmpty();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Test" />
    );

    const heading = document.body.querySelector("h2");
    expect(heading?.textContent).toContain("No resumes yet");

    const createLink = document.body.querySelector('a[href="/resume-builder"]');
    expect(createLink).toBeTruthy();
    expect(createLink?.textContent).toContain("Create Resume");

    unmount();
  });

  it("renders the AI Workspace heading when resumes exist", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const heading = document.body.querySelector("h1");
    expect(heading?.textContent).toContain("AI Workspace");

    unmount();
  });

  it("shows resume selector with the user's resume", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const resumeName = document.body.textContent;
    expect(resumeName).toContain("Software Engineer Resume");
    expect(resumeName).toContain("1 experience");

    unmount();
  });

  it("shows the three action tabs: Score, Match, Tailor", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const text = document.body.textContent || "";
    expect(text).toContain("Resume Score");
    expect(text).toContain("Job Match");
    expect(text).toContain("Tailor Resume");

    unmount();
  });

  it("shows empty JD input area for optional job description", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const textarea = document.body.querySelector("textarea");
    expect(textarea).toBeTruthy();
    expect(textarea?.getAttribute("placeholder")).toContain("job description");

    unmount();
  });

  it("shows Score My Resume button when Score tab is active", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const scoreBtn = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.includes("Score My Resume")
    );
    expect(scoreBtn).toBeTruthy();

    unmount();
  });

  it("shows trust/factuality notice", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const trustText = document.body.textContent || "";
    expect(trustText).toContain("never invents");
    expect(trustText).toContain("explicit approval");

    unmount();
  });

  it("fetches job applications on mount", () => {
    seedResumes();
    renderToContainer(<AIWorkspaceClient userName="Ada" />);

    expect(mockFetch).toHaveBeenCalledWith("/api/applications");
  });

  it("shows job selector area when no jobs selected", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    // Before fetch resolves: shows loading state; after: shows "Select a job"
    const text = document.body.textContent || "";
    const hasJobUI = text.includes("Select a job") || text.includes("Loading jobs");
    expect(hasJobUI).toBe(true);

    unmount();
  });

  it("shows resume info chip with template name", () => {
    seedResumes();
    const { unmount } = renderToContainer(
      <AIWorkspaceClient userName="Ada" />
    );

    const text = document.body.textContent || "";
    // modern-clean template resolves to name "Professional"
    expect(text).toContain("Professional");

    unmount();
  });
});
