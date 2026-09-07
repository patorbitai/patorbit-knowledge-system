"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  FileText,
  Loader2,
  Link as LinkIcon,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type ResumeOption = {
  resumeId: string;
  resumeName: string;
};

/**
 * AddJobApplicationForm — full-page form for creating a Job Application.
 */
export function AddJobApplicationForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [resumes, setResumes] = useState<ResumeOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Optional fields
  const [jobUrl, setJobUrl] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");

  // Load resumes
  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => {
        const list: ResumeOption[] = (data.resumes ?? []).map((r: any) => ({
          resumeId: r.resumeId,
          resumeName: r.resumeName || "Untitled",
        }));
        setResumes(list);
      })
      .catch(() => setResumes([]));
  }, []);

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
      router.push(`/jobs/${application.applicationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Jobs
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Add Job Application
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Track a job you&apos;re preparing for. Paste the job description and we&apos;ll help you tailor your resume.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Company + Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Building2 className="h-4 w-4 text-gray-400" />
              Company
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Microsoft"
              className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <Briefcase className="h-4 w-4 text-gray-400" />
              Job Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Data Engineer"
              className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
            />
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
            <FileText className="h-4 w-4 text-gray-400" />
            Job Description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={8}
            className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all resize-none"
          />
          <p className="text-xs text-gray-400 dark:text-slate-500">
            Patorbit will analyze this job against your resume to suggest truthful improvements.
          </p>
        </div>

        {/* Resume Selection */}
        {resumes.length > 0 && (
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
              <FileText className="h-4 w-4 text-gray-400" />
              Link Resume
              <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
            </label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
            >
              <option value="">No resume selected</option>
              {resumes.map((r) => (
                <option key={r.resumeId} value={r.resumeId}>
                  {r.resumeName}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Link a resume to tailor it specifically for this job. You can also do this later.
            </p>
          </div>
        )}

        {/* More Details Toggle */}
        <button
          type="button"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="flex items-center gap-2 text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
        >
          {showMoreDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {showMoreDetails ? "Show less" : "Add more details"}
        </button>

        {/* More Details Section */}
        {showMoreDetails && (
          <div className="space-y-4 p-4 rounded-xl border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
            {/* Job URL */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                <LinkIcon className="h-4 w-4 text-gray-400" />
                Job URL
                <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
              </label>
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://careers.company.com/job/123"
                className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
              />
            </div>

            {/* Location + Employment Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  Location
                  <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA or Remote"
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  Employment Type
                  <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
                >
                  <option value="">Select type</option>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Applied Date
                  <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="date"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  Follow-up Date
                  <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-300">
                <FileText className="h-4 w-4 text-gray-400" />
                Notes
                <span className="text-gray-400 dark:text-slate-500 font-normal text-xs">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes about this application..."
                rows={3}
                className="w-full rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 dark:focus:border-blue-500/40 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/jobs"
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-sm font-semibold text-white hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Application"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
