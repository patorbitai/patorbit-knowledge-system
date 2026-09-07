"use strict";

import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { FreeJDAnalysis } from "../FreeJDAnalysis";

// ── Test fixtures ──────────────────────────────────────────────────────────

const SAMPLE_JD = `
Senior Software Engineer (FinTech)

About us:
We are a fast growing fintech company building payments infrastructure.
We value cross-functional collaboration and shipping on tight deadlines.

Requirements:
- You must have 5+ years of software engineering experience
- Strong proficiency with TypeScript and Node.js required
- Experience with AWS and Docker

Responsibilities:
- Design and build scalable payment services
- Mentor junior engineers on the team
- Collaborate with product and stakeholders

Qualifications:
- Bachelor's degree in Computer Science or equivalent
- Experience with PostgreSQL

Skills:
- React, Kafka, Kubernetes
`;

const SHORT_JD = "Too short";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("FreeJDAnalysis", () => {
  it("renders without crashing", () => {
    const html = renderToString(<FreeJDAnalysis />);
    expect(html).toContain("Analyze Job Description");
  });

  it("renders the textarea input", () => {
    const html = renderToString(<FreeJDAnalysis />);
    expect(html).toContain("Paste the job description");
  });

  it("renders empty state before analysis", () => {
    const html = renderToString(<FreeJDAnalysis />);
    expect(html).toContain("Paste a job description above");
  });

  it("does not depend on Zustand store", () => {
    // Verify component renders without any store context
    const html = renderToString(<FreeJDAnalysis />);
    expect(html).toBeDefined();
    expect(html.length).toBeGreaterThan(0);
  });

  it("has correct character count display", () => {
    const html = renderToString(<FreeJDAnalysis />);
    expect(html).toContain("characters");
  });
});

describe("FreeJDAnalysis - Page", () => {
  it("page metadata is correct", async () => {
    const { metadata } = await import("@/app/(marketing)/free-analysis/page");
    expect(metadata.title).toContain("Free Job Description Analysis");
    expect(metadata.description).toContain("Paste a job description");
  });
});
