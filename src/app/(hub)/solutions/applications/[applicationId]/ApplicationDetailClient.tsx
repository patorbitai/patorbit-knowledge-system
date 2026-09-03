"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Target,
  ChevronDown,
  ExternalLink,
  Loader2,
  Trash2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";

type JobApplication = {
  applicationId: string;
  title: string;
  companyName: string;
  jobDescription: string;
  status: string;
  resumeId: string | null;
  matchScore: number | null;
  matchData: unknown;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  application: JobApplication;
  userName: string;
};

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "ready_to_apply", label: "Ready to Apply" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  saved: { bg: "bg-gray-100 dark:bg-white/[0.06]", text: "text-gray-600 dark:text-slate-400" },
  ready_to_apply: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400" },
  applied: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400" },
  interview: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400" },
  offer: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400" },
  rejected: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400" },
};

export function ApplicationDetailClient({ application: initialApp, userName }: Props) {
  const [app, setApp] = useState<JobApplication>(initialApp);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);

  const updateStatus = useCallback(async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/applications/${app.applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApp(updated);
      }
    } catch {
      // Silently handle
    } finally {
      setUpdatingStatus(false);
      setShowStatusMenu(false);
    }
  }, [app.applicationId]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this application? This will not affect your resumes.")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${app.applicationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        window.location.href = "/solutions";
      }
    } catch {
      setDeleting(false);
    }
  }, [app.applicationId]);

  // C55.1: After tailoring approval, refresh application data from server
  const handleTailorApproved = useCallback(async (data: { resumeId: string; matchScore: number; matchData: unknown }) => {
    // Refetch the application to get updated data
    try {
      const res = await fetch(`/api/applications/${app.applicationId}`);
      if (res.ok) {
        const updated = await res.json();
        setApp(updated);
      }
    } catch {
      // Non-critical — the modal already handled the approval
    }
  }, [app.applicationId]);

  const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.saved;
  const statusLabel = STATUS_OPTIONS.find((s) => s.value === app.status)?.label || "Saved";

  // Parse matchData if available
  const matchData = app.matchData as {
    matched?: string[];
    partial?: string[];
    missing?: string[];
  } | null;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/solutions"
          className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                {app.title}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-slate-400">
                  {app.companyName}
                </span>
              </div>
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={updatingStatus}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${statusStyle.bg} ${statusStyle.text} hover:brightness-95 transition-all disabled:opacity-50`}
              >
                {updatingStatus ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                {statusLabel}
              </button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateStatus(opt.value)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors ${
                        app.status === opt.value
                          ? "font-semibold text-blue-600 dark:text-blue-400"
                          : "text-gray-700 dark:text-slate-300"
                      } ${opt.value === STATUS_OPTIONS[0].value ? "rounded-t-xl" : ""} ${opt.value === STATUS_OPTIONS[STATUS_OPTIONS.length - 1].value ? "rounded-b-xl" : ""}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Job details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Description */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.04] flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                Job Description
              </h2>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                {app.jobDescription}
              </p>
            </div>
          </div>

          {/* Match Analysis (if available) */}
          {matchData && (
            <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-white/[0.04] flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                  Match Analysis
                </h2>
                {app.matchScore !== null && (
                  <span className="ml-auto text-sm font-bold text-blue-600 dark:text-blue-400">
                    {app.matchScore}%
                  </span>
                )}
              </div>
              <div className="px-5 py-4 space-y-4">
                {/* Matched skills */}
                {matchData.matched && matchData.matched.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                      Matched Skills
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.matched.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partial matches */}
                {matchData.partial && matchData.partial.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                      Partial Matches
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.partial.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing skills */}
                {matchData.missing && matchData.missing.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                      Missing from Your Resume
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {matchData.missing.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-slate-500">
                      These skills are required by the job but not present in your resume.
                      Patorbit will not add them unless you have them in your Professional Identity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No match analysis yet */}
          {!matchData && (
            <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-5 py-6 text-center">
              <Target className="h-5 w-5 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Not analyzed yet. Tailor a resume to see match analysis.
              </p>
            </div>
          )}
        </div>

        {/* Right column — Actions */}
        <div className="space-y-4">
          {/* Resume card */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Resume
            </h3>
            {app.resumeId ? (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Tailored resume linked
                </div>
                <Link
                  href="/resume-builder"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-500 dark:bg-[#0ea5e9] text-xs font-semibold text-white hover:brightness-110 transition-all w-full justify-center"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open Resume
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  No resume linked yet. Tailor a resume for this job to get started.
                </p>
              </div>
            )}
          </div>

          {/* C55.1: Tailor action — opens modal with application context */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Tailoring
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {app.resumeId
                ? "Re-tailor your resume with updated analysis, or tailor a different resume for this job."
                : "Tailor your resume to this specific job. Patorbit will analyze the job description and suggest truthful improvements."}
            </p>
            <button
              onClick={() => setShowTailorModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-500 dark:bg-purple-500/90 text-xs font-semibold text-white hover:brightness-110 transition-all w-full justify-center"
            >
              <Sparkles className="h-3 w-3" />
              {app.resumeId ? "Tailor Again" : "Tailor Resume"}
            </button>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 text-center">
              Uses this application&apos;s job description automatically.
            </p>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
              Danger Zone
            </h3>
            <p className="text-xs text-red-500/80 dark:text-red-400/70">
              Deleting this application will not affect any resumes.
            </p>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-200 dark:border-red-500/30 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/10 transition-all w-full justify-center disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Delete Application
            </button>
          </div>

          {/* Metadata */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              Details
            </h3>
            <div className="space-y-1.5 text-xs text-gray-500 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(app.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{new Date(app.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* C55.1: TailorResumeModal with application context */}
      <TailorResumeModal
        open={showTailorModal}
        onClose={() => setShowTailorModal(false)}
        applicationId={app.applicationId}
        initialJobDescription={app.jobDescription}
        initialResumeId={app.resumeId || undefined}
        onApproved={handleTailorApproved}
      />
    </div>
  );
}
