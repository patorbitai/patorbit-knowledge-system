"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { Passport } from "../Passport";
import { createMinimalResume } from "@/services/__tests__/fixtures";

describe("Public Professional Passport (P-04)", () => {
  it("excludes email and phone from public display", () => {
    const resume = createMinimalResume("Public Passport User");
    resume.email = "secret-email@example.com";
    resume.phone = "+1-555-999-9999";

    const html = renderToString(<Passport />);
    expect(html).not.toContain("secret-email@example.com");
    expect(html).not.toContain("+1-555-999-9999");
  });
});
