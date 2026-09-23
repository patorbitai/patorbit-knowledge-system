"use strict";

/**
 * §4 version history UI — the panel lists every recorded version for the
 * ACTIVE resume (newest first) and restores behind a confirmation:
 *  - content is rolled back
 *  - identity (resumeId/resumeName) is preserved
 *  - a "Before restore" undo point is captured first
 *  - the empty state explains what history is and when it appears
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { VersionHistoryPanel } from "../VersionHistoryPanel";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
} from "./gallery-test-utils";

installObserverStubs();

beforeEach(() => {
  const r1 = {
    ...structuredClone(defaultResume),
    resumeId: "r1",
    resumeName: "Jane Resume",
    summary: "Original summary",
  };
  useResumeBuilder.setState({
    resumes: [structuredClone(r1)],
    activeResumeId: "r1",
    resume: structuredClone(r1),
    lineage: {},
    versions: {},
    saveStatus: "saved",
    serverVersions: {},
    pendingDeletes: [],
  });
});

function captureHistory(): void {
  const st = useResumeBuilder.getState();
  st.captureVersion("r1", "original", "Imported resume");
  st.updateField("summary", "Edited summary");
  st.captureVersion("r1", "edit", "Edited", { coalesce: true });
  st.captureVersion("r1", "tailored", "Tailored for Software Engineer", {
    meta: { accepted: 3, edited: 1, rejected: 0, blocked: 2 },
  });
}

const rows = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll('[data-testid="version-history-panel"] li'),
  );

describe("VersionHistoryPanel", () => {
  it("explains itself when there is no history yet", () => {
    const { container, unmount } = renderToContainer(
      <VersionHistoryPanel open onClose={() => {}} />,
    );
    expect(container.textContent).toContain("No versions recorded yet");
    expect(container.textContent).toContain(
      "Versions appear when you import, tailor, edit or export",
    );
    expect(rows(container)).toHaveLength(0);
    unmount();
  });

  it("lists versions newest-first with kind labels and decision meta", () => {
    captureHistory();
    const { container, unmount } = renderToContainer(
      <VersionHistoryPanel open onClose={() => {}} />,
    );

    const items = rows(container);
    expect(items).toHaveLength(3);
    // newest first
    expect(items[0].textContent).toContain("Tailored for Software Engineer");
    expect(items[0].textContent).toContain("Tailored");
    expect(items[0].textContent).toContain(
      "3 accepted · 1 edited · 2 blocked",
    );
    expect(items[1].textContent).toContain("Edited");
    expect(items[1].textContent).toContain("Edit");
    expect(items[2].textContent).toContain("Imported resume");
    expect(items[2].textContent).toContain("Original");
    unmount();
  });

  it("restores a version after confirmation, keeping identity + undo point", () => {
    captureHistory();
    // a change that has NOT been captured yet (mid-typing burst)
    useResumeBuilder.getState().updateField(
      "summary",
      "Uncaptured latest change",
    );
    useResumeBuilder.setState((s) => ({
      resume: { ...s.resume, resumeName: "Renamed by user" },
      resumes: s.resumes.map((r) =>
        r.resumeId === "r1" ? { ...r, resumeName: "Renamed by user" } : r,
      ),
    }));

    const onClose = vi.fn();
    const { container, unmount } = renderToContainer(
      <VersionHistoryPanel open onClose={onClose} />,
    );

    // Restore the ORIGINAL row (bottom of the list).
    const originalRow = rows(container).find((li) =>
      li.textContent?.includes("Imported resume"),
    );
    expect(originalRow).toBeTruthy();
    click(originalRow!.querySelector("button"));

    // Confirmation required first.
    expect(findButton("Restore version")).not.toBeNull();
    expect(container.textContent).toContain("Before restore");
    click(findButton("Restore version"));

    const st = useResumeBuilder.getState();
    // content rolled back…
    expect(st.resume.summary).toBe("Original summary");
    // …identity preserved
    expect(st.resume.resumeId).toBe("r1");
    expect(st.resume.resumeName).toBe("Renamed by user");
    // undo point captured first
    expect(st.versions["r1"][0]).toMatchObject({
      kind: "edit",
      label: "Before restore",
    });
    expect(st.versions["r1"][0].snapshot.summary).toBe(
      "Uncaptured latest change",
    );
    expect(st.versions["r1"]).toHaveLength(4);
    expect(st.saveStatus).toBe("unsaved");

    // panel re-rendered with the new rows
    expect(rows(container)).toHaveLength(4);
    unmount();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Cancel leaves everything untouched", () => {
    captureHistory();
    const before = useResumeBuilder.getState().resume.summary;
    const { container, unmount } = renderToContainer(
      <VersionHistoryPanel open onClose={() => {}} />,
    );
    const originalRow = rows(container).find((li) =>
      li.textContent?.includes("Imported resume"),
    );
    click(originalRow!.querySelector("button"));
    const cancel = Array.from(document.body.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Cancel",
    );
    click(cancel ?? null);
    expect(useResumeBuilder.getState().resume.summary).toBe(before);
    expect(useResumeBuilder.getState().versions["r1"]).toHaveLength(3);
    unmount();
  });

  it("calls onClose from the header close button", () => {
    captureHistory();
    const onClose = vi.fn();
    const { unmount } = renderToContainer(
      <VersionHistoryPanel open onClose={onClose} />,
    );
    click(findButton("Close version history"));
    expect(onClose).toHaveBeenCalledTimes(1);
    unmount();
  });
});
