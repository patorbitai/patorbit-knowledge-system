import Link from "next/link";
import { Sparkles, BarChart3, Target, Lightbulb, ArrowRight } from "lucide-react";
import WidgetCard from "./WidgetCard";

const insights = [
  {
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    label: "Resume Analysis",
    desc: "AI-powered review of your resume strengths",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: <Target className="w-3.5 h-3.5" />,
    label: "Job Match Score",
    desc: "How well your profile matches target roles",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: <Lightbulb className="w-3.5 h-3.5" />,
    label: "Skill Suggestions",
    desc: "Recommendations to strengthen your profile",
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function CareerInsightsWidget() {
  return (
    <WidgetCard
      title="AI Career Insights"
      icon={Sparkles}
      action={{ label: "Open AI", href: "/ai" }}
    >
      <div className="space-y-2">
        {insights.map((item) => (
          <Link
            key={item.label}
            href="/ai"
            className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all group"
          >
            <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white shrink-0 shadow-sm`}>
              {item.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {item.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed">
                {item.desc}
              </p>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600 group-hover:text-gray-400 dark:group-hover:text-slate-400 transition-all group-hover:translate-x-0.5 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Empty state hint */}
      <div className="mt-3 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-4 py-4 text-center">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/15 dark:to-blue-500/15 flex items-center justify-center mx-auto mb-2">
          <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
        </div>
        <p className="text-[11px] font-medium text-gray-600 dark:text-slate-300">
          Turn your career data into insights
        </p>
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 leading-relaxed">
          Run Career Intelligence to uncover patterns and opportunities from your professional profile.
        </p>
        <Link
          href="/ai"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 px-3.5 py-1.5 text-[11px] font-semibold text-cyan-600 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 transition-colors"
        >
          Run analysis
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </WidgetCard>
  );
}
