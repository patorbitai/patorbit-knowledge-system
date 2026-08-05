"use client";

import { useEffect } from "react";
import { startIdentityPipeline } from "@/services/identity-pipeline-subscriber";

/**
 * Identity Pipeline Bootstrap — application lifecycle (client boundary).
 *
 * A tiny client component mounted from the (server) resume-builder layout.
 * It exists solely to run the automatic pipeline subscription exactly once
 * for the app's lifetime. No logic, no state, no UI.
 *
 * React guarantees the effect runs once per mount and that its cleanup (the
 * returned unsubscribe) runs on unmount, so this cannot leak or double-
 * subscribe across re-renders or navigation.
 */
export default function IdentityPipelineBootstrap() {
  useEffect(() => {
    return startIdentityPipeline();
  }, []);

  return null;
}