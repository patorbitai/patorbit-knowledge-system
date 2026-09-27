"use strict";

/**
 * M5B — save-state UI truthfulness:
 *  - SaveStatusIndicator distinguishes Unsaved / Saving / Saved / Save
 *    failed / Offline / Conflict with persistence-explaining titles
 *  - a 409 conflict derives its own display from `writeConflict`
 *  - failures expose an explicit, labelled, keyboard-focusable Retry
 *  - browser offline/online events never overwrite the underlying save
 *    state (recovery lives in the write-back)
 *  - the mobile pill carries the full truth (failure/offline/conflict were
 *    previously all lumped into "Unsaved changes")
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { SaveStatusIndicator } from "../SaveStatusIndicator";
import { ResumeContextBar } from "../ResumeContextBar";
import {
  renderToContainer,
  click,
  installObserverStubs,
  type Rendered,
} from "./gallery-test-utils";

installObserverStubs();

const { mockRetry } = vi.hoisted(() => ({ mockRetry: vi.fn(async () => undefined) }));

vi.mock("@/lib/resume-write-back", () => ({
  retryFailedSave: mockRetry,
  cancelSaveRetry: vi.fn(),
}));

function baseResume() {
  return {
    ...structuredClone(defaultResume),
    resumeId: "r1",
    resumeName: "R1",
    summary: "Baseline",
  };
}

let rendered: Rendered | null = null;

beforeEach(() => {
  mockRetry.mockClear();
  const r1 = baseResume();
  useResumeBuilder.setState({
    resumes: [r1],
    resume: r1,
    activeResumeId: "r1",
    saveStatus: "saved",
    lastSaveError: null,
    pendingSyncIds: [],
    serverVersions: {},
    writeConflict: null,
    versions: {},
    lineage: {},
    pendingDeletes: [],
    hydrated: true,
  });
});

afterEach(() => {
  rendered?.unmount();
  rendered = null;
});

const st = () => useResumeBuilder.getState();

const renderIndicator = () => {
  rendered = renderToContainer(<SaveStatusIndicator />);
  // renderToContainer wraps in its own div — the component root carries the
  // data-save-status / role attributes.
  return rendered.container.firstElementChild as HTMLElement;
};

describe("SaveStatusIndicator states", () => {
  it("shows Saved only for the server-confirmed state, with a cloud-truth title", () => {
    const el = renderIndicator();
    expect(el.getAttribute("data-save-status")).toBe("saved");
    expect(el.textContent).toContain("Saved");
    expect(el.getAttribute("title")).toContain("server confirmed");
    expect(el.textContent).not.toContain("Retry");
  });

  it("distinguishes Unsaved local changes from Saving", () => {
    useResumeBuilder.setState({ saveStatus: "unsaved" });
    let el = renderIndicator();
    expect(el.getAttribute("data-save-status")).toBe("unsaved");
    expect(el.textContent).toContain("Unsaved changes");
    expect(el.getAttribute("title")).toContain("not yet confirmed by the server");
    rendered?.unmount();

    useResumeBuilder.setState({ saveStatus: "saving" });
    el = renderIndicator();
    expect(el.getAttribute("data-save-status")).toBe("saving");
    expect(el.textContent).toContain("Saving");
    expect(el.getAttribute("title")).toContain("Sending your latest changes");
  });

  it("shows Save failed with the server's reason and an accessible Retry action", () => {
    useResumeBuilder.setState({
      saveStatus: "sync-failed",
      lastSaveError: "Free plan allows up to 2 resumes.",
    });
    const el = renderIndicator();

    expect(el.getAttribute("data-save-status")).toBe("sync-failed");
    expect(el.textContent).toContain("Save failed");
    expect(el.textContent).toContain("Free plan allows up to 2 resumes.");
    // The failure detail (server reason) is what the title surfaces.
    expect(el.getAttribute("title")).toContain("Free plan allows up to 2 resumes.");

    // G: announced + keyboard reachable + labelled.
    expect(el.getAttribute("role")).toBe("status");
    expect(el.getAttribute("aria-live")).toBe("polite");
    const retry = el.querySelector('button[aria-label="Retry save"]');
    expect(retry).not.toBeNull();
    (retry as HTMLElement).focus();
    expect(document.activeElement).toBe(retry);

    click(retry as HTMLElement);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it("shows Offline (with Retry) for a connectivity failure", () => {
    useResumeBuilder.setState({ saveStatus: "offline" });
    const el = renderIndicator();
    expect(el.getAttribute("data-save-status")).toBe("offline");
    expect(el.textContent).toContain("Offline");
    expect(el.getAttribute("title")).toContain("No connection");
    expect(el.querySelector('button[aria-label="Retry save"]')).not.toBeNull();
  });

  it("derives Conflict from writeConflict — without bypassing the conflict workflow", () => {
    useResumeBuilder.setState({
      saveStatus: "unsaved",
      writeConflict: {
        resumeId: "r1",
        localResume: baseResume(),
        serverResume: baseResume(),
        localBaseVersion: 3,
        serverVersion: 4,
      },
    });
    const el = renderIndicator();
    expect(el.getAttribute("data-save-status")).toBe("conflict");
    expect(el.textContent).toContain("Conflict");
    expect(el.getAttribute("title")).toContain("newer version");
    // The conflict itself stays intact for the resolution modal.
    expect(st().writeConflict).not.toBeNull();
    // Conflict is resolved via its own modal, not a blind retry.
    expect(el.querySelector('button[aria-label="Retry save"]')).toBeNull();
  });

  it("browser offline/online events never overwrite the underlying save state", () => {
    useResumeBuilder.setState({ saveStatus: "sync-failed", lastSaveError: "nope" });
    const el = renderIndicator();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    // Display may reflect connectivity… (re-render via fresh render call)
    // …but the STORE must still hold the failure truth:
    expect(st().saveStatus).toBe("sync-failed");
    expect(st().lastSaveError).toBe("nope");

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(st().saveStatus).toBe("sync-failed"); // no fake "unsaved"/"saved"
    expect(el.getAttribute("aria-live")).toBe("polite");
  });
});

describe("mobile save pill (ResumeContextBar)", () => {
  const pillText = (container: HTMLElement) =>
    container.querySelector('[data-testid="mobile-save-state"]')?.textContent ?? "";

  it("shows Save failed + Retry on the mobile pill (was: all failures read 'Unsaved changes')", () => {
    useResumeBuilder.setState({ saveStatus: "sync-failed", lastSaveError: "nope" });
    const { container, unmount } = renderToContainer(<ResumeContextBar />);
    const pill = container.querySelector(
      '[data-testid="mobile-save-state"]',
    ) as HTMLElement;

    expect(pillText(container)).toContain("Save failed");
    expect(pill.getAttribute("data-save-status")).toBe("sync-failed");
    expect(pill.getAttribute("role")).toBe("status");

    const retry = pill.querySelector('button[aria-label="Retry save"]');
    expect(retry).not.toBeNull();
    click(retry as HTMLElement);
    expect(mockRetry).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("shows Offline and Conflict distinctly on the mobile pill", () => {
    useResumeBuilder.setState({ saveStatus: "offline" });
    let { container, unmount } = renderToContainer(<ResumeContextBar />);
    expect(pillText(container)).toContain("Offline");
    unmount();

    useResumeBuilder.setState({
      saveStatus: "unsaved",
      writeConflict: {
        resumeId: "r1",
        localResume: baseResume(),
        serverResume: baseResume(),
        serverVersion: 4,
      },
    });
    ({ container, unmount } = renderToContainer(<ResumeContextBar />));
    expect(pillText(container)).toContain("Conflict");
    expect(
      container
        .querySelector('[data-testid="mobile-save-state"]')
        ?.getAttribute("data-save-status"),
    ).toBe("conflict");
    unmount();
  });

  it("still reads Saved for the confirmed state (existing contract)", () => {
    const { container, unmount } = renderToContainer(<ResumeContextBar />);
    expect(pillText(container)).toContain("Saved");
    expect(
      container.querySelector('button[aria-label="Retry save"]'),
    ).toBeNull();
    unmount();
  });
});
