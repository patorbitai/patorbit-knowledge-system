import clsx from "clsx";

/** Semantic ramp: strong >= 75, partial 40–74, gap < 40. Never a rainbow. */
export function matchTone(value: number): "strong" | "partial" | "gap" {
  if (value >= 75) return "strong";
  if (value >= 40) return "partial";
  return "gap";
}

const TONE_VAR = {
  strong: "var(--match-strong)",
  partial: "var(--match-partial)",
  gap: "var(--match-gap)",
} as const;

/**
 * Match score summary — a clear number, a supporting statement, and a
 * restrained ring. The score is never the whole experience; pair it with
 * "why" and "what to do next".
 */
export function ScoreIndicator({
  value,
  label = "match",
  size = "md",
  statement,
  className,
}: {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  statement?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const tone = matchTone(clamped);
  const dims = { sm: 64, md: 96, lg: 128 }[size];
  const stroke = size === "sm" ? 5 : size === "md" ? 7 : 9;
  const r = (dims - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={clsx("flex flex-col items-center gap-2", className)}
      role="img"
      aria-label={`${clamped}% ${label}`}
    >
      <div className="relative" style={{ width: dims, height: dims }}>
        <svg
          width={dims}
          height={dims}
          viewBox={`0 0 ${dims} ${dims}`}
          className="-rotate-90"
          aria-hidden
        >
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke="var(--match-track)"
            strokeWidth={stroke}
          />
          <circle
            cx={dims / 2}
            cy={dims / 2}
            r={r}
            fill="none"
            stroke={TONE_VAR[tone]}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={clsx(
              "tnum text-ink",
              size === "sm" && "text-lg font-bold",
              size === "md" && "text-3xl font-bold",
              size === "lg" && "text-5xl font-bold"
            )}
          >
            {clamped}
            <span className="text-[0.55em] font-semibold text-ink-secondary">
              %
            </span>
          </span>
          {size !== "sm" && (
            <span className="text-meta text-ink-muted">{label}</span>
          )}
        </div>
      </div>
      {statement && (
        <p className="text-secondary-size text-ink-secondary text-center">
          {statement}
        </p>
      )}
    </div>
  );
}

/** Linear progress bar. Determinate only — never fake progress. */
export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  label,
  className,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "strong" | "partial" | "gap" | "success";
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const color =
    tone === "brand"
      ? "var(--brand)"
      : tone === "success"
        ? "var(--status-success)"
        : TONE_VAR[tone];

  return (
    <div className={clsx("w-full", className)}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-label text-ink-secondary">{label}</span>
          <span className="tnum text-label text-ink-secondary">
            {Math.round(pct)}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-1.5 w-full overflow-hidden rounded-pill bg-match-track"
      >
        <div
          className="h-full rounded-pill transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default ScoreIndicator;
