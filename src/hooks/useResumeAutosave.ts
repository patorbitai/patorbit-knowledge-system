"use client";

/**
 * Resume-builder autosave pipeline (extracted from the page for
 * testability).
 *
 * On every `saveStatus === "unsaved"`:
 *  - debounced "Edited" version capture      (1200ms) for §4 history —
 *    coalesced (a typing burst is one row) and content-delta checked inside
 *    pushVersion, so metadata-only saves never stack junk rows.
 *
 * M6 — editing alone NEVER triggers AI. The former passive debounced
 * analyzeResume (1500ms) and generateClaims (2500ms) calls were removed:
 * AI work now happens only through explicit user actions (copilot button,
 * section AI buttons, "Suggest claims", import), so passive typing costs
 * zero AI quota and zero /api/ai requests.
 *
 * M5B — this hook NEVER writes saveStatus. Local state changes are not
 * persistence: "Saving" starts only when the write-back actually sends a
 * request, and only a successful server response may reach "Saved"
 * (see src/lib/resume-write-back.ts).
 */
import { useCallback, useEffect } from "react";
import type { Resume } from "@/types/resume";
import { useResumeBuilder } from "@/store/resume-builder";
import { debounce } from "@/lib/debounce";

export function useResumeAutosave(): void {
  const resume = useResumeBuilder((s) => s.resume);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);

  const debouncedMarkSaved = useCallback(
    debounce(() => {
      const st = useResumeBuilder.getState();
      // §4 — record the edit as a restorable version (local history only).
      // M5B: this deliberately does NOT touch saveStatus — local history
      // capture is not server persistence; the write-back owns the status.
      st.captureVersion(st.activeResumeId, "edit", "Edited", { coalesce: true });
    }, 1200),
    [],
  );

  useEffect(() => {
    if (saveStatus === "unsaved") {
      // M5B: no local "saving"/"saved" flips here — the write-back transitions
      // the status only from real server responses (debouncedSave → saving →
      // PUT → saved | sync-failed | offline).
      debouncedMarkSaved();
    }
  }, [resume, saveStatus, debouncedMarkSaved]);
}
