"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import { createMinimalResume } from "@/services/__tests__/fixtures";

describe("Trust Share (T-11)", () => {
  it("renders TrustView with share control options", () => {
    const resume = createMinimalResume("Share Test User");
    const html = renderToString(<TrustView resume={resume} />);
    expect(html).toContain("Public Trust Share Link");
    expect(html).toContain("Enable Public Share");
  });
});
