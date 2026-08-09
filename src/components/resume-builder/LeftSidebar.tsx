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
import { ImportButton } from "./ImportButton";
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
      <div className="px-4 py-4 border-b border-white/[0.06] space-y-3">
        <ProgressIndicator
          title="Resume Completion"
          value={hydrated ? progress() : 0}
          color="#22d3ee"
        />
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-500">Sections complete</span>
          <span className="text-slate-300 font-medium">
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
                "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 text-left group",
                "focus:outline-none focus:ring-1 focus:ring-blue-500/30",
                isActive
                  ? "bg-blue-500/10 text-white shadow-sm border border-blue-500/15"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent",
              )}
            >
              <div className={clsx(
                "relative flex h-7 w-7 items-center justify-center rounded-lg transition-all duration-200",
                isActive ? "bg-blue-500/15" : "bg-white/[0.04] group-hover:bg-white/[0.08]",
              )} >
                <Icon className={clsx("w-3.5 h-3.5", isActive ? "text-white" : "text-slate-500")} />
                {hydrated && isComplete && (
                  <div
                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#080C18]"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
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
      <div className="px-4 py-3 border-t border-white/[0.06] space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] text-slate-600">
          <div className="h-1 w-1 rounded-full bg-emerald-500 shadow-[0_0_4px] shadow-emerald-500/50" />
          Auto-saving enabled
        </div>
        <ImportButton />
      </div>
    </aside>
  );
}
