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
  ArrowRight,
  LayoutDashboard,
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
    <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-8">
      {/* ── HERO ── */}
      <section className="space-y-1">
        <div className="flex items-center gap-3 mb-2">
          <LayoutDashboard className="h-5 w-5 text-blue-500 dark:text-[#22d3ee]" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-[#f8fafc]">
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-[#94a3b8] max-w-xl">
          {hasResumes
            ? "Pick up where you left off or create a new resume."
            : "Create your first professional resume to get started."}
        </p>
      </section>

      {/* ── PRIMARY ACTIONS ── */}
      <section className="flex flex-wrap gap-3">
        <button
          onClick={handleCreateResume}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#0ea5e9] dark:to-[#2563eb] text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 active:scale-[0.99] transition-all"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumeList.map((r) => {
              const resumeId = r.resumeId ?? "";
              const isActive = resumeId === activeResumeId;
              const resumeName = r.resumeName || "Untitled Resume";
              const templateId = r.templateId || "modern-clean";
              const experienceCount = r.experience?.length || 0;

              return (
                <div
                  key={resumeId}
                  className={`group relative rounded-xl border transition-all overflow-hidden ${
                    isActive
                      ? "border-blue-300 dark:border-[#22d3ee]/40 bg-blue-50/50 dark:bg-[#22d3ee]/[0.03]"
                      : "border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-md"
                  }`}
                >
                  {/* Real miniature resume preview */}
                  <div className="border-b border-gray-100 dark:border-white/[0.04]">
                    <MiniaturePreview
                      templateId={templateId}
                      resume={r}
                    />
                  </div>

                  {/* Card body */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {resumeName}
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Updated just now
                        </p>
                      </div>
                      {/* Actions menu */}
                      <div className="relative group/menu">
                        <button
                          className="rounded-lg p-1 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors"
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

                    {/* Template + experience info */}
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-slate-500">
                      <span className="truncate">{getTemplateName(templateId)}</span>
                      {experienceCount > 0 && (
                        <>
                          <span>·</span>
                          <span>{experienceCount} experience</span>
                        </>
                      )}
                    </div>

                    {/* Edit button */}
                    <Link
                      href="/resume-builder"
                      onClick={() => switchResume(resumeId)}
                      className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gray-50 dark:bg-white/[0.04] text-xs font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                    >
                      Continue editing
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── */}
      {!hasResumes && mounted && (
        <section className="text-center py-12 space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-300 dark:text-white/20" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No resumes yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 max-w-sm mx-auto">
              Create your first resume or import an existing one to get started.
            </p>
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
    </div>
  );
}
