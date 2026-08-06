import { BadgeCheck } from "lucide-react";
import WidgetCard from "./WidgetCard";

type VerificationStep = {
  label: string;
  status: "verified" | "pending" | "unverified";
};

const STEPS: VerificationStep[] = [
  { label: "Identity", status: "unverified" },
  { label: "Employment", status: "unverified" },
  { label: "Education", status: "unverified" },
  { label: "Certifications", status: "unverified" },
];

const STATUS_CONFIG = {
  verified: {
    label: "Verified",
    className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400",
  },
  unverified: {
    label: "Unverified",
    className: "bg-white/[0.04] text-slate-500 border border-white/[0.06]",
    dot: "bg-slate-600",
  },
};

export default function VerificationWidget() {
  const verifiedCount = STEPS.filter((s) => s.status === "verified").length;

  return (
    <WidgetCard
      title="Credential Verification"
      icon={BadgeCheck}
      action={{ label: "Manage", href: "/trust" }}
    >
      <p className="mb-3 text-xs text-slate-500">
        {verifiedCount === 0
          ? "Verify your credentials to build trust with employers."
          : `${verifiedCount} of ${STEPS.length} categories verified.`}
      </p>
      <ul className="space-y-2">
        {STEPS.map(({ label, status }) => {
          const cfg = STATUS_CONFIG[status];
          return (
            <li
              key={label}
              className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dot}`} aria-hidden="true" />
                <span className="text-xs font-medium text-slate-300">{label}</span>
              </div>
              <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cfg.className}`}>
                {cfg.label}
              </span>
            </li>
          );
        })}
      </ul>
    </WidgetCard>
  );
}
