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

import { useResumeBuilder, type SaveStatus } from "@/store/resume-builder";
import type { Resume, CareerStage } from "@/types/resume";
import { enqueueOfflineSave, removeOfflineEntry, getAllOfflineEntries } from "@/lib/offline-queue";

/** Valid careerStage values accepted by the server. */
const VALID_CAREER_STAGES = new Set<string>(["student", "recent-graduate", "working-professional", "manager", "freelancer"]);

/** Sanitize careerStage to a valid server value. Falls back to "working-professional". */
function sanitizeCareerStage(stage: unknown): CareerStage {
  if (typeof stage === "string" && VALID_CAREER_STAGES.has(stage)) return stage as CareerStage;
  return "working-professional";
}

/** Pending save operations keyed by resumeId. Only the latest per resume is sent. */
const pendingSaves = new Map<string, ReturnType<typeof setTimeout>>();
const SAVE_DEBOUNCE_MS = 1500;

/**
 * In-flight POST guard — prevents duplicate POST requests for the same resumeId.
 * When a POST is in flight for resumeId X, any subsequent write-back for X
 * will skip the POST phase and wait for the in-flight request to complete.
 */
const inflightPosts = new Map<string, Promise<unknown>>();

/**
 * C30 — Resumes currently being created via explicit POST.
 * Prevents the write-back subscription from also trying to POST.
 */
const creatingResumeIds = new Set<string>();

/** Mark a resume as being created (C30). */
export function markCreating(resumeId: string): void {
  creatingResumeIds.add(resumeId);
}

/** Clear a resume from the creating set (C30). */
export function clearCreating(resumeId: string): void {
  creatingResumeIds.delete(resumeId);
}

/** Check if a resume is currently being created (C30). */
export function isCreating(resumeId: string): boolean {
  return creatingResumeIds.has(resumeId);
}

/**
 * Save a local resume to the server.
 *
 * `targetResumeId` says WHICH resume to send. Debounce timers capture the id
 * at schedule time; by the time the timer fires the user may have switched to
 * a different resume, so the live active resume must never be assumed to be
 * the one that needs saving (rapid-switch save-drop fix, BUG-2).
 * Without a target the currently active resume is saved (explicit saves).
 */
