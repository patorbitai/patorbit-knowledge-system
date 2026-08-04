"use client";

import { useState, useCallback } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { rewriteExperience, generateQuantifiedAchievements, improveBulletPoints } from "@/lib/ai/resume-ai";
import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { VerificationStatus } from "../fields/VerificationBadge";
import { useValidation } from "../hooks/useValidation";

export function ExperienceSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addExperience = useResumeBuilder((s) => s.addExperience);
  const updateExperience = useResumeBuilder((s) => s.updateExperience);
  const removeExperience = useResumeBuilder((s) => s.removeExperience);
  const moveExperience = useResumeBuilder((s) => s.moveExperience);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);

  const { touch, getFieldError } = useValidation();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Map<string, { type: string; content: any }>>(new Map());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAIRewrite = async (id: string, tone: "ats" | "impact" | "concise" | "expanded" | "professional") => {
    const exp = resume.experience.find((e) => e.id === id);
    if (!exp) return;
    const key = `exp-${id}-${tone}`;
    setAIAction(key, { status: "loading", result: null, error: null });
    try {
      const result = await rewriteExperience(exp, tone);
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: `rewrite-${tone}`, content: result });
        return next;
      });
      setAIAction(key, { status: "success", result: JSON.stringify(result), error: null });
    } catch (err: any) {
      setAIAction(key, { status: "error", result: null, error: err.message });
    }
  };

  const handleGenerateBullets = async (id: string) => {
    const exp = resume.experience.find((e) => e.id === id);
    if (!exp) return;
    setAIAction(`exp-${id}-bullets`, { status: "loading", result: null, error: null });
    try {
      const result = await generateQuantifiedAchievements(exp);
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: "bullets", content: result.bulletPoints });
        return next;
      });
      setAIAction(`exp-${id}-bullets`, { status: "success", result: result.bulletPoints.join("\n"), error: null });
    } catch (err: any) {
      setAIAction(`exp-${id}-bullets`, { status: "error", result: null, error: err.message });
    }
  };

  const handleImproveBullets = async (id: string) => {
    const exp = resume.experience.find((e) => e.id === id);
    if (!exp) return;
    const bullets = exp.bulletPoints?.length > 0
      ? exp.bulletPoints
      : exp.description?.split("\n").filter(Boolean) || [];
    if (bullets.length === 0) return;
    setAIAction(`exp-${id}-improve-bullets`, { status: "loading", result: null, error: null });
    try {
      const result = await improveBulletPoints(bullets);
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: "improve-bullets", content: result.bulletPoints });
        return next;
      });
      setAIAction(`exp-${id}-improve-bullets`, { status: "success", result: null, error: null });
    } catch (err: any) {
      setAIAction(`exp-${id}-improve-bullets`, { status: "error", result: null, error: err.message });
    }
  };

  const handleMoveBullet = (expId: string, fromIdx: number, dir: -1 | 1) => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp || !exp.bulletPoints) return;
    const bullets = [...exp.bulletPoints];
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= bullets.length) return;
    const [moved] = bullets.splice(fromIdx, 1);
    bullets.splice(toIdx, 0, moved);
    updateExperience(expId, "bulletPoints", bullets);
  };

  const handleRemoveBullet = (expId: string, idx: number) => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp || !exp.bulletPoints) return;
    const bullets = exp.bulletPoints.filter((_, i) => i !== idx);
    updateExperience(expId, "bulletPoints", bullets);
  };

  const handleAddBullet = (expId: string) => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp) return;
    const bullets = [...(exp.bulletPoints || []), ""];
    updateExperience(expId, "bulletPoints", bullets);
  };

  const handleUpdateBullet = (expId: string, idx: number, value: string) => {
    const exp = resume.experience.find((e) => e.id === expId);
    if (!exp || !exp.bulletPoints) return;
    const bullets = [...exp.bulletPoints];
    bullets[idx] = value;
    updateExperience(expId, "bulletPoints", bullets);
  };

  return (
    <SectionCard
      id="experience"
      title="Experience"
      description="Your work history — add metrics and strong action verbs"
      icon="💼"
      isValid={resume.experience.length > 0 && resume.experience.some((e) => e.company && e.position)}
      actions={
        <AIActionButton
          label="Add Experience"
          onClick={addExperience}
          variant="outline"
          icon={<Plus className="w-3 h-3" />}
        />
      }
    >
      <AnimatePresence>
        {resume.experience.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]"
          >
            <BriefcaseIcon />
            <p className="text-sm text-slate-400 mb-1 mt-4">No experience entries yet</p>
            <p className="text-xs text-slate-500 mb-5">Add your work history to build a stronger resume</p>
            <AIActionButton
              label="Add First Experience"
              onClick={addExperience}
              variant="primary"
              size="md"
              icon={<Plus className="w-3.5 h-3.5" />}
            />
          </motion.div>
        ) : (
          <div className="space-y-4">
            {resume.experience.map((exp, idx) => {
              const isExpanded = expandedIds.has(exp.id);
              const expSuggestion = suggestions.get(exp.id);

              return (
                <motion.div
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden"
                >
                  {/* Entry header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpand(exp.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">
                          {exp.position || "New Position"}
                        </span>
                        {exp.company && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-sm text-slate-400 truncate">{exp.company}</span>
                          </>
                        )}
                      </div>
                      {exp.duration && (
                        <span className="text-[11px] text-slate-500">{exp.duration}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <VerificationBadge status="pending" size="sm" />
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveExperience(exp.id, -1); }}
                          disabled={idx === 0}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20 rounded-md hover:bg-white/[0.06]"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveExperience(exp.id, 1); }}
                          disabled={idx === resume.experience.length - 1}
                          className="p-1 text-slate-500 hover:text-white disabled:opacity-20 rounded-md hover:bg-white/[0.06]"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeExperience(exp.id); }}
                        className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/[0.06]"
                      >
                        <div className="px-4 py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldInput
                              label="Company"
                              placeholder="Company Name"
                              value={exp.company}
                              onChange={(v) => updateExperience(exp.id, "company", v)}
                              onBlur={() => touch(`experience.${idx}.company`)}
                              error={getFieldError("experience", "company", idx)}
                            />
                            <FieldInput
                              label="Position"
                              placeholder="Senior Software Engineer"
                              value={exp.position}
                              onChange={(v) => updateExperience(exp.id, "position", v)}
                              onBlur={() => touch(`experience.${idx}.position`)}
                              error={getFieldError("experience", "position", idx)}
                            />
                            <FieldInput
                              label="Location"
                              placeholder="San Francisco, CA"
                              value={exp.location}
                              onChange={(v) => updateExperience(exp.id, "location", v)}
                            />
                            <div className="grid grid-cols-2 gap-4">
                              <FieldInput
                                label="Start Date"
                                placeholder="Jan 2020"
                                value={exp.startDate}
                                onChange={(v) => updateExperience(exp.id, "startDate", v)}
                              />
                              <FieldInput
                                label="End Date"
                                placeholder="Present"
                                value={exp.endDate}
                                onChange={(v) => updateExperience(exp.id, "endDate", v)}
                              />
                            </div>
                          </div>

                          {/* AI actions row */}
                          <div className="flex items-center flex-wrap gap-1.5">
                            <AIActionDropdown
                              label="Rewrite with AI"
                              items={[
                                { label: "ATS Optimize", onClick: () => handleAIRewrite(exp.id, "ats") },
                                { label: "Improve Impact", onClick: () => handleAIRewrite(exp.id, "impact") },
                                { label: "Make Concise", onClick: () => handleAIRewrite(exp.id, "concise") },
                                { label: "Expand", onClick: () => handleAIRewrite(exp.id, "expanded") },
                                { label: "Professional Tone", onClick: () => handleAIRewrite(exp.id, "professional") },
                              ]}
                            />
                            <AIActionButton
                              label="Generate Bullet Points"
                              onClick={() => handleGenerateBullets(exp.id)}
                              isLoading={aiActions[`exp-${exp.id}-bullets`]?.status === "loading"}
                              variant="ghost"
                            />
                            {(exp.bulletPoints?.length > 0 || exp.description) && (
                              <AIActionButton
                                label="Improve Bullets"
                                onClick={() => handleImproveBullets(exp.id)}
                                isLoading={aiActions[`exp-${exp.id}-improve-bullets`]?.status === "loading"}
                                variant="ghost"
                              />
                            )}
                          </div>

                          {/* Description */}
                          <FieldInput
                            label="Description"
                            placeholder="Describe your role and key responsibilities..."
                            value={exp.description}
                            onChange={(v) => updateExperience(exp.id, "description", v)}
                            type="textarea"
                            rows={3}
                          />

                          {/* Bullet points */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-medium text-slate-400">
                                Bullet Points ({exp.bulletPoints?.length || 0})
                              </label>
                              <button
                                onClick={() => handleAddBullet(exp.id)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                              >
                                <Plus className="w-2.5 h-2.5" /> Add Bullet
                              </button>
                            </div>
                            {(!exp.bulletPoints || exp.bulletPoints.length === 0) ? (
                              <div className="text-[11px] text-slate-500 italic">
                                No bullet points yet. Add detailed achievements for ATS optimization.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {exp.bulletPoints.map((bp, bpIdx) => (
                                  <div key={bpIdx} className="flex items-start gap-2 group/bullet">
                                    <span className="text-slate-500 mt-2 shrink-0">•</span>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={bp}
                                        onChange={(e) => handleUpdateBullet(exp.id, bpIdx, e.target.value)}
                                        className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-600 border-b border-transparent hover:border-white/[0.08] focus:border-blue-500/50 outline-none py-1 transition-colors"
                                        placeholder="Describe an achievement or responsibility..."
                                      />
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/bullet:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleMoveBullet(exp.id, bpIdx, -1)}
                                        disabled={bpIdx === 0}
                                        className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveBullet(exp.id, bpIdx, 1)}
                                        disabled={bpIdx === exp.bulletPoints.length - 1}
                                        className="p-0.5 text-slate-500 hover:text-white disabled:opacity-20"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveBullet(exp.id, bpIdx)}
                                        className="p-0.5 text-red-400 hover:text-red-300"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* AI Suggestions */}
                          {expSuggestion?.type === "bullets" && (
                            <SmartSuggestion
                              original=""
                              suggestion={(expSuggestion.content as string[]).join("\n• ")}
                              onAccept={() => {
                                updateExperience(exp.id, "bulletPoints", expSuggestion.content);
                                setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; });
                              }}
                              onRegenerate={() => handleGenerateBullets(exp.id)}
                              onDismiss={() => setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; })}
                              type="improvement"
                            />
                          )}

                          {(expSuggestion?.type as string)?.startsWith("rewrite-") && (
                            <SmartSuggestion
                              original={exp.description}
                              suggestion={(expSuggestion.content as any).description || ""}
                              onAccept={() => {
                                const content = expSuggestion.content as any;
                                updateExperience(exp.id, "description", content.description);
                                if (content.bulletPoints) {
                                  updateExperience(exp.id, "bulletPoints", content.bulletPoints);
                                }
                                setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; });
                              }}
                              onRegenerate={() => handleAIRewrite(exp.id, (expSuggestion.type as string).replace("rewrite-", "") as any)}
                              onDismiss={() => setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; })}
                              type="rewrite"
                            />
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </SectionCard>
  );
}

function BriefcaseIcon() {
  return (
    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
