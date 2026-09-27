"use client";

/**
 * Resume-builder autosave pipeline (extracted from the page for
 * testability).
 *
 * On every `saveStatus === "unsaved"`:
 *  - debounced AI resume analysis            (1500ms)
 *  - debounced suggested-claim generation    (2500ms)
 *  - debounced "Edited" version capture      (1200ms) for §4 history —
 *    coalesced (a typing burst is one row) and content-delta checked inside
 *    pushVersion, so metadata-only saves never stack junk rows.
 *
 * M5B — this hook NEVER writes saveStatus. Local state changes are not
 * persistence: "Saving" starts only when the write-back actually sends a
 * request, and only a successful server response may reach "Saved"
 * (see src/lib/resume-write-back.ts).
 */
import { useCallback, useEffect } from "react";
import type { Resume } from "@/types/resume";
import { useResumeBuilder } from "@/store/resume-builder";
import { ai } from "@/lib/ai/client";
import { debounce } from "@/lib/debounce";

export function useResumeAutosave(): void {
  const resume = useResumeBuilder((s) => s.resume);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const setAnalysis = useResumeBuilder((s) => s.setAnalysis);
  const setAnalysisLoading = useResumeBuilder((s) => s.setAnalysisLoading);
  const setSuggestedClaims = useResumeBuilder((s) => s.setSuggestedClaims);

  const debouncedAnalysis = useCallback(
    debounce(async (currentResume: Resume) => {
      setAnalysisLoading(true);
      try {
        const result = await ai.analyzeResume(currentResume);
        setAnalysis(result);
      } catch {
        setAnalysis(null);
      } finally {
        setAnalysisLoading(false);
      }
    }, 1500),
    [setAnalysis, setAnalysisLoading],
  );

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

  const debouncedClaimGen = useCallback(
    debounce(async (currentResume: Resume) => {
      if (!currentResume?.name && !currentResume?.summary && currentResume?.experience?.length === 0) return;
      try {
        const result = await ai.generateClaims(currentResume, currentResume.claims);
        if (result?.claims?.length) setSuggestedClaims(result.claims);
      } catch {
        /* silent */
      }
    }, 2500),
    [setSuggestedClaims],
  );

  useEffect(() => {
    if (saveStatus === "unsaved") {
      // M5B: no local "saving"/"saved" flips here — the write-back transitions
      // the status only from real server responses (debouncedSave → saving →
      // PUT → saved | sync-failed | offline).
      debouncedAnalysis(resume);
      debouncedMarkSaved();
      debouncedClaimGen(resume);
    }
  }, [resume, saveStatus, debouncedAnalysis, debouncedMarkSaved, debouncedClaimGen]);
}
