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
  Calendar,
  MessageSquare,
  TrendingUp,
  Award,
  XCircle,
  Clock,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import { TailorResumeModal } from "@/components/resume-builder/TailorResumeModal";
import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

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

type ApplicationEvent = {
  id: string;
  applicationId: string;
  eventType: string;
  previousStatus: string | null;
  newStatus: string | null;
  interviewStage: string | null;
  interviewType: string | null;
  interviewDate: string | null;
  outcome: string | null;
  notes: string | null;
  metadata: unknown;
  createdAt: string;
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

const EVENT_TYPE_LABELS: Record<string, { icon: typeof Calendar; label: string; color: string }> = {
  status_change: { icon: TrendingUp, label: "Status Changed", color: "text-blue-400" },
  interview_scheduled: { icon: Calendar, label: "Interview Scheduled", color: "text-purple-400" },
  interview_completed: { icon: MessageSquare, label: "Interview Completed", color: "text-amber-400" },
  outcome_recorded: { icon: Award, label: "Outcome Recorded", color: "text-green-400" },
};

const INTERVIEW_STAGES: { value: string; label: string }[] = [
  { value: "phone_screen", label: "Phone Screen" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "final", label: "Final Round" },
  { value: "onsite", label: "Onsite" },
];

const INTERVIEW_TYPES: { value: string; label: string }[] = [
  { value: "phone", label: "Phone" },
  { value: "video", label: "Video" },
  { value: "in_person", label: "In Person" },
  { value: "take_home", label: "Take Home" },
];

const OUTCOMES: { value: string; label: string; color: string }[] = [
  { value: "offer", label: "Offer", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { value: "rejected", label: "Rejected", color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { value: "withdrawn", label: "Withdrawn", color: "bg-gray-500/10 text-gray-400 border-gray-500/20" },
  { value: "no_response", label: "No Response", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
];

export function ApplicationDetailClient({ application: initialApp, userName }: Props) {
  const [app, setApp] = useState<JobApplication>(initialApp);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTailorModal, setShowTailorModal] = useState(false);
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [showOutcomeForm, setShowOutcomeForm] = useState(false);
  const [interviewForm, setInterviewForm] = useState({ stage: "phone_screen", type: "video", date: "", notes: "" });
  const [outcomeForm, setOutcomeForm] = useState({ outcome: "offer", notes: "" });
  const [submittingEvent, setSubmittingEvent] = useState(false);

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

  // Fetch events on mount
  React.useEffect(() => {
    fetch(`/api/applications/${app.applicationId}/events`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [app.applicationId]);

  const recordEvent = useCallback(async (eventType: string, payload: Record<string, unknown>) => {
    setSubmittingEvent(true);
    try {
      const res = await fetch(`/api/applications/${app.applicationId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, ...payload }),
      });
      if (res.ok) {
        const event = await res.json();
        setEvents((prev) => [...prev, event]);
        // Refetch application to get updated status
        const appRes = await fetch(`/api/applications/${app.applicationId}`);
        if (appRes.ok) {
          const updated = await appRes.json();
          setApp(updated);
        }
      }
    } catch {
      // Silently handle
    } finally {
      setSubmittingEvent(false);
      setShowInterviewForm(false);
      setShowOutcomeForm(false);
      setInterviewForm({ stage: "phone_screen", type: "video", date: "", notes: "" });
      setOutcomeForm({ outcome: "offer", notes: "" });
    }
  }, [app.applicationId]);

  const handleRecordInterview = useCallback(() => {
    recordEvent("interview_scheduled", {
      interviewStage: interviewForm.stage,
      interviewType: interviewForm.type,
      interviewDate: interviewForm.date || undefined,
      notes: interviewForm.notes || undefined,
    });
  }, [recordEvent, interviewForm]);

  const handleRecordOutcome = useCallback(() => {
    recordEvent("outcome_recorded", {
      outcome: outcomeForm.outcome,
      notes: outcomeForm.notes || undefined,
    });
  }, [recordEvent, outcomeForm]);

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${app.applicationId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/overview";
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
          href="/overview"
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

          {/* M5: Record Interview */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Record Interview
            </h3>
            {!showInterviewForm ? (
              <button
                onClick={() => setShowInterviewForm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-500 dark:bg-purple-500/90 text-xs font-semibold text-white hover:brightness-110 transition-all w-full justify-center"
              >
                <Plus className="h-3 w-3" />
                Add Interview
              </button>
            ) : (
              <div className="space-y-2">
                <select
                  value={interviewForm.stage}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, stage: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-300"
                >
                  {INTERVIEW_STAGES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <select
                  value={interviewForm.type}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, type: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-300"
                >
                  {INTERVIEW_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={interviewForm.date}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-300"
                />
                <textarea
                  value={interviewForm.notes}
                  onChange={(e) => setInterviewForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-300 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRecordInterview}
                    disabled={submittingEvent}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {submittingEvent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calendar className="h-3 w-3" />}
                    Save
                  </button>
                  <button
                    onClick={() => setShowInterviewForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-xs text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* M5: Record Outcome */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Award className="h-4 w-4 text-green-500" />
              Record Outcome
            </h3>
            {!showOutcomeForm ? (
              <button
                onClick={() => setShowOutcomeForm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-green-500 dark:bg-green-500/90 text-xs font-semibold text-white hover:brightness-110 transition-all w-full justify-center"
              >
                <Award className="h-3 w-3" />
                Add Outcome
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {OUTCOMES.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setOutcomeForm((p) => ({ ...p, outcome: o.value }))}
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all",
                        outcomeForm.outcome === o.value
                          ? o.color
                          : "border-gray-200 dark:border-white/[0.06] text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-white/[0.04]",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={outcomeForm.notes}
                  onChange={(e) => setOutcomeForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] text-xs text-gray-700 dark:text-slate-300 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleRecordOutcome}
                    disabled={submittingEvent}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
                  >
                    {submittingEvent ? <Loader2 className="h-3 w-3 animate-spin" /> : <Award className="h-3 w-3" />}
                    Save
                  </button>
                  <button
                    onClick={() => setShowOutcomeForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/[0.08] text-xs text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* M5: Event Timeline */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              Timeline
            </h3>
            {eventsLoading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-white/[0.06] rounded w-2/3" />
                <div className="h-3 bg-gray-200 dark:bg-white/[0.06] rounded w-1/2" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-slate-500">
                No events recorded yet. Update the status or record an interview to start tracking.
              </p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => {
                  const eventStyle = EVENT_TYPE_LABELS[event.eventType] || EVENT_TYPE_LABELS.status_change;
                  const EventIcon = eventStyle.icon;
                  return (
                    <div key={event.id} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <EventIcon className={clsx("h-3.5 w-3.5", eventStyle.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 dark:text-slate-300">
                          {eventStyle.label}
                          {event.newStatus && (
                            <span className="ml-1.5 text-gray-400 dark:text-slate-500">
                              → {event.newStatus.replace(/_/g, " ")}
                            </span>
                          )}
                        </p>
                        {event.interviewStage && (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">
                            {event.interviewStage.replace(/_/g, " ")} • {event.interviewType?.replace(/_/g, " ") || "video"}
                            {event.interviewDate && ` • ${new Date(event.interviewDate).toLocaleDateString()}`}
                          </p>
                        )}
                        {event.outcome && (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500">
                            Outcome: {event.outcome}
                          </p>
                        )}
                        {event.notes && (
                          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5 line-clamp-2">
                            {event.notes}
                          </p>
                        )}
                        <p className="text-[9px] text-gray-300 dark:text-slate-600 mt-0.5">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
              onClick={() => setShowDeleteConfirm(true)}
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

      <ConfirmationDialog
        open={showDeleteConfirm}
        title="Delete this application?"
        message={`"${app.title}" at ${app.companyName} will be permanently deleted. This will not affect your resumes.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
