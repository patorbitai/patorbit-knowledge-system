import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type CardVariant = "default" | "raised" | "interactive" | "ghost";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  padding?: "none" | "sm" | "md" | "lg";
};

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-surface border-subtle",
  raised: "bg-surface border-subtle shadow-md",
  interactive:
    "bg-surface border-subtle transition-colors hover:border-strong hover:shadow-sm cursor-pointer",
  ghost: "bg-white/[0.03] border border-dashed border-line",
};

const PADDING_CLASSES = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
} as const;

/**
 * Canonical card surface. One card style for the whole product —
 * do not re-create bordered boxes per page.
 */
export default function Card({
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border text-ink",
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/** Card header: title + optional description + optional right-side action. */
export function CardHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <header className={clsx("mb-4 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
              <Icon className="h-4 w-4" />
            </span>
          )}
          <h2 className="text-card text-ink">{title}</h2>
        </div>
        {description && (
          <p className="mt-1 text-secondary-size text-ink-secondary">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
