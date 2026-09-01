"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton } from "../AIActionButton";
import { Trash2, ChevronUp, ChevronDown, Plus, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

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

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddEducation = () => {
    addEducation();
    const newId = useResumeBuilder.getState().resume.education.at(-1)?.id;
    if (newId) setExpandedIds((prev) => new Set([...prev, newId]));
  };

  return (
    <SectionCard
      id="education"
      title="Education"
      description="Your academic background and qualifications"
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-14 text-center bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06]"
          >
            <GraduationCapIcon />
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 mt-4">Showcase your academic background</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">Add your degrees, certifications, and academic achievements</p>
            <AIActionButton label="Add Education" onClick={handleAddEducation} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {resume.education.map((edu, idx) => {
              const isExpanded = expandedIds.has(edu.id);
              return (
                <motion.div
                  key={edu.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    isExpanded
                      ? "border-cyan-500/20 bg-white dark:bg-[#0C1222]"
                      : "border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03]"
                  }`}
                >
                  {/* ── Collapsed card header ── */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(edu.id); }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{edu.school || "New Education"}</span>
                        {edu.degree && (
                          <>
                            <span className="text-gray-300 dark:text-slate-600">·</span>
                            <span className="text-sm text-gray-500 dark:text-slate-400 truncate">{edu.degree}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {edu.year && <span className="text-[11px] text-gray-400 dark:text-slate-500">{edu.year}</span>}
                        {edu.field && (
                          <>
                            <span className="text-gray-300 dark:text-slate-600">·</span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{edu.field}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const claim = claimForEducation(edu.id, idx);
                        return claim ? <VerificationBadge claim={claim} size="sm" /> : null;
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveEducation(edu.id, -1); }} disabled={idx === 0} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveEducation(edu.id, 1); }} disabled={idx === resume.education.length - 1} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(edu.id); }} className="p-1 text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-500/10" title="Edit"><Pencil className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeEducation(edu.id); }} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* ── Expanded content ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-gray-100 dark:border-white/[0.06]">
                        <div className="px-4 py-4 space-y-5">
                          {/* ── Academic Details ── */}
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

                          {/* ── Additional Info ── */}
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

function GraduationCapIcon() {
  return (
    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
    </svg>
  );
}
