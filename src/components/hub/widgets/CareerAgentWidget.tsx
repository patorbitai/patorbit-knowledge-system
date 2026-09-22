"use client";

import Link from "next/link";
import { useResumeBuilder } from "@/store/resume-builder";
import { useFeatureAccess } from "@/components/providers/FeatureAccessProvider";
import {
  Target,
  FileText,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Briefcase,
  Lightbulb,
} from "lucide-react";
import { clsx } from "clsx";
import { ImportButton } from "@/components/resume-builder/ImportButton";

type CareerAction = {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  available: boolean;
  comingSoon?: boolean;
};

const CAREER_ACTIONS: CareerAction[] = [
  {
    id: "tailor-resume",
    label: "Tailor a Resume",
    description: "Paste a job description and Patorbit will tailor your resume using your existing experience.",
    icon: Target,
    href: "/resume-builder",
    available: true,
  },
  {
    id: "find-opportunities",
    label: "Find Opportunities",
    description: "Discover roles that match your professional profile and career goals.",
    icon: Briefcase,
    href: "/jobs/new",
    available: true,
  },
  {
    id: "improve-profile",
    label: "Improve Professional Profile",
    description: "Strengthen your Professional Identity with AI-assisted recommendations.",
    icon: Lightbulb,
    href: "/ai",
    available: true,
  },
  {
    id: "interview-prep",
    label: "Prepare for an Interview",
    description: "Get personalized interview questions and preparation guidance.",
    icon: MessageSquare,
    href: "/ai",
    available: false,
    comingSoon: true,
  },
];

export default function CareerAgentWidget() {
  const { hasFeature } = useFeatureAccess();
  const activeResume = useResumeBuilder((s) => s.activeResumeId ? s.resumes.find(r => r.resumeId === s.activeResumeId) : null);

  const hasActiveResume = !!activeResume && !!(activeResume.name || activeResume.title || activeResume.email || activeResume.summary || activeResume.experience?.length || activeResume.education?.length || activeResume.skills?.length);

  const isPro = hasFeature("aiAdvanced");

  return (
    <section aria-labelledby="career-agent-heading" className="space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h2 id="career-agent-heading" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
            Career Agent
          </h2>
          <p className="text-sm text-gray-500 dark:text-slate-400 max-w-2xl">
            Tell Patorbit what you want to accomplish with your career. Choose an action to get started.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            AI Powered
          </span>
        </div>
      </header>

      {/* Primary Action Card - Tailor Resume (if resume exists) */}
      {hasActiveResume && (
        <Link
          href="/resume-builder"
          className="group block rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#080C18] p-6 transition-all hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-lg"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20">
              <Target className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                Tailor a Resume to a Job
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Paste a job description and Patorbit will identify relevant requirements and tailor your resume using your existing experience.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  Active Resume: {activeResume.resumeName || "Untitled"}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                  {activeResume.templateId}
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">
                Open Builder
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="list" aria-label="Career actions">
        {CAREER_ACTIONS.map((action) => {
          const isAvailable = action.available && (action.id !== "tailor-resume" || hasActiveResume);
          const isPrimary = action.id === "tailor-resume";

          return (
            <article
              key={action.id}
              role="listitem"
              className={clsx(
                "group relative rounded-2xl border p-4 transition-all",
                isAvailable
                  ? "border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#080C18] hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-md"
                  : "border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] cursor-not-allowed opacity-60",
                isPrimary && "border-cyan-200 dark:border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-500/[0.03]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={clsx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  isAvailable
                    ? action.id === "tailor-resume"
                      ? "bg-gradient-to-br from-cyan-500 to-blue-600"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                    : "bg-gray-200 dark:bg-white/[0.06]"
                )}>
                  <action.icon className={clsx("h-5 w-5", isAvailable ? "text-white" : "text-gray-400 dark:text-slate-500")} aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={clsx("font-semibold text-sm", isAvailable ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-slate-500")}>
                    {action.label}
                    {action.comingSoon && (
                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                        Soon
                      </span>
                    )}
                  </h4>
                  <p className="mt-1 text-[12px] leading-relaxed text-gray-500 dark:text-slate-400 line-clamp-2">
                    {action.description}
                  </p>
                  {isAvailable && (
                    <Link
                      href={action.href}
                      className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors"
                    >
                      Start
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  )}
                  {!isAvailable && !action.comingSoon && (
                    <p className="mt-3 text-[11px] text-gray-400 dark:text-slate-500">
                      Complete your resume first to enable this action.
                    </p>
                  )}
                  {!isAvailable && action.comingSoon && (
                    <p className="mt-3 text-[11px] text-gray-400 dark:text-slate-500">
                      This capability is under development.
                    </p>
                  )}
                </div>
              </div>
              {isPrimary && isAvailable && (
                <div className="absolute top-4 right-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-cyan-500 text-white shadow-sm">
                  Primary
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* Empty state for no resume */}
      {!hasActiveResume && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-8 text-center">
          <FileText className="h-10 w-10 mx-auto text-gray-300 dark:text-slate-600 mb-3" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Create a Resume First
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 max-w-md mx-auto">
            The Career Agent works best when you have an active resume. Create or import one to unlock personalized actions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/resume-builder"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-sm font-semibold text-white transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Create Resume
            </Link>
            <ImportButton variant="card" label="Upload an existing resume" />
          </div>
        </div>
      )}

      {/* Pro feature notice */}
      {!isPro && hasActiveResume && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Lightbulb className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Unlock Advanced Career Intelligence
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                Upgrade to Professional for AI-powered interview preparation, skill gap analysis, career trajectory modeling, and personalized opportunity matching.
              </p>
              <Link
                href="/pricing"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:underline"
              >
                View plans
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}