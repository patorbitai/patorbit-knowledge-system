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
  Sparkles,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { ProgressIndicator } from "./ProgressIndicator";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";
import type { SectionId } from "@/types/resume";

const sections: Array<{ id: SectionId; label: string; hint: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = [
  { id: "personal", label: "Profile", hint: "Identity & contact", Icon: User, color: "#22d3ee" },
  { id: "experience", label: "Experience", hint: "Work history", Icon: Briefcase, color: "#3b82f6" },
  { id: "education", label: "Education", hint: "Degrees, schools", Icon: GraduationCap, color: "#8b5cf6" },
  { id: "skills", label: "Skills", hint: "Chips by category", Icon: Zap, color: "#10b981" },
  { id: "projects", label: "Projects", hint: "Key projects", Icon: FolderKanban, color: "#f59e0b" },
  { id: "certifications", label: "Certifications", hint: "Credentials", Icon: Award, color: "#f97316" },
  { id: "achievements", label: "Achievements", hint: "Awards & honors", Icon: Trophy, color: "#ef4444" },
  { id: "languages", label: "Languages", hint: "Language proficiency", Icon: Globe, color: "#ec4899" },
  { id: "portfolio", label: "Links", hint: "Portfolio & profiles", Icon: Link2, color: "#14b8a6" },
  { id: "review", label: "Review & Preview", hint: "Final check", Icon: Eye, color: "#6366f1" },
];

/** Build data-driven readiness suggestions from the ACTUAL resume state. */
function readinessSuggestions(resume: ReturnType<typeof useResumeBuilder.getState>["resume"]): string[] {
  const out: string[] = [];
  if (!resume.social.linkedin && !resume.social.github && !resume.social.website) {
    out.push("Add a LinkedIn or portfolio link");
  }
  if (resume.skills.length < 5) {
    out.push("Add more skills to improve keyword matching");
  }
  if (resume.projects.length === 0) {
    out.push("Add a project to showcase your hands-on work");
  }
  if (resume.certifications.length === 0) {
    out.push("Add a certification to boost credibility");
  }
  if (!resume.summary) {
    out.push("Write a professional summary");
  }
  const measurable = resume.experience.flatMap((e) => e.bulletPoints ?? [])
    .some((b) => /\d/.test(b));
  if (!measurable && resume.experience.length > 0) {
    out.push("Add measurable outcomes (numbers, %, time saved) to achievements");
  }
  return out.slice(0, 3);
}

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
  const suggestions = hydrated ? readinessSuggestions(resume) : [];

  return (
    <>
    <aside className="flex flex-col h-full overflow-hidden">
      {/* Readiness */}
      <div className="px-4 py-4 border-b border-gray-200 dark:border-white/[0.08] space-y-3">
        <ProgressIndicator
          title="Resume readiness"
          value={hydrated ? progress() : 0}
          color="#22d3ee"
        />
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-slate-400">{completedCount} of 9 sections ready</span>
        </div>
        {suggestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Potential improvements
            </p>
            {suggestions.map((s, i) => (
              <p key={i} className="text-[11px] text-gray-500 dark:text-slate-400 leading-snug">
                • {s}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Outline navigator */}
      <nav className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto" aria-label="Resume sections">
        <p className="px-3 pb-1 text-[10px] font-semibold text-gray-400 dark:text-slate-600 uppercase tracking-wider">Resume</p>
        {sections.map(({ id, label, Icon }) => {
          const isActive = activeSection === id;
          const isComplete = id !== "review" && sectionComplete(id as Exclude<SectionId, "review">);
          const count = hydrated && sectionCounts[id] !== undefined ? sectionCounts[id] : 0;

          return (
            <div key={id}>
              <button
                onClick={() => setActiveSection(id)}
                aria-current={isActive ? "true" : undefined}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer group/section",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40",
                  isActive
                    ? "bg-gray-100 dark:bg-white/[0.06] text-gray-900 dark:text-white"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                )}
              >
                <Icon className={clsx("w-3.5 h-3.5 shrink-0", isActive ? "text-cyan-600 dark:text-cyan-400" : "text-gray-400 dark:text-slate-500")} />
                <span className="flex-1 min-w-0 text-xs font-medium truncate">{label}</span>
                {count > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 tabular-nums">{count}</span>
                )}
                {hydrated && isComplete && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" title="Complete" />
                )}
                {!isComplete && id !== "review" && <span className="h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-slate-700 shrink-0" />}
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

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-white/[0.08] space-y-2">
        <button
          onClick={() => setShowClearConfirm(true)}
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