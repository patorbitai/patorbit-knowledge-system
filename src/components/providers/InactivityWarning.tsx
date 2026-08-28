"use client";

/**
 * InactivityWarning — floating banner that appears 60 seconds before the
 * inactivity auto-logout fires. Shows a countdown and a "Stay Signed In"
 * button that resets the inactivity timer.
 */
import { useEffect, useState, useCallback } from "react";

/** Must match InactivityProvider's WARNING_BEFORE */
const WARNING_DURATION = 60 * 1000;

export function InactivityWarning() {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    let countdown: ReturnType<typeof setInterval> | null = null;

    const onWarning = () => {
      setVisible(true);
      setSecondsLeft(60);

      countdown = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdown) clearInterval(countdown);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    };

    window.addEventListener("inactivity-warning", onWarning);
    return () => {
      window.removeEventListener("inactivity-warning", onWarning);
      if (countdown) clearInterval(countdown);
    };
  }, []);

  const handleStayLoggedIn = useCallback(() => {
    setVisible(false);
    // Dispatch a reset event — the InactivityProvider listens and resets its timer
    window.dispatchEvent(new CustomEvent("inactivity-reset"));
    // Reset timer by simulating user activity
    window.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl px-5 py-3 shadow-2xl"
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-amber-300">
          You will be signed out due to inactivity
        </span>
        <span className="text-xs text-amber-400/80">
          Session expires in {secondsLeft}s — move your mouse or press a key to stay signed in
        </span>
      </div>
      <button
        onClick={handleStayLoggedIn}
        className="shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition-all"
      >
        Stay Signed In
      </button>
    </div>
  );
}
