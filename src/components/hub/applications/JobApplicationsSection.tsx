"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Plus,
  Target,
  Clock,
  MoreHorizontal,
  Trash2,
  ExternalLink,
  ChevronRight,
  Search,
  ArrowUpDown,
} from "lucide-react";
import { AddJobApplicationModal } from "./AddJobApplicationModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

type JobApplication = {
  applicationId: string;
  title: string;
  companyName: string;
  jobDescription: string;
  status: string;
  resumeId: string | null;
  matchScore: number | null;
  createdAt: string;
  updatedAt: string;
};

/** Format a date string into a human-readable relative time. */
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

/** Status badge colors. */
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  saved: { bg: "bg-gray-100 dark:bg-white/[0.06]", text: "text-gray-600 dark:text-slate-400", label: "Saved" },
  ready_to_apply: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", label: "Ready to Apply" },
  applied: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Applied" },
  interview: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", label: "Interview" },
  offer: { bg: "bg-green-50 dark:bg-green-500/10", text: "text-green-600 dark:text-green-400", label: "Offer" },
  rejected: { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", label: "Rejected" },
};

/** Status filter options. */
const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "saved", label: "Saved" },
  { value: "ready_to_apply", label: "Ready" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

/** Sort options. */
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "company_az", label: "Company A–Z" },
  { value: "company_za", label: "Company Z–A" },
  { value: "match_high", label: "Match Score" },
];

export function JobApplicationsSection() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  // Search, filter, sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchApplications = useCallback(async () => {
    try {
      const res = await fetch("/api/applications");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch {
      // Silently handle fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/applications/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.applicationId !== deleteTarget.id));
      }
    } catch { /* silently handle */ }
    setDeleteTarget(null);
    setOpenMenuId(null);
  };

  const handleCreated = (application: { applicationId: string; title: string; companyName: string }) => {
    // Refetch to get the full application data
    fetchApplications();
  };

  // Filter and sort applications
  const filteredApplications = useMemo(() => {
    let result = [...applications];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (app) =>
          app.title.toLowerCase().includes(query) ||
          app.companyName.toLowerCase().includes(query) ||
          app.jobDescription.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((app) => app.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
        break;
      case "company_az":
        result.sort((a, b) => a.companyName.localeCompare(b.companyName));
        break;
      case "company_za":
        result.sort((a, b) => b.companyName.localeCompare(a.companyName));
        break;
      case "match_high":
        result.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
        break;
    }

    return result;
  }, [applications, searchQuery, statusFilter, sortBy]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Briefcase className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Job Applications
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {applications.length} application{applications.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 dark:bg-amber-500/90 text-xs font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Job
        </button>
      </div>

      {/* Search, Filter, Sort controls */}
      {!loading && applications.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-300 dark:focus:border-amber-500/40 transition-all"
            />
          </div>

          {/* Status filter */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  statusFilter === filter.value
                    ? "bg-amber-500 dark:bg-amber-500/90 text-white"
                    : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-8 pr-8 py-2 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && applications.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] px-6 py-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center mb-3">
            <Briefcase className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          </div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            No job applications yet
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
            Add a job description, tailor the right resume, and keep your application materials together.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 dark:bg-amber-500/90 text-xs font-semibold text-white hover:brightness-110 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Job Application
          </button>
        </div>
      )}

      {/* No results state */}
      {!loading && applications.length > 0 && filteredApplications.length === 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-6 py-8 text-center">
          <Search className="h-5 w-5 text-gray-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-slate-400">
            No applications match your search or filter.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-6 py-8 text-center">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-white/[0.06] rounded w-1/3 mx-auto" />
            <div className="h-3 bg-gray-200 dark:bg-white/[0.06] rounded w-1/2 mx-auto" />
          </div>
        </div>
      )}

      {/* Application list */}
      {!loading && filteredApplications.length > 0 && (
        <div className="space-y-3">
          {filteredApplications.map((app) => {
            const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.saved;
            const timeAgo = formatRelativeTime(app.updatedAt);

            return (
              <div
                key={app.applicationId}
                className="group rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/[0.12] hover:shadow-md transition-all overflow-hidden"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Company icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                    <Building2 className="h-4.5 w-4.5 text-gray-400 dark:text-slate-500" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {app.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {app.companyName}
                        </p>
                      </div>

                      {/* Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenuId(openMenuId === app.applicationId ? null : app.applicationId)}
                          className="rounded-lg p-1.5 text-gray-400 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
                          aria-label={`Actions for ${app.title}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        {openMenuId === app.applicationId && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-xl">
                            <button
                              onClick={() => { setOpenMenuId(null); setDeleteTarget({ id: app.applicationId, title: app.title }); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {/* Status badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                        {statusStyle.label}
                      </span>

                      {/* Match score */}
                      {app.matchScore !== null && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                          <Target className="h-3 w-3" />
                          {app.matchScore}% match
                        </span>
                      )}

                      {/* Resume linked indicator */}
                      {app.resumeId && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-500/10 text-[10px] font-medium text-green-600 dark:text-green-400">
                          <ExternalLink className="h-2.5 w-2.5" />
                          Resume linked
                        </span>
                      )}

                      {/* Time */}
                      {timeAgo && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-slate-500 ml-auto">
                          <Clock className="h-3 w-3" />
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    {/* Job description preview */}
                    <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {app.jobDescription.slice(0, 200)}
                      {app.jobDescription.length > 200 ? "..." : ""}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <Link
                        href={`/jobs/${app.applicationId}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-500 dark:bg-[#0ea5e9] text-[11px] font-semibold text-white hover:brightness-110 transition-all"
                      >
                        Open
                        <ChevronRight className="h-3 w-3" />
                      </Link>
                      {app.resumeId && (
                        <Link
                          href="/resume-builder"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-[11px] font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Resume
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={!!deleteTarget}
        title="Delete this application?"
        message={`"${deleteTarget?.title ?? ""}" will be permanently deleted. This will not affect your resumes.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Add modal */}
      <AddJobApplicationModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={handleCreated}
      />
    </section>
  );
}
