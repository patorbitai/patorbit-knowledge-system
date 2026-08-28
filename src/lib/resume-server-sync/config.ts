/**
 * Feature flag for the Phase-1A READ-ONLY server resume awareness (ADR-004).
 *
 * The flag is read at call time so tests can toggle it with `vi.stubEnv`.
 * Default: ENABLED. Set `NEXT_PUBLIC_RESUME_SERVER_SYNC=false` to disable the
 * entire server-read path (the builder then behaves exactly as before Phase 0).
 *
 * This is the smallest safe activation mechanism — no flag framework.
 */
export function isResumeServerSyncEnabled(): boolean {
  return process.env.NEXT_PUBLIC_RESUME_SERVER_SYNC !== "false";
}
