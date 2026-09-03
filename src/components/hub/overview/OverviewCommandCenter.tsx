"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  FileText,
  Clock,
  MoreHorizontal,
  Trash2,
  Pencil,
  Copy,
  ArrowRight,
  LayoutDashboard,
  Share2,
  User,
  Sparkles,
  Target,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import AICopilotWidget from "@/components/hub/widgets/AICopilotWidget";
import { JobApplicationsSection } from "@/components/hub/applications/JobApplicationsSection";
import type { IdentityScoreData } from "@/lib/identity-score";
import { MiniaturePreview } from "@/components/resume-builder/MiniaturePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { ShareResumeModal } from "@/components/resume-builder/ShareResumeModal";
import { OnboardingModal } from "@/components/hub/OnboardingModal";

type Props = {
  name: string;
  email: string;
  data: IdentityScoreData;
  onboardingCompleted?: boolean;
};

/** Format a date string or timestamp into a human-readable relative time. */
function formatRelativeTime(date: string | number | Date | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OverviewCommandCenter({ name, email, data, onboardingCompleted = true }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shareModalResume, setShareModalResume] = useState<{ id: string; name: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(!onboardingCompleted);
  // C46: State-driven menu instead of CSS hover
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // C46: Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  // C46: Close menu on Escape
  useEffect(() => {
    if (!openMenuId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [openMenuId]);

  const toggleMenu = useCallback((id: string) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
  }, []);

  const closeMenu = useCallback(() => setOpenMenuId(null), []);

  const firstName = name.split(" ")[0] || "there";

  // Get all resumes from the store
  const resumes = useResumeBuilder((s) => s.resumes);
  const activeResumeId = useResumeBuilder((s) => s.activeResumeId);
  const createResume = useResumeBuilder((s) => s.createResume);
  const deleteResume = useResumeBuilder((s) => s.deleteResume);
  const duplicateResume = useResumeBuilder((s) => s.duplicateResume);
  const switchResume = useResumeBuilder((s) => s.switchResume);

  const resumeList = mounted && resumes ? resumes : [];
  const hasResumes = resumeList.length > 0;

  // Sort resumes by most recently updated
  const sortedResumes = [...resumeList].sort((a, b) => {
    const aTime = (a as any).updatedAt || (a as any).createdAt || 0;
    const bTime = (b as any).updatedAt || (b as any).createdAt || 0;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  const handleCreateResume = () => {
    const id = createResume();
    switchResume(id);
    window.location.href = "/resume-builder";
  };

  const handleDelete = (id: string) => {
    if (resumeList.length <= 1) return; // Don't delete last resume
    deleteResume(id);
    closeMenu();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const getTemplateName = (templateId: string) => {
    const t = TEMPLATES.find((t) => t.id === templateId);
    return t?.name || templateId;
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10 space-y-8">
      {/* ── HERO ── */}
      <section className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-[#f8fafc]">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-[#94a3b8] max-w-xl">
          {hasResumes
            ? "Pick up where you left off or create a new resume."
            : "Build a professional resume, tailor it to any job, and export it in minutes."}
        </p>
      </section>

      {/* ── EMPTY STATE — New user ── */}
      {!hasResumes && mounted && (
        <section className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
          <div className="px-6 py-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileText className="h-7 w-7 text-white" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Create your first resume
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                Build a professional resume from scratch, or import an existing one.
                Your Professional Profile can automatically seed new resumes with your information.
              </p>
            </div>

            {/* Primary actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleCreateResume}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-sm font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20"
              >
                <Plus className="h-4 w-4" />
                Create Resume
              </button>
              <Link
                href="/resume-builder"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-sm font-medium text-gray-700 dark:text-[#cbd5e1] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
              >
                <Upload className="h-4 w-4" />
                Import Resume
              </Link>
            </div>

            {/* What you can do */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2">
              {[
                { icon: <Pencil className="w-3.5 h-3.5" />, label: "Edit & customize", desc: "32 templates" },
                { icon: <Target className="w-3.5 h-3.5" />, label: "Tailor to any job", desc: "AI-powered matching" },
                { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Improve with AI", desc: "Bullets, summary, skills" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/[0.04]">
                  <span className="text-blue-500 dark:text-cyan-400">{item.icon}</span>
                  <div>
                    <p className="text-[11px] font-medium text-gray-700 dark:text-slate-300">{item.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PRIMARY ACTIONS (only when user has resumes) ── */}
      {hasResumes && (
        <section className="flex flex-wrap gap-3">
          <button
            onClick={handleCreateResume}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-sm font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all"
          >
            <Plus className="h-4 w-4" />
            Create Resume
          </button>
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-sm font-medium text-gray-700 dark:text-[#cbd5e1] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
          >
            <Upload className="h-4 w-4" />
            Import Resume
          </Link>
        </section>
      )}

      {/* ── RESUMES ── */}
      {hasResumes && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Your resumes
            </h2>
            <span className="text-xs text-gray-400 dark:text-slate-500">
              {resumeList.length} resume{resumeList.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {sortedResumes.map((r) => {
              const resumeId = r.resumeId ?? "";
              const isActive = resumeId === activeResumeId;
              const resumeName = r.resumeName || "Untitled Resume";
              const templateId = r.templateId || "modern-clean";
              const professionalTitle = (r as any).title || "";
              const experienceCount = r.experience?.length || 0;
              const educationCount = r.education?.length || 0;
              const skillsCount = r.skills?.length || 0;
              const updatedAt = (r as any).updatedAt || (r as any).createdAt;
              const timeAgo = formatRelativeTime(updatedAt);
              const isMenuOpen = openMenuId === resumeId;

              return (
                <div
                  key={resumeId}
                  className={`group relative rounded-2xl border transition-all overflow-hidden ${
                    isActive
                      ? "border-blue-300 dark:border-[#22d3ee]/40 bg-blue-50/50 dark:bg-[#22d3ee]/[0.03] shadow-sm"
                      : "border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-lg"
                  }`}
                >
                  {/* Real miniature resume preview — taller */}
                  <div className="border-b border-gray-100 dark:border-white/[0.04] bg-gray-50 dark:bg-white/[0.01]">
                    <div className="px-6 pt-5 pb-3">
                      <MiniaturePreview
                        templateId={templateId}
                        resume={r}
                      />
                    </div>
                  </div>

                  {/* Card body — richer metadata */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {resumeName}
                        </h3>
                        {professionalTitle && (
                          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                            {professionalTitle}
                          </p>
                        )}
                      </div>
                      {/* C46: Actions menu — click/tap driven, not hover */}
                      <div className="relative" ref={isMenuOpen ? menuRef : undefined}>
                        <button
                          onClick={() => toggleMenu(resumeId)}
                          className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                          aria-label={`Actions for ${resumeName}`}
                          aria-expanded={isMenuOpen}
                          aria-haspopup="menu"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {isMenuOpen && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl"
                          >
                            <button
                              role="menuitem"
                              onClick={() => {
                                closeMenu();
                                switchResume(resumeId);
                                window.location.href = "/resume-builder";
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04] rounded-t-xl"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>

                            <button
                              role="menuitem"
                              onClick={() => {
                                closeMenu();
                                const newId = duplicateResume(resumeId);
                                if (newId) {
                                  switchResume(newId);
                                }
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                            >
                              <Copy className="h-3 w-3" />
                              Duplicate
                            </button>

                            <button
                              role="menuitem"
                              onClick={() => {
                                closeMenu();
                                setShareModalResume({ id: resumeId, name: resumeName });
                              }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                            >
                              <Share2 className="h-3 w-3" />
                              Share
                            </button>

                            {resumeList.length > 1 && (
                              <button
                                role="menuitem"
                                onClick={() => handleDelete(resumeId)}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-b-xl"
                              >
                                <Trash2 className="h-3 w-3" />
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {getTemplateName(templateId)}
                      </span>
                      {experienceCount > 0 && (
                        <span>{experienceCount} experience</span>
                      )}
                      {educationCount > 0 && (
                        <span>{educationCount} education</span>
                      )}
                      {skillsCount > 0 && (
                        <span>{skillsCount} skills</span>
                      )}
                      {timeAgo && (
                        <span className="flex items-center gap-1 ml-auto">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    {/* Actions row */}
                    <div className="flex gap-2 pt-1">
                      <Link
                        href="/resume-builder"
                        onClick={() => switchResume(resumeId)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-xs font-semibold text-white hover:brightness-110 transition-all"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit Resume
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── JOB APPLICATIONS ── */}
      <JobApplicationsSection />

      {/* ── AI TOOLS ── */}
      <section>
        <AICopilotWidget />
      </section>

      {/* Share Resume Modal */}
      {shareModalResume && (
        <ShareResumeModal
          open={true}
          onClose={() => setShareModalResume(null)}
          resumeId={shareModalResume.id}
          resumeName={shareModalResume.name}
        />
      )}

      {/* C35: Onboarding Modal for first-time users */}
      <OnboardingModal
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </div>
  );
}
