"use client";

import { useEffect } from "react";
import { hookWriteBackToStore } from "@/lib/resume-write-back";

/**
 * Write-Back Bootstrap — application lifecycle (client boundary).
 *
 * A tiny client component mounted from the resume-builder layout.
 * It calls hookWriteBackToStore() exactly once for the app's lifetime.
 *
 * hookWriteBackToStore() has its own _hooked guard, so even if this
 * component re-mounts (React Strict Mode), the subscription and
 * beforeunload handler are registered only once.
 */
export default function WriteBackBootstrap() {
  useEffect(() => {
    hookWriteBackToStore();
  }, []);

  return null;
}
