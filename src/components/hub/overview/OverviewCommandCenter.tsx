"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
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

export function OverviewCommandCenter({ name, email, data, onboardingCompleted = true }: Props) {
  const [mounted, setMounted] = useState(false);
  const [shareModalResume, setShareModalResume] = useState<{ id: string; name: string } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(!onboardingCompleted);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

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

  const handleCreateResume = () => {
    const id = createResume();
    switchResume(id);
    window.location.href = "/resume-builder";
  };

  const handleDelete = (id: string) => {
    if (resumeList.length <= 1) return; // Don't delete last resume
    deleteResume(id);
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
            : "Build a professional resume in minutes."}
        </p>
      </section>

      {/* ── PRIMARY ACTIONS ── */}
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
            {resumeList.map((r) => {
              const resumeId = r.resumeId ?? "";
              const isActive = resumeId === activeResumeId;
              const resumeName = r.resumeName || "Untitled Resume";
              const templateId = r.templateId || "modern-clean";
              const professionalTitle = (r as any).title || "";
              const experienceCount = r.experience?.length || 0;
              const educationCount = r.education?.length || 0;
              const skillsCount = r.skills?.length || 0;

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
                      {/* Actions menu */}
                      <div className="relative group/menu">
                        <button
                          className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors"
                          aria-label="Resume actions"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
                          <button
                            onClick={() => {
                              switchResume(resumeId);
                              window.location.href = "/resume-builder";
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>

                          <button
                            onClick={() => {
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
                            onClick={() => setShareModalResume({ id: resumeId, name: resumeName })}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                          >
                            <Share2 className="h-3 w-3" />
                            Share
                          </button>

                          {resumeList.length > 1 && (
                            <button
                              onClick={() => handleDelete(resumeId)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                            >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                          )}
                        </div>
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

      {/* ── EMPTY STATE ── */}
      {!hasResumes && mounted && (
        <section className="text-center py-16 space-y-5">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/[0.03] flex items-center justify-center border border-gray-100 dark:border-white/[0.04]">
            <FileText className="h-6 w-6 text-gray-300 dark:text-white/15" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Build your professional resume
            </h3>
            <p className="text-sm text-gray-400 dark:text-slate-500 max-w-xs mx-auto">
              Choose a template, add your experience, and export a polished resume in minutes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleCreateResume}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-sm font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all"
            >
              <Plus className="h-4 w-4" />
              Create Resume
            </button>
          </div>
        </section>
      )}

      {/* ── QUICK ACTIONS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/templates"
          className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
            <LayoutDashboard className="h-4 w-4 text-purple-500 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Templates</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Browse 29 designs</p>
          </div>
        </Link>
        <Link
          href="/resume-builder"
          className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Pencil className="h-4 w-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Resume Builder</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Edit your resume</p>
          </div>
        </Link>
        <Link
          href="/trust"
          className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <FileText className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 dark:text-white">Trust Score</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Verify credentials</p>
          </div>
        </Link>
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
