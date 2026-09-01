"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus, Sparkles, Trophy, Globe, Link2, Award, Eye, CheckCircle2, AlertTriangle, XCircle, FileText } from "lucide-react";
import { clsx } from "clsx";
import { ai } from "@/lib/ai/client";
import { AnalysisScore } from "../AnalysisScore";
import { ProgressIndicator } from "../ProgressIndicator";
import { useValidation } from "../hooks/useValidation";

/* ====================================================================
 * ACHIEVEMENTS
 * ==================================================================== */
export function AchievementsSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addAchievement = useResumeBuilder((s) => s.addAchievement);
  const updateAchievement = useResumeBuilder((s) => s.updateAchievement);
  const removeAchievement = useResumeBuilder((s) => s.removeAchievement);
  const { touch, getFieldError } = useValidation();

  return (
    <SectionCard
      id="achievements"
      title="Achievements"
      description="Awards, honors, and major accomplishments"
      icon="🏆"
      actions={
        <AIActionButton label="Add Achievement" onClick={addAchievement} variant="outline" icon={<Plus className="w-3 h-3" />} />
      }
    >
      <SectionContent>
        {resume.achievements.length === 0 ? (            <EmptyState icon={<Trophy className="w-8 h-8 text-gray-400 dark:text-slate-600" />} message="No achievements yet" submessage="Add awards and accomplishments to stand out" action={() => addAchievement()} actionLabel="Add Achievement" />
        ) : (
          <div className="space-y-3">
            {resume.achievements.map((ach, idx) => (
              <motion.div
                key={ach.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <FieldInput label="Title" placeholder="Employee of the Month" value={ach.title} onChange={(v) => updateAchievement(ach.id, "title", v)} onBlur={() => touch(`achievements.${idx}.title`)} error={getFieldError("achievements", "title", idx)} />
                      <FieldInput label="Issuer" placeholder="Company Name" value={ach.issuer} onChange={(v) => updateAchievement(ach.id, "issuer", v)} />
                      <FieldInput label="Date" placeholder="Jan 2024" value={ach.date} onChange={(v) => updateAchievement(ach.id, "date", v)} />
                    </div>
                    <FieldInput label="Description" placeholder="Describe the achievement and its impact..." value={ach.description} onChange={(v) => updateAchievement(ach.id, "description", v)} type="textarea" rows={2} />
                  </div>
                  <button onClick={() => removeAchievement(ach.id)} className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10 shrink-0">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionContent>
    </SectionCard>
  );
}

/* ====================================================================
 * LANGUAGES
 * ==================================================================== */
const proficiencyLevels = ["Native", "Fluent", "Professional", "Conversational", "Beginner"] as const;

export function LanguagesSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addLanguage = useResumeBuilder((s) => s.addLanguage);
  const updateLanguage = useResumeBuilder((s) => s.updateLanguage);
  const removeLanguage = useResumeBuilder((s) => s.removeLanguage);
  const { touch, getFieldError } = useValidation();

  return (
    <SectionCard
      id="languages"
      title="Languages"
      description="Languages you speak and your proficiency level"
      icon="🌐"
      actions={
        <AIActionButton label="Add Language" onClick={addLanguage} variant="outline" icon={<Plus className="w-3 h-3" />} />
      }
    >
      <SectionContent>
        {resume.languages.length === 0 ? (            <EmptyState icon={<Globe className="w-8 h-8 text-gray-400 dark:text-slate-600" />} message="No languages added" submessage="Add languages to showcase your multilingual skills" action={() => addLanguage()} actionLabel="Add Language" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resume.languages.map((lang, idx) => (
              <motion.div
                key={lang.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-3.5 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={lang.name}
                    onChange={(e) => updateLanguage(lang.id, "name", e.target.value)}
                    onBlur={() => touch(`languages.${idx}.name`)}
                    placeholder="Language"
                    className={"w-full bg-transparent text-sm text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-slate-600 outline-none " + (getFieldError("languages", "name", idx) ? "text-red-400" : "")}
                  />
                  {getFieldError("languages", "name", idx) && <p className="text-[11px] text-red-400 mt-1">{getFieldError("languages", "name", idx)}</p>}
                </div>
                <select
                  value={lang.proficiency}
                  onChange={(e) => updateLanguage(lang.id, "proficiency", e.target.value)}
                  className="bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg text-[10px] text-gray-700 dark:text-slate-300 px-2 py-1.5 outline-none focus:border-blue-500/50"
                >
                  {proficiencyLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <button onClick={() => removeLanguage(lang.id)} className="p-1 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10">
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </SectionContent>
    </SectionCard>
  );
}

/* ====================================================================
 * PORTFOLIO
 * ==================================================================== */
const portfolioTypes = ["github", "website", "dribbble", "figma", "other"] as const;

export function PortfolioSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addPortfolio = useResumeBuilder((s) => s.addPortfolio);
  const updatePortfolio = useResumeBuilder((s) => s.updatePortfolio);
  const removePortfolio = useResumeBuilder((s) => s.removePortfolio);
  const { touch, getFieldError } = useValidation();

  return (
    <SectionCard
      id="portfolio"
      title="Portfolio"
      description="Links to your work samples, projects, and profiles"
      icon="🔗"
      actions={
        <AIActionButton label="Add Item" onClick={addPortfolio} variant="outline" icon={<Plus className="w-3 h-3" />} />
      }
    >
      <SectionContent>
        {resume.portfolio.length === 0 ? (            <EmptyState icon={<Link2 className="w-8 h-8 text-gray-400 dark:text-slate-600" />} message="No portfolio items" submessage="Add links to your best work to impress employers" action={() => addPortfolio()} actionLabel="Add Portfolio Item" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {resume.portfolio.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 space-y-3"
              >
                <div className="grid grid-cols-1 gap-3">
                  <FieldInput label="Title" placeholder="My Portfolio" value={item.title} onChange={(v) => updatePortfolio(item.id, "title", v)} onBlur={() => touch(`portfolio.${idx}.title`)} error={getFieldError("portfolio", "title", idx)} />
                  <FieldInput label="URL" placeholder="https://..." value={item.url} onChange={(v) => updatePortfolio(item.id, "url", v)} type="url" onBlur={() => touch(`portfolio.${idx}.url`)} error={getFieldError("portfolio", "url", idx)} />
                  <div>
                    <label className="text-[10px] font-medium text-slate-500 mb-1 block">Type</label>
                    <select
                      value={item.type}
                      onChange={(e) => updatePortfolio(item.id, "type", e.target.value)}
                      className="w-full bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-xl text-xs text-gray-700 dark:text-slate-300 px-3.5 py-2.5 outline-none focus:border-blue-500/50"
                    >
                      {portfolioTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <FieldInput label="Description" placeholder="What this link showcases..." value={item.description} onChange={(v) => updatePortfolio(item.id, "description", v)} type="textarea" rows={2} />
                </div>
                <div className="flex justify-end">
                  <button onClick={() => removePortfolio(item.id)} className="px-2.5 py-1 rounded-lg text-red-400 text-[10px] hover:bg-red-500/10 transition-colors">Remove</button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </SectionContent>
    </SectionCard>
  );
}

/* ====================================================================
 * REVIEW SECTION
 * ==================================================================== */
export function ReviewSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const analysis = useResumeBuilder((s) => s.analysis);
  const resumeScore = useResumeBuilder((s) => s.resumeScore);
  const progress = useResumeBuilder((s) => s.progress);
  const sectionComplete = useResumeBuilder((s) => s.sectionComplete);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const setAnalysis = useResumeBuilder((s) => s.setAnalysis);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    try {
      const result = await ai.analyzeResume(resume);
      setAnalysis(result);
    } catch (err: any) {
      setAnalyzeError(err.message || "AI request failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sections: Array<{ id: Parameters<typeof sectionComplete>[0]; label: string }> = [
    { id: "personal", label: "Personal Information" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "projects", label: "Projects" },
    { id: "certifications", label: "Certifications" },
    { id: "achievements", label: "Achievements" },
    { id: "languages", label: "Languages" },
    { id: "portfolio", label: "Portfolio" },
  ];

  const issues: Array<{ type: "error" | "warning" | "info"; message: string }> = [];
  if (!resume.name) issues.push({ type: "error", message: "Full name is missing" });
  if (!resume.email) issues.push({ type: "error", message: "Email address is missing" });
  if (!resume.phone) issues.push({ type: "error", message: "Phone number is missing" });
  if (!resume.summary) issues.push({ type: "warning", message: "Professional summary is missing — reduces ATS score" });
  if (resume.experience.length === 0) issues.push({ type: "error", message: "No experience entries — this is required" });
  if (resume.skills.length < 3) issues.push({ type: "warning", message: "Add at least 3 skills to improve keyword matching" });
  if (!resume.social.linkedin) issues.push({ type: "info", message: "Adding a LinkedIn profile increases credibility" });
  if (!resume.social.github) issues.push({ type: "info", message: "Adding a GitHub profile showcases your work" });

  const missingCertText = resume.certifications.length === 0 ? "No certifications listed" : null;

  return (
    <SectionCard
      id="review"
      title="Review & Finalize"
      description="Review your complete profile before generating your Professional Passport"
      icon="👁️"
    >
      <SectionContent>
        <div className="space-y-6">
          {/* Run Analysis CTA */}
          {!analysis && (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06]">
              <Eye className="w-10 h-10 text-gray-400 dark:text-slate-600 mb-3" />
              <p className="text-sm text-gray-900 dark:text-slate-300 font-medium mb-1">Ready to review?</p>
              <p className="text-xs text-gray-500 dark:text-slate-500 mb-5">Run a full analysis to check your resume quality before previewing.</p>
              <AIActionButton
                label="Run Full Analysis"
                onClick={handleRunAnalysis}
                isLoading={isAnalyzing}
                variant="primary"
                size="md"
                icon={<Sparkles className="w-4 h-4" />}
              />
              {analyzeError && (
                <p className="text-[11px] text-red-400 mt-2">{analyzeError}</p>
              )}
            </div>
          )}

          {/* Analysis Results */}
          {analysis && (
            <>
              {/* Score Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 text-center">
                  <AnalysisScore label="Resume Score" score={analysis.resumeScore?.overall} size="lg" />
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 text-center">
                  <AnalysisScore label="ATS Score" score={analysis.atsScore} size="lg" />
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 text-center">
                  <AnalysisScore label="Trust Score" score={analysis.trustScore?.overall} size="lg" />
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] p-4 text-center">
                  <AnalysisScore label="Professional Impact" score={analysis.professionalImpact} size="lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <ProgressIndicator title="Grammar" value={analysis.resumeScore?.grammar} color="#10b981" />
                <ProgressIndicator title="Readability" value={analysis.resumeScore?.readability} color="#22d3ee" />
                <ProgressIndicator title="Keyword Match" value={analysis.resumeScore?.keywordMatch} color="#8b5cf6" />
                <ProgressIndicator title="Completion" value={progress()} color="#f59e0b" />
                <ProgressIndicator title="Trust Score" value={analysis.trustScore?.overall} color="#ef4444" />
              </div>

              {/* Issues */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Issues to Resolve</h3>
                {issues.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    All checks passed! Your resume looks great.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {issues.map((issue, i) => (
                      <div
                        key={i}
                        className={clsx(
                          "flex items-start gap-2 px-3 py-2 rounded-lg text-xs",
                          issue.type === "error" && "bg-red-500/8 text-red-400",
                          issue.type === "warning" && "bg-amber-500/8 text-amber-400",
                          issue.type === "info" && "bg-blue-500/8 text-blue-400",
                        )}
                      >
                        {issue.type === "error" ? <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> :
                         issue.type === "warning" ? <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> :
                         <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section Completion */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-900 dark:text-white">Section Completion</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {sections.map((sec) => {
                    const complete = sectionComplete(sec.id);
                    return (
                      <div
                        key={sec.id}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs border",
                          complete
                            ? "bg-emerald-500/8 text-emerald-400 border-emerald-500/15"
                            : "bg-slate-500/8 text-slate-400 border-slate-500/15",
                        )}
                      >
                        {complete
                          ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                          : <AlertTriangle className="w-3 h-3 shrink-0" />}
                        <span>{sec.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Proceed to Preview */}
          <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-white/[0.06]">
            <AIActionButton
              label="Continue to Preview"
              onClick={() => window.location.href = "/resume-builder/preview"}
              variant="primary"
              size="md"
              icon={<Eye className="w-4 h-4" />}
            />
          </div>
        </div>
      </SectionContent>
    </SectionCard>
  );
}

/* ── Shared Empty State ── */
function EmptyState({
  icon,
  message,
  submessage,
  action,
  actionLabel,
}: {
  icon: React.ReactNode;
  message: string;
  submessage: string;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06]"
    >
      {icon}
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 mt-3">{message}</p>
      <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">{submessage}</p>
      <AIActionButton label={actionLabel} onClick={action} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
    </motion.div>
  );
}
