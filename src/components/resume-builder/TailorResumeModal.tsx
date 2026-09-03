"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Loader2,
  Target,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";

interface MatchAnalysis {
  matchScore: number;
  matchedSkills: string[];
  partialMatches: string[];
  missingSkills: string[];
}

interface TailorResult {
  resume: Record<string, unknown>;
  matchAnalysis: MatchAnalysis;
}

interface TailorResumeModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = "input" | "analyzing" | "results" | "generating" | "review" | "saving";

export function TailorResumeModal({ open, onClose }: TailorResumeModalProps) {
  const [step, setStep] = useState<Step>("input");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [createdResumeId, setCreatedResumeId] = useState<string | null>(null);

  const resume = useResumeBuilder((s) => s.resume);
  const createResume = useResumeBuilder((s) => s.createResume);
  const switchResume = useResumeBuilder((s) => s.switchResume);
  const setResume = useResumeBuilder((s) => s.setResume);

  const handleAnalyze = useCallback(async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }
    if (jobDescription.trim().length < 50) {
      setError("Job description is too short. Please paste the full job posting.");
      return;
    }

    setError(null);
    setStep("analyzing");

    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume,
          jobDescription: jobDescription.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze job description.");
      }

      setTailorResult(data);
      setStep("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setStep("input");
    }
  }, [jobDescription, resume]);

  const handleGenerate = useCallback(() => {
    if (!tailorResult) return;
    setStep("review");
  }, [tailorResult]);

  const handleSave = useCallback(async () => {
    if (!tailorResult) return;
    setStep("saving");
    setError(null);

    try {
      // Create a new resume with the tailored content
      const tailoredResume = tailorResult.resume;
      const name = (tailoredResume as Record<string, unknown>).name || resume.name || "Tailored Resume";
      const newResumeId = createResume(`${name} — Tailored`);

      // Switch to the new resume and populate it
      switchResume(newResumeId);

      // Update the new resume with tailored content
      const store = useResumeBuilder.getState();
      const updates = tailoredResume as Record<string, unknown>;
      if (updates.name) store.updateField("name", updates.name as string);
      if (updates.title) store.updateField("title", updates.title as string);
      if (updates.email) store.updateField("email", updates.email as string);
      if (updates.phone) store.updateField("phone", updates.phone as string);
      if (updates.address) store.updateField("address", updates.address as string);
      if (updates.summary) store.updateField("summary", updates.summary as string);

      // Copy arrays
      if (Array.isArray(updates.experience)) {
        store.updateField("experience", updates.experience as any);
      }
      if (Array.isArray(updates.education)) {
        store.updateField("education", updates.education as any);
      }
      if (Array.isArray(updates.skills)) {
        store.updateField("skills", updates.skills as any);
      }
      if (Array.isArray(updates.projects)) {
        store.updateField("projects", updates.projects as any);
      }
      if (Array.isArray(updates.certifications)) {
        store.updateField("certifications", updates.certifications as any);
      }

      setCreatedResumeId(newResumeId);
      setStep("review");

      // Navigate to builder after a brief delay
      setTimeout(() => {
        window.location.href = "/resume-builder";
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tailored resume.");
      setStep("review");
    }
  }, [tailorResult, resume, createResume, switchResume]);

  const handleReset = useCallback(() => {
    setStep("input");
    setJobDescription("");
    setTailorResult(null);
    setCreatedResumeId(null);
    setError(null);
  }, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Tailor Resume to Job
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    Analyze a job description and generate a tailored resume
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step: Input */}
            {step === "input" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">
                    Paste the Job Description
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => {
                      setJobDescription(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste the complete job description here...

Example:
Senior Azure Data Engineer

Responsibilities:
- Build ETL pipelines using Azure Data Factory
- Develop data processing solutions using Databricks
...

Requirements:
- 3+ years of data engineering experience
- Azure Data Factory, Databricks, PySpark
..."
                    className="w-full h-48 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                  />
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400 dark:text-slate-500">
                      {jobDescription.length} characters
                    </span>
                    {jobDescription.length > 0 && jobDescription.length < 50 && (
                      <span className="text-[10px] text-amber-500">
                        Paste the full job posting for best results
                      </span>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleAnalyze}
                  disabled={!jobDescription.trim() || jobDescription.trim().length < 50}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-sm font-medium text-white transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  Analyze Job Description
                </button>
              </div>
            )}

            {/* Step: Analyzing */}
            {step === "analyzing" && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Analyzing job description...
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    Comparing requirements against your Professional Identity
                  </p>
                </div>
              </div>
            )}

            {/* Step: Results (match analysis) */}
            {step === "results" && tailorResult && (
              <div className="space-y-4">
                {/* Match Score */}
                <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
                      Job Match Score
                    </span>
                    <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                      {tailorResult.matchAnalysis.matchScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-white/[0.06] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${tailorResult.matchAnalysis.matchScore}%` }}
                    />
                  </div>
                </div>

                {/* Matched Skills */}
                {tailorResult.matchAnalysis.matchedSkills.length > 0 && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        Matched Skills ({tailorResult.matchAnalysis.matchedSkills.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.matchAnalysis.matchedSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-[11px] font-medium text-emerald-700 dark:text-emerald-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Partial Matches */}
                {tailorResult.matchAnalysis.partialMatches.length > 0 && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        Partial Matches ({tailorResult.matchAnalysis.partialMatches.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.matchAnalysis.partialMatches.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-[11px] font-medium text-amber-700 dark:text-amber-300"
                        >
                          ~ {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Skills */}
                {tailorResult.matchAnalysis.missingSkills.length > 0 && (
                  <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <X className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                        Missing from Your Profile ({tailorResult.matchAnalysis.missingSkills.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {tailorResult.matchAnalysis.missingSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-[11px] font-medium text-red-700 dark:text-red-300"
                        >
                          ! {skill}
                        </span>
                      ))}
                    </div>
                    <p className="text-[10px] text-red-500/70 dark:text-red-400/50 mt-2">
                      These skills were NOT added to your resume — they are missing from your profile.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
                  >
                    Try Another JD
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-4 py-2.5 text-xs font-medium text-white transition-all"
                  >
                    Generate Tailored Resume
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step: Review (generated resume) */}
            {step === "review" && tailorResult && (
              <div className="space-y-4">
                {createdResumeId ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Tailored Resume Created!
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                        Opening in the resume builder...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] p-4">
                      <p className="text-xs text-gray-600 dark:text-slate-400">
                        Your tailored resume has been generated based on your existing
                        Professional Identity. No information has been fabricated.
                      </p>
                    </div>

                    {/* Show what changed */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                        What was tailored:
                      </h3>
                      <ul className="space-y-1 text-xs text-gray-600 dark:text-slate-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Summary rewritten for the target role
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Skills reordered to prioritize JD-relevant skills
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          Experience bullets rewritten for relevance
                        </li>
                        {tailorResult.matchAnalysis.missingSkills.length > 0 && (
                          <li className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            {tailorResult.matchAnalysis.missingSkills.length} missing skills NOT fabricated
                          </li>
                        )}
                      </ul>
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleReset}
                        className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
                      >
                        Start Over
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 px-4 py-2.5 text-xs font-medium text-white transition-all"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Save as New Resume
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
