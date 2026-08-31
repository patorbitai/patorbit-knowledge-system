"use client";

import { clsx } from "clsx";
import { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  GraduationCap,
  Zap,
  FolderKanban,
  Award,
  Trophy,
  Globe,
  Link2,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ProgressIndicator } from "./ProgressIndicator";
import type { SectionId } from "@/types/resume";

const sections: Array<{ id: SectionId; label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { id: "personal", label: "Personal Info", Icon: User, color: "#22d3ee" },
  { id: "experience", label: "Experience", Icon: Briefcase, color: "#3b82f6" },
  { id: "education", label: "Education", Icon: GraduationCap, color: "#8b5cf6" },
  { id: "skills", label: "Skills", Icon: Zap, color: "#10b981" },
  { id: "projects", label: "Projects", Icon: FolderKanban, color: "#f59e0b" },
  { id: "certifications", label: "Certifications", Icon: Award, color: "#f97316" },
  { id: "achievements", label: "Achievements", Icon: Trophy, color: "#ef4444" },
  { id: "languages", label: "Languages", Icon: Globe, color: "#ec4899" },
  { id: "portfolio", label: "Portfolio", Icon: Link2, color: "#14b8a6" },
  { id: "review", label: "Review & Preview", Icon: Eye, color: "#6366f1" },
];

export function LeftSidebar() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  const activeSection = useResumeBuilder((s) => s.activeSection);
  const setActiveSection = useResumeBuilder((s) => s.setActiveSection);
  const sectionComplete = useResumeBuilder((s) => s.sectionComplete);
  const progress = useResumeBuilder((s) => s.progress);
  const resume = useResumeBuilder((s) => s.resume);

  const sectionCounts: Record<string, number> = {
    experience: resume.experience?.length || 0,
    education: resume.education?.length || 0,
    skills: resume.skills?.length || 0,
    projects: resume.projects?.length || 0,
    certifications: resume.certifications?.length || 0,
    achievements: resume.achievements?.length || 0,
    languages: resume.languages?.length || 0,
    portfolio: resume.portfolio?.length || 0,
  };

  return (
    <aside className="flex flex-col h-full overflow-hidden">
      {/* Progress summary */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-white/[0.08] space-y-3">
        <ProgressIndicator
          title="Resume Completion"
          value={hydrated ? progress() : 0}
          color="#22d3ee"
        />
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-500 dark:text-[#94a3b8]">Sections complete</span>
          <span className="text-gray-900 dark:text-[#f8fafc] font-medium">
            {hydrated ? sections.filter((s) => s.id !== "review" && sectionComplete(s.id)).length : 0} / 9
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-1 overflow-y-auto">
        {sections.map(({ id, label, Icon, color }) => {
          const isActive = activeSection === id;
          const isComplete = id !== "review" && sectionComplete(id as Exclude<SectionId, "review">);

          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={clsx(
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 text-left group cursor-pointer",
                "focus:outline-none focus:ring-1 focus:ring-cyan-500/30",
                isActive
                  ?                "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-gray-900 dark:text-white shadow-sm border border-cyan-500/30"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.04] border border-transparent",
              )}
            >
              <div className={clsx(
                "relative flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",                  isActive ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400" : "bg-gray-100 dark:bg-white/[0.04] group-hover:bg-gray-200 dark:group-hover:bg-white/[0.08]",
              )} >
                <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-gray-500 dark:text-slate-400")} />
                {hydrated && isComplete && (
                  <div
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-[#070d18]"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              <span className="flex-1">
                {label}
                {hydrated && sectionCounts[id] !== undefined && sectionCounts[id] > 0 && (
                  <span className="ml-1.5 text-[10px] text-gray-400 dark:text-slate-500 font-normal">
                    {sectionCounts[id]}
                  </span>
                )}
              </span>
              {isActive && <ChevronRight className="w-3 h-3 text-cyan-500 dark:text-cyan-400" />}
              {hydrated && isComplete && (
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-white/[0.08] space-y-2">
        <button
          onClick={() => {
            if (window.confirm("Clear this resume?\n\nThis will remove the content from the currently selected resume. Your other resumes will not be affected.")) {
              useResumeBuilder.getState().resetResume();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 transition-all cursor-pointer"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Clear Resume Data
        </button>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-slate-400">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Auto-saving
        </div>
      </div>
    </aside>
  );
}
