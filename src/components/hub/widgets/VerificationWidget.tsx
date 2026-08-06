import { BadgeCheck } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";

const STEPS = [
  "Identity",
  "Employment",
  "Education",
  "Certifications",
];

export default function VerificationWidget() {
  return (
    <WidgetCard
      title="Credential Verification"
      icon={BadgeCheck}
      action={{ label: "Manage verification", href: "/trust" }}
    >
      <ul className="space-y-2">
        {STEPS.map((step) => (
          <li
            key={step}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <span className="text-xs font-medium text-slate-400">{step}</span>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Unverified
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <EmptyState
          title="Nothing verified yet"
          description="Verify identity, employment, and education to strengthen your profile."
          cta={{ label: "Start verification", href: "/trust" }}
        />
      </div>
    </WidgetCard>
  );
}
