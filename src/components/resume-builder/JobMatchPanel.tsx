"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { useResumeBuilder } from "@/store/resume-builder";
import { ai } from "@/lib/ai/client";
import type { JobMatchResult } from "@/types/resume";
import { AnalysisScore } from "./AnalysisScore";
import { AIActionButton } from "./AIActionButton";
import { Sparkles, CheckCircle2, XCircle, ArrowRight, ChevronDown, ChevronUp, Target, Wand2 } from "lucide-react";

export function JobMatchPanel() {
  const resume = useResumeBuilder((s) => s.resume);
  const jobMatch = useResumeBuilder((s) => s.jobMatch);
  const setJobMatch = useResumeBuilder((s) => s.setJobMatch);
  const jobDescription = useResumeBuilder((s) => s.jobDescription);
  const setJobDescription = useResumeBuilder((s) => s.setJobDescription);

  const [expanded, setExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await ai.analyzeJobMatch(resume, jobDescription);
      setJobMatch(result as unknown as JobMatchResult);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async () => {
    if (!jobDescription.trim()) return;
    setIsOptimizing(true);
    try {
      const result = await ai.optimizeForJob(resume, jobDescription, resume.title || "professional");
      setOptimizationResult(result.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
      >
        <span>Paste a job description to check compatibility</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-3"
          >
            {/* JD Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={4}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white px-3.5 py-2.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-slate-600 resize-none transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !jobDescription.trim()}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] font-semibold transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Sparkles className="w-3 h-3 animate-pulse" />
                ) : (
                  <Target className="w-3 h-3" />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze Match"}
              </button>
              {jobMatch && (
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-[10px] font-semibold transition-all disabled:opacity-50"
                >
                  <Wand2 className="w-3 h-3" />
                  {isOptimizing ? "Optimizing..." : "Optimize"}
                </button>
              )}
            </div>

            {/* Results */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center py-4"
                >
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
                    Matching resume against job description...
                  </div>
                </motion.div>
              )}

              {jobMatch && !isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Score */}
                  <div className="flex items-center justify-center py-2">
                    <AnalysisScore label="Job Match" score={jobMatch.overallScore} size="lg" />
                  </div>

                  {/* Matched Skills */}
                  {jobMatch.matchedSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Matched Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatch.matchedSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-medium"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  {jobMatch.missingSkills.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Missing Skills</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {jobMatch.missingSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-medium"
                          >
                            <XCircle className="w-2.5 h-2.5" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {jobMatch.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Suggestions</h4>
                      {jobMatch.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/8 text-[10px] text-slate-300">
                          <ArrowRight className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
