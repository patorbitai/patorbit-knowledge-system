/**
 * C6 — Client-side Write-Back Service
 *
 * Provides debounced, ordered save of local resume data to the server.
 * Uses optimistic locking (baseVersion) to detect conflicts.
 *
 * Architecture:
 *   Local Zustand → saveLocalResumeToServer() → PUT /api/resumes/:resumeId
 *   On 200: update serverVersion in store
 *   On 409: expose conflict state (do NOT overwrite local)
 */

import { useResumeBuilder } from "@/store/resume-builder";

/** Pending save operations keyed by resumeId. Only the latest per resume is sent. */
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
const SAVE_DEBOUNCE_MS = 1500;

/**
 * Save the current local resume to the server.
 * Called internally by the debounced mechanism.
 */
export async function saveLocalResumeToServer(): Promise<void> {
  const state = useResumeBuilder.getState();
  const { resume, activeResumeId, serverVersions } = state;

  if (!activeResumeId || !resume.resumeId) return;

  // Set saving status
  state.setSaveStatus("saving");

  const baseVersion = serverVersions[resume.resumeId] ?? 0;

  try {
    const res = await fetch(`/api/resumes/${resume.resumeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId: resume.resumeId,
        resumeName: resume.resumeName || resume.name || "My Resume",
        templateId: resume.templateId,
        careerStage: resume.careerStage,
        resume,
        baseVersion: baseVersion > 0 ? baseVersion : undefined,
      }),
    });

    if (res.status === 409) {
      // Conflict — server version is newer. Do NOT overwrite local.
      const body = await res.json().catch(() => ({}));
      const serverVersion = (body as { currentVersion?: number }).currentVersion ?? baseVersion;
      useResumeBuilder.setState({
        writeConflict: { resumeId: resume.resumeId, serverVersion },
        saveStatus: "unsaved",
      });
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
      console.error("[write-back] Save failed:", msg);
      state.setSaveStatus("sync-failed");
      return;
    }

    const data = await res.json() as { version?: number; resumeId?: string };

    // Success — update server version, mark saved
    if (data.version !== undefined) {
      state.setServerVersion(resume.resumeId, data.version);
    }
    state.setSaveStatus("saved");
  } catch (err) {
    console.error("[write-back] Network error:", err);
    state.setSaveStatus("offline");
  }
}

/**
 * Debounced save — waits for the user to stop editing, then saves.
 * Only the latest edit per resume is sent (older pending saves are cancelled).
 */
export function debouncedSave(): void {
  const state = useResumeBuilder.getState();
  const resumeId = state.activeResumeId;
  if (!resumeId) return;

  // Cancel any pending save for this resume
  const existing = pendingSaves.get(resumeId);
  if (existing) clearTimeout(existing);

  // Set unsaved status immediately
  state.setSaveStatus("unsaved");

  // Schedule new save
  const timer = setTimeout(() => {
    pendingSaves.delete(resumeId);
    saveLocalResumeToServer();
  }, SAVE_DEBOUNCE_MS);

  pendingSaves.set(resumeId, timer);
}

/**
 * Force an immediate save (bypasses debounce).
 * Used for explicit save actions or on page unload.
 */
export async function forceSaveNow(): Promise<void> {
  const state = useResumeBuilder.getState();
  const resumeId = state.activeResumeId;
  if (resumeId) {
    const existing = pendingSaves.get(resumeId);
    if (existing) clearTimeout(existing);
    pendingSaves.delete(resumeId);
  }
  await saveLocalResumeToServer();
}

/**
 * Cancel any pending debounced save for a specific resume.
 */
export function cancelPendingSave(resumeId: string): void {
  const existing = pendingSaves.get(resumeId);
  if (existing) {
    clearTimeout(existing);
    pendingSaves.delete(resumeId);
  }
}

/**
 * Hook up store mutations to trigger debounced write-back.
 * Call once when the app initializes.
 */
let _hooked = false;
export function hookWriteBackToStore(): void {
  if (_hooked) return;
  _hooked = true;

  // Subscribe to store changes — trigger debounced save on any resume mutation
  useResumeBuilder.subscribe((state, prevState) => {
    // Only save when resume content actually changed
    if (state.resume === prevState.resume) return;
    // Don't save during initial hydration
    if (state.saveStatus === "saved" && prevState.saveStatus === "saved") return;
    // Don't trigger during active saving
    if (state.saveStatus === "saving") return;

    debouncedSave();
  });
}
