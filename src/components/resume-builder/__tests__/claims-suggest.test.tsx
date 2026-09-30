/**
 * M6 — claims generation is EXPLICIT ONLY (checks 13 + 14):
 *
 *  13: no request happens until the user clicks "Suggest claims";
 *      one activation = exactly one request
 *  14: a failed generation renders an error — never a success state
 *      (no suggestions appear, no "AI detected N claims" header)
 *
 * The passive debounced generateClaims call was removed from
 * useResumeAutosave; this covers the replacement launcher in ClaimsReview.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { renderToContainer, installObserverStubs } from "./gallery-test-utils";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";

installObserverStubs();

const { generateClaimsMock } = vi.hoisted(() => ({
  generateClaimsMock: vi.fn(),
}));

vi.mock("@/lib/ai/client", () => ({
  ai: { generateClaims: (...args: unknown[]) => generateClaimsMock(...args) },
  notifyAiUsageChanged: vi.fn(),
  onAiUsageChanged: vi.fn(() => () => {}),
  setQuotaExhaustedHandler: vi.fn(() => () => {}),
  classifyAiFailure: vi.fn(() => "error"),
}));

import { ClaimsReview } from "@/components/resume-builder/ClaimsReview";

const SUGGESTION = {
  assertionText: "Shipped a billing service handling 1M requests/day.",
  claimType: "Achievement" as const,
  sourceActivityId: "experience-0",
  confidence: 0.9,
  reasoning: "From resume bullet",
};

let rendered: { unmount: () => void } | null = null;

function render() {
  rendered = renderToContainer(<ClaimsReview />);
  return rendered;
}

const button = () =>
  Array.from(document.querySelectorAll("button")).find(
    (b) => b.textContent?.includes("Suggest claims") || b.textContent?.includes("Suggesting"),
  ) ?? null;

const alert = () => document.querySelector('[role="alert"]');

beforeEach(() => {
  vi.clearAllMocks();
  useResumeBuilder.setState({
    suggestedClaims: [],
    resume: { ...structuredClone(defaultResume) },
  });
});

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

async function clickSuggest(times = 1) {
  for (let i = 0; i < times; i++) {
    const btn = button();
    if (!btn) throw new Error("Suggest claims button not found");
    await act(async () => {
      (btn as HTMLElement).click();
      await Promise.resolve();
    });
  }
}

describe("ClaimsReview — explicit Suggest claims (checks 13 + 14)", () => {
  it("renders the launcher with NO request on mount (check 13)", () => {
    render();
    expect(button()).not.toBeNull();
    expect(generateClaimsMock).not.toHaveBeenCalled();
  });

  it("one activation = exactly one request (check 13)", async () => {
    generateClaimsMock.mockResolvedValue({ claims: [SUGGESTION] });
    render();
    await clickSuggest();
    expect(generateClaimsMock).toHaveBeenCalledTimes(1);
  });

  it("double-clicking while in flight does not fire a second request (check 13)", async () => {
    let resolve!: (v: unknown) => void;
    generateClaimsMock.mockImplementation(
      () => new Promise((r) => { resolve = r; }),
    );
    render();

    // First click starts the request (button becomes disabled/aria-busy).
    await act(async () => {
      (button() as HTMLElement).click();
      await Promise.resolve();
    });
    expect(generateClaimsMock).toHaveBeenCalledTimes(1);

    // A second activation attempt while pending is ignored by the guard.
    const btn = button();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
    await act(async () => {
      (btn as HTMLElement).click();
      await Promise.resolve();
    });
    expect(generateClaimsMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve({ claims: [SUGGESTION] });
      await Promise.resolve();
    });
  });

  it("shows suggestions only AFTER a successful explicit activation", async () => {
    generateClaimsMock.mockResolvedValue({ claims: [SUGGESTION] });
    render();
    expect(document.body.textContent).not.toContain("AI detected");

    await clickSuggest();

    expect(document.body.textContent).toContain("AI detected 1 new claim");
    expect(document.body.textContent).toContain(SUGGESTION.assertionText);
  });

  it("failed generation renders an error, never a success state (check 14)", async () => {
    generateClaimsMock.mockRejectedValue(new Error("Monthly AI generation limit reached for Free tier."));
    render();

    await clickSuggest();

    // error is visible…
    expect(alert()).not.toBeNull();
    expect(alert()?.textContent).toContain("Monthly AI generation limit reached");
    // …and NO success/suggestion UI appeared
    expect(document.body.textContent).not.toContain("AI detected");
    expect(useResumeBuilder.getState().suggestedClaims).toHaveLength(0);
  });

  it("empty result is reported truthfully (no fake success)", async () => {
    generateClaimsMock.mockResolvedValue({ claims: [] });
    render();

    await clickSuggest();

    expect(alert()).not.toBeNull();
    expect(alert()?.textContent).toContain("No new claim suggestions");
    expect(document.body.textContent).not.toContain("AI detected");
  });

  it("the error clears on the next activation (no sticky failure)", async () => {
    generateClaimsMock
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ claims: [SUGGESTION] });
    render();

    await clickSuggest();
    expect(alert()).not.toBeNull();

    await clickSuggest();
    expect(alert()).toBeNull();
    expect(document.body.textContent).toContain("AI detected 1 new claim");
  });
});
