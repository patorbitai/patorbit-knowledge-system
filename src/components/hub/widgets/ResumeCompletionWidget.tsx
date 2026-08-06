import { FileText } from "lucide-react";
import WidgetCard from "./WidgetCard";
import EmptyState from "./EmptyState";

const PERCENT = 0;

export default function ResumeCompletionWidget() {
  return (
    <WidgetCard
      title="Resume Completion"
      icon={FileText}
      action={{ label: "Edit resume", href: "/resume-builder" }}
    >
      <div className="flex items-center gap-5">
        {/* Progress ring */}
        <div className="relative h-20 w-20 shrink-0">
          <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="7"
              className="stroke-white/[0.06]"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - PERCENT / 100)}
              className="stroke-cyan-400"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
            {PERCENT}%
          </span>
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Your resume is a blank canvas. Add your experience, education, and
          skills to build a complete professional profile.
        </p>
      </div>
      <div className="mt-4">
        <EmptyState
          title="No resume yet"
          description="Start from scratch or import an existing resume."
          cta={{ label: "Start building", href: "/resume-builder" }}
        />
      </div>
    </WidgetCard>
  );
}
