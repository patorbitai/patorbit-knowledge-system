"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
const CURRENT_SHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local";

export function useDeploymentVersion(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function check() {
    // Skip check if update already detected or running locally
    if (updateAvailable || CURRENT_SHA === "local") return;
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const { sha } = await res.json();
      if (sha && sha !== "local" && sha !== CURRENT_SHA) {
        setUpdateAvailable(true);
      }
    } catch {
      // Silently ignore network errors
    }
  }

  useEffect(() => {
    check();

    timerRef.current = setInterval(check, POLL_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return updateAvailable;
}
