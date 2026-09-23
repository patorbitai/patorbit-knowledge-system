"use client";

import clsx from "clsx";
import { useId, useRef, type KeyboardEvent } from "react";
import type { ReactNode } from "react";

export type TabItem = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  badge?: ReactNode;
};

/**
 * Accessible tab group (roving tabindex, arrow-key navigation).
 * One tab style for the whole product.
 */
export function Tabs({
  items,
  activeId,
  onChange,
  className,
  panelClassName,
}: {
  items: TabItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
  panelClassName?: string;
}) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((t) => t.id === activeId);
    let next = idx;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    const id = items[next].id;
    onChange?.(id);
    const el = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-tab-id="${id}"]`
    );
    el?.focus();
  };

  const active = items.find((t) => t.id === activeId) ?? items[0];

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex items-center gap-1 overflow-x-auto border-b border-subtle scrollbar-none"
      >
        {items.map((t) => {
          const selected = t.id === active?.id;
          return (
            <button
              key={t.id}
              data-tab-id={t.id}
              role="tab"
              type="button"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange?.(t.id)}
              className={clsx(
                "relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2 text-label font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand",
                selected
                  ? "text-ink"
                  : "text-ink-muted hover:text-ink-secondary"
              )}
            >
              {t.label}
              {t.badge}
              <span
                aria-hidden
                className={clsx(
                  "absolute inset-x-0 -bottom-px h-0.5 rounded-pill transition-colors",
                  selected ? "bg-brand" : "bg-transparent"
                )}
              />
            </button>
          );
        })}
      </div>
      {active && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className={clsx("focus:outline-none", panelClassName)}
        >
          {active.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
