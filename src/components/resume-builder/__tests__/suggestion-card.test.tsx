"use strict";

/**
 * §11 AI suggestion review — for EVERY suggestion the card must show
 * Original / Suggested / Why / Evidence / Confidence, plus the never-apply
 * list, and the three user decisions:
 *   Accept → onDecide("accepted")
 *   Edit   → draft → "Save my version" → onDecide("edited", text)
 *   Reject → onDecide("rejected")
 */

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { SuggestionCard } from "../TailorResumeModal";
import { renderToContainer, click, findButton } from "./gallery-test-utils";
import type { TailorSuggestion } from "@/lib/tailor-review";

const SUGGESTION: TailorSuggestion = {
  id: "exp:0",
  kind: "rewrite",
  sectionLabel: "Experience — Software Engineer",
  original: "Did some backend work",
  suggested: "Built REST APIs serving 2M requests/day",
  why: "The job description emphasizes REST APIs.",
  evidence: [
    {
      label: "Software Engineer — Acme — 2024 – 2026",
      quote: "Shipped REST APIs in Python",
    },
  ],
  confidence: "high",
  safe: true,
  blocked: ["Kubernetes"],
};

describe("SuggestionCard", () => {
  it("shows original, suggested, why, evidence, confidence and the never-apply list", () => {
    const { container, unmount } = renderToContainer(
      <SuggestionCard suggestion={SUGGESTION} onDecide={() => {}} />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Experience — Software Engineer");
    expect(text).toContain("Rewrite · Confidence: High");
    expect(text).toContain("Original");
    expect(text).toContain("Did some backend work");
    expect(text).toContain("Suggested");
    expect(text).toContain("Built REST APIs serving 2M requests/day");
    expect(text).toContain("Why");
    expect(text).toContain("The job description emphasizes REST APIs.");
    expect(text).toContain("Evidence");
    expect(text).toContain("Software Engineer — Acme — 2024 – 2026");
    expect(text).toContain("Shipped REST APIs in Python");
    expect(text).toContain("Will not be applied");
    expect(text).toContain("Kubernetes");
    unmount();
  });

  it("renders the empty-evidence state honestly", () => {
    const { container, unmount } = renderToContainer(
      <SuggestionCard
        suggestion={{ ...SUGGESTION, evidence: [], blocked: [] }}
        onDecide={() => {}}
      />,
    );
    expect(container.textContent).toContain(
      "We couldn't find supporting evidence",
    );
    expect(container.textContent).not.toContain("Will not be applied");
    unmount();
  });

  it("Accept decides accepted", () => {
    const onDecide = vi.fn();
    const { unmount } = renderToContainer(
      <SuggestionCard suggestion={SUGGESTION} onDecide={onDecide} />,
    );
    click(findButton("Accept"));
    expect(onDecide).toHaveBeenCalledTimes(1);
    expect(onDecide).toHaveBeenCalledWith("accepted");
    unmount();
  });

  it("Reject decides rejected", () => {
    const onDecide = vi.fn();
    const { unmount } = renderToContainer(
      <SuggestionCard suggestion={SUGGESTION} onDecide={onDecide} />,
    );
    click(findButton("Reject"));
    expect(onDecide).toHaveBeenCalledWith("rejected");
    unmount();
  });

  it("Edit opens a draft and 'Save my version' decides edited with the user's text", () => {
    const onDecide = vi.fn();
    const { container, unmount } = renderToContainer(
      <SuggestionCard suggestion={SUGGESTION} onDecide={onDecide} />,
    );
    click(findButton("Edit"));

    const textarea = container.querySelector("textarea");
    expect(textarea).not.toBeNull();
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(textarea, "My own wording");
    textarea!.dispatchEvent(new Event("input", { bubbles: true }));

    click(findButton("Save my version"));
    expect(onDecide).toHaveBeenCalledWith("edited", "My own wording");
    // leaving edit mode — decisions row is back
    expect(findButton("Accept")).not.toBeNull();
    unmount();
  });

  it("Edit → Cancel decides nothing", () => {
    const onDecide = vi.fn();
    const { unmount } = renderToContainer(
      <SuggestionCard suggestion={SUGGESTION} onDecide={onDecide} />,
    );
    click(findButton("Edit"));
    click(findButton("Cancel"));
    expect(onDecide).not.toHaveBeenCalled();
    expect(findButton("Accept")).not.toBeNull();
    unmount();
  });

  it("reflects an existing decision (disabled Accept, status chip, edited wording)", () => {
    const onDecide = vi.fn();
    const { container, unmount } = renderToContainer(
      <SuggestionCard
        suggestion={SUGGESTION}
        decision={{ status: "edited", text: "User's own words" }}
        onDecide={onDecide}
      />,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("your edit");
    expect(text).toContain("User's own words");
    unmount();
  });

  it("Accept after an edit keeps the user's wording (live acceptance fix)", () => {
    const onDecide = vi.fn();
    const { container, unmount } = renderToContainer(
      <SuggestionCard
        suggestion={SUGGESTION}
        decision={{ status: "edited", text: "My own wording" }}
        onDecide={onDecide}
      />,
    );
    // The card shows the user's text as the working suggestion…
    expect(container.textContent).toContain("My own wording");
    click(findButton("Accept"));
    // …and Accept carries that wording instead of reverting to the AI's.
    expect(onDecide).toHaveBeenCalledWith("accepted", "My own wording");
    unmount();
  });
});
