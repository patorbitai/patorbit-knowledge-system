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
import type { ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { enqueueOfflineSave, removeOfflineEntry, getAllOfflineEntries } from "@/lib/offline-queue";

/**
 * M5C — customization joins the write-back payload.
 *
 * The store keeps style configs in `styleConfigs[resumeId]` (not inside the
 * resume document), but the server payload contract (ResumePayloadSchema,
 * ADR-003) carries them under `resume.styleConfigs`. Merging here means ONE
 * save covers content AND customization, so the M5B status machine stays
 * truthful about both. Seams that predate the style map (test mocks) pass
 * `undefined` and keep the exact previous payload.
 */
function withStyleConfigs(
  resume: Resume,
  styleConfigs: Record<string, ResumeStyleConfig> | undefined,
): Resume {
  if (!styleConfigs || !resume.resumeId) return resume;
  const config = styleConfigs[resume.resumeId];
  return {
    ...resume,
    styleConfigs: config ? { [resume.resumeId]: config } : {},
  } as Resume;
}

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

/* ── M5B — save sequencing & failure recovery ──────────────────────────────
 *
 * Truthful save-state model:
 *   edit → "unsaved" → (debounce) → "saving" → PUT 200 → "saved"
 * "saved" is ONLY ever set from a successful server response (plus the
 * adopting of server content via conflict resolution / hydration).
 *
 * - saveSeq:    every started save supersedes earlier ones for that resume;
 *               a stale completion may never write status or serverVersion.
 * - sentResumes: the exact local object a request carried — if NEWER local
 *               edits exist when it completes, the indicator must not claim
 *               "Saved" for them (their save is pending/in flight).
 * - bounded auto-retry with backoff for TRANSIENT failures (network/408/429/
 *   5xx); terminal rejections (400/401/403) rely on the explicit manual
 *   Retry action. Auto-retry is disabled under tests (deterministic timers).
 */
const saveSeq = new Map<string, number>();
const sentResumes = new Map<string, Resume>();
const retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
/** Failure-attempt counter per resume — also gates one log per failure episode. */
const retryAttempts = new Map<string, number>();
const AUTO_RETRY_DELAYS_MS = [2000, 4000, 8000];
const IS_TEST_ENV =
  typeof process !== "undefined" &&
  (process.env.NODE_ENV === "test" || !!process.env.VITEST);
let autoRetryEnabled = !IS_TEST_ENV;

/** Test seam: focused M5B tests flip this to exercise auto-retry timing. */
export function setAutoRetryEnabled(enabled: boolean): void {
  autoRetryEnabled = enabled;
}

/** Cancel scheduled auto-retries (one resume, or all). */
export function cancelSaveRetry(resumeId?: string): void {
  if (resumeId) {
    const t = retryTimers.get(resumeId);
    if (t) {
      clearTimeout(t);
      retryTimers.delete(resumeId);
    }
    return;
  }
  for (const t of retryTimers.values()) clearTimeout(t);
  retryTimers.clear();
}

/**
 * Reset the bounded-retry budget (one resume, or all) — cancels any
 * scheduled timer as well. Test/maintenance seam so failure episodes do not
 * leak into each other; production paths reset implicitly on new edits,
 * explicit saves and successes.
 */
export function resetSaveRetryBudget(resumeId?: string): void {
  if (resumeId) {
    retryAttempts.delete(resumeId);
    const t = retryTimers.get(resumeId);
    if (t) {
      clearTimeout(t);
      retryTimers.delete(resumeId);
    }
    return;
  }
  retryAttempts.clear();
  for (const t of retryTimers.values()) clearTimeout(t);
  retryTimers.clear();
}

/** True while a debounced (not yet sent) save is pending. */
export function hasPendingSave(resumeId?: string): boolean {
  return resumeId ? pendingSaves.has(resumeId) : pendingSaves.size > 0;
}

/** HTTP statuses worth retrying automatically (transient/server-side). */
function isRetriableHttpStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Schedule ONE bounded auto-retry for a failed resume save. */
function scheduleAutoRetry(resumeId: string): void {
  if (!autoRetryEnabled) return;
  // Actual connectivity loss: the online listener + offline queue recover.
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;
  const attempt = retryAttempts.get(resumeId) ?? 0;
  if (attempt >= AUTO_RETRY_DELAYS_MS.length) return; // bounded
  retryAttempts.set(resumeId, attempt + 1);
  const existing = retryTimers.get(resumeId);
  if (existing) clearTimeout(existing);
  const timer = setTimeout(() => {
    retryTimers.delete(resumeId);
    void saveLocalResumeToServer(resumeId);
  }, AUTO_RETRY_DELAYS_MS[attempt]);
  retryTimers.set(resumeId, timer);
}

/** Log a save failure at most once per failure episode (console hygiene). */
function logFailureOnce(resumeId: string, ...args: unknown[]): void {
  if ((retryAttempts.get(resumeId) ?? 0) === 0) console.error("[write-back]", ...args);
}

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

  // M5B — sequencing: this save supersedes earlier ones for this resume; a
  // stale completion may never write status or serverVersion (and an older
  // snapshot completing late must never overwrite a newer one).
  const rid: string = resume.resumeId; // narrowed once — closures capture this
  const seq = (saveSeq.get(rid) ?? 0) + 1;
  saveSeq.set(rid, seq);
  sentResumes.set(rid, resume);
  // M5C — the exact style config THIS request carries. A newer local style
  // edit beyond it keeps the status truthful when this request completes.
  const sentStyleRef = snapshot.styleConfigs?.[resume.resumeId];
  const payloadResume = withStyleConfigs(resume, snapshot.styleConfigs);
  cancelSaveRetry(rid); // this attempt replaces any scheduled retry
  const isCurrent = () => saveSeq.get(rid) === seq;
  const finish = (apply: () => void) => {
    if (isCurrent()) apply();
  };
  /** Newer local edits exist beyond the exact object THIS request carried. */
  const hasNewerEdits = () => {
    const st = useResumeBuilder.getState();
    // M5C: a customization edit is a local edit too — a style config newer
    // than the one THIS request carried must never be claimed "Saved".
    if (st.styleConfigs?.[rid] !== sentStyleRef) return true;
    const fromList = Array.isArray(st.resumes)
      ? st.resumes.find((r) => r.resumeId === rid)
      : undefined;
    const latest = fromList ?? (st.resume?.resumeId === rid ? st.resume : undefined);
    return !!latest && latest !== resume;
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
        resume: payloadResume,
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
      finish(() => {
        cancelSaveRetry(rid);
        retryAttempts.delete(rid);
        useResumeBuilder.setState((s) => ({
          writeConflict: {
            resumeId: rid,
            localResume: { ...resume },
            serverResume: serverResume as unknown as Resume,
            localBaseVersion: baseVersion > 0 ? baseVersion : undefined,
            serverVersion,
          },
          // M5B: this content is NOT on the server — persist that truth so a
          // refresh resumes truthfully instead of claiming "Saved".
          pendingSyncIds: (s.pendingSyncIds ?? []).includes(rid)
            ? (s.pendingSyncIds ?? [])
            : [...(s.pendingSyncIds ?? []), rid],
          // A background-save conflict must not flip the ACTIVE resume's indicator.
          ...(isActive() ? { saveStatus: "unsaved" as const } : {}),
        }));
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
        // M5B — after the other caller's POST settles, run a fresh save
        // cycle: the status must resolve from a real server response instead
        // of stranding on "unsaved" with nothing scheduled.
        finish(() => {
          state.setSaveStatus("unsaved");
          debouncedSave();
        });
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
              resume: payloadResume,
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
            finish(() => {
              if (created.version !== undefined && rid) {
                useResumeBuilder.getState().setServerVersion(rid, created.version);
              }
              cancelSaveRetry(rid);
              retryAttempts.delete(rid);
              removeOfflineEntry(rid).catch(() => {});
              // Never claim "Saved" for newer edits that landed mid-POST.
              state.setSaveStatus(hasNewerEdits() ? "unsaved" : "saved");
            });
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
          finish(() => {
            logFailureOnce(rid, "Create failed:", createMsg);
            state.setSaveStatus("sync-failed");
            state.setLastSaveError(createMsg);
            if (isRetriableHttpStatus(createRes.status)) scheduleAutoRetry(rid);
          });
        } catch (createErr) {
          // M5B: a thrown fetch is an ACTUAL connectivity failure — report
          // Offline (device-local copy queued), never a generic failure.
          if (isCurrent()) {
            logFailureOnce(rid, "Create network error:", createErr);
            try {
              await enqueueOfflineSave(
                rid,
                payloadResume as unknown as Record<string, unknown>,
                baseVersion > 0 ? baseVersion : undefined,
              );
            } catch (queueErr) {
              console.error("[write-back] Failed to enqueue offline save:", queueErr);
            }
            if (isCurrent()) {
              state.setSaveStatus("offline");
              state.setLastSaveError(
                "Can't reach the server. Changes are saved on this device — we'll keep retrying.",
              );
              scheduleAutoRetry(rid);
            }
          }
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
      finish(() => {
        logFailureOnce(rid, "Save failed:", msg);
        state.setSaveStatus("sync-failed");
        state.setLastSaveError(msg);
        // Transient failures (429/5xx/408) get bounded automatic retries;
        // terminal rejections wait for the explicit Retry action.
        if (isRetriableHttpStatus(res.status)) scheduleAutoRetry(rid);
      });
      return;
    }

    const data = await res.json() as { version?: number; resumeId?: string };

    // Success — the SERVER confirmed this exact content (M5B: the only path
    // that may transition to "saved").
    finish(() => {
      if (data.version !== undefined) {
        state.setServerVersion(rid, data.version);
      }
      cancelSaveRetry(rid);
      retryAttempts.delete(rid);
      // Any queued offline copy of this resume is now redundant.
      removeOfflineEntry(rid).catch(() => {});
      // Never claim "Saved" for NEWER edits that landed mid-flight — their
      // own save cycle (pending debounce or in-flight request) resolves them.
      state.setSaveStatus(hasNewerEdits() ? "unsaved" : "saved");
    });
  } catch (err) {
    // A newer save already started for this resume — it owns status + queue.
    if (!isCurrent()) return;            logFailureOnce(resume.resumeId, "Network error:", err);
            // C8: Persist to IndexedDB offline queue so edits survive refresh
            try {
              await enqueueOfflineSave(
                resume.resumeId,
                payloadResume as unknown as Record<string, unknown>,
                baseVersion > 0 ? baseVersion : undefined,
              );
    } catch (queueErr) {
      console.error("[write-back] Failed to enqueue offline save:", queueErr);
    }
    if (!isCurrent()) return; // re-check: a newer attempt may have raced in
    state.setSaveStatus("offline");
    scheduleAutoRetry(rid);
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

  // M5B: a fresh user-edit cycle starts a new bounded retry budget.
  cancelSaveRetry(resumeId);
  retryAttempts.delete(resumeId);

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
    // M5B: an explicit save is a fresh (user-driven) attempt.
    cancelSaveRetry(resumeId);
    retryAttempts.delete(resumeId);
  }
  await saveLocalResumeToServer();
}

/**
 * M5B — explicit manual Retry action: save the LATEST local content now
 * (latest snapshot, fresh bounded auto-retry budget; any pending debounce is
 * coalesced away). Used by the save indicator, context bar pill and popover.
 */
export async function retryFailedSave(): Promise<void> {
  const state = useResumeBuilder.getState();
  if (state.activeResumeId) retryAttempts.delete(state.activeResumeId);
  await forceSaveNow();
}

/**
 * M5B — recovery entry point (browser "online" event + app startup):
 * flush queued offline edits; if nothing is queued but the active resume is
 * still unacknowledged by the server, force a fresh save of the latest
 * content. Also re-saves background resumes whose saves failed in a previous
 * session (their persisted pendingSync marker survived the refresh).
 */
export async function recoverFromOffline(): Promise<void> {
  try {
    const entries = await getAllOfflineEntries();
    if (entries.length > 0) {
      await flushOfflineQueue();
      return;
    }
  } catch {
    // IndexedDB unavailable — fall through to direct save attempts
  }
  const st = useResumeBuilder.getState();
  const ids = st.pendingSyncIds ?? [];
  const activeUnconfirmed = ids.includes(st.activeResumeId) && st.saveStatus !== "saving";
  if (st.saveStatus === "offline" || activeUnconfirmed) {
    await retryFailedSave();
  }
  for (const id of ids) {
    if (id !== st.activeResumeId) await saveLocalResumeToServer(id);
  }
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
  // M5B: any state whose content the server never confirmed deserves one last
  // keepalive attempt on unload ("saving" = an in-flight attempt the browser
  // may kill with the page). "saved" and conflict resolution are excluded.
  const activeDirty =
    state.saveStatus === "unsaved" ||
    state.saveStatus === "saving" ||
    state.saveStatus === "sync-failed" ||
    state.saveStatus === "offline";

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
    // M5C: include styleConfigs so an unload-flush also persists the latest
    // customization (same merge as saveLocalResumeToServer).
    const payloadResume = withStyleConfigs(
      resume,
      useResumeBuilder.getState().styleConfigs,
    );
    const payload = JSON.stringify({
      resumeId: resume.resumeId,
      resumeName: resume.resumeName || resume.name || "My Resume",
      templateId: resume.templateId,
      careerStage: sanitizeCareerStage(resume.careerStage),
      resume: payloadResume,
      baseVersion: baseVersion > 0 ? baseVersion : undefined,
    });

    // C8: Also persist to IndexedDB as a safety net.
    // If fetch(keepalive) fails (e.g. browser kills it), the offline queue
    // ensures the edit is not lost on refresh.
    enqueueOfflineSave(
      resume.resumeId,
      payloadResume as unknown as Record<string, unknown>,
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
    }).then((res) => {
      // M5B: only a CONFIRMED success may drop the queued safety copy — a
      // failed unload-flush must not silently discard it.
      if (res && res.ok && resume.resumeId) removeOfflineEntry(resume.resumeId).catch(() => {});
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
        cancelSaveRetry(entry.resumeId);
        retryAttempts.delete(entry.resumeId);
        // M5B: claim "Saved" only if the server now holds EXACTLY the local
        // content (newer local edits keep their own pending save cycle) and
        // never clobber an in-flight save's "saving" state.
        if (localMatchesPayload(entry.resumeId, entry.resume)) {
          useResumeBuilder.setState((s) => ({
            pendingSyncIds: (s.pendingSyncIds ?? []).filter((pid) => pid !== entry.resumeId),
          }));
          if (
            state.activeResumeId === entry.resumeId &&
            state.saveStatus !== "saving" &&
            state.saveStatus !== "saved"
          ) {
            state.setSaveStatus("saved");
          }
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
            if (localMatchesPayload(entry.resumeId, entry.resume)) {
              useResumeBuilder.setState((s) => ({
                pendingSyncIds: (s.pendingSyncIds ?? []).filter((pid) => pid !== entry.resumeId),
              }));
              if (
                state.activeResumeId === entry.resumeId &&
                state.saveStatus !== "saving" &&
                state.saveStatus !== "saved"
              ) {
                state.setSaveStatus("saved");
              }
            }
          } else {
            const qBody = await createRes.json().catch(() => ({}));
            const qMsg = (qBody as { error?: string }).error ?? `POST HTTP ${createRes.status}`;
            console.error(`[write-back] Queue flush create failed for ${entry.resumeId}: HTTP ${createRes.status}`);
            const qState = useResumeBuilder.getState();
            if (qState.activeResumeId === entry.resumeId) {
              qState.setSaveStatus("sync-failed");
              qState.setLastSaveError(qMsg);
              if (isRetriableHttpStatus(createRes.status)) scheduleAutoRetry(entry.resumeId);
            }
          }
        } catch (createErr) {
          // M5B: connectivity failure, not a generic sync failure.
          logFailureOnce(entry.resumeId, `Queue flush create network error for ${entry.resumeId}:`, createErr);
          const st = useResumeBuilder.getState();
          if (st.activeResumeId === entry.resumeId) {
            st.setSaveStatus("offline");
          }
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
        // M5B: the queue's content was rejected by the server — persist that
        // truth so a refresh resumes truthfully instead of claiming "Saved".
        useResumeBuilder.setState((s) => ({
          pendingSyncIds: (s.pendingSyncIds ?? []).includes(entry.resumeId)
            ? (s.pendingSyncIds ?? [])
            : [...(s.pendingSyncIds ?? []), entry.resumeId],
        }));
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
          fState.setLastSaveError(
            `Sync failed (HTTP ${res.status}) — your changes are kept on this device.`,
          );
          if (isRetriableHttpStatus(res.status)) scheduleAutoRetry(entry.resumeId);
        }
      }
    } catch {
      // Network still unavailable — keep entry for next retry
      logFailureOnce(entry.resumeId, `Queue flush network error for ${entry.resumeId}`);
      const st = useResumeBuilder.getState();
      if (st.activeResumeId === entry.resumeId) {
        st.setSaveStatus("offline"); // an actual connectivity failure occurred
      }
    }
  }
}

