"use client";

/**
 * ResumeServerSyncMonitor — Phase 1A READ-ONLY server awareness (ADR-004).
 *
 * Renders nothing. On mount, once the session is confirmed authenticated, it
 * fetches the server resume snapshot and computes LOCAL vs SERVER parity.
 * It NEVER writes to the store, never uploads local resumes, never adds
 * server-only resumes to the UI, and never overwrites anything — the local
 * Zustand/localStorage flow is completely untouched.
 *
 * Failure is silent and fail-closed: the builder keeps working from
 * localStorage regardless of what the server returns.
 */
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useResumeBuilder } from "@/store/resume-builder";
import { buildLocalSnapshots } from "@/lib/resume-server-sync/local";
import { runServerResumeSync } from "@/lib/resume-server-sync/sync";
import { reportParity } from "@/lib/resume-server-sync/debug";

export function ResumeServerSyncMonitor() {
  const { status } = useSession();
  const ranRef = useRef(false);

  useEffect(() => {
    // Only fetch for an authenticated session; unauthenticated keeps existing
    // local-only behavior and never hits /api/resumes.
    if (ranRef.current || status !== "authenticated") {
      return;
    }
    ranRef.current = true;

    const { resumes, styleConfigs } = useResumeBuilder.getState();
    const snapshots = buildLocalSnapshots(resumes, styleConfigs);

    void runServerResumeSync(snapshots).then((outcome) => {
      if (outcome.status === "ok") {
        reportParity(outcome.report);
      }
      // "disabled" and "error" outcomes are intentionally silent (fail closed).
    });
  }, [status]);

  return null;
}
