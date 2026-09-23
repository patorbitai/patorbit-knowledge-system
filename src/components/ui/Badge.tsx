import clsx from "clsx";
import type { ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info";

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "bg-white/[0.06] text-ink-secondary border-line",
  brand: "bg-brand-soft text-brand border-transparent",
  success:
    "bg-[var(--status-success-soft)] text-success border-transparent",
  warning:
    "bg-[var(--status-warning-soft)] text-warning border-transparent",
  danger: "bg-[var(--status-danger-soft)] text-danger border-transparent",
  info: "bg-[var(--status-info-soft)] text-info border-transparent",
};

type BadgeProps = {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
  title?: string;
  className?: string;
  children: ReactNode;
};

/** Small inline status chip. Color = meaning, never decoration. */
export function Badge({
  tone = "neutral",
  dot,
  icon,
  title,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 text-meta font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
        />
      )}
      {icon}
      {children}
    </span>
  );
}

/**
 * Domain status badge for application/job lifecycle states.
 * Maps product statuses onto the meaning-driven tone palette.
 */
export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  let tone: BadgeTone = "neutral";
  if (["accepted", "offer", "verified", "exported", "hired"].includes(s))
    tone = "success";
  else if (["applied", "interview", "screening", "in review"].includes(s))
    tone = "info";
  else if (["pending", "follow up", "awaiting"].includes(s)) tone = "warning";
  else if (["rejected", "failed", "blocked", "declined"].includes(s))
    tone = "danger";

  return (
    <Badge tone={tone} dot>
      {status}
    </Badge>
  );
}

/**
 * Provenance badge — one of Patorbit's differentiating concepts, in plain
 * language. NEVER implies third-party verification that does not exist:
 * "Verified" is reserved for a real, supported verification mechanism.
 */
export type Provenance =
  | "imported"
  | "user-provided"
  | "ai-suggested"
  | "verified";

const PROVENANCE_COPY: Record<
  Provenance,
  { label: string; tone: BadgeTone; title: string }
> = {
  imported: {
    label: "Imported",
    tone: "info",
    title: "Extracted from an uploaded resume or document.",
  },
  "user-provided": {
    label: "Added by you",
    tone: "neutral",
    title: "You entered this yourself.",
  },
  "ai-suggested": {
    label: "AI suggested",
    tone: "warning",
    title: "Suggested by Patorbit — review before relying on it.",
  },
  verified: {
    label: "Verified",
    tone: "success",
    title: "Independently verified through a supported verification.",
  },
};

export function ProvenanceBadge({
  provenance,
  showTitle = true,
}: {
  provenance: Provenance;
  showTitle?: boolean;
}) {
  const meta = PROVENANCE_COPY[provenance];
  return (
    <Badge
      tone={meta.tone}
      title={showTitle ? meta.title : undefined}
    >
      {meta.label}
    </Badge>
  );
}

export default Badge;
