import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * Vertical timeline — used for experience, trust timeline, activity feeds.
 * Marker tone follows the meaning palette (success/warning/neutral/brand).
 */
export function Timeline({
  items,
  className,
}: {
  items: {
    id: string;
    tone?: "neutral" | "brand" | "success" | "warning" | "danger";
    content: ReactNode;
    meta?: ReactNode;
  }[];
  className?: string;
}) {
  const TONE_DOT = {
    neutral: "bg-ink-muted",
    brand: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  } as const;

  return (
    <ol className={clsx("relative space-y-5", className)}>
      {items.map((item, i) => (
        <li key={item.id} className="relative flex gap-3.5">
          {/* rail */}
          {i < items.length - 1 && (
            <span
              aria-hidden
              className="absolute left-[5px] top-4 h-full w-px bg-line"
            />
          )}
          <span
            aria-hidden
            className={clsx(
              "relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-surface",
              TONE_DOT[item.tone ?? "neutral"]
            )}
          />
          <div className="min-w-0 flex-1 pb-1">
            {item.meta && (
              <div className="mb-0.5 text-meta text-ink-muted">{item.meta}</div>
            )}
            <div className="text-body text-ink">{item.content}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default Timeline;
