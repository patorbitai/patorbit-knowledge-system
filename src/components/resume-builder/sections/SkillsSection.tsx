"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { FieldInput } from "../fields/FieldInput";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { suggestMissingSkills } from "@/lib/ai/resume-ai";
import { SmartSuggestion } from "../SmartSuggestion";
import { Trash2, Plus, Sparkles, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const levels = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;

export function SkillsSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addSkill = useResumeBuilder((s) => s.addSkill);
  const updateSkill = useResumeBuilder((s) => s.updateSkill);
  const removeSkill = useResumeBuilder((s) => s.removeSkill);
  const updateField = useResumeBuilder((s) => s.updateField);

  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const handleSuggestSkills = async () => {
    setIsLoadingSuggestions(true);
    try {
      const result = await suggestMissingSkills(resume);
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error(err);
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
    updateField("skills", deduped as any);
  };

  return (
    <SectionCard
      id="skills"
      title="Skills"
      description="Technical and professional skills with proficiency levels"
      icon="⚡"
      isValid={resume.skills.length > 0 && resume.skills.some((s) => s.name)}
      actions={
        <div className="flex items-center gap-1.5">
          <AIActionButton label="Add Skill" onClick={addSkill} variant="outline" icon={<Plus className="w-3 h-3" />} />
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
      {/* AI Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <SmartSuggestion
          original=""
          suggestion={`Consider adding these skills: ${suggestions.join(", ")}`}
          onAccept={() => {
            suggestions.forEach((s) => {
              addSkill();
              // We need to update the last added skill
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-14 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]"
        >
          <ZapIcon />
          <p className="text-sm text-slate-400 mb-1 mt-4">No skills added yet</p>
          <p className="text-xs text-slate-500 mb-5">Add your key technical and professional skills</p>
          <div className="flex gap-2">
            <AIActionButton label="Add Skill" onClick={addSkill} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
            <AIActionButton label="Suggest with AI" onClick={handleSuggestSkills} isLoading={isLoadingSuggestions} variant="secondary" size="md" />
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {resume.skills.map((skill, idx) => (
            <motion.div
              key={skill.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-3.5 hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0 space-y-2">
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => updateSkill(skill.id, "name", e.target.value)}
                    placeholder="Skill name"
                    className="w-full bg-transparent text-sm text-white font-medium placeholder:text-slate-600 outline-none"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <select
                        value={skill.level}
                        onChange={(e) => updateSkill(skill.id, "level", e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg text-[10px] text-slate-300 px-2 py-1 outline-none focus:border-blue-500/50"
                      >
                        {levels.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={skill.category}
                        onChange={(e) => updateSkill(skill.id, "category", e.target.value)}
                        placeholder="Category"
                        className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg text-[10px] text-slate-300 px-2 py-1 outline-none placeholder:text-slate-600 focus:border-blue-500/50"
                      />
                    </div>
                  </div>
                </div>
                <button onClick={() => removeSkill(skill.id)} className="p-1 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10 shrink-0 mt-0.5">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function ZapIcon() {
  return (
    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}
