import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from "lucide-react";

/* ───────────────────────────── Alert ─────────────────────────────────── */

export type AlertTone = "info" | "success" | "warning" | "danger";

const ALERT_STYLES: Record<
  AlertTone,
  { wrap: string; icon: LucideIcon }
> = {
  info: { wrap: "border-info/30 bg-[var(--status-info-soft)] text-ink", icon: Info },
  success: {
    wrap: "border-success/30 bg-[var(--status-success-soft)] text-ink",
    icon: CheckCircle2,
  },
  warning: {
    wrap: "border-warning/30 bg-[var(--status-warning-soft)] text-ink",
    icon: AlertTriangle,
  },
  danger: {
    wrap: "border-danger/30 bg-[var(--status-danger-soft)] text-ink",
    icon: XCircle,
  },
};

/**
 * Polished failure/information state. Every message must cover:
 * what happened, what was preserved, what to do next.
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: AlertTone;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const style = ALERT_STYLES[tone];
  const Icon = style.icon;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={clsx(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        style.wrap,
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold">{title}</p>
        {children && (
          <div className="mt-0.5 text-secondary-size text-ink-secondary">
            {children}
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ───────────────────────────── Skeleton ──────────────────────────────── */

/** Skeleton loader — use instead of bare spinners for content areas. */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={clsx(
        "animate-pulse rounded-md bg-white/[0.06] dark:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}

/** Skeleton block shaped like a card list — dashboard/profile/jobs loading. */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-subtle bg-surface p-5">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={clsx("h-3", i === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────────── EmptyState ────────────────────────────── */

type EmptyStateCta =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

/**
 * Every empty state must answer: (1) what this area does,
 * (2) why it matters, (3) what to do next. Never "Nothing here yet".
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  cta,
  secondaryCta,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  cta?: EmptyStateCta;
  secondaryCta?: EmptyStateCta;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-white/[0.02] px-6 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      )}
      <div className="max-w-sm">
        <p className="text-card text-ink">{title}</p>
        <p className="mt-1 text-secondary-size text-ink-secondary leading-relaxed">
          {description}
        </p>
      </div>
      {(cta || secondaryCta) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {cta &&
            ("href" in cta && cta.href ? (
              <Link
                href={cta.href}
                className="inline-flex h-8 items-center rounded-md bg-brand px-3.5 text-label font-semibold text-brand-contrast transition-opacity hover:opacity-90"
              >
                {cta.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={"onClick" in cta ? cta.onClick : undefined}
                className="inline-flex h-8 cursor-pointer items-center rounded-md bg-brand px-3.5 text-label font-semibold text-brand-contrast transition-opacity hover:opacity-90"
              >
                {cta.label}
              </button>
            ))}
          {secondaryCta &&
            ("href" in secondaryCta && secondaryCta.href ? (
              <Link
                href={secondaryCta.href}
                className="inline-flex h-8 items-center rounded-md border border-line bg-surface px-3.5 text-label font-medium text-ink-secondary transition-colors hover:border-strong hover:text-ink"
              >
                {secondaryCta.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={"onClick" in secondaryCta ? secondaryCta.onClick : undefined}
                className="inline-flex h-8 cursor-pointer items-center rounded-md border border-line bg-surface px-3.5 text-label font-medium text-ink-secondary transition-colors hover:border-strong hover:text-ink"
              >
                {secondaryCta.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
