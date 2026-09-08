"use client";

import { useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { SectionCard } from "../section-card";
import { FieldInput } from "../fields/FieldInput";
import { VerificationBadge } from "../fields/VerificationBadge";
import { AIActionButton } from "../AIActionButton";
import { SmartSuggestion } from "../SmartSuggestion";
import { EmptyState } from "../cards/EmptyState";
import { BulletList } from "../cards/BulletList";
import { ai } from "@/lib/ai/client";
import { FolderKanban, ChevronUp, ChevronDown, Plus, Pencil, Trash2, Check, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useValidation } from "../hooks/useValidation";

export function ProjectsSection() {
  const claims = useResumeBuilder((s) => s.resume?.claims ?? []);
  const projects = useResumeBuilder((s) => s.resume?.projects ?? []);
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

  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [projectSuggestions, setProjectSuggestions] = useState<Map<string, { description: string; bulletPoints: string[] }>>(new Map());

  const toggleEdit = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddProject = () => {
    addProject();
    const newId = useResumeBuilder.getState().resume.projects.at(-1)?.id;
    if (newId) setEditingIds((prev) => new Set([...prev, newId]));
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
    } catch (err: unknown) {
      setAIAction(`proj-${id}-gen`, { status: "error", result: null, error: err instanceof Error ? err.message : "AI request failed." });
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
          <EmptyState
            icon={<FolderKanban className="w-5 h-5" />}
            message="Build your project portfolio"
            submessage="Show apps, research, AI work, GitHub projects, and more."
            action={handleAddProject}
            actionLabel="Add Your First Project"
          />
        ) : (
          <div className="space-y-3">
            {projects.map((proj, idx) => {
              const isEditing = editingIds.has(proj.id);
              const projSug = projectSuggestions.get(proj.id);

              return (
                <motion.div
                  key={proj.id}
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
                  <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{proj.name || "New Project"}</span>
                        {proj.role && <span className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{proj.role}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {(proj.startDate || proj.endDate) && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500">
                            {[proj.startDate, proj.endDate].filter(Boolean).join(" — ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {(() => {
                        const claim = claimForProject(proj.id, idx);
                        return claim ? <VerificationBadge claim={claim} size="sm" /> : null;
                      })()}
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => moveProject(proj.id, -1)} disabled={idx === 0} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronUp className="w-3 h-3" /></button>
                        <button onClick={() => moveProject(proj.id, 1)} disabled={idx === projects.length - 1} className="p-1 text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-20 rounded-md hover:bg-gray-100 dark:hover:bg-white/[0.06]"><ChevronDown className="w-3 h-3" /></button>
                      </div>
                      <button
                        onClick={() => toggleEdit(proj.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                          isEditing
                            ? "text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
                            : "text-gray-400 dark:text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10"
                        }`}
                      >
                        {isEditing ? <Check className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                        {isEditing ? "Done" : "Edit"}
                      </button>
                      <button onClick={() => removeProject(proj.id)} className="p-1 text-gray-400 dark:text-slate-500 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10" title="Delete"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>

                  {/* Content view */}
                  <div className="px-4 pb-4 space-y-3">
                    {proj.description && (
                      <p className="text-[13px] leading-relaxed text-gray-600 dark:text-slate-400">{proj.description}</p>
                    )}
                    <BulletList
                      bullets={proj.bulletPoints ?? []}
                      onChange={(bullets) => updateProject(proj.id, "bulletPoints", bullets)}
                    />
                    {proj.tech && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {proj.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/[0.05] text-[10px] text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-white/[0.06]">{t}</span>
                        ))}
                      </div>
                    )}
                    {proj.link && (
                      <a
                        href={proj.link.startsWith("http") ? proj.link : `https://${proj.link}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {proj.link.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>

                  {/* Edit details */}
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

                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3">Description</h4>
                            <div className="flex items-center flex-wrap gap-1.5 mb-3">
                              <AIActionButton label="Generate Description" onClick={() => handleGenerateDescription(proj.id)} isLoading={aiActions[`proj-${proj.id}-gen`]?.status === "loading"} variant="ghost" />
                            </div>
                            {aiActions[`proj-${proj.id}-gen`]?.status === "error" && (
                              <p className="text-[11px] text-red-400 mb-2">{aiActions[`proj-${proj.id}-gen`].error || "AI request failed. Please try again."}</p>
                            )}
                            <FieldInput label="" placeholder="Describe the project and your contributions..." value={proj.description} onChange={(v) => updateProject(proj.id, "description", v)} type="textarea" rows={3} />
                          </div>

                          <div>
                            <h4 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">Bullets</h4>
                            <BulletList
                              bullets={proj.bulletPoints ?? []}
                              onChange={(bullets) => updateProject(proj.id, "bulletPoints", bullets)}
                            />
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