export async function saveLocalResumeToServer(targetResumeId?: string): Promise<void> {
  const snapshot = useResumeBuilder.getState();
  const { activeResumeId, serverVersions } = snapshot;

  const resume: Resume | undefined = targetResumeId
    ? (Array.isArray(snapshot.resumes)
        ? snapshot.resumes.find((r) => r.resumeId === targetResumeId)
        : undefined) ??
      (snapshot.resume?.resumeId === targetResumeId ? snapshot.resume : undefined)
    : snapshot.resume;

  if (!resume || !resume.resumeId) return;
  if (!targetResumeId && !activeResumeId) return;

  // C29: Skip save for resumes that have been deleted locally (prevents resurrection)
  if (snapshot.pendingDeletes?.includes(resume.resumeId)) return;

  // C30: Skip save for resumes that are currently being created via explicit POST
  if (creatingResumeIds.has(resume.resumeId)) return;

  // The save-status indicator always describes the ACTIVE resume. A background
  // save of a different resume must not flip it to "saving"/"saved" (or mask
  // the active resume's own unsaved edits).
  const isActive = () => useResumeBuilder.getState().activeResumeId === resume.resumeId;
  const state = {
    ...snapshot,
    setSaveStatus: (status: SaveStatus) => {
      if (isActive()) snapshot.setSaveStatus(status);
    },
  };

  // Set saving status (gated to the active resume)
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
        careerStage: sanitizeCareerStage(resume.careerStage),
        resume,
        baseVersion: baseVersion > 0 ? baseVersion : undefined,
      }),
    });

    if (res.status === 409) {
      // Conflict — server version is newer. Do NOT overwrite local.
      const body = await res.json().catch(() => ({}));
      const serverVersion = (body as { currentVersion?: number }).currentVersion ?? baseVersion;
      // Fetch the latest server snapshot for the conflict review UI
      let serverResume: Record<string, unknown> = {};
      try {
        const snapshotRes = await fetch(`/api/resumes/${resume.resumeId}`);
        if (snapshotRes.ok) {
          const snapshot = await snapshotRes.json() as { resume?: Record<string, unknown> };
          serverResume = snapshot.resume ?? {};
        }
      } catch {
        // Best-effort — if snapshot fetch fails, show conflict without server data
      }
      useResumeBuilder.setState({
        writeConflict: {
          resumeId: resume.resumeId,
          localResume: { ...resume },
          serverResume: serverResume as unknown as Resume,
          localBaseVersion: baseVersion > 0 ? baseVersion : undefined,
          serverVersion,
        },
        // A background-save conflict must not flip the ACTIVE resume's indicator.
        ...(isActive() ? { saveStatus: "unsaved" as const } : {}),
      });
      return;
    }

    if (res.status === 404) {
      // Resume does not exist on server yet — create it via POST.
      // This happens when a resume was created locally (or imported)
      // and the write-back runs before any server record exists.
      console.log("[write-back] Resume not found on server — creating via POST");

      // C16: Guard against duplicate POST — if a POST is already in flight
      // for this resumeId, wait for it to complete instead of firing another.
      const existingPost = inflightPosts.get(resume.resumeId);
      if (existingPost) {
        console.log("[write-back] POST already in flight for", resume.resumeId, "— waiting");
        await existingPost;
        // After the in-flight POST completes, re-check: try PUT again.
        // If the server now has the resume, PUT will succeed.
        state.setSaveStatus("unsaved"); // trigger a fresh save cycle
        return;
      }

      const rid = resume.resumeId;
      const postPromise = (async () => {
        try {
          // C29: Check if this resume has been deleted while the POST was pending
          const currentPendingDeletes = useResumeBuilder.getState().pendingDeletes ?? [];
          if (currentPendingDeletes.includes(rid)) {
            console.log("[write-back] Resume deleted during pending POST — skipping");
            return;
          }
          const createRes = await fetch("/api/resumes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resumeId: rid,
              resumeName: resume.resumeName || resume.name || "My Resume",
              templateId: resume.templateId,
              careerStage: sanitizeCareerStage(resume.careerStage),
              resume,
            }),
          });
          if (createRes.ok) {
            const created = await createRes.json() as { version?: number; resumeId?: string };
            // C29: If resume was deleted while POST was in flight, clean up the server row
            const postCreateDeletes = useResumeBuilder.getState().pendingDeletes ?? [];
            if (postCreateDeletes.includes(rid)) {
              console.log("[write-back] Resume deleted after POST succeeded — cleaning up server row");
              fetch(`/api/resumes/${rid}`, { method: "DELETE" })
                .then((delRes) => {
                  if (delRes.ok || delRes.status === 404) {
                    useResumeBuilder.getState().clearPendingDelete(rid);
                  }
                })
                .catch(() => {});
              return;
            }
            if (created.version !== undefined && rid) {
              useResumeBuilder.getState().setServerVersion(rid, created.version);
            }
            state.setSaveStatus("saved");
            return;
          }
          // C16: Cross-identity duplicate — resumeId belongs to another user.
          // Generate a new resumeId and update the store.
          if (createRes.status === 409) {
            const conflictBody = await createRes.json().catch(() => ({}));
            if ((conflictBody as { error?: string }).error === "resumeId_conflict") {
              console.log("[write-back] Cross-identity resumeId conflict — regenerating ID");
              const newId = `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
              const st = useResumeBuilder.getState();
              const oldResume = st.resume;
              const newResume = { ...oldResume, resumeId: newId };
              // Update the resumes array and active resume
              const updatedResumes = st.resumes.map((r) =>
                r.resumeId === rid ? newResume : r,
              );
              useResumeBuilder.setState({
                resume: newResume,
                resumes: updatedResumes,
                activeResumeId: newId,
                saveStatus: "unsaved",
              });
              return; // will trigger a new save cycle with the new ID
            }
          }
          // POST also failed — fall through to generic error handling
          const createBody = await createRes.json().catch(() => ({}));
          const createMsg = (createBody as { error?: string }).error ?? `POST HTTP ${createRes.status}`;
          console.error("[write-back] Create failed:", createMsg);
          state.setSaveStatus("sync-failed");
          state.setLastSaveError(createMsg);
        } catch (createErr) {
          console.error("[write-back] Create network error:", createErr);
          state.setSaveStatus("sync-failed");
          state.setLastSaveError(
            "Can't reach the server. Changes are saved on this device — we'll keep retrying.",
          );
        } finally {
          if (rid) inflightPosts.delete(rid);
        }
      })();

      if (rid) inflightPosts.set(rid, postPromise);
      await postPromise;
      return;
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
      console.error("[write-back] Save failed:", msg);
      state.setSaveStatus("sync-failed");
      state.setLastSaveError(msg);
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
    // C8: Persist to IndexedDB offline queue so edits survive refresh
    try {
      await enqueueOfflineSave(
        resume.resumeId,
        resume as unknown as Record<string, unknown>,
        baseVersion > 0 ? baseVersion : undefined,
      );
    } catch (queueErr) {
      console.error("[write-back] Failed to enqueue offline save:", queueErr);
    }
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
    // Save the resume that was active when this save was SCHEDULED — the user
    // may have switched resumes during the debounce window (BUG-2).
    saveLocalResumeToServer(resumeId);
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
 * Flush pending saves synchronously on page unload.
 * Uses sendBeacon as a fallback for cases where fetch() cannot complete.
 */
function handleBeforeUnload(): void {
  const state = useResumeBuilder.getState();
  const { resume, activeResumeId, serverVersions } = state;
  if (!activeResumeId || !resume.resumeId) return;

  // Resume ids to flush: the active resume when it has unsaved edits, PLUS
  // every resume whose debounce timer is still pending (rapid-switch case —
  // the user may have edited resume A, switched to B, and closed the tab
  // before A's save fired; A must not lose its pending server save).
  const pendingIds = [...pendingSaves.keys()];
  const activeDirty = state.saveStatus === "unsaved";

  // Cancel all pending debounce timers — we're saving NOW
  for (const id of pendingIds) {
    const t = pendingSaves.get(id);
    if (t) clearTimeout(t);
    pendingSaves.delete(id);
  }

  const toFlush: Resume[] = [];
  const pushIfFlushable = (r: Resume | undefined) => {
    if (!r?.resumeId) return;
    // C29: Skip save for pending deletes
    if (state.pendingDeletes?.includes(r.resumeId)) return;
    // C30: Skip save for resumes being created (POST in flight)
    if (creatingResumeIds.has(r.resumeId)) return;
    if (!toFlush.some((x) => x.resumeId === r.resumeId)) toFlush.push(r);
  };
  if (activeDirty) pushIfFlushable(resume);
  const resumesList = Array.isArray(state.resumes) ? state.resumes : [];
  for (const id of pendingIds) {
    pushIfFlushable(
      resumesList.find((r) => r.resumeId === id) ??
        (resume.resumeId === id ? resume : undefined),
    );
  }
  if (toFlush.length === 0) return;

  for (const target of toFlush) {
    const rid = target.resumeId;
    if (!rid) continue;
    // Synchronous fetch with keepalive (works in most browsers on unload)
    flushKeepalive(target, serverVersions[rid] ?? 0);
  }
}

/** Send one resume to the server with keepalive + an IndexedDB safety net. */
function flushKeepalive(resume: Resume, baseVersion: number): void {
  if (!resume.resumeId) return;
  try {
    const payload = JSON.stringify({
      resumeId: resume.resumeId,
      resumeName: resume.resumeName || resume.name || "My Resume",
      templateId: resume.templateId,
      careerStage: sanitizeCareerStage(resume.careerStage),
      resume,
      baseVersion: baseVersion > 0 ? baseVersion : undefined,
    });

    // C8: Also persist to IndexedDB as a safety net.
    // If fetch(keepalive) fails (e.g. browser kills it), the offline queue
    // ensures the edit is not lost on refresh.
    enqueueOfflineSave(
      resume.resumeId,
      resume as unknown as Record<string, unknown>,
      baseVersion > 0 ? baseVersion : undefined,
    ).catch(() => {
      // Best-effort — IndexedDB write may not complete before unload
    });

    // fetch(keepalive) supports PUT and survives page unload in modern browsers.
    // sendBeacon only sends POST (not PUT), so it cannot be used with the
    // existing PUT /api/resumes/:resumeId endpoint.
    fetch(`/api/resumes/${resume.resumeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).then(() => {
      // If the fetch succeeded, remove from offline queue
      if (resume.resumeId) removeOfflineEntry(resume.resumeId).catch(() => {});
    }).catch(() => {
      // Best-effort — the offline queue entry will be flushed on next startup
    });
  } catch {
    // Silently fail — this is best-effort on unload
  }
}

/**
 * C8 — Flush the offline queue.
 * Called on reconnect (online event) or app initialization.
 * Sends each queued entry to the server. On success, removes the entry.
 * On 409, enters C7 conflict flow. On persistent failure, keeps the entry.
 */
export async function flushOfflineQueue(): Promise<void> {
  const entries = await getAllOfflineEntries();
  if (entries.length === 0) return;

  console.log(`[write-back] Flushing ${entries.length} offline queue entries`);

  for (const entry of entries) {
    // C29: Skip entries for resumes that have been deleted locally
    const currentPendingDeletes = useResumeBuilder.getState().pendingDeletes ?? [];
    if (currentPendingDeletes.includes(entry.resumeId)) {
      await removeOfflineEntry(entry.resumeId);
      continue;
    }
    try {
      const res = await fetch(`/api/resumes/${entry.resumeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeId: entry.resumeId,
          resumeName: (entry.resume.resumeName as string) || (entry.resume.name as string) || "My Resume",
          templateId: entry.resume.templateId,
          careerStage: sanitizeCareerStage(entry.resume.careerStage),
          resume: entry.resume,
          baseVersion: entry.baseVersion,
        }),
      });

      if (res.ok) {
        // Success — remove from queue, update store
        await removeOfflineEntry(entry.resumeId);
        const data = await res.json() as { version?: number };
        const state = useResumeBuilder.getState();
        if (data.version !== undefined) {
          state.setServerVersion(entry.resumeId, data.version);
        }
        // Only set saved if this is the active resume
        if (state.activeResumeId === entry.resumeId) {
          state.setSaveStatus("saved");
        }
      } else if (res.status === 404) {
        // Resume does not exist on server — create via POST
        console.log(`[write-back] Queue flush: resume ${entry.resumeId} not found — creating via POST`);

        // C16: Guard against duplicate POST from regular write-back
        const existingPost = inflightPosts.get(entry.resumeId);
        if (existingPost) {
          console.log(`[write-back] Queue flush: POST already in flight for ${entry.resumeId} — skipping`);
          continue;
        }

        try {
          const createRes = await fetch("/api/resumes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              resumeId: entry.resumeId,
              resumeName: (entry.resume.resumeName as string) || (entry.resume.name as string) || "My Resume",
              templateId: entry.resume.templateId,
              careerStage: sanitizeCareerStage(entry.resume.careerStage),
              resume: entry.resume,
            }),
          });
          if (createRes.ok) {
            await removeOfflineEntry(entry.resumeId);
            const created = await createRes.json() as { version?: number };
            const state = useResumeBuilder.getState();
            if (created.version !== undefined) {
              state.setServerVersion(entry.resumeId, created.version);
            }
            if (state.activeResumeId === entry.resumeId) {
              state.setSaveStatus("saved");
            }
          } else {
            const qBody = await createRes.json().catch(() => ({}));
            const qMsg = (qBody as { error?: string }).error ?? `POST HTTP ${createRes.status}`;
            console.error(`[write-back] Queue flush create failed for ${entry.resumeId}: HTTP ${createRes.status}`);
            const qState = useResumeBuilder.getState();
            if (qState.activeResumeId === entry.resumeId) {
              qState.setSaveStatus("sync-failed");
              qState.setLastSaveError(qMsg);
            }
          }
        } catch (createErr) {
          console.error(`[write-back] Queue flush create network error for ${entry.resumeId}:`, createErr);
        }
      } else if (res.status === 409) {
        // C7 conflict — remove from queue, let C7 handle it
        await removeOfflineEntry(entry.resumeId);
        const body = await res.json().catch(() => ({}));
        const serverVersion = (body as { currentVersion?: number }).currentVersion ?? entry.baseVersion ?? 0;
        // Fetch server snapshot for conflict UI
        let serverResume: Record<string, unknown> = {};
        try {
          const snapshotRes = await fetch(`/api/resumes/${entry.resumeId}`);
          if (snapshotRes.ok) {
            const snapshot = await snapshotRes.json() as { resume?: Record<string, unknown> };
            serverResume = snapshot.resume ?? {};
          }
        } catch {
          // Best-effort
        }
        const state = useResumeBuilder.getState();
        // Only set conflict if this is the active resume
        if (state.activeResumeId === entry.resumeId) {
          useResumeBuilder.setState({
            writeConflict: {
              resumeId: entry.resumeId,
              localResume: entry.resume as unknown as Resume,
              serverResume: serverResume as unknown as Resume,
              localBaseVersion: entry.baseVersion,
              serverVersion,
            },
            saveStatus: "unsaved",
          });
        }
      } else {
        // Server error — keep entry for retry, but never claim "Saved".
        console.error(`[write-back] Queue flush failed for ${entry.resumeId}: HTTP ${res.status}`);
        const fState = useResumeBuilder.getState();
        if (fState.activeResumeId === entry.resumeId) {
          fState.setSaveStatus("sync-failed");
          fState.setLastSaveError(`Sync failed (HTTP ${res.status}) — we'll retry automatically.`);
        }
      }
    } catch {
      // Network still unavailable — keep entry for next retry
      console.error(`[write-back] Queue flush network error for ${entry.resumeId}`);
    }
  }
}

