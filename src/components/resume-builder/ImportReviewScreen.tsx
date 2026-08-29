"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  ArrowLeft, FileText, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle2, Eye, EyeOff, X, Plus, Pencil, AlertTriangle,
  Sparkles, User, Briefcase, GraduationCap, Wrench, FolderOpen,
  Award, Globe, MessageSquare,
} from "lucide-react";
import type { Resume } from "@/types/resume";

/* ── Types ── */

export interface ImportMeta {
  path: "ai" | "regex";
  truncated: boolean;
  charCount: number;
  rawText: string;
}

export interface ImportReviewScreenProps {
  resume: Resume;
  meta: ImportMeta;
  onConfirm: (draft: Resume) => void;
  onCancel: () => void;
}

type SectionKey = "personal" | "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "languages";
type Confidence = "high" | "medium" | "low";

/* ── Section metadata ── */

const SECTION_META: Record<SectionKey, { label: string; icon: React.ReactNode; emptyMsg: string }> = {
  personal:     { label: "Personal",     icon: <User className="w-4 h-4" />,           emptyMsg: "No personal info detected" },
  summary:      { label: "Summary",      icon: <MessageSquare className="w-4 h-4" />,  emptyMsg: "No summary detected" },
  experience:   { label: "Experience",   icon: <Briefcase className="w-4 h-4" />,      emptyMsg: "No experience detected" },
  education:    { label: "Education",    icon: <GraduationCap className="w-4 h-4" />,  emptyMsg: "No education detected" },
  skills:       { label: "Skills",       icon: <Wrench className="w-4 h-4" />,         emptyMsg: "No skills detected" },
  projects:     { label: "Projects",     icon: <FolderOpen className="w-4 h-4" />,     emptyMsg: "No projects detected" },
  certifications: { label: "Certifications", icon: <Award className="w-4 h-4" />,      emptyMsg: "No certifications detected" },
  languages:    { label: "Languages",    icon: <Globe className="w-4 h-4" />,          emptyMsg: "No languages detected" },
};

const SECTIONS: SectionKey[] = ["personal", "summary", "experience", "education", "skills", "projects", "certifications", "languages"];

/* ── Confidence helpers ── */

function personalConfidence(r: Resume): Confidence {
  const filled = [r.name, r.email, r.phone, r.title].filter(Boolean).length;
  if (filled >= 3) return "high";
  if (filled >= 1) return "medium";
  return "low";
}

function summaryConfidence(r: Resume): Confidence {
  if (r.summary.length > 80) return "high";
  if (r.summary.length > 0) return "medium";
  return "low";
}

function arrayConfidence(arr: { name?: string; company?: string; school?: string; description?: string }[], minHigh = 1): Confidence {
  if (!arr.length) return "low";
  const complete = arr.filter(i =>
    (i.name || i.company || i.school) && i.description
  ).length;
  if (complete >= minHigh) return "high";
  if (complete > 0 || arr.length > 0) return "medium";
  return "low";
}

function skillsConfidence(r: Resume): Confidence {
  if (r.skills.length >= 5) return "high";
  if (r.skills.length >= 1) return "medium";
  return "low";
}

function languagesConfidence(r: Resume): Confidence {
  if (r.languages.length >= 1) return "high";
  return "low";
}

function sectionConfidence(section: SectionKey, r: Resume): Confidence {
  switch (section) {
    case "personal": return personalConfidence(r);
    case "summary": return summaryConfidence(r);
    case "experience": return arrayConfidence(r.experience.map(e => ({ company: e.company, description: e.description || (e.bulletPoints && e.bulletPoints.length > 0 ? "•" : "") })));
    case "education": return arrayConfidence(r.education.map(e => ({ school: e.school, description: e.degree })));
    case "skills": return skillsConfidence(r);
    case "projects": return arrayConfidence(r.projects.map(p => ({ name: p.name, description: p.description })));
    case "certifications": return r.certifications.length > 0 ? "medium" : "low";
    case "languages": return languagesConfidence(r);
  }
}

function overallConfidence(r: Resume): number {
  const weights: Record<SectionKey, number> = {
    personal: 2, summary: 1.5, experience: 2.5, education: 1.5,
    skills: 1.5, projects: 1, certifications: 0.5, languages: 0.5,
  };
  const scoreMap: Record<Confidence, number> = { high: 100, medium: 65, low: 20 };
  let total = 0, weightSum = 0;
  for (const s of SECTIONS) {
    const w = weights[s];
    total += scoreMap[sectionConfidence(s, r)] * w;
    weightSum += w;
  }
  return Math.round(total / weightSum);
}

