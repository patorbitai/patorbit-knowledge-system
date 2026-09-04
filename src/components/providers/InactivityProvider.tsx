"use client";

/**
 * InactivityProvider — monitors user activity and signs out after a period of
 * inactivity (default 30 minutes). Tracks mouse, keyboard, touch, and scroll
 * events. Shows a 60-second warning before logout so the user can stay signed
 * in by interacting with the page.
 */
import { useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

/** How long before we consider the user inactive (ms). Default: 10 minutes. */
const INACTIVITY_TIMEOUT = 10 * 60 * 1000;

/** How far before logout to show the warning (ms). Default: 60 seconds. */
const WARNING_BEFORE = 60 * 1000;

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  "mousedown",
  "mousemove",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

export function InactivityProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnedRef = useRef(false);

  const logout = useCallback(() => {
    signOut({ redirect: false }).then(() => { window.location.href = "/home"; });
  }, []);

  const resetTimer = useCallback(() => {
    if (status !== "authenticated") return;

    // Clear existing timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    warnedRef.current = false;

    // Set the inactivity timer
    timerRef.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT);

    // Set a warning timer that fires just before logout
    warningRef.current = setTimeout(() => {
      warnedRef.current = true;
      // Dispatch a custom event so components can show a warning banner
      window.dispatchEvent(new CustomEvent("inactivity-warning"));
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);
  }, [status, logout]);

  useEffect(() => {
    if (status !== "authenticated") return;

    // Start the initial timer
    resetTimer();

    // Listen for activity events
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, resetTimer, { passive: true });
    }

    // Listen for the "Stay Signed In" button reset
    window.addEventListener("inactivity-reset", resetTimer);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, resetTimer);
      }
      window.removeEventListener("inactivity-reset", resetTimer);
    };
  }, [status, resetTimer]);

  return <>{children}</>;
}
