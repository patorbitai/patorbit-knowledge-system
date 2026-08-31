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
              const templateId = r.templateId || "modern";
              const experienceCount = r.experience?.length || 0;
              const skillCount = r.skills?.length || 0;
              const hasContent = !!(r.name || r.summary || experienceCount > 0);

              return (
                <div
                  key={resumeId}
                  className={`group relative rounded-xl border transition-all overflow-hidden ${
                    isActive
                      ? "border-blue-300 dark:border-[#22d3ee]/40 bg-blue-50/50 dark:bg-[#22d3ee]/[0.03]"
                      : "border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-md"
                  }`}
                >
                  {/* Preview area */}
                  <div className="aspect-[8.5/11] bg-gray-50 dark:bg-[#0f172a] border-b border-gray-100 dark:border-white/[0.04] flex items-center justify-center relative overflow-hidden">
                    {hasContent ? (
                      <div className="p-4 space-y-2 w-full">
                        {r.name && (
                          <div className="h-3 bg-gray-300 dark:bg-white/20 rounded w-2/3" />
                        )}
                        {r.title && (
                          <div className="h-2 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
                        )}
                        <div className="pt-2 space-y-1">
                          {Array.from({ length: Math.min(experienceCount, 3) }).map((_, i) => (
                            <div key={i} className="h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded w-full" />
                          ))}
                          {Array.from({ length: Math.min(skillCount, 4) }).map((_, i) => (
                            <div key={i} className="h-1 bg-gray-200 dark:bg-white/[0.04] rounded w-3/4" />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <FileText className="h-8 w-8 text-gray-300 dark:text-white/10" />
                    )}
                    {/* Template badge */}
                    <span className="absolute top-2 right-2 text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/80 dark:bg-white/5 text-gray-500 dark:text-white/40 capitalize">
                      {templateId}
                    </span>
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

                    {/* Resume stats */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-slate-500">
                      {experienceCount > 0 && (
                        <span>{experienceCount} experience</span>
                      )}
                      {skillCount > 0 && (
                        <span>{skillCount} skills</span>
                      )}
                    </div>

                    {/* Continue button */}
                    <button
                      onClick={() => {
                        switchResume(resumeId);
                        window.location.href = "/resume-builder";
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-[#22d3ee] hover:bg-blue-50 dark:hover:bg-[#22d3ee]/[0.06] transition-colors"
                    >
                      Continue editing
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── EMPTY STATE ── */}
      {!hasResumes && mounted && (
        <section className="rounded-2xl border border-dashed border-gray-300 dark:border-white/[0.1] bg-gray-50 dark:bg-white/[0.01] p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#22d3ee]/[0.06] flex items-center justify-center mx-auto">
            <FileText className="h-7 w-7 text-blue-500 dark:text-[#22d3ee]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              No resumes yet
            </h3>
            <p className="text-sm text-gray-500 dark:text-[#94a3b8] max-w-sm mx-auto">
              Create your first resume or import an existing one to get started.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={handleCreateResume}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#0ea5e9] dark:to-[#2563eb] text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:brightness-110 transition-all"
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
          </div>
        </section>
      )}

      {/* ── QUICK LINKS ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/resume-builder"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/[0.08] flex items-center justify-center text-blue-500 dark:text-[#60a5fa] shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Resume Builder</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Edit your resume</p>
          </div>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/[0.08] flex items-center justify-center text-purple-500 dark:text-[#a78bfa] shrink-0 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Settings</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Account & preferences</p>
          </div>
        </Link>

        <Link
          href="/overview"
          className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-sm transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.08] flex items-center justify-center text-emerald-500 dark:text-[#10b981] shrink-0 group-hover:scale-105 transition-transform">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Trust Score</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500">Verify credentials</p>
          </div>
        </Link>
      </section>
    </div>
  );
}
