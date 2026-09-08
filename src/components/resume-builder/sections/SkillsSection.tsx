"use client";

import { useMemo, useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { ai } from "@/lib/ai/client";
import { SmartSuggestion } from "../SmartSuggestion";
import { EmptyState } from "../cards/EmptyState";
import { Plus, Sparkles, Filter, Zap, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { SKILL_LEVELS } from "@/utils/resume-parser";

/** Display-only grouping: explicit category wins; otherwise keyword heuristic. */
const TECH_KEYWORDS = /\b(python|java|javascript|typescript|react|node|sql|azure|aws|gcp|docker|kubernetes|pyspark|databricks|git|linux|html|css|go\b|rust|c\+\+|c#|php|ruby|r\b|sas|excel|power\s*bi|tableau|mlflow|tensorflow|pytorch|postgres|mysql|mongodb|redis|kafka|airflow|hadoop|spark|etl|api|rest|cloud|devops|ci\/cd|terraform|kubernetes|snowflake|data|machine\s*learning|ai\b|llm|genai)\b/i;

export function SkillsSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addSkill = useResumeBuilder((s) => s.addSkill);
  const updateSkill = useResumeBuilder((s) => s.updateSkill);
  const removeSkill = useResumeBuilder((s) => s.removeSkill);
  const updateField = useResumeBuilder((s) => s.updateField);

  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [addingNew, setAddingNew] = useState(false);

  const groups = useMemo(() => {
    const buckets: Record<string, typeof resume.skills> = {};
    for (const skill of resume.skills) {
      const category = skill.category || (TECH_KEYWORDS.test(skill.name) ? "Technical" : "Soft");
      if (!buckets[category]) buckets[category] = [];
      buckets[category].push(skill);
    }
    const order = ["Technical", "Soft"];
    return Object.keys(buckets)
      .sort((a, b) => {
        const ai = order.indexOf(a); const bi = order.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
      .map((name) => ({ name, skills: buckets[name] }));
  }, [resume]);

  const handleSuggestSkills = async () => {
    setIsLoadingSuggestions(true);
    setSuggestError(null);
    try {
      const result = await ai.suggestSkills(resume);
      setSuggestions(result.content);
    } catch (err: unknown) {
      setSuggestError(err instanceof Error ? err.message : "AI request failed. Please try again.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleRemoveDuplicates = () => {
    const seen = new Set<string>();
    const deduped = resume.skills.filter((s) => {
      const key = s.name.toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    updateField("skills", deduped);
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setDraftName(name);
  };

  const commitEdit = (id: string) => {
    if (draftName.trim()) updateSkill(id, "name", draftName.trim());
    setEditingId(null);
  };

  const startAdd = () => {
    addSkill();
    setAddingNew(true);
    const newId = useResumeBuilder.getState().resume.skills.at(-1)?.id;
    if (newId) {
      setEditingId(newId);
      setDraftName("");
    }
  };

  const commitNew = (id: string) => {
    if (draftName.trim()) updateSkill(id, "name", draftName.trim());
    setEditingId(null);
    setAddingNew(false);
  };

  return (
    <SectionCard
      id="skills"
      title="Skills"
      description="Skills render as chips — click a chip to rename it, hover to remove"
      icon="⚡"
      isValid={resume.skills.length > 0 && resume.skills.some((s) => s.name)}
      actions={
        <div className="flex items-center gap-1.5">
          <AIActionButton label="Add Skill" onClick={startAdd} variant="outline" icon={<Plus className="w-3 h-3" />} />
          <AIActionDropdown
            label="AI Actions"
            items={[
              { label: "Suggest Missing Skills", onClick: handleSuggestSkills, icon: <Sparkles className="w-3 h-3 text-blue-400" /> },
              { label: "Remove Duplicates", onClick: handleRemoveDuplicates, icon: <Filter className="w-3 h-3 text-amber-400" /> },
            ]}
          />
        </div>
      }
    >
      {suggestions && suggestions.length > 0 && (
        <SmartSuggestion
          original=""
          suggestion={`Consider adding these skills: ${suggestions.join(", ")}`}
          onAccept={() => {
            suggestions.forEach((s) => {
              addSkill();
              const skills = useResumeBuilder.getState().resume.skills;
              if (skills.length > 0) {
                const last = skills[skills.length - 1];
                updateSkill(last.id, "name", s);
              }
            });
            setSuggestions(null);
          }}
          onRegenerate={handleSuggestSkills}
          onDismiss={() => setSuggestions(null)}
          type="improvement"
        />
      )}

      {resume.skills.length === 0 ? (
        <>
          <EmptyState
            icon={<Zap className="w-5 h-5" />}
            message="Highlight your expertise"
            submessage="Skills render as tidy chips grouped by category — add your key technical and professional skills."
            action={startAdd}
            actionLabel="Add Skill"
          />
          <div className="flex justify-center mt-3">
            <AIActionButton label="Suggest with AI" onClick={handleSuggestSkills} isLoading={isLoadingSuggestions} variant="secondary" size="md" />
          </div>
          {suggestError && <p className="text-[11px] text-red-400 mt-2 text-center">{suggestError}</p>}
        </>
      ) : (
        <SectionContent>
          {groups.map((group) => (
            <div key={group.name}>
              <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">{group.name}</h4>
              <div className="flex flex-wrap gap-2">
                {group.skills.map((skill) => {
                  const isEditing = editingId === skill.id;
                  return (
                    <motion.span
                      key={skill.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group/chip relative inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] px-3 py-1.5 text-xs text-gray-700 dark:text-slate-200 hover:border-cyan-400/40 transition-colors"
                    >
                      {isEditing ? (
                        <>
                          <input
                            autoFocus
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onBlur={() => addingNew ? commitNew(skill.id) : commitEdit(skill.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") { e.preventDefault(); if (addingNew) commitNew(skill.id); else commitEdit(skill.id); }
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            placeholder="Skill name"
                            aria-label="Skill name"
                            className="w-28 bg-transparent outline-none text-xs text-gray-900 dark:text-white"
                          />
                          <button onClick={() => addingNew ? commitNew(skill.id) : commitEdit(skill.id)} className="text-emerald-500 hover:text-emerald-400" aria-label="Save skill"><Check className="w-3 h-3" /></button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(skill.id, skill.name)}
                            className="group-hover/chip:underline decoration-dotted underline-offset-4 cursor-pointer text-left"
                            title="Click to rename"
                          >
                            {skill.name || "Untitled"}
                          </button>
                          <select
                            value={skill.level}
                            onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                            title="Proficiency level"
                            aria-label={`Level for ${skill.name}`}
                            className="text-[9px] font-medium text-gray-400 dark:text-slate-500 bg-transparent outline-none opacity-0 group-hover/chip:opacity-100 transition-opacity cursor-pointer"
                          >
                            {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <button
                            onClick={() => removeSkill(skill.id)}
                            className="opacity-0 group-hover/chip:opacity-100 transition-opacity text-red-400 hover:text-red-300 cursor-pointer"
                            aria-label={`Remove ${skill.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </motion.span>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="pt-1">
            <button
              onClick={startAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 dark:border-white/[0.14] text-[11px] font-medium text-gray-400 dark:text-slate-500 hover:border-cyan-400/50 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add skill
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-slate-500">
            <Zap className="w-3 h-3" />
            Click a chip to rename · hover to reveal the level picker and remove
          </div>
        </SectionContent>
      )}
    </SectionCard>
  );
}