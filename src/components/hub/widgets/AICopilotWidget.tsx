import Link from "next/link";
import { Bot } from "lucide-react";
import WidgetCard from "./WidgetCard";

export default function AICopilotWidget() {
  return (
    <WidgetCard
      title="AI Career Copilot"
      icon={Bot}
      action={{ label: "Open AI", href: "/ai" }}
    >
      <div className="flex flex-col gap-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Your AI career copilot analyzes your profile and surfaces opportunities — job matches,
          skill gaps, and resume improvements tailored to your goals.
        </p>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
          {["Resume analysis", "Job match scoring", "Skill gap detection"].map((item) => (
            <div key={item} className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-white/[0.04]">
                <svg className="h-3 w-3 text-slate-600" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                  <circle cx="6" cy="6" r="5" />
                  <path d="M4 6h4M6 4v4" />
                </svg>
              </span>
              <span className="text-xs text-slate-600">{item}</span>
              <span className="ml-auto rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                Soon
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/ai"
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:text-cyan-300"
        >
          Add a resume to unlock AI insights →
        </Link>
      </div>
    </WidgetCard>
  );
}
