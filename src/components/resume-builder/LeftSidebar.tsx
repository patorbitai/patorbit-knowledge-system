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
  Trash2,
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
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-slate-400">Sections complete</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {hydrated ? sections.filter((s) => s.id !== "review" && sectionComplete(s.id)).length : 0} / 9
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto">
        {sections.map(({ id, label, Icon, color }) => {
          const isActive = activeSection === id;
          const isComplete = id !== "review" && sectionComplete(id as Exclude<SectionId, "review">);

          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={clsx(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 text-left cursor-pointer",
                "focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40",
                isActive
                  ? "bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.03]",
              )}
            >
              <Icon className={clsx("w-5 h-5 shrink-0", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400 dark:text-slate-500")} />
              <span className="flex-1 truncate">
                {label}
              </span>
              {hydrated && sectionCounts[id] !== undefined && sectionCounts[id] > 0 && (
                <span className="text-xs text-gray-400 dark:text-slate-500 tabular-nums">
                  {sectionCounts[id]}
                </span>
              )}
              {hydrated && isComplete && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.08] space-y-2">
        <button
          onClick={() => {
            if (window.confirm("Clear this resume?\n\nThis will remove the content from the currently selected resume. Your other resumes will not be affected.")) {
              useResumeBuilder.getState().resetResume();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 dark:text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-3 h-3" />
          Clear Resume Data
        </button>
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Auto-saving
        </div>
      </div>
    </aside>
  );
}
