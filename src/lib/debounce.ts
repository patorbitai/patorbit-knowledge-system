"use strict";

interface Debounced<F extends (...args: any[]) => any> {
  (...args: Parameters<F>): void;
  /** Cancel any pending (not yet fired) invocation. */
  cancel: () => void;
}

/**
 * Simple trailing-edge debounce utility matching Next.js App Router best practices.
 * Assumes stable function identity, so useCallback is not required.
 */
export function debounce<F extends (...args: any[]) => any>(fn: F, delay: number): Debounced<F> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: any[]) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  } as Debounced<F>;

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}