function countNeedsReview(r: Resume): number {
  let count = 0;
  if (!r.name) count++;
  if (!r.email) count++;
  if (!r.phone) count++;
  if (!r.title) count++;
  if (r.summary.length < 10) count++;
  r.experience.forEach(e => { if (!e.company || !e.position) count++; });
  r.education.forEach(e => { if (!e.school || !e.degree) count++; });
  if (r.skills.length === 0) count++;
  r.projects.forEach(p => { if (!p.name) count++; });
  return count;
}

/* ── Field status indicator ── */

function FieldStatus({ value, label }: { value: string; label: string }) {
  const detected = !!value;
  return (
    <div className="flex items-center gap-2">
      {detected ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
      ) : (
        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
      )}
      <span className={clsx("text-[11px] font-medium", detected ? "text-slate-400" : "text-amber-500/80")}>
        {label}
      </span>
    </div>
  );
}

/* ── Inline editable value ── */

function InlineValue({ value, onValueChange, placeholder, className }: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setTemp(value); setEditing(true); }}
        className={clsx(
          "group text-left px-2 py-1 rounded-md transition-all hover:bg-white/[0.05] min-w-[60px]",
          value ? "text-white/90 text-[13px] font-medium" : "text-amber-500/60 text-[12px] italic",
          className,
        )}
      >
        {value || placeholder || "Not detected"}
        <Pencil className="w-2.5 h-2.5 ml-1.5 text-white/0 group-hover:text-white/20 inline transition-colors" />
      </button>
    );
  }

  return (
    <input
      autoFocus
      className="w-full px-2 py-1 rounded-md bg-white/[0.06] border border-blue-500/30 text-[13px] text-white/90 outline-none focus:ring-1 focus:ring-blue-500/20"
      value={temp}
      onChange={e => setTemp(e.target.value)}
      onBlur={() => { onValueChange(temp); setEditing(false); }}
      onKeyDown={e => { if (e.key === "Enter") { onValueChange(temp); setEditing(false); } if (e.key === "Escape") { setEditing(false); } }}
    />
  );
}

/* ── Inline editable textarea ── */

function InlineTextarea({ value, onValueChange, placeholder, rows = 4 }: {
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const [editing, setEditing] = useState(false);
  const [temp, setTemp] = useState(value);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setTemp(value); setEditing(true); }}
        className="group w-full text-left px-2 py-1.5 rounded-md transition-all hover:bg-white/[0.05]"
      >
        {value ? (
          <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-[12px] text-amber-500/60 italic">{placeholder || "Not detected"}</p>
        )}
        <Pencil className="w-2.5 h-2.5 mt-1 text-white/0 group-hover:text-white/20 transition-colors" />
      </button>
    );
  }

  return (
    <textarea
      autoFocus
      className="w-full px-2 py-1.5 rounded-md bg-white/[0.06] border border-blue-500/30 text-[13px] text-white/80 leading-relaxed outline-none focus:ring-1 focus:ring-blue-500/20 resize-none"
      rows={rows}
      value={temp}
      onChange={e => setTemp(e.target.value)}
      onBlur={() => { onValueChange(temp); setEditing(false); }}
    />
  );
}

/* ── Section: Personal ── */

function PersonalSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const u = (k: keyof Resume, v: string) => setDraft({ ...draft, [k]: v });
  const us = (k: keyof Resume["social"], v: string) => setDraft({ ...draft, social: { ...draft.social, [k]: v } });
  const fields = [
    { label: "Name", value: draft.name, key: "name" as const },
    { label: "Title", value: draft.title, key: "title" as const },
    { label: "Email", value: draft.email, key: "email" as const },
    { label: "Phone", value: draft.phone, key: "phone" as const },
    { label: "Address", value: draft.address, key: "address" as const },
    { label: "Nationality", value: draft.nationality, key: "nationality" as const },
  ];
  const socialFields = [
    { label: "LinkedIn", value: draft.social.linkedin, key: "linkedin" as const },
    { label: "GitHub", value: draft.social.github, key: "github" as const },
    { label: "Website", value: draft.social.website, key: "website" as const },
    { label: "Portfolio", value: draft.social.portfolio, key: "portfolio" as const },
  ];

  return (
    <div className="space-y-3">
      {/* Primary fields */}
      <div className="grid grid-cols-2 gap-2">
        {fields.map(f => (
          <div key={f.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
            <FieldStatus value={f.value} label={f.label} />
            <span className="flex-1" />
            <InlineValue value={f.value} onValueChange={v => u(f.key, v)} placeholder={`Add ${f.label.toLowerCase()}`} />
          </div>
        ))}
      </div>

      {/* Social */}
      <div className="pt-2 border-t border-white/[0.04]">
        <p className="text-[10px] font-bold text-white/25 uppercase tracking-[0.12em] mb-2 px-1">Social Links</p>
        <div className="grid grid-cols-2 gap-2">
          {socialFields.map(f => (
            <div key={f.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <FieldStatus value={f.value} label={f.label} />
              <span className="flex-1" />
              <InlineValue value={f.value} onValueChange={v => us(f.key, v)} placeholder={`Add ${f.label.toLowerCase()}`} className="text-[12px] truncate max-w-[200px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Section: Summary ── */

function SummarySection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const confidence = sectionConfidence("summary", draft);
  const wordCount = draft.summary.split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 mb-1">
        <ConfidencePill level={confidence} />
        {draft.summary && <span className="text-[11px] text-white/30">{wordCount} words</span>}
      </div>
      <div className="rounded-lg bg-white/[0.02] border border-white/[0.05] p-3">
        <InlineTextarea
          value={draft.summary}
          onValueChange={v => setDraft({ ...draft, summary: v })}
          placeholder="No professional summary detected — click to add one"
          rows={6}
        />
      </div>
    </div>
  );
}

/* ── Section: Experience ── */

function ExperienceSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, experience: draft.experience.map((e, i) => i === idx ? { ...e, [field]: value } : e) });
  const remove = (idx: number) =>
    setDraft({ ...draft, experience: draft.experience.filter((_, i) => i !== idx) });

  if (!draft.experience.length) {
    return <EmptyState message="No experience entries detected" />;
  }

  return (
    <div className="space-y-2">
      {draft.experience.map((exp, i) => {
        const isOpen = expanded[exp.id] ?? false;
        const missing = [!exp.company, !exp.position, !exp.duration, !exp.description].filter(Boolean).length;
        return (
          <div key={exp.id} className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            {/* Collapsed view */}
            <button
              type="button"
              onClick={() => toggle(exp.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white/90 truncate">{exp.position || "Untitled Position"}</span>
                  {missing > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {missing} missing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {exp.company && <span className="text-[12px] text-white/50">{exp.company}</span>}
                  {exp.company && exp.duration && <span className="text-[12px] text-white/25">·</span>}
                  {exp.duration && <span className="text-[12px] text-white/40">{exp.duration}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remove(i); }}
                className="p-1 rounded-md text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
            </button>

            {/* Expanded view */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-white/[0.04]">
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="Company" value={exp.company} onChange={v => update(i, "company", v)} />
                      <FieldRow label="Position" value={exp.position} onChange={v => update(i, "position", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="Duration" value={exp.duration} onChange={v => update(i, "duration", v)} />
                      <FieldRow label="Location" value={exp.location} onChange={v => update(i, "location", v)} />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Description</p>
                      <InlineTextarea value={exp.description} onValueChange={v => update(i, "description", v)} placeholder="Add description" rows={4} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Section: Education ── */

function EducationSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, education: draft.education.map((e, i) => i === idx ? { ...e, [field]: value } : e) });
  const remove = (idx: number) =>
    setDraft({ ...draft, education: draft.education.filter((_, i) => i !== idx) });

  if (!draft.education.length) {
    return <EmptyState message="No education entries detected" />;
  }

  return (
    <div className="space-y-2">
      {draft.education.map((edu, i) => {
        const isOpen = expanded[edu.id] ?? false;
        const missing = [!edu.school, !edu.degree, !edu.field, !edu.year].filter(Boolean).length;
        return (
          <div key={edu.id} className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            {/* Collapsed: degree + school */}
            <button
              type="button"
              onClick={() => toggle(edu.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white/90 truncate">{edu.degree || "Untitled Degree"}</span>
                  {missing > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {missing} missing
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {edu.school && <span className="text-[12px] text-white/50">{edu.school}</span>}
                  {edu.school && edu.year && <span className="text-[12px] text-white/25">·</span>}
                  {edu.year && <span className="text-[12px] text-white/40">{edu.year}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remove(i); }}
                className="p-1 rounded-md text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-white/[0.04]">
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="School" value={edu.school} onChange={v => update(i, "school", v)} />
                      <FieldRow label="Degree" value={edu.degree} onChange={v => update(i, "degree", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="Field of Study" value={edu.field} onChange={v => update(i, "field", v)} />
                      <FieldRow label="Year" value={edu.year} onChange={v => update(i, "year", v)} />
                    </div>
                    <FieldRow label="GPA / Honors" value={edu.gpa} onChange={v => update(i, "gpa", v)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Section: Skills ── */

function SkillsSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const [editing, setEditing] = useState(false);
  const remove = (idx: number) =>
    setDraft({ ...draft, skills: draft.skills.filter((_, i) => i !== idx) });
  const updateName = (idx: number, name: string) =>
    setDraft({ ...draft, skills: draft.skills.map((s, i) => i === idx ? { ...s, name } : s) });

  if (!draft.skills.length) {
    return <EmptyState message="No skills detected" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-white/30 font-medium">{draft.skills.length} skills detected</span>
        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className={clsx(
            "text-[11px] font-medium px-2 py-0.5 rounded-md transition-all",
            editing ? "bg-blue-500/15 text-blue-400" : "text-white/25 hover:text-white/50 hover:bg-white/[0.05]",
          )}
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {draft.skills.map((skill, i) => (
          <span
            key={skill.id}
            className={clsx(
              "inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-1 rounded-full transition-all",
              "bg-white/[0.04] text-white/70 border border-white/[0.06]",
              editing && "hover:border-red-500/30 hover:bg-red-500/5",
            )}
          >
            {editing ? (
              <input
                autoFocus={i === 0}
                className="w-16 bg-transparent text-[12px] text-white/80 outline-none"
                value={skill.name}
                onChange={e => updateName(i, e.target.value)}
              />
            ) : (
              <span>{skill.name}</span>
            )}
            {editing && (
              <button type="button" onClick={() => remove(i)} className="text-white/20 hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Section: Projects ── */

function ProjectsSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, projects: draft.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p) });
  const remove = (idx: number) =>
    setDraft({ ...draft, projects: draft.projects.filter((_, i) => i !== idx) });

  if (!draft.projects.length) {
    return <EmptyState message="No projects detected" />;
  }

  return (
    <div className="space-y-2">
      {draft.projects.map((proj, i) => {
        const isOpen = expanded[proj.id] ?? false;
        const missing = [!proj.name, !proj.tech, !proj.description].filter(Boolean).length;
        return (
          <div key={proj.id} className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(proj.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white/90 truncate">{proj.name || "Untitled Project"}</span>
                  {missing > 0 && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {missing} missing
                    </span>
                  )}
                </div>
                {proj.tech && (
                  <div className="mt-0.5">
                    <span className="text-[11px] text-white/40">{proj.tech}</span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remove(i); }}
                className="p-1 rounded-md text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-white/[0.04]">
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="Name" value={proj.name} onChange={v => update(i, "name", v)} />
                      <FieldRow label="Link" value={proj.link} onChange={v => update(i, "link", v)} />
                    </div>
                    <FieldRow label="Tech Stack" value={proj.tech} onChange={v => update(i, "tech", v)} />
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">Description</p>
                      <InlineTextarea value={proj.description} onValueChange={v => update(i, "description", v)} placeholder="Add description" rows={4} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Section: Certifications ── */

function CertificationsSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, certifications: draft.certifications.map((c, i) => i === idx ? { ...c, [field]: value } : c) });
  const remove = (idx: number) =>
    setDraft({ ...draft, certifications: draft.certifications.filter((_, i) => i !== idx) });

  if (!draft.certifications.length) {
    return <EmptyState message="No certifications detected" />;
  }

  return (
    <div className="space-y-2">
      {draft.certifications.map((cert, i) => {
        const isOpen = expanded[cert.id] ?? false;
        return (
          <div key={cert.id} className="rounded-lg border border-white/[0.06] bg-white/[0.015] overflow-hidden">
            <button
              type="button"
              onClick={() => toggle(cert.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[14px] font-semibold text-white/90 truncate">{cert.name || "Untitled Certification"}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {cert.issuer && <span className="text-[12px] text-white/50">{cert.issuer}</span>}
                  {cert.issuer && cert.date && <span className="text-[12px] text-white/25">·</span>}
                  {cert.date && <span className="text-[12px] text-white/40">{cert.date}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); remove(i); }}
                className="p-1 rounded-md text-white/15 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white/20" /> : <ChevronDown className="w-4 h-4 text-white/20" />}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-3 pt-1 space-y-2 border-t border-white/[0.04]">
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="Name" value={cert.name} onChange={v => update(i, "name", v)} />
                      <FieldRow label="Issuer" value={cert.issuer} onChange={v => update(i, "issuer", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FieldRow label="Date" value={cert.date} onChange={v => update(i, "date", v)} />
                      <FieldRow label="Link" value={cert.link} onChange={v => update(i, "link", v)} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Section: Languages ── */

function LanguagesSection({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, languages: draft.languages.map((l, i) => i === idx ? { ...l, [field]: value } : l) });
  const remove = (idx: number) =>
    setDraft({ ...draft, languages: draft.languages.filter((_, i) => i !== idx) });

  if (!draft.languages.length) {
    return <EmptyState message="No languages detected" />;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {draft.languages.map((lang, i) => (
        <div key={lang.id} className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-all">
          <span className="text-[13px] text-white/80 font-medium">{lang.name}</span>
          <select
            className="text-[11px] bg-white/[0.05] text-white/40 outline-none rounded px-1.5 py-0.5 border border-white/[0.06] cursor-pointer"
            value={lang.proficiency}
            onChange={e => update(i, "proficiency", e.target.value)}
          >
            {["Native", "Fluent", "Professional", "Conversational", "Beginner"].map(p => (
              <option key={p} value={p} className="bg-[#0A0E1B]">{p}</option>
            ))}
          </select>
          <button type="button" onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 text-white/15 hover:text-red-400 transition-all">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Shared components ── */

function FieldRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-1">{label}</p>
      <InlineValue value={value} onValueChange={onChange} placeholder={`Add ${label.toLowerCase()}`} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white/15" />
      </div>
      <p className="text-[13px] text-white/25">{message}</p>
    </div>
  );
}

function ConfidencePill({ level }: { level: Confidence }) {
  const c = CONFIDENCE_CONFIG[level];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border", c.bg, c.border, c.color)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", { "bg-emerald-400": level === "high", "bg-amber-400": level === "medium", "bg-red-400": level === "low" })} />
      {c.label}
    </span>
  );
}

const CONFIDENCE_CONFIG = {
  high: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", label: "High" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25", label: "Review" },
  low: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/25", label: "Low" },
} as const;

/* ── Main component ── */

export function ImportReviewScreen({ resume, meta, onConfirm, onCancel }: ImportReviewScreenProps) {
  const [draft, setDraft] = useState<Resume>(resume);
  const [activeSection, setActiveSection] = useState<SectionKey>("personal");
  const [showRaw, setShowRaw] = useState(false);

  const confidences = useMemo(() =>
    Object.fromEntries(SECTIONS.map(s => [s, sectionConfidence(s, draft)])) as Record<SectionKey, Confidence>,
    [draft],
  );

  const confidence = overallConfidence(draft);
  const needsReview = countNeedsReview(draft);

  const renderSection = useCallback(() => {
    switch (activeSection) {
      case "personal": return <PersonalSection draft={draft} setDraft={setDraft} />;
      case "summary": return <SummarySection draft={draft} setDraft={setDraft} />;
      case "experience": return <ExperienceSection draft={draft} setDraft={setDraft} />;
      case "education": return <EducationSection draft={draft} setDraft={setDraft} />;
      case "skills": return <SkillsSection draft={draft} setDraft={setDraft} />;
      case "projects": return <ProjectsSection draft={draft} setDraft={setDraft} />;
      case "certifications": return <CertificationsSection draft={draft} setDraft={setDraft} />;
      case "languages": return <LanguagesSection draft={draft} setDraft={setDraft} />;
    }
  }, [activeSection, draft]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] bg-[#070911] flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <header className="h-11 shrink-0 border-b border-white/[0.06] bg-[#080C18] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            Back to Builder
          </button>
          <ChevronRight className="w-3 h-3 text-slate-700" />
          <span className="text-[12px] font-semibold text-white">Review Imported Resume</span>
        </div>
        <div className="flex items-center gap-2">
          {meta.rawText && (
            <button
              type="button"
              onClick={() => setShowRaw(v => !v)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all",
                showRaw
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.06]",
              )}
            >
              {showRaw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showRaw ? "Hide" : "Source"}
            </button>
          )}
        </div>
      </header>

      {/* ── Status strip ── */}
      <div className="px-6 py-2.5 border-b border-white/[0.05] bg-white/[0.015] flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-[13px] font-semibold text-white/90">Import Complete</span>
          <span className={clsx("text-[13px] font-bold", {
            "text-emerald-400": confidence >= 90,
            "text-amber-400": confidence >= 70 && confidence < 90,
            "text-red-400": confidence < 70,
          })}>{confidence}%</span>
        </div>
        <div className="h-3 w-px bg-white/[0.08]" />
        <div className="flex items-center gap-3 text-[11px] text-white/40">
          {draft.experience.length > 0 && <span>{draft.experience.length} experience</span>}
          {draft.skills.length > 0 && <span>{draft.skills.length} skills</span>}
          {draft.projects.length > 0 && <span>{draft.projects.length} projects</span>}
          {draft.certifications.length > 0 && <span>{draft.certifications.length} certs</span>}
          {draft.languages.length > 0 && <span>{draft.languages.length} languages</span>}
        </div>
        {needsReview > 0 && (
          <>
            <div className="h-3 w-px bg-white/[0.08]" />
            <span className="text-[11px] font-medium text-amber-400/80">
              <AlertTriangle className="w-3 h-3 inline mr-1" />
              {needsReview} item{needsReview !== 1 ? "s" : ""} need review
            </span>
          </>
        )}
        <div className="ml-auto">
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium",
            meta.path === "ai"
              ? "border-violet-500/25 bg-violet-500/10 text-violet-400"
              : "border-amber-500/25 bg-amber-500/10 text-amber-400"
          )}>
            {meta.path === "ai" ? "AI extracted" : "Regex fallback"}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Section nav rail */}
        <nav className="w-[220px] shrink-0 border-r border-white/[0.06] bg-[#080C18] overflow-y-auto py-3 px-2">
          {SECTIONS.map((key) => {
            const level = confidences[key];
            const isActive = activeSection === key;
            const meta = SECTION_META[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all text-left mb-0.5",
                  isActive
                    ? "bg-blue-500/10 text-white border border-blue-500/15"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent",
                )}
              >
                <span className={clsx(
                  "flex h-6 w-6 items-center justify-center rounded-md shrink-0 transition-all",
                  isActive ? "bg-blue-500/20 text-blue-400" : "bg-white/[0.04] text-white/20",
                )}>
                  {meta.icon}
                </span>
                <span className="flex-1 font-medium truncate">{meta.label}</span>
                {level === "low" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />}
                {level === "high" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="w-full max-w-2xl mx-auto px-6 py-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-white/20">{SECTION_META[activeSection].icon}</span>
                <h2 className="text-lg font-bold text-white/90">{SECTION_META[activeSection].label}</h2>
              </div>
              <ConfidencePill level={confidences[activeSection]} />
            </div>
            {renderSection()}
          </div>
        </div>

        {/* Raw text panel */}
        <AnimatePresence>
          {showRaw && meta.rawText && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-l border-white/[0.06] bg-[#080C18] overflow-hidden flex flex-col"
            >
              <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-300">Source Text</span>
              </div>
              <pre className="flex-1 overflow-y-auto p-4 text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                {meta.rawText}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <footer className="h-13 shrink-0 border-t border-white/[0.06] bg-[#080C18] flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <span>Confidence</span>
          <span className={clsx("font-bold", {
            "text-emerald-400": confidence >= 90,
            "text-amber-400": confidence >= 70 && confidence < 90,
            "text-red-400": confidence < 70,
          })}>{confidence}%</span>
          {needsReview > 0 && (
            <span className="text-amber-400/60">· {needsReview} need review</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draft)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
          >
            Continue to Builder
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
