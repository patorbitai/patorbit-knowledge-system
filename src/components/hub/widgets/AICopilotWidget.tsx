import Link from "next/link";
import { Target, Sparkles, FileText, ArrowRight } from "lucide-react";

/**
 * C41: Real AI dashboard card — replaces the "Coming Soon" placeholder.
 * Shows the primary AI workflow (Tailor to Job) and secondary actions.
 * Links directly to the resume builder where all AI features live.
 */
export default function AICopilotWidget() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-3">
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
          className="group block rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50 dark:bg-purple-500/[0.06] p-4 hover:bg-purple-100 dark:hover:bg-purple-500/[0.1] transition-all"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Tailor Resume to a Job
              </p>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                Paste a job description and Patorbit will identify relevant requirements and tailor your resume using your existing experience.
              </p>
              <div className="flex items-center gap-1 mt-2 text-[11px] font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                Open Builder
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Secondary actions */}
      <div className="px-5 pb-5 space-y-2">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
          Also available in the builder
        </p>

        {[
          {
            icon: <Sparkles className="w-3.5 h-3.5" />,
            label: "Improve Summary",
            desc: "Rewrite or improve tone of your professional summary",
            color: "text-cyan-500",
          },
          {
            icon: <FileText className="w-3.5 h-3.5" />,
            label: "Improve Bullet Points",
            desc: "Strengthen experience bullets with better impact language",
            color: "text-blue-500",
          },
        ].map((action) => (
          <Link
            key={action.label}
            href="/resume-builder"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors group"
          >
            <span className={`${action.color} opacity-70 group-hover:opacity-100 transition-opacity`}>
              {action.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300">
                {action.label}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate">
                {action.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Trust footer */}
      <div className="px-5 py-3 border-t border-gray-100 dark:border-white/[0.04] bg-gray-50 dark:bg-white/[0.01]">
        <p className="text-[10px] text-gray-400 dark:text-slate-500 leading-relaxed">
          AI uses information already in your resume. It does not verify employment, education, or certifications. Review all AI-generated changes before saving.
        </p>
      </div>
    </div>
  );
}
