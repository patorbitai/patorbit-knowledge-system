"use strict";

import { describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { Passport } from "../Passport";
import { PassportShareControl } from "../PassportShareControl";
import { useResumeBuilder } from "@/store/resume-builder";
import { createMinimalResume } from "@/services/__tests__/fixtures";

describe("Public Professional Passport (P-04)", () => {
  beforeEach(() => {
    useResumeBuilder.getState().resetResume();
  });
  it("excludes email and phone from public display", () => {
    const resume = createMinimalResume("Public Passport User");
    resume.email = "secret-email@example.com";
    resume.phone = "+1-555-999-9999";

    const html = renderToString(<Passport />);
    expect(html).not.toContain("secret-email@example.com");
    expect(html).not.toContain("+1-555-999-9999");
  });

  it("renders valid public Passport content correctly", () => {
    const resume = createMinimalResume("Verified Professional");
    resume.title = "Principal Engineer";
    const html = renderToString(<Passport resumeProp={resume} />);
    expect(html).toContain("Verified Professional");
    expect(html).toContain("Principal Engineer");
    expect(html).toContain("Career Snapshot");
    expect(html).toContain("Professional Trust");
    expect(html).toContain("Professional Highlights");
  });

  it("ensures public Passport is strictly read-only with no edit inputs", () => {
    const html = renderToString(<Passport />);
    expect(html).not.toContain("<input");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("contentEditable");
  });

  it("excludes private evidence contents and internal IDs from public rendering", () => {
    const html = renderToString(<Passport />);
    expect(html).not.toContain("db_id_");
    expect(html).not.toContain("private-blob-content");
  });
});

describe("Passport QR Code Generation (P-03)", () => {
  it("renders share control with QR label instructions", () => {
    const html = renderToString(<PassportShareControl />);
    expect(html).toContain("Professional Passport Share Link &amp; QR Code");
    expect(html).toContain("Enable Public Share");
  });
});
