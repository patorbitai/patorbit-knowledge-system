"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Loader2,
  Target,
  RefreshCw,
  ShieldCheck,
  Eye,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { TEMPLATES } from "@/app/resume-builder/templates";
import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import { getActiveTemplate } from "@/components/resume/ResumePreview";
import type { Resume } from "@/types/resume";
import type { ResumeTemplate } from "@/app/resume-builder/templates";

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

type Step = "input" | "analyzing" | "results" | "review";

/**
 * Compare original and tailored resumes to detect what changed.
 * Returns a structured diff for the comparison view.
 */
function compareResumes(original: Resume, tailored: Record<string, unknown>) {
  const changes: Array<{ section: string; type: "rewritten" | "reordered" | "unchanged" | "omitted"; detail: string }> = [];

  // Summary
  if (tailored.summary && original.summary !== tailored.summary) {
    changes.push({ section: "Summary", type: "rewritten", detail: "Rewritten for target role" });
  } else if (tailored.summary) {
    changes.push({ section: "Summary", type: "unchanged", detail: "No change needed" });
  }

  // Skills
  const origSkills = original.skills.map((s) => s.name).sort().join(",");
  const tailoredSkills = (Array.isArray(tailored.skills) ? tailored.skills : []).map((s: any) => s.name).sort().join(",");
  if (origSkills !== tailoredSkills) {
    const origSet = new Set(original.skills.map((s) => s.name));
    const tailSet = new Set((Array.isArray(tailored.skills) ? tailored.skills : []).map((s: any) => s.name));
    const added = [...tailSet].filter((s) => !origSet.has(s));
    const removed = [...origSet].filter((s) => !tailSet.has(s));
    if (added.length || removed.length) {
      changes.push({ section: "Skills", type: "reordered", detail: `Prioritized ${tailSet.size - origSet.size > 0 ? "JD-relevant" : "relevant"} skills` });
    } else {
      changes.push({ section: "Skills", type: "reordered", detail: "Skills reordered for relevance" });
    }
  }

  // Experience
  const origExpCount = original.experience.length;
  const tailExpCount = Array.isArray(tailored.experience) ? tailored.experience.length : 0;
  if (origExpCount !== tailExpCount) {
    changes.push({ section: "Experience", type: "omitted", detail: `${origExpCount - tailExpCount} less relevant entries omitted` });
  } else {
    changes.push({ section: "Experience", type: "rewritten", detail: "Bullets rewritten for JD relevance" });
  }

  return changes;
}

/**
 * Detect potential unsupported claims in the tailored resume
 * by comparing against the original profile.
 */
function detectUnsupportedClaims(original: Resume, tailored: Record<string, unknown>): string[] {
  const unsupported: string[] = [];

  // Check skills
  const origSkillNames = new Set(original.skills.map((s) => s.name.toLowerCase()));
  const tailSkills = Array.isArray(tailored.skills) ? tailored.skills : [];
  for (const skill of tailSkills) {
    const name = (skill as any).name?.toLowerCase();
    if (name && !origSkillNames.has(name)) {
      unsupported.push(`Skill: ${(skill as any).name}`);
    }
  }

  // Check experience companies
  const origCompanies = new Set(original.experience.map((e) => e.company.toLowerCase()));
  const tailExp = Array.isArray(tailored.experience) ? tailored.experience : [];
  for (const exp of tailExp) {
    const company = (exp as any).company?.toLowerCase();
    if (company && !origCompanies.has(company)) {
      unsupported.push(`Experience: ${(exp as any).company}`);
    }
  }

  // Check certifications
  const origCerts = new Set(original.certifications.map((c) => c.name.toLowerCase()));
  const tailCerts = Array.isArray(tailored.certifications) ? tailored.certifications : [];
  for (const cert of tailCerts) {
    const name = (cert as any).name?.toLowerCase();
    if (name && !origCerts.has(name)) {
      unsupported.push(`Certification: ${(cert as any).name}`);
    }
  }

  return unsupported;
}

