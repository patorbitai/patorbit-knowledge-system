import { Clock } from "lucide-react";
import WidgetCard from "./WidgetCard";

const PLACEHOLDER_ITEMS = [
  { label: "Resume updated", detail: "Changes will appear here" },
  { label: "Credential verified", detail: "Verifications will appear here" },
  { label: "Passport viewed", detail: "Passport activity will appear here" },
];

export default function ActivityWidget() {
  return (
    <WidgetCard title="Recent Activity" icon={Clock}>
      <ul className="space-y-2" aria-label="Recent activity — no items yet">
        {PLACEHOLDER_ITEMS.map(({ label, detail }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-lg border border-white/[0.04] bg-white/[0.01] px-3 py-2.5"
            aria-hidden="true"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/[0.12] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-600">{label}</p>
              <p className="text-[11px] text-slate-700">{detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-center text-[11px] text-slate-600">
        Activity will appear as you use Patorbit.
      </p>
    </WidgetCard>
  );
}
