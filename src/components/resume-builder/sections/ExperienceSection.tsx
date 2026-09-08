"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { EmptyState } from "../cards/EmptyState";
import { BulletList } from "../cards/BulletList";
import { ai } from "@/lib/ai/client";
import { Briefcase, ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

type ExpSuggestion =
  | { type: "bullets"; content: string[] }
  | { type: "improve-bullets"; content: string[] }
  | { type: `rewrite-${string}`; content: { description: string; bulletPoints: string[] } };

/** True when a description looks like a bulleted list rather than narrative prose. */
function isBulletedDescription(desc?: string): boolean {
  if (!desc) return false;
  const lines = desc.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return false;
  const marker = /^[-•*▪◦‣]\s*/;
  return marker.test(lines[0]) || lines.some((l) => marker.test(l));
}

/** Render a narrative description as soft-wrapped lines (never a form field). */
function NarrativeDescription({ text }: { text: string }) {
  if (!text.trim()) return null;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i} className="text-[13px] leading-relaxed text-gray-600 dark:text-slate-400">
          {line}
        </p>
      ))}
    </div>
  );
}

export function ExperienceSection() {
  const claims = useResumeBuilder((s) => s.resume?.claims ?? []);
  const experience = useResumeBuilder((s) => s.resume?.experience ?? []);
  const addExperience = useResumeBuilder((s) => s.addExperience);
  const updateExperience = useResumeBuilder((s) => s.updateExperience);
  const removeExperience = useResumeBuilder((s) => s.removeExperience);
  const moveExperience = useResumeBuilder((s) => s.moveExperience);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);

  const claimForExperience = (id: string, index: number) =>
    claims.find(
      (c) => c.sourceActivityId === id || c.sourceActivityId === `experience-${index}`,
    );

  const { touch, getFieldError } = useValidation();

  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<Map<string, ExpSuggestion>>(new Map());

  const toggleEdit = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddExperience = () => {
    addExperience();
    const newId = useResumeBuilder.getState().resume.experience.at(-1)?.id;
    if (newId) setEditingIds((prev) => new Set([...prev, newId]));
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
      const content = { description: result.content, bulletPoints: [result.content] };
      setSuggestions((prev) => {
        const next = new Map(prev);
        next.set(id, { type: `rewrite-${tone}`, content });
        return next;
      });
      setAIAction(key, { status: "success", result: JSON.stringify(content), error: null });
    } catch (err: unknown) {
      setAIAction(key, { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
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
    } catch (err: unknown) {
      setAIAction(`exp-${id}-bullets`, { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
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
    } catch (err: unknown) {
      setAIAction(`exp-${id}-improve-bullets`, { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
    }
  };

  const handleImproveOneBullet = async (text: string) => {
    const result = await ai.rewrite(text, "impact");
    return result.content;
  };

  const handleAddBullet = (expId: string) => {
    const exp = experience.find((e) => e.id === expId);
    if (!exp) return;
    const bullets = [...(exp.bulletPoints || []), ""];
    updateExperience(expId, "bulletPoints", bullets);
  };

  return (
    <SectionCard
      id="experience"
      title="Experience"
      description="Your work history — each role is a card you can arrange and refine"
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
          <EmptyState
            icon={<Briefcase className="w-5 h-5" />}
            message="Showcase your professional experience"
            submessage="Add your roles, responsibilities, and achievements as cards you can arrange."
            action={handleAddExperience}
            actionLabel="Add First Experience"
          />
        ) : (
          <div className="space-y-3">
            {experience.map((exp, idx) => {
              const isEditing = editingIds.has(exp.id);
              const expSuggestion = suggestions.get(exp.id);
              const expAIError = [
                aiActions[`exp-${exp.id}-bullets`],
                aiActions[`exp-${exp.id}-improve-bullets`],
                ...["ats", "impact", "concise", "expanded", "professional"].map((t) => aiActions[`exp-${exp.id}-${t}`]),
              ].find((a) => a?.status === "error")?.error ?? null;

              const hasNarrativeDescription = !!exp.description && !isBulletedDescription(exp.description);

              return (
                <motion.div
                  key={exp.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className={`rounded-xl border transition-colors ${
                    isEditing
                      ? "border-cyan-500/25 bg-white dark:bg-[#0C1222]"
                      : "border-gray-200 dark:border-white/[0.07] bg-white dark:bg-[#0A0E1B] hover:border-gray-300 dark:hover:border-white/[0.12]"
                  }`}
                >
                  {/* ── Card header ── */}
                  <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {exp.position || "New Position"}
                        </span>
                        {exp.company && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                            {exp.company}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(exp.location || exp.startDate || exp.endDate) && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                            {[exp.location, [exp.startDate, exp.endDate].filter(Boolean).join(" — ")].filter(Boolean).join(" · ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const claim = claimForExperience(exp.id, idx);
                        return claim ? <VerificationBadge claim={claim} size="sm" /> : null;
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveExperience(exp.id, -1)}
                          disabled={idx === 0}
                          title="Move up"
                          className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveExperience(exp.id, 1)}
                          disabled={idx === experience.length - 1}
                          title="Move down"
                          className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => toggleEdit(exp.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          isEditing
                            ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                            : "text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                        }`}
                        title={isEditing ? "Close details" : "Edit details"}
                      >
                        {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                        {isEditing ? "Done" : "Edit"}
                      </button>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        title="Delete"
                        className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* ── Content view: real resume content, inline editing ── */}
                  <div className="px-4 pb-4 space-y-3">
                    {hasNarrativeDescription && (
                      <NarrativeDescription text={exp.description} />
                    )}
                    <BulletList
                      bullets={exp.bulletPoints ?? []}
                      onChange={(bullets) => updateExperience(exp.id, "bulletPoints", bullets)}
                      onImprove={handleImproveOneBullet}
                    />
                    {exp.techUsed && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] text-[10px] text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-white/[0.06]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Edit details (structured fields) ── */}
                  <AnimatePresence>
                    {isEditing && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-gray-100 dark:border-white/[0.06] overflow-hidden"
                      >
                        <div className="px-4 py-4 space-y-5">
                          {/* Role Details */}
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Role Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FieldInput
                                label="Position"
                                placeholder="Senior Software Engineer"
                                value={exp.position}
                                onChange={(v) => updateExperience(exp.id, "position", v)}
                                onBlur={() => touch(`experience.${idx}.position`)}
                                error={getFieldError("experience", "position", idx)}
                              />
                              <FieldInput
                                label="Company"
                                placeholder="Company Name"
                                value={exp.company}
                                onChange={(v) => updateExperience(exp.id, "company", v)}
                                onBlur={() => touch(`experience.${idx}.company`)}
                                error={getFieldError("experience", "company", idx)}
                              />
                              <FieldInput
                                label="Location"
                                placeholder="San Francisco, CA"
                                value={exp.location}
                                onChange={(v) => updateExperience(exp.id, "location", v)}
                              />
                              <div className="grid grid-cols-2 gap-3">
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
                          </div>

                          {/* Narrative description (kept separate from bullets) */}
                          <div>
                            <div className="flex items-center flex-wrap gap-1.5 mb-3">
                              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mr-1">Description</h4>
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
                                label="Generate Bullets"
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
                              <p className="text-[11px] text-red-400 mb-2">{expAIError}</p>
                            )}
                            <FieldInput
                              label=""
                              placeholder="Describe your role and key responsibilities..."
                              value={exp.description}
                              onChange={(v) => updateExperience(exp.id, "description", v)}
                              type="textarea"
                              rows={3}
                            />
                            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1.5">
                              The description is your narrative summary. Bullets above are the achievement points shown on the resume.
                            </p>
                          </div>

                          {/* Bullets (structured list) */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Achievements</h4>
                              <button
                                onClick={() => handleAddBullet(exp.id)}
                                className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Add
                              </button>
                            </div>
                            <BulletList
                              bullets={exp.bulletPoints ?? []}
                              onChange={(bullets) => updateExperience(exp.id, "bulletPoints", bullets)}
                              onImprove={handleImproveOneBullet}
                            />
                          </div>

                          {/* AI Suggestions */}
                          {expSuggestion?.type === "bullets" && (
                            <SmartSuggestion
                              original=""
                              suggestion={(expSuggestion.content as string[]).join("\n• ")}
                              onAccept={() => {
                                updateExperience(exp.id, "bulletPoints", expSuggestion.content);
                                if (isBulletedDescription(exp.description)) {
                                  updateExperience(exp.id, "description", "");
                                }
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
                              suggestion={(expSuggestion.content as { description: string }).description || ""}
                              onAccept={() => {
                                const content = expSuggestion.content as { description: string; bulletPoints?: string[] };
                                updateExperience(exp.id, "description", content.description);
                                if (content.bulletPoints) {
                                  updateExperience(exp.id, "bulletPoints", content.bulletPoints);
                                }
                                setSuggestions((prev) => { const n = new Map(prev); n.delete(exp.id); return n; });
                              }}
                              onRegenerate={() => handleAIRewrite(exp.id, (expSuggestion.type as string).replace("rewrite-", "") as "ats" | "impact" | "concise" | "expanded" | "professional")}
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
                                if (isBulletedDescription(exp.description)) {
                                  updateExperience(exp.id, "description", "");
                                }
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