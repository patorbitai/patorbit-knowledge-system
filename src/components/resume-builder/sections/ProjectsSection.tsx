"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { ai } from "@/lib/ai/client";
import { Trash2, ChevronUp, ChevronDown, Plus, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

export function ProjectsSection() {
  const claims = useResumeBuilder((s) => s.resume.claims ?? []);
  const projects = useResumeBuilder((s) => s.resume.projects ?? []);
  const addProject = useResumeBuilder((s) => s.addProject);
  const updateProject = useResumeBuilder((s) => s.updateProject);
  const removeProject = useResumeBuilder((s) => s.removeProject);
  const moveProject = useResumeBuilder((s) => s.moveProject);
  const setAIAction = useResumeBuilder((s) => s.setAIAction);
  const aiActions = useResumeBuilder((s) => s.aiActions);
  const { touch, getFieldError } = useValidation();

  const claimForProject = (id: string, index: number) =>
    claims.find(
      (c) => c.sourceActivityId === id || c.sourceActivityId === `projects-${index}`,
    );

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

  const handleAddProject = () => {
    addProject();
    const newId = useResumeBuilder.getState().resume.projects.at(-1)?.id;
    if (newId) setExpandedIds((prev) => new Set([...prev, newId]));
  };

  const handleGenerateDescription = async (id: string) => {
    const proj = projects.find((p) => p.id === id);
    if (!proj) return;
    setAIAction(`proj-${id}-gen`, { status: "loading", result: null, error: null });
    try {
      const result = await ai.generateProjects(proj);
      const suggestion = { description: result.content, bulletPoints: [result.content] };
      setProjectSuggestions((prev) => { const n = new Map(prev); n.set(id, suggestion); return n; });
      setAIAction(`proj-${id}-gen`, { status: "success", result: result.content, error: null });
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
      isValid={projects.length > 0 && projects.some((p) => p.name)}
      actions={
        <AIActionButton label="Add Project" onClick={handleAddProject} variant="outline" icon={<Plus className="w-3 h-3" />} />
      }
    >
      <AnimatePresence>
        {projects.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-14 text-center bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-dashed border-gray-200 dark:border-white/[0.06]">
            <FolderIcon />
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-1 mt-4">Showcase your hands-on work</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-5">Add projects that demonstrate your skills and impact</p>
            <AIActionButton label="Add Project" onClick={handleAddProject} variant="primary" size="md" icon={<Plus className="w-3.5 h-3.5" />} />
          </motion.div>
        ) : (
          <div className="space-y-3">
            {projects.map((proj, idx) => {
              const isExpanded = expandedIds.has(proj.id);
              const projSug = projectSuggestions.get(proj.id);

              return (
                <motion.div key={proj.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8, height: 0 }}
                  className={`rounded-xl border overflow-hidden transition-colors ${
                    isExpanded
                      ? "border-cyan-500/20 bg-white dark:bg-[#0C1222]"
                      : "border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03]"
                  }`}
                >
                  {/* ── Collapsed card header ── */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.02] transition-colors" onClick={(e) => { e.stopPropagation(); toggleExpand(proj.id); }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{proj.name || "New Project"}</span>
                        {proj.tech && (
                          <>
                            <span className="text-gray-300 dark:text-slate-600">·</span>
                            <span className="text-xs text-gray-500 dark:text-slate-500 truncate">{proj.tech}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(proj.startDate || proj.endDate) && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">
                            {proj.startDate || "Start"} — {proj.endDate || "End"}
                          </span>
                        )}
                        {proj.role && (
                          <>
                            <span className="text-gray-300 dark:text-slate-600">·</span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{proj.role}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const claim = claimForProject(proj.id, idx);
                        return claim ? <VerificationBadge claim={claim} size="sm" /> : null;
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); moveProject(proj.id, -1); }} disabled={idx === 0} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveProject(proj.id, 1); }} disabled={idx === projects.length - 1} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); toggleExpand(proj.id); }} className="p-1 text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 rounded-md hover:bg-cyan-50 dark:hover:bg-cyan-500/10" title="Edit"><Pencil className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); removeProject(proj.id); }} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* ── Expanded content ── */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="border-t border-gray-100 dark:border-white/[0.06]">
                        <div className="px-4 py-4 space-y-5">
                          {/* ── Project Details ── */}
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Project Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <FieldInput label="Project Name" placeholder="AI Chat Platform" value={proj.name} onChange={(v) => updateProject(proj.id, "name", v)} onBlur={() => touch(`projects.${idx}.name`)} error={getFieldError("projects", "name", idx)} />
                              <FieldInput label="Technologies Used" placeholder="React, Node.js, OpenAI" value={proj.tech} onChange={(v) => updateProject(proj.id, "tech", v)} />
                              <FieldInput label="Role" placeholder="Lead Developer" value={proj.role} onChange={(v) => updateProject(proj.id, "role", v)} />
                              <FieldInput label="Project Link" placeholder="https://github.com/..." value={proj.link} onChange={(v) => updateProject(proj.id, "link", v)} type="url" />
                              <FieldInput label="Start Date" placeholder="Jan 2024" value={proj.startDate} onChange={(v) => updateProject(proj.id, "startDate", v)} />
                              <FieldInput label="End Date" placeholder="Jun 2024" value={proj.endDate} onChange={(v) => updateProject(proj.id, "endDate", v)} />
                            </div>
                          </div>

                          {/* ── Description ── */}
                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Description</h4>
                            <div className="flex items-center flex-wrap gap-1.5 mb-3">
                              <AIActionButton label="Generate Description" onClick={() => handleGenerateDescription(proj.id)} isLoading={aiActions[`proj-${proj.id}-gen`]?.status === "loading"} variant="ghost" />
                              {proj.description && <AIActionButton label="Improve Description" onClick={() => handleGenerateDescription(proj.id)} isLoading={aiActions[`proj-${proj.id}-gen`]?.status === "loading"} variant="ghost" />}
                            </div>
                            {aiActions[`proj-${proj.id}-gen`]?.status === "error" && (
                              <p className="text-[11px] text-red-400 mb-2">{aiActions[`proj-${proj.id}-gen`].error || "AI request failed. Please try again."}</p>
                            )}
                            <FieldInput label="" placeholder="Describe the project and your contributions..." value={proj.description} onChange={(v) => updateProject(proj.id, "description", v)} type="textarea" rows={4} />
                          </div>

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
