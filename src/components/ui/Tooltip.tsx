import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Lightweight tooltip: CSS-only on hover/focus, screen-reader friendly
 * via aria-describedby. No library dependency.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "group/tt relative inline-flex",
        className
      )}
    >
      {children}
      <span
        role="tooltip"
        className={clsx(
          "pointer-events-none absolute left-1/2 z-40 w-max max-w-60 -translate-x-1/2 rounded-md",
          "border border-subtle bg-surface-overlay px-2.5 py-1.5 text-meta text-ink",
          "shadow-md opacity-0 transition-opacity duration-150",
          "group-hover/tt:opacity-100 group-focus-within/tt:opacity-100",
          side === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        )}
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
