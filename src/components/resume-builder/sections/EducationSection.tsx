"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton } from "../AIActionButton";
import { EmptyState } from "../cards/EmptyState";
import { GraduationCap, ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";
import { ResumeFont } from "../cards/ResumeFont";

export function EducationSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addEducation = useResumeBuilder((s) => s.addEducation);
  const updateEducation = useResumeBuilder((s) => s.updateEducation);
  const removeEducation = useResumeBuilder((s) => s.removeEducation);
  const moveEducation = useResumeBuilder((s) => s.moveEducation);
  const { touch, getFieldError } = useValidation();

  const claimForEducation = (id: string, index: number) =>
    resume.claims.find(
      (c) => c.sourceActivityId === id || c.sourceActivityId === `education-${index}`,
    );

  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const toggleEdit = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddEducation = () => {
    addEducation();
    const newId = useResumeBuilder.getState().resume.education.at(-1)?.id;
    if (newId) setEditingIds((prev) => new Set([...prev, newId]));
  };

  return (
    <SectionCard
      id="education"
      title="Education"
      description="Your academic background — each degree is its own card"
      icon="🎓"
      isValid={resume.education.length > 0 && resume.education.some((e) => e.school && e.degree)}
      actions={
        <AIActionButton
          label="Add Education"
          onClick={handleAddEducation}
          variant="outline"
          icon={<Plus className="w-3 h-3" />}
        />
      }
    >
      <AnimatePresence>
        {resume.education.length === 0 ? (
          <EmptyState
            icon={<GraduationCap className="w-5 h-5" />}
            message="Showcase your academic background"
            submessage="Add your degrees and qualifications as tidy cards."
            action={handleAddEducation}
            actionLabel="Add Education"
          />
        ) : (
          <div className="space-y-3">
            {resume.education.map((edu, idx) => {
              const isEditing = editingIds.has(edu.id);
              return (
                <motion.div
                  key={edu.id}
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
                  <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
                    <div className="flex-1 min-w-0">
                      <ResumeFont>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {edu.degree || "Degree"}
                          </span>
                          {edu.school && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{edu.school}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {(edu.field || edu.year) && (
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                              {[edu.field, edu.year].filter(Boolean).join(" · ")}
                            </span>
                          )}
                          {edu.gpa && <span className="text-[11px] text-gray-400 dark:text-slate-500">GPA {edu.gpa}</span>}
                        </div>
                      </ResumeFont>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const claim = claimForEducation(edu.id, idx);
                        return claim ? <VerificationBadge claim={claim} size="sm" /> : null;
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveEducation(edu.id, -1)} disabled={idx === 0} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveEducation(edu.id, 1)} disabled={idx === resume.education.length - 1} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button
                        onClick={() => toggleEdit(edu.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          isEditing
                            ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                            : "text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                        }`}
                      >
                        {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                        {isEditing ? "Done" : "Edit"}
                      </button>
                      <button onClick={() => removeEducation(edu.id)} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

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
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Academic Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FieldInput label="School / University" placeholder="Stanford University" value={edu.school} onChange={(v) => updateEducation(edu.id, "school", v)} onBlur={() => touch(`education.${idx}.school`)} error={getFieldError("education", "school", idx)} />
                              <FieldInput label="Degree" placeholder="Bachelor of Science" value={edu.degree} onChange={(v) => updateEducation(edu.id, "degree", v)} onBlur={() => touch(`education.${idx}.degree`)} error={getFieldError("education", "degree", idx)} />
                              <FieldInput label="Field of Study" placeholder="Computer Science" value={edu.field} onChange={(v) => updateEducation(edu.id, "field", v)} />
                              <FieldInput label="Year" placeholder="2020" value={edu.year} onChange={(v) => updateEducation(edu.id, "year", v)} />
                              <FieldInput label="GPA" placeholder="3.8 / 4.0" value={edu.gpa} onChange={(v) => updateEducation(edu.id, "gpa", v)} />
                              <FieldInput label="Location" placeholder="Stanford, CA" value={edu.location} onChange={(v) => updateEducation(edu.id, "location", v)} />
                            </div>
                          </div>

                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Additional Info</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FieldInput label="Honors" placeholder="Cum Laude, Dean's List" value={edu.honors} onChange={(v) => updateEducation(edu.id, "honors", v)} />
                              <FieldInput label="Activities" placeholder="Robotics Club, Hackathon Organizer" value={edu.activities} onChange={(v) => updateEducation(edu.id, "activities", v)} />
                            </div>
                          </div>
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