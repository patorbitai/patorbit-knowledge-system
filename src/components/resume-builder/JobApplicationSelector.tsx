"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { clsx } from "clsx";
import {
  Briefcase,
  ChevronDown,
  Plus,
  Target,
  Check,
  Loader2,
  Building2,
} from "lucide-react";

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

const STATUS_COLORS: Record<string, string> = {
  saved: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400",
  ready_to_apply: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  applied: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  interview: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  offer: "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
};

export function JobApplicationSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeJobApplicationId = useResumeBuilder((s) => s.activeJobApplicationId);
  const activeJobApplication = useResumeBuilder((s) => s.activeJobApplication);
  const setActiveJobApplication = useResumeBuilder((s) => s.setActiveJobApplication);
  const setJobDescription = useResumeBuilder((s) => s.setJobDescription);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  const handleSelect = useCallback((app: JobApplication) => {
    setActiveJobApplication({
      applicationId: app.applicationId,
      title: app.title,
      companyName: app.companyName,
      jobDescription: app.jobDescription,
      status: app.status,
      resumeId: app.resumeId,
      matchScore: app.matchScore,
      matchData: app.matchData,
    });
    setJobDescription(app.jobDescription);
    setIsOpen(false);
  }, [setActiveJobApplication, setJobDescription]);

  const handleClear = useCallback(() => {
    setActiveJobApplication(null);
    setJobDescription("");
    setIsOpen(false);
  }, [setActiveJobApplication, setJobDescription]);

  // Sort: active first, then by most recently updated
  const sortedApplications = [...applications].sort((a, b) => {
    if (a.applicationId === activeJobApplicationId) return -1;
    if (b.applicationId === activeJobApplicationId) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select job application"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={clsx(
          "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer",
          "border border-gray-200 dark:border-white/[0.08]",
          activeJobApplication
            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
            : "bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.08]",
        )}
      >
        <Briefcase className="w-3 h-3 shrink-0" />
        <span className="max-w-[140px] truncate">
          {activeJobApplication
            ? `${activeJobApplication.title}`
            : "Select Job"}
        </span>
        <ChevronDown className={clsx("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Job applications"
          className="absolute left-0 mt-1.5 w-72 rounded-xl bg-white dark:bg-[#0C1222] border border-gray-200 dark:border-white/[0.08] shadow-2xl py-1 z-50 max-h-80 overflow-y-auto"
        >
          {/* Header */}
          <div className="px-3 py-1.5 border-b border-gray-200 dark:border-white/[0.06]">
            <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Job Applications ({applications.length})
            </span>
          </div>

          {/* No job option */}
          <button
            role="option"
            aria-selected={!activeJobApplicationId}
            onClick={handleClear}
            className={clsx(
              "flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors",
              !activeJobApplicationId && "bg-gray-50 dark:bg-white/[0.04]",
            )}
          >
            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0">
              {!activeJobApplicationId && <Check className="w-3 h-3 text-amber-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-500 dark:text-slate-400 italic">
                No job selected
              </span>
            </div>
          </button>

          {/* Application list */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
              <span className="text-[11px] text-gray-400">Loading applications…</span>
            </div>
          ) : sortedApplications.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[11px] text-gray-400 dark:text-slate-500">No applications yet</p>
            </div>
          ) : (
            sortedApplications.map((app) => {
              const isActive = app.applicationId === activeJobApplicationId;
              return (
                <button
                  key={app.applicationId}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => handleSelect(app)}
                  className={clsx(
                    "flex items-start gap-2.5 w-full px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors group",
                    isActive && "bg-amber-50 dark:bg-amber-500/10",
                  )}
                >
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5">
                    {isActive && <Check className="w-3 h-3 text-amber-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={clsx(
                        "text-xs font-medium truncate",
                        isActive ? "text-amber-700 dark:text-amber-300" : "text-gray-900 dark:text-white",
                      )}>
                        {app.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Building2 className="w-2.5 h-2.5 text-gray-400 dark:text-slate-500 shrink-0" />
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 truncate">
                        {app.companyName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {app.matchScore != null && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-500 dark:text-blue-400">
                          <Target className="w-2.5 h-2.5" />
                          {app.matchScore}%
                        </span>
                      )}
                      <span className={clsx(
                        "text-[9px] font-medium px-1.5 py-0.5 rounded",
                        STATUS_COLORS[app.status] || STATUS_COLORS.saved,
                      )}>
                        {app.status.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {/* Add new */}
          <div className="border-t border-gray-200 dark:border-white/[0.06] mt-1">
            <a
              href="/jobs/new"
              className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-amber-600 dark:text-amber-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Plus className="w-3 h-3" />
              Add New Job
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
