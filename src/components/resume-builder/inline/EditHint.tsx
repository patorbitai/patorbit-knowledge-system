"use client";

import { useSyncExternalStore } from "react";
import {
  EDIT_HINT_EVENT,
  dismissEditHint,
  isEditHintDismissed,
} from "./edit-hint";

/**
 * M5A — the lightweight "you can edit this" hint.
 *
 * A quiet, dismissible one-liner placed inside an EXISTING chrome row
 * (preview toolbar / mobile preview meta line) — no banner, no modal,
 * no content coverage. Hides on first use of the edit popover or via its
 * dismiss button, whichever comes first, and stays hidden afterwards.
 *
 * The flag is an external store (localStorage + window event), read with
 * useSyncExternalStore so no effect ever sets state.
 */

function subscribeToDismissal(onChange: () => void): () => void {
  window.addEventListener(EDIT_HINT_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EDIT_HINT_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const readDismissed = () => isEditHintDismissed();
const readDismissedOnServer = () => false;

export function EditHint({
  text,
  className = "",
  testId = "edit-hint",
}: {
  text: string;
  className?: string;
  testId?: string;
}) {
  const dismissed = useSyncExternalStore(
    subscribeToDismissal,
    readDismissed,
    readDismissedOnServer,
  );

  if (dismissed) return null;

  return (
    <span
      data-testid={testId}
      className={`inline-flex items-center gap-1 shrink-0 ${className}`}
    >
      <span>{text}</span>
      <button
        type="button"
        aria-label="Dismiss edit hint"
        onClick={() => dismissEditHint()}
        className="p-0.5 rounded text-gray-300 dark:text-slate-600 hover:text-gray-600 dark:hover:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
      >
        <span aria-hidden="true" className="text-[11px] leading-none">
          ×
        </span>
      </button>
    </span>
  );
}
