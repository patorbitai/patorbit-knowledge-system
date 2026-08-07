"use client";

import { useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 12 * 60 * 1000; // 12 minutes
const CURRENT_SHA = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ?? "local";

export function useDeploymentVersion(): boolean {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  // Ref avoids stale closure in event handlers
  const detectedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function check() {
    if (detectedRef.current || CURRENT_SHA === "local") return;
    try {
      const res = await fetch("/api/version", { cache: "no-store" });
      if (!res.ok) return;
      const { sha } = await res.json();
      if (sha && sha !== "local" && sha !== CURRENT_SHA) {
        detectedRef.current = true;
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

    function onOnline() {
      check();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("online", onOnline);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("online", onOnline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return updateAvailable;
}
