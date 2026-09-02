"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  FileText,
  MoreHorizontal,
  Trash2,
  Pencil,
  ArrowRight,
  Palette,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import type { IdentityScoreData } from "@/lib/identity-score";
import { MiniaturePreview } from "@/components/resume-builder/MiniaturePreview";
import { TEMPLATES } from "@/app/resume-builder/templates";

type Props = {
  name: string;
  email: string;
  data: IdentityScoreData;
};

export function OverviewCommandCenter({ name, email, data }: Props) {
  const [mounted, setMounted] = useState(false);

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
  const switchResume = useResumeBuilder((s) => s.switchResume);

  const resumeList = mounted && resumes ? resumes : [];
  const hasResumes = resumeList.length > 0;

  const handleCreateResume = () => {
    const id = createResume();
    switchResume(id);
    window.location.href = "/resume-builder";
  };

  const handleDelete = (id: string) => {
    if (resumeList.length <= 1) return;
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
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-10 space-y-8">
      {/* ── HERO ── */}
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-[#f1f5f9]">
            {getGreeting()}, {firstName}
          </h1>
          <p className="mt-1.5 text-[15px] text-gray-500 dark:text-[#94a3b8]">
            {hasResumes
              ? "Pick up where you left off."
              : "Build a professional resume in minutes."}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCreateResume}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-[#0ea5e9] text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 dark:hover:bg-[#0891b2] active:scale-[0.98] transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Resume
          </button>
          <Link
            href="/resume-builder"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-[13px] font-medium text-gray-600 dark:text-[#cbd5e1] hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
          >
            <Upload className="h-3.5 w-3.5" />
            Import
          </Link>
        </div>
      </section>

      {/* ── RESUMES ── */}
      {hasResumes && (
        <section className="space-y-3.5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-wider text-gray-400 dark:text-[#64748b]">
              Your resumes
            </h2>
            <span className="text-[12px] text-gray-400 dark:text-[#64748b]">
              {resumeList.length}
            </span>
          </div>

          {/* Single resume: full-width featured card. Multiple: 2-column grid. */}
          <div className={resumeList.length === 1 ? "" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
            {resumeList.map((r) => {
              const resumeId = r.resumeId ?? "";
              const isActive = resumeId === activeResumeId;
              const resumeName = r.resumeName || "Untitled Resume";
              const templateId = r.templateId || "modern-clean";
              const professionalTitle = (r as any).title || "";
              const experienceCount = r.experience?.length || 0;
              const skillsCount = r.skills?.length || 0;
              const educationCount = r.education?.length || 0;
              const projectsCount = r.projects?.length || 0;
              const isSingle = resumeList.length === 1;

              return (
                <div
                  key={resumeId}
                  className={`group relative rounded-xl border transition-all overflow-hidden flex ${
                    isSingle ? "flex-row sm:flex-row" : ""
                  } ${
                    isActive
                      ? "border-blue-200 dark:border-cyan-500/30 bg-blue-50/40 dark:bg-cyan-500/[0.03]"
                      : "border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.1] hover:shadow-md dark:hover:shadow-black/20"
                  }`}
                >
                  {/* Thumbnail — larger for single resume */}
                  <div className={`${isSingle ? "w-[180px] sm:w-[220px]" : "w-[140px] sm:w-[160px]"} shrink-0 border-r border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]`}>
                    <MiniaturePreview
                      templateId={templateId}
                      resume={r}
                    />
                  </div>

                  {/* Metadata */}
                  <div className="flex-1 min-w-0 px-5 py-4 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`${isSingle ? "text-lg" : "text-[15px]"} font-semibold text-gray-900 dark:text-white truncate leading-tight`}>
                          {resumeName}
                        </h3>
                        <div className="relative shrink-0 group/menu">
                          <button
                            className="rounded-md p-1 text-gray-300 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors"
                            aria-label="Resume actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all">
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

                      {professionalTitle && (
                        <p className={`${isSingle ? "text-[14px]" : "text-[13px]"} text-gray-500 dark:text-[#94a3b8] truncate`}>
                          {professionalTitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400 dark:text-[#64748b]">
                        <span className="font-medium">{getTemplateName(templateId)}</span>
                        {experienceCount > 0 && <span>{experienceCount} experience</span>}
                        {skillsCount > 0 && <span>{skillsCount} skills</span>}
                        {educationCount > 0 && <span>{educationCount} education</span>}
                        {projectsCount > 0 && <span>{projectsCount} projects</span>}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <Link
                        href="/resume-builder"
                        onClick={() => switchResume(resumeId)}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 dark:text-cyan-400 hover:underline"
                      >
                        Edit resume
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/templates"
                        className="inline-flex items-center gap-1 text-[12px] text-gray-400 dark:text-[#64748b] hover:text-gray-600 dark:hover:text-[#94a3b8] transition-colors"
                      >
                        <Palette className="h-3 w-3" />
                        Templates
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
          <div className="mx-auto w-14 h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center border border-gray-200 dark:border-white/[0.06]">
            <FileText className="h-6 w-6 text-gray-300 dark:text-white/20" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Build your professional resume
            </h3>
            <p className="text-sm text-gray-400 dark:text-[#64748b] max-w-sm mx-auto">
              Choose a template, add your experience, and export a polished resume in minutes.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={handleCreateResume}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-blue-600 dark:bg-[#0ea5e9] text-[13px] font-semibold text-white shadow-sm hover:bg-blue-700 dark:hover:bg-[#0891b2] active:scale-[0.98] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Create Resume
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
