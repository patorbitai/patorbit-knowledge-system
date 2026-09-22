"use strict";

/**
 * §1.3 regression: opening the Tailor modal from the header/copilot must
 * reuse the CURRENT job description, and no stale JD may survive a context
 * switch (different application / cleared session).
 */

import { describe, expect, it, afterEach, vi } from "vitest";
import { act } from "react";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";
import { installObserverStubs, renderToContainer } from "./gallery-test-utils";

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
});

const JD_A = "Software Engineer at Acme — Responsibilities: build APIs…";
const JD_B = "Backend Platform role at Globex — Requirements: Python…";

function jdTextarea(): HTMLTextAreaElement | null {
  return document.querySelector(
    'textarea[placeholder*="Paste the complete job description"]',
  ) as HTMLTextAreaElement | null;
}

function jdValue(): string {
  return jdTextarea()?.value ?? "";
}

describe("TailorResumeModal JD prefill", () => {
  it("prefills the JD passed from the current job context on open", () => {
    installObserverStubs();
    const { unmount } = renderToContainer(
      <TailorResumeModal open onClose={() => {}} initialJobDescription={JD_A} />,
    );
    expect(jdValue()).toBe(JD_A);
    unmount();
  });

  it("re-prefills with the NEW context after close — no stale JD leaks", () => {
    installObserverStubs();
    const r = renderToContainer(
      <TailorResumeModal open onClose={() => {}} initialJobDescription={JD_A} />,
    );
    expect(jdValue()).toBe(JD_A);

    // Close (component stays mounted, content unmounts — like the page).
    act(() => {
      r.root.render(
        <TailorResumeModal open={false} onClose={() => {}} initialJobDescription={JD_A} />,
      );
    });
    expect(jdTextarea()).toBeNull();

    // Reopen as a DIFFERENT application — must show B, never A.
    act(() => {
      r.root.render(
        <TailorResumeModal open onClose={() => {}} initialJobDescription={JD_B} />,
      );
    });
    expect(jdValue()).toBe(JD_B);
    r.unmount();
  });

  it("opens empty when the new context has no JD (cleared session)", () => {
    installObserverStubs();
    const r = renderToContainer(
      <TailorResumeModal open onClose={() => {}} initialJobDescription={JD_A} />,
    );
    expect(jdValue()).toBe(JD_A);

    act(() => {
      r.root.render(
        <TailorResumeModal open={false} onClose={() => {}} initialJobDescription={JD_A} />,
      );
    });
    act(() => {
      r.root.render(<TailorResumeModal open onClose={() => {}} />);
    });
    expect(jdValue()).toBe("");
    r.unmount();
  });
});
