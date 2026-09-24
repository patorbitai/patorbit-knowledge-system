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
  Trash2,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ImportButton } from "./ImportButton";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import type { SectionId } from "@/types/resume";

const sections: Array<{ id: SectionId; label: string; hint: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: "personal", label: "Profile", hint: "Identity & contact", Icon: User },
  { id: "experience", label: "Experience", hint: "Work history", Icon: Briefcase },
  { id: "education", label: "Education", hint: "Degrees, schools", Icon: GraduationCap },
  { id: "skills", label: "Skills", hint: "Chips by category", Icon: Zap },
  { id: "projects", label: "Projects", hint: "Key projects", Icon: FolderKanban },
  { id: "certifications", label: "Certifications", hint: "Credentials", Icon: Award },
  { id: "achievements", label: "Achievements", hint: "Awards & honors", Icon: Trophy },
  { id: "languages", label: "Languages", hint: "Language proficiency", Icon: Globe },
  { id: "portfolio", label: "Links", hint: "Portfolio & profiles", Icon: Link2 },
  { id: "review", label: "Review & Preview", hint: "Final check", Icon: Eye },
];

export function LeftSidebar() {
  const [hydrated, setHydrated] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
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

  const completedCount = hydrated
    ? sections.filter((s) => s.id !== "review" && sectionComplete(s.id)).length
    : 0;
  const pct = hydrated ? Math.round(progress()) : 0;

  return (
    <>
    <aside className="flex flex-col h-full overflow-hidden">
      {/* Outline navigator — compact rows, quiet active state */}
      <nav className="flex-1 py-2 px-2 space-y-px overflow-y-auto" aria-label="Resume sections">
        {sections.map(({ id, label, Icon }) => {
          const isActive = activeSection === id;
          const isComplete = id !== "review" && sectionComplete(id as Exclude<SectionId, "review">);
          const count = hydrated && sectionCounts[id] !== undefined ? sectionCounts[id] : 0;

          return (
            <div key={id}>
              <button
                onClick={() => setActiveSection(id)}
                aria-current={isActive ? "true" : undefined}
                title={label}
                className={clsx(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-left transition-colors duration-150 cursor-pointer group/section",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40",
                  isActive
                    ? "bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                )}
              >
                <Icon className={clsx("w-3.5 h-3.5 shrink-0", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400 dark:text-slate-500")} />
                <span className="flex-1 min-w-0 text-xs truncate">{label}</span>
                {count > 0 && (
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 tabular-nums">{count}</span>
                )}
                {hydrated && id !== "review" && (
                  <span
                    className={clsx(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isComplete ? "bg-emerald-400" : "bg-gray-300 dark:bg-slate-700",
                    )}
                    title={isComplete ? "Complete" : "Needs content"}
                  />
                )}
              </button>
              {/* Experience sub-outline */}
              {id === "experience" && isActive && hydrated && resume.experience.length > 0 && (
                <div className="ml-6 mt-0.5 space-y-0.5 border-l border-gray-200 dark:border-white/[0.06] pl-2.5">
                  {resume.experience.slice(0, 4).map((exp) => (
                    <p key={exp.id} className="text-[10px] text-gray-400 dark:text-slate-500 truncate leading-5">
                      {exp.company || exp.position || "New role"}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer — compact readiness + secondary utilities */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-white/[0.06] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-gray-400 dark:text-slate-500">Readiness</span>
          <span className="font-medium text-gray-600 dark:text-slate-300 tabular-nums">
            {pct}% · {completedCount}/9
          </span>
        </div>
        <div className="h-1 rounded-full bg-gray-200 dark:bg-white/[0.06] overflow-hidden" aria-hidden="true">
          <div
            className="h-full rounded-full bg-cyan-500 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-1 pt-0.5">
          <ImportButton label="Import resume" />
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium text-gray-400 dark:text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
      </div>
    </aside>

      <ConfirmationDialog
        open={showClearConfirm}
        title="Clear this resume?"
        message="This will remove all content from the currently selected resume. Your other resumes will not be affected."
        confirmLabel="Clear Resume"
        variant="danger"
        onConfirm={() => { setShowClearConfirm(false); useResumeBuilder.getState().resetResume(); }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </>
  );
}