/** True when the store's local copy of `resumeId` deep-matches `payload`. */
function localMatchesPayload(resumeId: string, payload: Record<string, unknown>): boolean {
  const st = useResumeBuilder.getState();
  const fromList = Array.isArray(st.resumes)
    ? st.resumes.find((r) => r.resumeId === resumeId)
    : undefined;
  const local = fromList ?? (st.resume?.resumeId === resumeId ? st.resume : undefined);
  if (!local) return false;
  try {
    // M5C — the queued payload carries the style config alongside the content
    // (withStyleConfigs). Compare content and customization separately so a
    // reserved styleConfigs key on either side can never hide the truth.
    const { styleConfigs: queuedStyles, ...payloadDoc } = payload;
    const localDoc = { ...(local as unknown as Record<string, unknown>) };
    delete localDoc.styleConfigs;
    if (JSON.stringify(localDoc) !== JSON.stringify(payloadDoc)) return false;
    const queued = (
      queuedStyles as Record<string, Record<string, unknown> | undefined> | undefined
    )?.[resumeId];
    const current = st.styleConfigs?.[resumeId];
    return JSON.stringify(queued ?? null) === JSON.stringify(current ?? null);
  } catch {
    return false;
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
    // Only save when resume content actually changed — M5C: or the per-resume
    // customization (style config), which now enters the SAME debounced
    // write-back so customization changes follow the truthful save states.
    if (state.resume === prevState.resume && state.styleConfigs === prevState.styleConfigs) return;
    // Don't trigger during active saving
    if (state.saveStatus === "saving") return;
    // Don't trigger server sync result propagation
    if (state.saveStatus === "sync-failed" && prevState.saveStatus === "sync-failed") return;

    debouncedSave();
  });

  if (typeof window !== "undefined") {
    // Flush pending saves on page unload (best-effort)
    window.addEventListener("beforeunload", handleBeforeUnload);

    // C8/M5B: on reconnect, flush queued offline edits and/or force a fresh
    // save for anything the server never confirmed.
    window.addEventListener("online", () => {
      console.log("[write-back] Browser online — recovering unacknowledged saves");
      void recoverFromOffline();
    });

    // C8/M5B: on startup (online), flush queued entries and re-save resumes
    // whose previous session ended on a failed/unacknowledged save.
    if (navigator.onLine) {
      void recoverFromOffline();
    }
  }
}
