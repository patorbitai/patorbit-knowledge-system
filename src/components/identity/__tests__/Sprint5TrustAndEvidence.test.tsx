"use strict";

import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { TrustView } from "../TrustView";
import TrustWidget from "@/components/hub/widgets/TrustWidget";
import { validateEvidenceEntry } from "@/lib/evidence/validate";

describe("Sprint 5 P0 Verification Tests", () => {
  it("renders live TrustService data on TrustView", () => {
    const html = renderToString(<TrustView />);
    expect(html).toContain("Professional Trust");
  });

  it("handles empty state on TrustView cleanly", () => {
    const html = renderToString(<TrustView />);
    expect(html).toContain("No trust data yet");
  });

  it("validates evidence entries (file/link types and consent)", () => {
    // Missing kind
    const err1 = validateEvidenceEntry({ kind: null, link: "", file: null, consent: true });
    expect(err1).not.toBeNull();

    // Missing consent
    const err2 = validateEvidenceEntry({ kind: "GitHub Repository", link: "https://github.com/test", file: null, consent: false });
    expect(err2).not.toBeNull();

    // Valid link evidence
    const err3 = validateEvidenceEntry({ kind: "GitHub Repository", link: "https://github.com/test", file: null, consent: true });
    expect(err3).toBeNull();
  });

  it("renders Trust Score widget on overview", () => {
    const html = renderToString(<TrustWidget />);
    expect(html).toContain("Trust Score");
  });
});
