import Link from "next/link";
import { Target, Sparkles, FileText, ArrowRight, Wand2 } from "lucide-react";

/**
 * Premium AI dashboard card — the primary AI workflow entry point.
 * Shows "Tailor to Job" as the hero action and secondary AI tools below.
 */
export default function AICopilotWidget() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-[#080C18] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
              AI Resume Tools
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
              Improve your resume with AI assistance
            </p>
          </div>
        </div>
      </div>

      {/* Primary action — Tailor to Job */}
      <div className="px-5 pb-4">
        <Link
          href="/resume-builder"
          className="group relative block rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-purple-500/10"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-purple-500/5 to-transparent dark:from-purple-500/15 dark:via-purple-500/5 dark:to-transparent" />
          <div className="absolute inset-0 border border-purple-200/60 dark:border-purple-500/20 rounded-xl" />

          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md shadow-purple-500/20">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white">
                  Tailor Resume to a Job
                </p>
                <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Paste a job description and Patorbit will identify relevant requirements and tailor your resume using your existing experience.
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  Open Builder
                  <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary actions */}
      <div className="px-5 pb-4 space-y-1">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Also available in the builder
        </p>

        {[
          {
            icon: <Wand2 className="w-3.5 h-3.5" />,
            label: "Improve Summary",
            desc: "Rewrite or improve tone of your professional summary",
            gradient: "from-cyan-500 to-blue-500",
          },
          {
            icon: <FileText className="w-3.5 h-3.5" />,
            label: "Improve Bullet Points",
            desc: "Strengthen experience bullets with better impact language",
            gradient: "from-blue-500 to-indigo-500",
          },
        ].map((action) => (
          <Link
            key={action.label}
            href="/resume-builder"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all group"
          >
            <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shrink-0 shadow-sm`}>
              {action.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-gray-700 dark:text-slate-200 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {action.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate leading-relaxed">
                {action.desc}
              </p>
            </div>
            <ArrowRight className="w-3 h-3 text-gray-300 dark:text-slate-600 group-hover:text-gray-400 dark:group-hover:text-slate-400 transition-all group-hover:translate-x-0.5 shrink-0" />
          </Link>
        ))}
      </div>

      {/* Trust footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50/50 dark:bg-white/[0.01]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            AI uses your existing information. All changes require your approval.
          </p>
          <Link
            href="/ai"
            className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
          >
            Open AI Workspace
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
