"use client";

import { useEffect, useRef } from "react";
import { track, type EventProps, type FunnelEvent } from "@/lib/analytics";

/**
 * Fires a funnel event exactly once when the page mounts.
 * Use on server-rendered pages (landing, pricing) that have no client effect
 * of their own.
 */
export default function TrackEvent({ name, props }: { name: FunnelEvent; props?: EventProps }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(name, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  return null;
}
