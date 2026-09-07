"use client";

import React, { useState, useEffect } from "react";
import { X, Briefcase, Building2, FileText, Loader2, FileCheck, Link, MapPin, Calendar, ChevronDown, ChevronUp } from "lucide-react";

/** Minimal resume shape for the selector. */
type ResumeOption = {
  resumeId: string;
  resumeName: string;
  templateId: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (application: {
    applicationId: string;
    title: string;
    companyName: string;
  }) => void;
};

/**
 * AddJobApplicationModal — creates a new Job Application.
 *
 * C55: The user provides company, title, and job description.
 * Optional resume association at creation time.
 */
export function AddJobApplicationModal({ open, onClose, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  
  // New optional fields
  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  // Load resumes when modal opens
  useEffect(() => {
    if (!open) return;
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        const list: ResumeOption[] = (data.resumes ?? []).map((r: any) => ({
          resumeId: r.resumeId,
          resumeName: r.resumeName || "Untitled",
          templateId: r.templateId || "modern-clean",
        }));
        setResumes(list);
      })
      .catch(() => setResumes([]));
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Job title is required");
      return;
    }
    if (!companyName.trim()) {
      setError("Company name is required");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Job description is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          companyName: companyName.trim(),
          jobDescription: jobDescription.trim(),
          resumeId: selectedResumeId || null,
          jobUrl: jobUrl.trim() || null,
          location: location.trim() || null,
          employmentType: employmentType || null,
          appliedDate: appliedDate || null,
          followUpDate: followUpDate || null,
          notes: notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create application");
      }

      const application = await res.json();
      setTitle("");
      setCompanyName("");
      setJobDescription("");
      setSelectedResumeId("");
      setJobUrl("");
      setLocation("");
      setEmploymentType("");
      setAppliedDate("");
      setFollowUpDate("");
      setNotes("");
      setShowMoreDetails(false);
      onCreated(application);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0C1322] border border-gray-200 dark:border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <Briefcase className="h-4.5 w-4.5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Add Job Application
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                Track a job you&apos;re preparing for
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-600 dark:hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Company */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              Company
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Microsoft"
              className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Briefcase className="h-3.5 w-3.5 text-gray-400" />
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Data Engineer"
              className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
            />
          </div>

          {/* Job Description */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-gray-400" />
              Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description here..."
              rows={6}
              className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all resize-none"
            />
            <p className="text-[11px] text-gray-400 dark:text-slate-500">
              Patorbit will analyze this job against your resume to suggest truthful improvements.
            </p>
          </div>

          {/* Resume Selection */}
          {resumes.length > 0 && (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                <FileCheck className="h-3.5 w-3.5 text-gray-400" />
                Link Resume (optional)
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
              >
                <option value="">No resume selected</option>
                {resumes.map((r) => (
                  <option key={r.resumeId} value={r.resumeId}>
                    {r.resumeName}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 dark:text-slate-500">
                You can also link a resume later after tailoring.
              </p>
            </div>
          )}

          {/* More Details Toggle */}
          <button
            type="button"
            onClick={() => setShowMoreDetails(!showMoreDetails)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            {showMoreDetails ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            More details
          </button>

          {/* More Details Section */}
          {showMoreDetails && (
            <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/[0.06]">
              {/* Job URL */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Link className="h-3.5 w-3.5 text-gray-400" />
                  Job URL (optional)
                </label>
                <input
                  type="url"
                  value={jobUrl}
                  onChange={(e) => setJobUrl(e.target.value)}
                  placeholder="https://careers.company.com/job/123"
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  Location (optional)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
                />
              </div>

              {/* Employment Type */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                  Employment Type (optional)
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
                >
                  <option value="">Select type</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Applied Date (optional)
                  </label>
                  <input
                    type="date"
                    value={appliedDate}
                    onChange={(e) => setAppliedDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Follow-up Date (optional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional notes about this application..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-300 dark:focus:border-blue-500/40 transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-blue-500 dark:bg-[#0ea5e9] text-sm font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Application"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
