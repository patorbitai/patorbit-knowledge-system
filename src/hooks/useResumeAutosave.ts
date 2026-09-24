"use client";

/**
 * Resume-builder autosave pipeline (extracted from the page for
 * testability).
 *
 * On every `saveStatus === "unsaved"`:
 *  - flips to "saving"
 *  - debounced AI resume analysis            (1500ms)
 *  - debounced suggested-claim generation    (2500ms)
 *  - debounced "saved" flip (1200ms) which ALSO captures an "Edited"
 *    version for §4 history — coalesced (a typing burst is one row) and
 *    content-delta checked inside pushVersion, so metadata-only saves
 *    never stack junk rows.
 */
import { useCallback, useEffect } from "react";
import type { Resume } from "@/types/resume";
import { useResumeBuilder } from "@/store/resume-builder";
import { ai } from "@/lib/ai/client";
import { debounce } from "@/lib/debounce";

export function useResumeAutosave(): void {
  const resume = useResumeBuilder((s) => s.resume);
  const saveStatus = useResumeBuilder((s) => s.saveStatus);
  const setSaveStatus = useResumeBuilder((s) => s.setSaveStatus);
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
      // §4 — record the edit as a restorable version.
      st.captureVersion(st.activeResumeId, "edit", "Edited", { coalesce: true });
      // Only flip to "saved" for the LOCAL pipeline — never clobber a
      // server-side failure (sync-failed/offline) the write-back reported.
      if (st.saveStatus === "saving" || st.saveStatus === "unsaved") {
        st.setSaveStatus("saved");
      }
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
      setSaveStatus("saving");
      debouncedAnalysis(resume);
      debouncedMarkSaved();
      debouncedClaimGen(resume);
    }
  }, [resume, saveStatus, setSaveStatus, debouncedAnalysis, debouncedMarkSaved, debouncedClaimGen]);
}
