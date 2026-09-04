"use client";

/**
 * ResumeServerSyncMonitor — Phase 1A READ-ONLY server awareness (ADR-004)
 * + C28 server-first hydration.
 *
 * Renders nothing. On mount, once the session is confirmed authenticated, it
 * fetches the server resume snapshot and computes LOCAL vs SERVER parity.
 *
 * When local state is empty (new browser / cleared localStorage) or when the
 * server has resumes not present locally, the monitor hydrates the Zustand
 * store from the server response via the store's hydrateFromServer action.
 *
 * Failure is silent and fail-closed: the builder keeps working from
 * localStorage regardless of what the server returns.
 */
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useResumeBuilder } from "@/store/resume-builder";
import { buildLocalSnapshots } from "@/lib/resume-server-sync/local";
import { runServerResumeSync } from "@/lib/resume-server-sync/sync";
import { fetchServerResumes } from "@/lib/resume-server-sync/client";
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

        // C28: Hydrate from server when local state is empty or server-only resumes exist.
        const hasServerOnly = outcome.report.summary.serverOnly > 0;
        const localEmpty = (() => {
          const r = useResumeBuilder.getState().resumes;
          if (r.length !== 1) return false;
          const first = r[0];
          return (
            !first.name && !first.title && !first.email && !first.summary &&
            first.experience.length === 0 && first.education.length === 0 &&
            first.skills.length === 0 && first.projects.length === 0 &&
            first.templateId === "modern-clean"
          );
        })();

        if (hasServerOnly || localEmpty) {
          // Fetch server resumes and hydrate into Zustand
          fetchServerResumes()
            .then((serverResumes) => {
              if (serverResumes.length > 0) {
                useResumeBuilder.getState().hydrateFromServer(serverResumes);
              }
            })
            .catch((err) => {
              // Fail-closed: local state remains usable
              console.error("[SyncMonitor] Server hydration failed:", err);
            });
        }

        // Evidence sync: always fetch evidence from server (server-authoritative per ADR-001)
        useResumeBuilder.getState().syncEvidenceFromServer();

        // C29: Retry pending deletes — if we're online and have pending deletes, retry them
        const pendingDeletes = useResumeBuilder.getState().pendingDeletes ?? [];
        if (pendingDeletes.length > 0 && navigator.onLine) {
          for (const rid of pendingDeletes) {
            fetch(`/api/resumes/${rid}`, { method: "DELETE" })
              .then((res) => {
                if (res.ok || res.status === 404) {
                  useResumeBuilder.getState().clearPendingDelete(rid);
                }
              })
              .catch(() => {
                // Will retry on next sync
              });
          }
        }
      }
      // "disabled" and "error" outcomes are intentionally silent (fail closed).
    });
  }, [status]);

  return null;
}
