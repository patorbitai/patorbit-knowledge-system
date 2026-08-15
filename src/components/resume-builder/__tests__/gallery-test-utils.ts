"use strict";

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type { ReactNode } from "react";

/**
 * jsdom does not implement layout or ResizeObserver/IntersectionObserver.
 * These stubs let the gallery components render and report deterministic
 * page counts during tests.
 */

// Opt into React's act() environment so synchronous state flushes work.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let fakeScrollHeight = 900;

export function setFakeScrollHeight(value: number): void {
  fakeScrollHeight = value;
}

Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  get() {
    return fakeScrollHeight;
  },
});

type ObserveCb = (entries: unknown[]) => void;

class MockResizeObserver {
  constructor(private cb: ObserveCb) {}
  observe(target: Element): void {
    this.cb([{ target, contentRect: { width: 300, height: 400 } }]);
  }
  unobserve(): void {}
  disconnect(): void {}
}

class MockIntersectionObserver {
  constructor(private cb: ObserveCb) {}
  observe(target: Element): void {
    this.cb([{ target, isIntersecting: true }]);
  }
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): unknown[] {
    return [];
  }
}

export function installObserverStubs(): void {
  (globalThis as Record<string, unknown>).ResizeObserver ??= MockResizeObserver;
  (globalThis as Record<string, unknown>).IntersectionObserver ??= MockIntersectionObserver;
}

export interface Rendered {
  container: HTMLDivElement;
  root: Root;
  unmount: () => void;
}

/** Render a React node into jsdom and flush effects synchronously. */
export function renderToContainer(node: ReactNode): Rendered {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(node);
  });
  return {
    container,
    root,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

export function click(el: Element | null): void {
  if (!el) throw new Error("click: element not found");
  act(() => {
    (el as HTMLElement).click();
  });
}

export function findButton(label: string): HTMLButtonElement | null {
  return Array.from(document.body.querySelectorAll("button")).find(
    (b) => b.getAttribute("aria-label") === label || b.textContent?.trim() === label,
  ) as HTMLButtonElement | null;
}
