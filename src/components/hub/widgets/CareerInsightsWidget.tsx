import { Sparkles } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";

export default function CareerInsightsWidget() {
  return (
    <WidgetCard
      title="AI Career Insights"
      icon={Sparkles}
      action={{ label: "Open AI", href: "/ai" }}
    >
      <ul className="space-y-2">
        {["Resume analysis", "Job match", "Skill suggestions"].map((item) => (
          <li
            key={item}
            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
          >
            <span className="text-xs font-medium text-slate-400">{item}</span>
            <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Pending
            </span>
          </li>
        ))}
      </ul>
      <div className="mt-3">
        <EmptyState
          title="No insights yet"
          description="Run an AI resume analysis to get tailored career suggestions."
          cta={{ label: "Run analysis", href: "/ai" }}
        />
      </div>
    </WidgetCard>
  );
}
