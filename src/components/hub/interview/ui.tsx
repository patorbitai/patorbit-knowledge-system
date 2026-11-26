import Link from "next/link";
import clsx from "clsx";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

/** Shared presentational pieces for the Interview Preparation workspace. */

const LINK_VARIANTS = {
  primary: "bg-brand text-brand-contrast hover:opacity-90 border border-transparent",
  secondary: "bg-surface text-ink border border-line hover:bg-surface-raised hover:border-strong",
  ghost: "bg-transparent text-ink-secondary border border-transparent hover:bg-white/[0.06] hover:text-ink",
} as const;

const LINK_SIZES = {
  sm: "h-8 px-3 text-label",
  md: "h-9 px-4 text-body",
  lg: "h-11 px-5 text-body font-semibold",
} as const;

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof LINK_VARIANTS;
  size?: keyof typeof LINK_SIZES;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        LINK_VARIANTS[variant],
        LINK_SIZES[size],
        className,
      )}
    >
      {icon}
      {children}
    </Link>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "neutral" | "brand";
}) {
  return (
    <div className="rounded-xl border border-subtle bg-surface p-4">
      <p className="text-meta font-semibold uppercase tracking-wider text-ink-muted">{label}</p>
      <p className={clsx("mt-1.5 text-2xl font-semibold tabular-nums", tone === "brand" ? "text-brand" : "text-ink")}>
        {value}
      </p>
      {hint && <p className="mt-1 text-meta text-ink-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Preparation progress"}
        className="h-1.5 w-full overflow-hidden rounded-pill bg-white/[0.08]"
      >
        <div className="h-full rounded-pill bg-brand transition-[width]" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

export interface TrendPoint {
  date: string;
  score: number;
  sessionType: string;
}

/**
 * Score progression drawn from real completed sessions only.
 * Renders an explicit empty state instead of a decorative chart.
 */
export function ScoreTrend({ points }: { points: TrendPoint[] }) {
  if (points.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line p-4 text-secondary-size text-ink-muted">
        Complete a mock interview to start tracking your score progression.
      </p>
    );
  }

  // One completed session is a fact, not a trend — a single point on a line
  // chart reads as a broken chart, so show the number plainly instead.
  if (points.length === 1) {
    const only = points[0];
    return (
      <div className="flex items-baseline gap-3">
        <p className="text-3xl font-semibold tabular-nums text-brand">{only.score}%</p>
        <p className="text-label text-ink-secondary">
          {only.sessionType === "mock" ? "Mock interview" : "Practice set"} ·{" "}
          {new Date(only.date).toLocaleDateString()}
        </p>
      </div>
    );
  }

  const width = 520;
  const height = 140;
  const padding = 12;
  const max = 100;
  const step = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coords = points.map((point, index) => {
    const x = padding + index * step;
    const y = height - padding - (Math.max(0, Math.min(max, point.score)) / max) * (height - padding * 2);
    return { x, y, point };
  });
  const path = coords.map((coord, index) => `${index === 0 ? "M" : "L"}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Score progression across ${points.length} completed sessions`}
        className="h-36 w-full"
      >
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-subtle, #2a2a2a)" strokeWidth="1" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="var(--border-subtle, #2a2a2a)" strokeDasharray="3 4" strokeWidth="1" />
        <path d={path} fill="none" stroke="var(--color-brand, #7c5cff)" strokeWidth="2" strokeLinejoin="round" />
        {coords.map((coord) => (
          <circle key={`${coord.point.date}-${coord.point.score}`} cx={coord.x} cy={coord.y} r="3" fill="var(--color-brand, #7c5cff)">
            <title>{`${coord.point.score}% — ${new Date(coord.point.date).toLocaleDateString()}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-meta text-ink-muted">
        <span>{new Date(points[0].date).toLocaleDateString()}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export function TopicPill({ label, average }: { label: string; average: number }) {
  const tone = average >= 4 ? "success" : average >= 3 ? "warning" : "danger";
  return (
    <span className="inline-flex items-center gap-2 rounded-md border border-subtle bg-surface-raised px-2.5 py-1 text-label text-ink">
      {label}
      <Badge tone={tone}>{average.toFixed(1)}/5</Badge>
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white/[0.02] p-6 text-center">
      <h3 className="text-card text-ink">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-md text-secondary-size text-ink-secondary">{description}</p>
      {actions && <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}