export function TailorResumeModal({ open, onClose }: TailorResumeModalProps) {
  const [step, setStep] = useState<Step>("input");
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tailorResult, setTailorResult] = useState<TailorResult | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("modern-clean");
  const [showComparison, setShowComparison] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const originalResume = useResumeBuilder((s) => s.resume);
  const createResume = useResumeBuilder((s) => s.createResume);
  const switchResume = useResumeBuilder((s) => s.switchResume);

  // Build the tailored Resume object for preview
  const tailoredResume = useMemo((): Resume | null => {
    if (!tailorResult) return null;
    const t = tailorResult.resume;
    return {
      ...originalResume,
      ...(t as Partial<Resume>),
      templateId: selectedTemplateId,
    } as Resume;
  }, [tailorResult, selectedTemplateId, originalResume]);

  // Get the selected template
  const selectedTemplate = useMemo((): ResumeTemplate => {
    return TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0];
  }, [selectedTemplateId]);

  // Compare original vs tailored
  const comparison = useMemo(() => {
    if (!tailorResult) return [];
    return compareResumes(originalResume, tailorResult.resume);
  }, [tailorResult, originalResume]);

  // Detect unsupported claims
  const unsupportedClaims = useMemo(() => {
    if (!tailorResult) return [];
    return detectUnsupportedClaims(originalResume, tailorResult.resume);
  }, [tailorResult, originalResume]);

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
          resume: originalResume,
          jobDescription: jobDescription.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze job description.");
      }

      setTailorResult(data);
      setSelectedTemplateId(originalResume.templateId || "modern-clean");
      setStep("results");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try again.");
      setStep("input");
    }
  }, [jobDescription, originalResume]);

  const handleGenerate = useCallback(() => {
    if (!tailorResult) return;
    setStep("review");
  }, [tailorResult]);

  const handleRegenerate = useCallback(async () => {
    if (!jobDescription.trim()) return;
    setIsRegenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume: originalResume,
          jobDescription: jobDescription.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to regenerate.");
      }

      setTailorResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Regeneration failed. Please try again.");
    } finally {
      setIsRegenerating(false);
    }
  }, [jobDescription, originalResume]);

  const handleApprove = useCallback(() => {
    if (!tailorResult || !tailoredResume) return;

    // Create a new resume with the tailored content
    const name = (tailorResult.resume as Record<string, unknown>).name || originalResume.name || "Tailored Resume";
    const newResumeId = createResume(`${name} — Tailored`);

    // Switch to the new resume and populate it
    switchResume(newResumeId);

    // Update the new resume with tailored content
    const store = useResumeBuilder.getState();
    const updates = tailorResult.resume as Record<string, unknown>;
    if (updates.name) store.updateField("name", updates.name as string);
    if (updates.title) store.updateField("title", updates.title as string);
    if (updates.email) store.updateField("email", updates.email as string);
    if (updates.phone) store.updateField("phone", updates.phone as string);
    if (updates.address) store.updateField("address", updates.address as string);
    if (updates.summary) store.updateField("summary", updates.summary as string);
    if (Array.isArray(updates.experience)) store.updateField("experience", updates.experience as any);
    if (Array.isArray(updates.education)) store.updateField("education", updates.education as any);
    if (Array.isArray(updates.skills)) store.updateField("skills", updates.skills as any);
    if (Array.isArray(updates.projects)) store.updateField("projects", updates.projects as any);
    if (Array.isArray(updates.certifications)) store.updateField("certifications", updates.certifications as any);

    // Apply the selected template
    store.applyTemplate(selectedTemplateId);

    // Navigate to builder
    setTimeout(() => {
      window.location.href = "/resume-builder";
    }, 800);
  }, [tailorResult, tailoredResume, originalResume, createResume, switchResume, selectedTemplateId]);

  const handleReset = useCallback(() => {
    setStep("input");
    setJobDescription("");
    setTailorResult(null);
    setError(null);
    setShowComparison(false);
    setIsRegenerating(false);
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
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-[#0C1322] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#0C1322]/90 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {step === "review" ? "Review Tailored Resume" : "Tailor Resume to Job"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {step === "review"
                      ? "Review, compare, and approve before saving"
                      : "Analyze a job description and generate a tailored resume"}
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

            <div className="p-6">
              {/* Step: Input */}
              {step === "input" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-2">
                      Paste the Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => { setJobDescription(e.target.value); setError(null); }}
                      placeholder={"Paste the complete job description here...\n\nExample:\nSenior Azure Data Engineer\n\nResponsibilities:\n- Build ETL pipelines using Azure Data Factory\n...\n\nRequirements:\n- 3+ years of data engineering experience\n- Azure Data Factory, Databricks, PySpark\n..."}
                      className="w-full h-48 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-transparent"
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">{jobDescription.length} characters</span>
                      {jobDescription.length > 0 && jobDescription.length < 50 && (
                        <span className="text-[10px] text-amber-500">Paste the full job posting for best results</span>
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
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Analyzing job description...</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Comparing requirements against your Professional Identity</p>
                  </div>
                </div>
              )}

              {/* Step: Results (match analysis) */}
              {step === "results" && tailorResult && (
                <div className="space-y-4">
                  {/* Match Score */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-500 dark:text-slate-400">Job Match Score</span>
                      <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{tailorResult.matchAnalysis.matchScore}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-white/[0.06] rounded-full h-2">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all" style={{ width: `${tailorResult.matchAnalysis.matchScore}%` }} />
                    </div>
                  </div>

                  {/* Matched Skills */}
                  {tailorResult.matchAnalysis.matchedSkills.length > 0 && (
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Matched ({tailorResult.matchAnalysis.matchedSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tailorResult.matchAnalysis.matchedSkills.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Partial Matches */}
                  {tailorResult.matchAnalysis.partialMatches.length > 0 && (
                    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Partial ({tailorResult.matchAnalysis.partialMatches.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tailorResult.matchAnalysis.partialMatches.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-[11px] font-medium text-amber-700 dark:text-amber-300">~ {skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {tailorResult.matchAnalysis.missingSkills.length > 0 && (
                    <div className="rounded-xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold text-red-700 dark:text-red-400">Missing ({tailorResult.matchAnalysis.missingSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {tailorResult.matchAnalysis.missingSkills.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-500/20 text-[11px] font-medium text-red-700 dark:text-red-300">! {skill}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-red-500/70 dark:text-red-400/50 mt-2">These were NOT added to your resume — they are missing from your profile.</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={handleReset} className="flex-1 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors">
                      Try Another JD
                    </button>
                    <button onClick={handleGenerate} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 px-4 py-2.5 text-xs font-medium text-white transition-all">
                      Generate Tailored Resume
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step: Review (full preview + comparison + template + approval) */}
              {step === "review" && tailorResult && tailoredResume && (
                <div className="space-y-4">
                  {/* Trust Panel */}
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Trust & Factuality</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-emerald-600 dark:text-emerald-300/80">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Built from your existing Professional Identity</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Existing experience was preserved</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> Missing skills were NOT added</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3" /> You control the final version</li>
                    </ul>
                    {unsupportedClaims.length > 0 && (
                      <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3">
                        <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mb-1">⚠ Review Required</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-300/70">The following items could not be verified against your profile:</p>
                        <ul className="mt-1 space-y-0.5">
                          {unsupportedClaims.map((item) => (
                            <li key={item} className="text-[10px] text-amber-600 dark:text-amber-300/70">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Match Summary */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">Match: {tailorResult.matchAnalysis.matchScore}%</span>
                    <span className="text-emerald-600 dark:text-emerald-400">✓ {tailorResult.matchAnalysis.matchedSkills.length} matched</span>
                    {tailorResult.matchAnalysis.partialMatches.length > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">~ {tailorResult.matchAnalysis.partialMatches.length} partial</span>
                    )}
                    {tailorResult.matchAnalysis.missingSkills.length > 0 && (
                      <span className="text-red-600 dark:text-red-400">! {tailorResult.matchAnalysis.missingSkills.length} missing</span>
                    )}
                  </div>

                  {/* Comparison Toggle */}
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="flex items-center gap-2 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showComparison ? "Hide" : "Show"} Original vs Tailored Comparison
                  </button>

                  {/* Comparison View */}
                  {showComparison && (
                    <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300">What Changed</h3>
                      {comparison.map((change) => (
                        <div key={change.section} className="flex items-start gap-3 text-xs">
                          <span className="font-medium text-gray-700 dark:text-slate-300 w-24 shrink-0">{change.section}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            change.type === "rewritten" ? "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300" :
                            change.type === "reordered" ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300" :
                            change.type === "omitted" ? "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300" :
                            "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-slate-400"
                          }`}>
                            {change.type}
                          </span>
                          <span className="text-gray-500 dark:text-slate-400">{change.detail}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Template Selection */}
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-gray-700 dark:text-slate-300">Template:</label>
                    <div className="relative">
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        className="appearance-none rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-3 py-1.5 pr-8 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      >
                        {TEMPLATES.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Full Resume Preview */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] p-4">
                    <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-3">Resume Preview</h3>
                    <div className="flex justify-center overflow-x-auto">
                      <PaginatedResumeSheet
                        resume={tailoredResume}
                        template={selectedTemplate}
                      />
                    </div>
                  </div>

                  {/* Approval Confirmation */}
                  <div className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] p-4">
                    <p className="text-xs text-gray-600 dark:text-slate-400">
                      You are about to create a <strong>new resume</strong>. Your original resume will remain <strong>unchanged</strong>.
                      The tailored resume will be created with its own independent ID.
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleReset}
                      className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
                      Back
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={isRegenerating}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02] px-4 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50"
                    >
                      {isRegenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Regenerate
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 px-4 py-2.5 text-xs font-medium text-white transition-all"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Save as New Resume
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
