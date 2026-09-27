"use client";

/**
 * M5A — first-use edit hint.
 *
 * A single persisted flag + window event shared by every surface that mounts
 * the inline edit layer (desktop preview toolbar, mobile preview). The hint
 * disappears the first time the user actually opens the edit popover, or when
 * they dismiss it manually — never permanently, never as a banner.
 */

export const EDIT_HINT_KEY = "patorbit-m5a-edit-hint-dismissed";
export const EDIT_HINT_EVENT = "patorbit:edit-hint-dismissed";

export function isEditHintDismissed(): boolean {
  try {
    return (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(EDIT_HINT_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/** Persist dismissal (idempotent) and notify mounted hints to hide now. */
export function dismissEditHint(): void {
  try {
    if (
      typeof localStorage !== "undefined" &&
      localStorage.getItem(EDIT_HINT_KEY) !== "1"
    ) {
      localStorage.setItem(EDIT_HINT_KEY, "1");
    }
  } catch {
    /* private mode — the in-session event still hides the hint */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EDIT_HINT_EVENT));
  }
}