/**
 * Hook up store mutations to trigger debounced write-back.
 * Also registers beforeunload to flush pending saves.
 * Also registers online event to flush offline queue on reconnect.
 * Call once when the app initializes.
 */
let _hooked = false;
export function hookWriteBackToStore(): void {
  if (_hooked) return;
  _hooked = true;

  // Subscribe to store changes — trigger debounced save on any resume mutation
  useResumeBuilder.subscribe((state, prevState) => {
    // Wait until localStorage hydration is complete.
    // In Zustand v5, onRehydrateStorage may not propagate hydrated=true
    // reliably to the live store. Use a robust fallback check.
    const isHydrated = state.hydrated || (Array.isArray(state.resumes) && state.resumes.length > 0 && state.activeResumeId);
    if (!isHydrated) return;
    // C28: Skip write-back during server-first hydration to prevent loops.
    if (state.hydratingFromServer || prevState.hydratingFromServer) return;
    // Only save when resume content actually changed
    if (state.resume === prevState.resume) return;
    // Don't trigger during active saving
    if (state.saveStatus === "saving") return;
    // Don't trigger server sync result propagation
    if (state.saveStatus === "sync-failed" && prevState.saveStatus === "sync-failed") return;

    debouncedSave();
  });

  if (typeof window !== "undefined") {
    // Flush pending saves on page unload (best-effort)
    window.addEventListener("beforeunload", handleBeforeUnload);

    // C8: Flush offline queue when browser comes back online
    window.addEventListener("online", () => {
      console.log("[write-back] Browser online — flushing offline queue");
      flushOfflineQueue();
    });

    // C8: On startup, if there are queued entries and we're online, flush them
    // (handles the case where user was offline, refreshed, and is now back online)
    if (navigator.onLine) {
      getAllOfflineEntries().then((entries) => {
        if (entries.length > 0) {
          console.log(`[write-back] Found ${entries.length} queued entries on startup — flushing`);
          flushOfflineQueue();
        }
      }).catch(() => {
        // IndexedDB not available — ignore
      });
    }
  }
}
