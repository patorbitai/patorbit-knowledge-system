"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { ai } from "@/lib/ai/client";
import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

export function ExperienceSection() {
  const claims = useResumeBuilder((s) => s.resume.claims ?? []);
  const experience = useResumeBuilder((s) => s.resume.experience ?? []);
  const addExperience = useResumeBuilder((s) => s.addExperience);
  const updateExperience = useResumeBuilder((s) => s.updateExperience);
  const removeExperience = useResumeBuilder((s) => s.removeExperience);
  const moveExperience = useResumeBuilder((s) => s.moveExperience);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);

  // Map an experience entry to its claim (via sourceActivityId "experience-<n>") so
  // the VerificationBadge reflects the claim's real evidence state.
  const claimForExperience = (id: string, index: number) =>
    claims.find(
      (c) => c.sourceActivityId === id || c.sourceActivityId === `experience-${index}`,
    );

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

  const handleAddExperience = () => {
    addExperience();
    const newId = useResumeBuilder.getState().resume.experience.at(-1)?.id;
    if (newId) setExpandedIds((prev) => new Set([...prev, newId]));
  };

  const handleAIRewrite = async (id: string, tone: "ats" | "impact" | "concise" | "expanded" | "professional") => {
    const exp = experience.find((e) => e.id === id);
    if (!exp) return;
    const key = `exp-${id}-${tone}`;
    setAIAction(key, { status: "loading", result: null, error: null });
    try {
      const inputText = exp.description || exp.position;
      const result =
        tone === "ats"
          ? await ai.atsOptimization(inputText)
          : await ai.rewrite(inputText, tone);
      // Downstream SmartSuggestion expects { description, bulletPoints }
      const content = { description: result.content, bulletPoints: [result.content] };
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: `rewrite-${tone}`, content });
        return next;
      });
      setAIAction(key, { status: "success", result: JSON.stringify(content), error: null });
    } catch (err: any) {
      setAIAction(key, { status: "error", result: null, error: err.message });
    }
  };

  const handleGenerateBullets = async (id: string) => {
    const exp = experience.find((e) => e.id === id);
    if (!exp) return;
    setAIAction(`exp-${id}-bullets`, { status: "loading", result: null, error: null });
    try {
      const result = await ai.generateAchievements(exp);
      const bullets = result.content;
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: "bullets", content: bullets });
        return next;
      });
      setAIAction(`exp-${id}-bullets`, { status: "success", result: bullets.join("\n"), error: null });
    } catch (err: any) {
      setAIAction(`exp-${id}-bullets`, { status: "error", result: null, error: err.message });
    }
  };

  const handleImproveBullets = async (id: string) => {
    const exp = experience.find((e) => e.id === id);
    if (!exp) return;
    const bullets = exp.bulletPoints?.length > 0
      ? exp.bulletPoints
      : exp.description?.split("\n").filter(Boolean) || [];
    if (bullets.length === 0) return;
    setAIAction(`exp-${id}-improve-bullets`, { status: "loading", result: null, error: null });
    try {
      const result = await ai.improveBulletPoints(bullets);
      const improved = result.content;
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: "improve-bullets", content: improved });
        return next;
      });
      setAIAction(`exp-${id}-improve-bullets`, { status: "success", result: null, error: null });
    } catch (err: any) {
      setAIAction(`exp-${id}-improve-bullets`, { status: "error", result: null, error: err.message });
    }
  };

  const handleMoveBullet = (expId: string, fromIdx: number, dir: -1 | 1) => {
    const exp = experience.find((e) => e.id === expId);
    if (!exp || !exp.bulletPoints) return;
    const bullets = [...exp.bulletPoints];
    const toIdx = fromIdx + dir;
    if (toIdx < 0 || toIdx >= bullets.length) return;
    const [moved] = bullets.splice(fromIdx, 1);
    bullets.splice(toIdx, 0, moved);
    updateExperience(expId, "bulletPoints", bullets);
  };

  const handleRemoveBullet = (expId: string, idx: number) => {
    const exp = experience.find((e) => e.id === expId);
    if (!exp || !exp.bulletPoints) return;
    const bullets = exp.bulletPoints.filter((_, i) => i !== idx);
    updateExperience(expId, "bulletPoints", bullets);
  };

  const handleAddBullet = (expId: string) => {
    const exp = experience.find((e) => e.id === expId);
    if (!exp) return;
    const bullets = [...(exp.bulletPoints || []), ""];
    updateExperience(expId, "bulletPoints", bullets);
  };

  const handleUpdateBullet = (expId: string, idx: number, value: string) => {
    const exp = experience.find((e) => e.id === expId);
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
      isValid={experience.length > 0 && experience.some((e) => e.company && e.position)}
      actions={
        <AIActionButton
          label="Add Experience"
          onClick={handleAddExperience}
          variant="outline"
          icon={<Plus className="w-3 h-3" />}
        />
      }
    >
      <AnimatePresence>
        {experience.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06]"
          >
            <BriefcaseIcon />
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 mt-4">Showcase your professional experience</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">Add your roles, responsibilities and achievements</p>
            <AIActionButton
              label="Add First Experience"
              onClick={handleAddExperience}
              variant="primary"
              size="md"
              icon={<Plus className="w-3.5 h-3.5" />}
            />
          </motion.div>
        ) : (
          <div className="space-y-4">
            {experience.map((exp, idx) => {
              const isExpanded = expandedIds.has(exp.id);
              const expSuggestion = suggestions.get(exp.id);
              const expAIError = [
                aiActions[`exp-${exp.id}-bullets`],
                aiActions[`exp-${exp.id}-improve-bullets`],
                ...["ats", "impact", "concise", "expanded", "professional"].map((t) => aiActions[`exp-${exp.id}-${t}`]),
              ].find((a) => a?.status === "error")?.error ?? null;

              return (
                <motion.div
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className="bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden"
                >
                  {/* Entry header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors"
                    onClick={() => toggleExpand(exp.id)}
                  >
                    <GripVertical className="w-3.5 h-3.5 text-gray-400 dark:text-slate-600 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {exp.position || "New Position"}
                        </span>
                        {exp.company && (
                          <>
                            <span className="text-gray-400 dark:text-slate-600">·</span>
                            <span className="text-sm text-gray-500 dark:text-slate-400 truncate">{exp.company}</span>
                          </>
                        )}
                      </div>
                      {exp.duration && (
                        <span className="text-[11px] text-gray-400 dark:text-slate-500">{exp.duration}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const claim = claimForExperience(exp.id, idx);
                        return claim ? (
                          <VerificationBadge claim={claim} size="sm" />
                        ) : (
                          <span className="text-[10px] text-gray-400 dark:text-slate-600 italic">No claim yet</span>
                        );
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); moveExperience(exp.id, -1); }}
                          disabled={idx === 0}
                          className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); moveExperience(exp.id, 1); }}
                          disabled={idx === experience.length - 1}
                          className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeExperience(exp.id); }}
                        className="p-1.5 text-red-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
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
                        className="border-t border-gray-200 dark:border-white/[0.06]"
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
                          {expAIError && (
                            <p className="text-[11px] text-red-400">{expAIError}</p>
                          )}

                          {/* Description */}
                          <FieldInput
                            label="Description"
                            placeholder="Describe your role and key responsibilities..."
                            value={exp.description}
                            onChange={(v) => updateExperience(exp.id, "description", v)}
                            type="textarea"
                            rows={6}
                          />

                          {/* Bullet points */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-medium text-gray-500 dark:text-slate-400">
                                Bullet Points ({exp.bulletPoints?.length || 0})
                              </label>
                              <button
                                onClick={() => handleAddBullet(exp.id)}
                                className="text-[10px] text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                              >
                                <Plus className="w-2.5 h-2.5" /> Add Bullet
                              </button>
                            </div>
                            {(!exp.bulletPoints || exp.bulletPoints.length === 0) ? (
                              <div className="text-[11px] text-gray-400 dark:text-slate-500 italic">
                                No bullet points yet. Add detailed achievements for ATS optimization.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {exp.bulletPoints.map((bp, bpIdx) => (
                                  <div key={bpIdx} className="flex items-start gap-2 group/bullet">
                                    <span className="text-gray-400 dark:text-slate-500 mt-2 shrink-0">•</span>
                                    <div className="flex-1">
                                      <textarea
                                        value={bp}
                                        onChange={(e) => handleUpdateBullet(exp.id, bpIdx, e.target.value)}
                                        className="w-full bg-transparent text-[15px] text-gray-900 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600 border-b border-transparent hover:border-gray-300 dark:hover:border-white/[0.08] focus:border-blue-500/50 outline-none py-1.5 transition-colors resize-none leading-relaxed"
                                        placeholder="Describe an achievement or responsibility..."
                                        rows={2}
                                      />
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover/bullet:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => handleMoveBullet(exp.id, bpIdx, -1)}
                                        disabled={bpIdx === 0}
                                        className="p-0.5 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20"
                                      >
                                        <ChevronUp className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleMoveBullet(exp.id, bpIdx, 1)}
                                        disabled={bpIdx === exp.bulletPoints.length - 1}
                                        className="p-0.5 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20"
                                      >
                                        <ChevronDown className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRemoveBullet(exp.id, bpIdx)}
                                        className="p-0.5 text-red-400 hover:text-red-500"
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

                          {(expSuggestion?.type as string)?.startsWith("rewrite-") && expSuggestion?.content && (
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

                          {expSuggestion?.type === "improve-bullets" && Array.isArray(expSuggestion.content) && (
                            <SmartSuggestion
                              original={(exp.bulletPoints ?? []).join("\n• ")}
                              suggestion={(expSuggestion.content as string[]).join("\n• ")}
                              onAccept={() => {
                                updateExperience(exp.id, "bulletPoints", expSuggestion.content as string[]);
                                setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; });
                              }}
                              onRegenerate={() => handleImproveBullets(exp.id)}
                              onDismiss={() => setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; })}
                              type="improvement"
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
