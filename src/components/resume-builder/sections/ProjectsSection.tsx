"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { SectionContent } from "../fields/SectionContent";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton, AIActionDropdown } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { generateProjectDescription } from "@/lib/ai/resume-ai";
import { Trash2, GripVertical, ChevronUp, ChevronDown, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function ProjectsSection() {
  const resume = useResumeBuilder((s) => s.resume);
  const addProject = useResumeBuilder((s) => s.addProject);
  const updateProject = useResumeBuilder((s) => s.updateProject);
  const removeProject = useResumeBuilder((s) => s.removeProject);
  const moveProject = useResumeBuilder((s) => s.moveProject);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [projectSuggestions, setProjectSuggestions] = useState<Map<string, { description: string; bulletPoints: string[] }>>(new Map());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateDescription = async (id: string) => {
    const proj = resume.projects.find((p) => p.id === id);
    if (!proj) return;
    setAIAction(`proj-${id}-gen`, { status: "loading", result: null, error: null });
    try {
      const result = await generateProjectDescription(proj);
      setProjectSuggestions((prev) => { const n = new Map(prev); n.set(id, result); return n; });
      setAIAction(`proj-${id}-gen`, { status: "success", result: result.description, error: null });
    } catch (err: any) {
      setAIAction(`proj-${id}-gen`, { status: "error", result: null, error: err.message });
    }
  };

  return (
    <SectionCard
      id="projects"
      title="Projects"
      description="Notable projects that demonstrate your skills"
      icon="📁"
      isValid={resume.projects.length > 0 && resume.projects.some((p) => p.name)}
      actions={
        <AIActionButton label="Add Project" onClick={addProject} variant="outline" icon={<Plus className="w-3 h-3" />} />
      }
    >
      <AnimatePresence>
        {resume.projects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-14 text-center bg-white/[0.02] rounded-xl border border-dashed border-white/[0.06]">
            <FolderIcon />
            <p className="text-sm text-slate-400 mb-1 mt-4">No projects yet</p>
            <p className="text-xs text-slate-500 mb-5">Add projects to showcase your hands-on experience</p>
            <AIActionButton label="Add Project" onClick={addProject} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {resume.projects.map((proj, idx) => {
              const isExpanded = expandedIds.has(proj.id);
              const projSug = projectSuggestions.get(proj.id);

              return (
                <motion.div key={proj.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, height: 0 }} className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={() => toggleExpand(proj.id)}>
                    <GripVertical className="w-3.5 h-3.5 text-slate-600 shrink-0 cursor-grab" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{proj.name || "New Project"}</span>
                        {proj.tech && <><span className="text-slate-600">·</span><span className="text-xs text-slate-500 truncate">{proj.tech}</span></>}
                      </div>
                      {proj.status && <span className="text-[11px] text-slate-500">{proj.status}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <VerificationBadge status="pending" size="sm" />
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveProject(proj.id, -1); }} disabled={idx === 0} className="p-1 text-slate-500 hover:text-white disabled:opacity-20 rounded-md hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveProject(proj.id, 1); }} disabled={idx === resume.projects.length - 1} className="p-1 text-slate-500 hover:text-white disabled:opacity-20 rounded-md hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeProject(proj.id); }} className="p-1.5 text-red-400 hover:text-red-300 rounded-md hover:bg-red-500/10"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-white/[0.06]">
                        <div className="px-4 py-4 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FieldInput label="Project Name" placeholder="AI Chat Platform" value={proj.name} onChange={(v) => updateProject(proj.id, "name", v)} />
                            <FieldInput label="Technologies Used" placeholder="React, Node.js, OpenAI" value={proj.tech} onChange={(v) => updateProject(proj.id, "tech", v)} />
                            <FieldInput label="Role" placeholder="Lead Developer" value={proj.role} onChange={(v) => updateProject(proj.id, "role", v)} />
                            <FieldInput label="Project Link" placeholder="https://github.com/..." value={proj.link} onChange={(v) => updateProject(proj.id, "link", v)} type="url" />
                            <FieldInput label="Start Date" placeholder="Jan 2024" value={proj.startDate} onChange={(v) => updateProject(proj.id, "startDate", v)} />
                            <FieldInput label="End Date" placeholder="Jun 2024" value={proj.endDate} onChange={(v) => updateProject(proj.id, "endDate", v)} />
                          </div>

                          {/* AI actions */}
                          <div className="flex items-center flex-wrap gap-1.5">
                            <AIActionButton label="Generate Description" onClick={() => handleGenerateDescription(proj.id)} isLoading={false} variant="ghost" />
                            {proj.description && <AIActionButton label="Improve Description" onClick={() => handleGenerateDescription(proj.id)} variant="ghost" />}
                          </div>

                          <FieldInput label="Description" placeholder="Describe the project and your contributions..." value={proj.description} onChange={(v) => updateProject(proj.id, "description", v)} type="textarea" rows={3} />

                          {projSug && (
                            <SmartSuggestion
                              original={proj.description}
                              suggestion={projSug.description}
                              onAccept={() => { updateProject(proj.id, "description", projSug.description); setProjectSuggestions((prev) => { const n = new Map(prev); n.delete(proj.id); return n; }); }}
                              onRegenerate={() => handleGenerateDescription(proj.id)}
                              onDismiss={() => setProjectSuggestions((prev) => { const n = new Map(prev); n.delete(proj.id); return n; })}
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

function FolderIcon() {
  return (
    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
    </svg>
  );
}
