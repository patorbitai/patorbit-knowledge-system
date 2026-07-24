'use client';

import { useEffect, useRef } from 'react';

import { useResumeStore } from '@/lib/stores/use-resume-store';

export function useWarnOnUnsavedChanges(enabled = true) {
  const isDirty = useResumeStore((s) => s.saveState.isDirty);
  const dirtyRef = useRef(isDirty);

  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    if (!enabled) return;

    // For browser refresh or tab close
    const beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = ''; // Required for some browsers
      }
    };

    // For back/forward button navigation
    const popStateHandler = (e: PopStateEvent) => {
      if (dirtyRef.current) {
        if (!window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
          // Push the current state back into history to prevent navigation
          window.history.pushState(null, '', window.location.href);
        } else {
          // Allow navigation
          dirtyRef.current = false;
        }
      }
    };

    window.addEventListener('beforeunload', beforeUnloadHandler);
    window.addEventListener('popstate', popStateHandler);

    return () => {
      window.removeEventListener('beforeunload', beforeUnloadHandler);
      window.removeEventListener('popstate', popStateHandler);
    };
  }, [enabled]);
}

/**
 * Prompts the user for confirmation before navigating if there are unsaved changes.
 * @returns {boolean} `true` if navigation should proceed, `false` otherwise.
 */
export function confirmIfDirty(): boolean {
  const isDirty = useResumeStore.getState().saveState.isDirty;
  if (isDirty) {
    if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
      // Allow navigation and prevent beforeunload from firing again
      useResumeStore.setState((s) => ({ saveState: { ...s.saveState, isDirty: false } }));
      return true;
    }
    return false;
  }
  return true;
}
