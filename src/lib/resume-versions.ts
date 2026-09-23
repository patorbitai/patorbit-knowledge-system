"use strict";

/**
 * Resume version history — pure, store-agnostic helpers (§4 of the
 * editing/review spec).
 *
 * Captured kinds:
 *  - "original"  — created / duplicated / imported baseline
 *  - "tailored"  — the approved tailor result (carries decision counts)
 *  - "edit"      — autosaved user edits (coalesced) and explicit markers
 *                  ("Before restore", "Promoted from …")
 *  - "export"    — a completed PDF/DOCX export
 *
 * Invariants (tested):
 *  - Snapshots are deep clones — later edits never mutate a stored version.
 *  - Identical kind + label + content never stacks duplicate entries.
 *  - Autosave edits (coalesce: true) merge into the previous coalesce-edit
 *    within EDIT_COALESCE_MS so a typing burst is one history row, while
 *    explicit markers ("Before restore") are never merged away.
 *  - The list is newest-first and capped; an "original" entry is pinned so
 *    the earliest restore point always survives the cap.
 */

import type { Resume } from "@/types/resume";

export type ResumeVersionKind = "original" | "tailored" | "edit" | "export";

export interface ResumeVersion {
  id: string;
  kind: ResumeVersionKind;
  /** Human label shown in the history panel. */
  label: string;
  /** Epoch ms of capture. */
  at: number;
  /** Autosave edits may merge into a previous coalesce-edit; markers never do. */
  coalesce?: boolean;
  /** Full content snapshot at capture time. */
  snapshot: Resume;
  /** Optional decision/export counts (accepted/edited/rejected/blocked/format). */
  meta?: Record<string, number | string>;
}

export interface CaptureOptions {
  meta?: Record<string, number | string>;
  coalesce?: boolean;
}

/** Typing bursts shorter than this collapse into a single "Edited" row. */
export const EDIT_COALESCE_MS = 3 * 60_000;

/** Newest versions kept per resume; an "original" entry is always pinned. */
export const MAX_VERSIONS_PER_RESUME = 8;

let _vCounter = 0;
function versionId(): string {
  return `v_${Date.now().toString(36)}_${(++_vCounter).toString(36)}${Math
    .random()
    .toString(36)
    .slice(2, 6)}`;
}

/** Deep-cloned snapshot — callers may keep mutating their resume afterwards. */
export function makeVersion(
  kind: ResumeVersionKind,
  label: string,
  snapshot: Resume,
  opts: CaptureOptions = {},
): ResumeVersion {
  return {
    id: versionId(),
    kind,
    label,
    at: Date.now(),
    ...(opts.coalesce ? { coalesce: true } : {}),
    snapshot: structuredClone(snapshot),
    ...(opts.meta ? { meta: { ...opts.meta } } : {}),
  };
}

function sameContent(a: Resume, b: Resume): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Prepend a version (newest-first) with de-duplication, coalescing and cap.
 * Pure — returns a new array; never mutates `list`.
 */
export function pushVersion(
  list: ResumeVersion[],
  v: ResumeVersion,
  cap: number = MAX_VERSIONS_PER_RESUME,
): ResumeVersion[] {
  const last = list[0];

  // Same kind + label + content → the event is already recorded.
  if (
    last &&
    last.kind === v.kind &&
    last.label === v.label &&
    sameContent(last.snapshot, v.snapshot)
  ) {
    return list;
  }

  // An "edit" whose content matches the newest version → there is nothing
  // to restore to (autosave firing right after create / import / tailor-
  // approval, or a metadata-only change). Never stack junk rows.
  if (last && v.kind === "edit" && sameContent(last.snapshot, v.snapshot)) {
    return list;
  }

  // Coalescable edit on top of a coalescable edit within the window → merge
  // (replace the previous autosave row, keeping history readable). `at` is
  // kept from the FIRST capture of the burst so a long typing session still
  // ends — the window is measured from session start, not from the last
  // keystroke.
  if (
    v.coalesce &&
    last?.coalesce &&
    last.kind === "edit" &&
    v.kind === "edit" &&
    v.at - last.at <= EDIT_COALESCE_MS
  ) {
    return [{ ...v, at: last.at }, ...list.slice(1)];
  }

  const next = [v, ...list];
  if (next.length <= cap) return next;

  // Cap while pinning the "original" restore point (kept last / oldest).
  const original = next.find((x) => x.kind === "original");
  const others = next.filter((x) => x !== original);
  const keptOthers = others.slice(0, original ? cap - 1 : cap);
  return original ? [...keptOthers, original] : keptOthers;
}

/**
 * Content to apply when restoring `snapshot` onto the resume currently in
 * use: full snapshot content, but the live identity (resumeId/resumeName)
 * wins so the server key and the user's rename survive a restore.
 * Template validity is enforced by the caller (store) against TEMPLATES.
 */
export function restoreContent(current: Resume, snapshot: Resume): Resume {
  return {
    ...structuredClone(snapshot),
    resumeId: current.resumeId,
    resumeName: current.resumeName,
  };
}
