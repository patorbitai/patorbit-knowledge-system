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

  return (
    <aside className="flex flex-col h-full overflow-hidden">
      {/* Progress summary */}
      <div className="px-4 py-4 border-b border-[rgba(148,163,184,.14)] space-y-3">
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
                  ? "bg-gradient-to-r from-[rgba(14,165,233,0.15)] to-[rgba(59,130,246,0.15)] text-white shadow-sm border border-[rgba(34,211,238,0.3)]"
                  : "text-gray-500 dark:text-[#94a3b8] hover:text-gray-900 dark:hover:text-[#f8fafc] hover:bg-gray-100 dark:hover:bg-white/[0.04] border border-transparent",
              )}
            >
              <div className={clsx(
                "relative flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",                  isActive ? "bg-cyan-500/20 text-cyan-600 dark:text-[#22d3ee]" : "bg-gray-100 dark:bg-white/[0.04] group-hover:bg-gray-200 dark:group-hover:bg-white/[0.08]",
              )} >
                <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-cyan-600 dark:text-[#22d3ee]" : "text-gray-500 dark:text-[#94a3b8]")} />
                {hydrated && isComplete && (
                  <div
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#070d18]"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-[#22d3ee]" />}
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
      <div className="px-4 py-3 border-t border-[rgba(148,163,184,.14)] space-y-2">
        <button
          onClick={() => {
            if (window.confirm("Clear this resume?\n\nThis will remove the content from the currently selected resume. Your other resumes will not be affected.")) {
              useResumeBuilder.getState().resetResume();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium text-gray-400 dark:text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
        >
          Clear Resume Data
        </button>
        <div className="flex items-center gap-2 text-[10px] text-[#94a3b8]">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          Auto-saving enabled
        </div>
      </div>
    </aside>
  );
}
