"use strict";

/**
 * §5 export gate + §7 export parity:
 *  - unsupported content BLOCKS export (no buttons, gate explains why)
 *  - resolving the finding (remove from this version) unblocks it
 *  - DOCX receives the exact CURRENT (edited) resume
 *  - the PDF print target renders the exact CURRENT (edited) resume
 *  - completed exports are captured as restorable versions (§4)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import React, { act } from "react";
import { useResumeBuilder, defaultResume } from "@/store/resume-builder";
import { ExportModal } from "../ExportModal";
import { exportToDocx } from "@/utils/export";
import {
  renderToContainer,
  click,
  findButton,
  installObserverStubs,
  setFakeScrollHeight,
} from "./gallery-test-utils";
import type { Resume, Skill } from "@/types/resume";

installObserverStubs();
setFakeScrollHeight(900);

vi.mock("@/utils/export", () => ({
  exportToDocx: vi.fn(async () => undefined),
}));

const docxMock = vi.mocked(exportToDocx);

function skill(name: string): Skill {
  return { id: `s_${name}`, name, level: "Intermediate", category: "", years: "" };
}

beforeEach(() => {
  docxMock.mockClear();
  const master: Resume = {
    ...structuredClone(defaultResume),
    resumeId: "r_master",
    resumeName: "Master Resume",
    summary: "Master summary",
    skills: [skill("Python")],
  };
  const tailored: Resume = {
    ...master,
    resumeId: "r_tailored",
    resumeName: "Master Resume — Tailored",
    summary: "Edited tailored summary",
    skills: [skill("Python"), skill("Kubernetes")],
  };
  useResumeBuilder.setState({
    resumes: [master, tailored],
    activeResumeId: "r_tailored",
    resume: structuredClone(tailored),
    lineage: {
      r_tailored: {
        sourceResumeId: "r_master",
        sourceResumeName: "Master Resume",
        tailoredAt: 1,
      },
    },
    versions: {},
    saveStatus: "saved",
    lastTailoring: null,
    hasExported: false,
    serverVersions: {},
    pendingDeletes: [],
  });
});

const get = () => useResumeBuilder.getState();

/** Export option buttons carry label + description text — substring match. */
function findButtonContaining(needle: string): HTMLButtonElement | null {
  return (
    (Array.from(document.body.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(needle),
    ) as HTMLButtonElement | undefined) ?? null
  );
}

describe("ExportModal safety gate (§5)", () => {
  it("blocks export while unsupported content exists, and explains why", () => {
    const { container, unmount } = renderToContainer(
      <ExportModal open onClose={() => {}} />,
    );

    const gate = container.querySelector('[data-testid="export-safety-gate"]');
    expect(gate).not.toBeNull();
    expect(gate!.textContent).toContain(
      "Resolve unsupported changes before exporting",
    );
    expect(gate!.textContent).toContain("Kubernetes");
    expect(gate!.textContent).toContain("cannot be exported as fact");

    // NO export affordances while blocked
    expect(findButtonContaining("Print / Save as PDF")).toBeNull();
    expect(findButtonContaining("DOCX")).toBeNull();
    // …but the resolution paths ARE offered
    expect(findButton("Remove from this version")).toBeTruthy();
    unmount();
  });

  it("unblocks after 'Remove from this version' and exports the edited state", async () => {
    const onClose = vi.fn();
    const { container, unmount } = renderToContainer(
      <ExportModal open onClose={onClose} />,
    );
    expect(
      container.querySelector('[data-testid="export-safety-gate"]'),
    ).not.toBeNull();
    expect(
      findButton("Remove from this version"),
    ).toBeTruthy();

    // Resolve the single finding.
    click(findButton("Remove from this version"));
    expect(container.querySelector('[data-testid="export-safety-gate"]')).toBeNull();
    expect(get().resume.skills?.map((s) => s.name)).toEqual(["Python"]);

    // Export buttons are back.
    expect(findButtonContaining("Print / Save as PDF")).not.toBeNull();
    expect(findButtonContaining("DOCX")).not.toBeNull();
    click(findButtonContaining("DOCX"));
    await act(async () => {});

    // DOCX got the EXACT current (edited) resume — untouched summary.
    expect(docxMock).toHaveBeenCalledTimes(1);
    const exported = docxMock.mock.calls[0][0] as Resume;
    expect(exported.summary).toBe("Edited tailored summary");
    expect(exported.resumeId).toBe("r_tailored");
    expect(onClose).toHaveBeenCalled();

    // §4 — completed export captured as a restorable version.
    const rows = get().versions["r_tailored"];
    expect(rows[0]).toMatchObject({
      kind: "export",
      label: "Exported DOCX",
    });
    expect(rows[0].meta).toEqual({ format: "docx" });
    unmount();
  });

  it("PDF print target renders the current edited content", async () => {
    const { unmount } = renderToContainer(
      <ExportModal open onClose={() => {}} />,
    );
    // resolve the finding first so the button exists
    click(findButton("Remove from this version"));

    click(findButtonContaining("Print / Save as PDF"));

    // print target mounts as soon as isPrinting flips
    const target = document.querySelector("#pdf-export-target");
    expect(target).not.toBeNull();
    expect(target!.textContent).toContain("Edited tailored summary");
    expect(target!.textContent).toContain("Python");

    // §4 — pdf export version captured
    expect(get().versions["r_tailored"][0]).toMatchObject({
      kind: "export",
      label: "Exported PDF",
    });

    // flush the triple-rAF print callbacks so nothing leaks past the test
    await act(async () => {
      for (let i = 0; i < 4; i++) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    });
    unmount();
  });
});
