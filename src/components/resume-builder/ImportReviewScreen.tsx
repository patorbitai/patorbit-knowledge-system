"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  ArrowLeft, FileText, ChevronRight, AlertTriangle, CheckCircle2,
  Eye, EyeOff, X, User, Briefcase, GraduationCap, Wrench, FolderOpen,
  Award, Globe, MessageSquare, Sparkles, Shield, FileSearch, Link2,
  Mail, Phone, MapPin, Flag, Link, ExternalLink, GitBranch,
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

/* ── Section icons ── */

const SECTION_ICONS: Record<SectionKey, React.ReactNode> = {
  personal: <User className="w-[15px] h-[15px]" />,
  summary: <MessageSquare className="w-[15px] h-[15px]" />,
  experience: <Briefcase className="w-[15px] h-[15px]" />,
  education: <GraduationCap className="w-[15px] h-[15px]" />,
  skills: <Wrench className="w-[15px] h-[15px]" />,
  projects: <FolderOpen className="w-[15px] h-[15px]" />,
  certifications: <Award className="w-[15px] h-[15px]" />,
  languages: <Globe className="w-[15px] h-[15px]" />,
};

const SECTION_COUNTS: Record<SectionKey, (r: Resume) => number> = {
  personal: (r) => [r.name, r.email, r.phone, r.title, r.address].filter(Boolean).length,
  summary: (r) => r.summary ? 1 : 0,
  experience: (r) => r.experience.length,
  education: (r) => r.education.length,
  skills: (r) => r.skills.length,
  projects: (r) => r.projects.length,
  certifications: (r) => r.certifications.length,
  languages: (r) => r.languages.length,
};

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
  const sections: SectionKey[] = ["personal", "summary", "experience", "education", "skills", "projects", "certifications", "languages"];
  let total = 0, weightSum = 0;
  for (const s of sections) {
    const w = weights[s];
    total += scoreMap[sectionConfidence(s, r)] * w;
    weightSum += w;
  }
  return Math.round(total / weightSum);
}

/* ── Confidence components ── */

const CONFIDENCE_CONFIG = {
  high: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", ring: "ring-emerald-500/20", label: "High" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25", ring: "ring-amber-500/20", label: "Review" },
  low: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/25", ring: "ring-red-500/20", label: "Missing" },
} as const;

function ConfidencePill({ level }: { level: Confidence }) {
  const c = CONFIDENCE_CONFIG[level];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border", c.bg, c.border, c.color)}>
      <span className={clsx("w-1.5 h-1.5 rounded-full", { "bg-emerald-400": level === "high", "bg-amber-400": level === "medium", "bg-red-400": level === "low" })} />
      {c.label}
    </span>
  );
}

function ConfidenceBar({ level }: { level: Confidence }) {
  const pct = { high: 100, medium: 60, low: 20 }[level];
  return (
    <div className="h-1 w-10 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={clsx("h-full rounded-full", {
          "bg-emerald-400": level === "high",
          "bg-amber-400": level === "medium",
          "bg-red-400": level === "low",
        })}
      />
    </div>
  );
}

/* ── Shared input styles ── */

function inputCls(empty: boolean) {
  return clsx(
    "w-full rounded-lg px-3 py-2 text-[13px] leading-snug text-white/90",
    "bg-white/[0.03] border transition-all duration-150",
    "focus:border-blue-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-blue-500/15 focus:outline-none",
    "placeholder:text-white/20 hover:bg-white/[0.05]",
    empty
      ? "border-amber-500/30 bg-amber-500/[0.04]"
      : "border-white/[0.07]",
  );
}

function textareaCls(empty: boolean) {
  return clsx(
    "w-full rounded-lg px-3 py-2.5 text-[13px] leading-relaxed text-white/90",
    "bg-white/[0.03] border transition-all duration-150 resize-none",
    "focus:border-blue-500/50 focus:bg-white/[0.05] focus:ring-2 focus:ring-blue-500/15 focus:outline-none",
    "placeholder:text-white/20 hover:bg-white/[0.05]",
    empty
      ? "border-amber-500/30 bg-amber-500/[0.04]"
      : "border-white/[0.07]",
  );
}

function FieldLabel({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-[0.08em]">
      {icon && <span className="text-white/25">{icon}</span>}
      {children}
    </label>
  );
}

function CardGroup({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.05] bg-white/[0.02]">
        {icon && <span className="text-white/30">{icon}</span>}
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1em]">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function EntryCard({ index, onRemove, children }: { index: number; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="relative group rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/[0.1]">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Entry {index + 1}</span>
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
          aria-label="Remove entry"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-3">
        <FileSearch className="w-5 h-5 text-white/15" />
      </div>
      <p className="text-[13px] text-white/30 font-medium">{message}</p>
    </div>
  );
}

/* ── Section panels ── */

function PersonalPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const f = (key: keyof Resume) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, [key]: e.target.value });
  const sf = (key: keyof Resume["social"]) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft({ ...draft, social: { ...draft.social, [key]: e.target.value } });

  return (
    <div className="space-y-4">
      <CardGroup title="Basic Information" icon={<User className="w-3 h-3" />}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<User className="w-3 h-3" />}>Full Name</FieldLabel>
            <input className={inputCls(!draft.name)} value={draft.name} onChange={f("name")} placeholder="e.g. John Smith" />
          </div>
          <div>
            <FieldLabel icon={<Briefcase className="w-3 h-3" />}>Title / Headline</FieldLabel>
            <input className={inputCls(!draft.title)} value={draft.title} onChange={f("title")} placeholder="e.g. Senior Engineer" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<Mail className="w-3 h-3" />}>Email</FieldLabel>
            <input className={inputCls(!draft.email)} value={draft.email} onChange={f("email")} placeholder="e.g. john@email.com" />
          </div>
          <div>
            <FieldLabel icon={<Phone className="w-3 h-3" />}>Phone</FieldLabel>
            <input className={inputCls(!draft.phone)} value={draft.phone} onChange={f("phone")} placeholder="e.g. +1 234 567 890" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<MapPin className="w-3 h-3" />}>Address</FieldLabel>
            <input className={inputCls(!draft.address)} value={draft.address} onChange={f("address")} placeholder="e.g. New York, NY" />
          </div>
          <div>
            <FieldLabel icon={<Flag className="w-3 h-3" />}>Nationality</FieldLabel>
            <input className={inputCls(!draft.nationality)} value={draft.nationality} onChange={f("nationality")} placeholder="Not detected" />
          </div>
        </div>
      </CardGroup>

      <CardGroup title="Social Links" icon={<Link2 className="w-3 h-3" />}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<Link className="w-3 h-3" />}>LinkedIn</FieldLabel>
            <input className={inputCls(!draft.social.linkedin)} value={draft.social.linkedin} onChange={sf("linkedin")} placeholder="linkedin.com/in/..." />
          </div>
          <div>
            <FieldLabel icon={<GitBranch className="w-3 h-3" />}>GitHub</FieldLabel>
            <input className={inputCls(!draft.social.github)} value={draft.social.github} onChange={sf("github")} placeholder="github.com/..." />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel icon={<ExternalLink className="w-3 h-3" />}>Website</FieldLabel>
            <input className={inputCls(!draft.social.website)} value={draft.social.website} onChange={sf("website")} placeholder="yourwebsite.com" />
          </div>
          <div>
            <FieldLabel icon={<FolderOpen className="w-3 h-3" />}>Portfolio</FieldLabel>
            <input className={inputCls(!draft.social.portfolio)} value={draft.social.portfolio} onChange={sf("portfolio")} placeholder="portfolio link" />
          </div>
        </div>
      </CardGroup>
    </div>
  );
}

function SummaryPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const charCount = draft.summary.length;
  return (
    <div className="space-y-3">
      <CardGroup title="Professional Summary" icon={<MessageSquare className="w-3 h-3" />}>
        <div className="relative">
          <textarea
            className={textareaCls(!draft.summary)}
            rows={8}
            value={draft.summary}
            onChange={e => setDraft({ ...draft, summary: e.target.value })}
            placeholder="Write a brief professional summary highlighting your key qualifications..."
          />
          <div className="absolute bottom-2.5 right-3 text-[10px] text-white/20 font-mono">
            {charCount.toLocaleString()} chars
          </div>
        </div>
      </CardGroup>
    </div>
  );
}

function ExperiencePanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, experience: draft.experience.map((e, i) => i === idx ? { ...e, [field]: value } : e) });
  const remove = (idx: number) =>
    setDraft({ ...draft, experience: draft.experience.filter((_, i) => i !== idx) });

  if (!draft.experience.length) return <EmptyState message="No experience entries detected" />;

  return (
    <div className="space-y-3">
      {draft.experience.map((exp, i) => (
        <EntryCard key={exp.id} index={i} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Company</FieldLabel>
              <input className={inputCls(!exp.company)} value={exp.company} onChange={e => update(i, "company", e.target.value)} placeholder="Company name" />
            </div>
            <div>
              <FieldLabel>Position</FieldLabel>
              <input className={inputCls(!exp.position)} value={exp.position} onChange={e => update(i, "position", e.target.value)} placeholder="Job title" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Duration</FieldLabel>
              <input className={inputCls(!exp.duration)} value={exp.duration} onChange={e => update(i, "duration", e.target.value)} placeholder="e.g. Jan 2022 - Present" />
            </div>
            <div>
              <FieldLabel>Location</FieldLabel>
              <input className={inputCls(!exp.location)} value={exp.location} onChange={e => update(i, "location", e.target.value)} placeholder="e.g. Mumbai, India" />
            </div>
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea className={textareaCls(!exp.description)} rows={5} value={exp.description} onChange={e => update(i, "description", e.target.value)} placeholder="Describe your responsibilities and achievements..." />
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

function EducationPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, education: draft.education.map((e, i) => i === idx ? { ...e, [field]: value } : e) });
  const remove = (idx: number) =>
    setDraft({ ...draft, education: draft.education.filter((_, i) => i !== idx) });

  if (!draft.education.length) return <EmptyState message="No education entries detected" />;

  return (
    <div className="space-y-3">
      {draft.education.map((edu, i) => (
        <EntryCard key={edu.id} index={i} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>School / University</FieldLabel>
              <input className={inputCls(!edu.school)} value={edu.school} onChange={e => update(i, "school", e.target.value)} placeholder="Institution name" />
            </div>
            <div>
              <FieldLabel>Degree</FieldLabel>
              <input className={inputCls(!edu.degree)} value={edu.degree} onChange={e => update(i, "degree", e.target.value)} placeholder="e.g. Bachelor of Science" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Field of Study</FieldLabel>
              <input className={inputCls(!edu.field)} value={edu.field} onChange={e => update(i, "field", e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div>
              <FieldLabel>Year</FieldLabel>
              <input className={inputCls(!edu.year)} value={edu.year} onChange={e => update(i, "year", e.target.value)} placeholder="e.g. 2018 - 2022" />
            </div>
          </div>
          <div>
            <FieldLabel>GPA / Honors</FieldLabel>
            <input className={inputCls(!edu.gpa)} value={edu.gpa} onChange={e => update(i, "gpa", e.target.value)} placeholder="e.g. 3.8/4.0" />
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

function SkillsPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, skills: draft.skills.map((s, i) => i === idx ? { ...s, [field]: value } : s) });
  const remove = (idx: number) =>
    setDraft({ ...draft, skills: draft.skills.filter((_, i) => i !== idx) });

  if (!draft.skills.length) return <EmptyState message="No skills detected" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/30 font-medium">{draft.skills.length} skill{draft.skills.length !== 1 ? "s" : ""} detected</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {draft.skills.map((skill, i) => (
          <div key={skill.id} className="group flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 hover:border-white/[0.1] transition-all">
            <Wrench className="w-3 h-3 text-white/15 shrink-0" />
            <input
              className="flex-1 bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/15"
              value={skill.name}
              onChange={e => update(i, "name", e.target.value)}
              placeholder="Skill name"
            />
            <button type="button" onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 p-0.5 text-white/20 hover:text-red-400 transition-all">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, projects: draft.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p) });
  const remove = (idx: number) =>
    setDraft({ ...draft, projects: draft.projects.filter((_, i) => i !== idx) });

  if (!draft.projects.length) return <EmptyState message="No projects detected" />;

  return (
    <div className="space-y-3">
      {draft.projects.map((proj, i) => (
        <EntryCard key={proj.id} index={i} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Project Name</FieldLabel>
              <input className={inputCls(!proj.name)} value={proj.name} onChange={e => update(i, "name", e.target.value)} placeholder="Project name" />
            </div>
            <div>
              <FieldLabel>Link</FieldLabel>
              <input className={inputCls(!proj.link)} value={proj.link} onChange={e => update(i, "link", e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div>
            <FieldLabel>Tech Stack</FieldLabel>
            <input className={inputCls(!proj.tech)} value={proj.tech} onChange={e => update(i, "tech", e.target.value)} placeholder="e.g. React, Node.js, PostgreSQL" />
          </div>
          <div>
            <FieldLabel>Description</FieldLabel>
            <textarea className={textareaCls(!proj.description)} rows={5} value={proj.description} onChange={e => update(i, "description", e.target.value)} placeholder="Describe the project, your role, and impact..." />
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

function CertificationsPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, certifications: draft.certifications.map((c, i) => i === idx ? { ...c, [field]: value } : c) });
  const remove = (idx: number) =>
    setDraft({ ...draft, certifications: draft.certifications.filter((_, i) => i !== idx) });

  if (!draft.certifications.length) return <EmptyState message="No certifications detected" />;

  return (
    <div className="space-y-3">
      {draft.certifications.map((cert, i) => (
        <EntryCard key={cert.id} index={i} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Certification Name</FieldLabel>
              <input className={inputCls(!cert.name)} value={cert.name} onChange={e => update(i, "name", e.target.value)} placeholder="e.g. AWS Solutions Architect" />
            </div>
            <div>
              <FieldLabel>Issuer</FieldLabel>
              <input className={inputCls(!cert.issuer)} value={cert.issuer} onChange={e => update(i, "issuer", e.target.value)} placeholder="e.g. Amazon Web Services" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Date</FieldLabel>
              <input className={inputCls(!cert.date)} value={cert.date} onChange={e => update(i, "date", e.target.value)} placeholder="e.g. Dec 2023" />
            </div>
            <div>
              <FieldLabel>Link</FieldLabel>
              <input className={inputCls(!cert.link)} value={cert.link} onChange={e => update(i, "link", e.target.value)} placeholder="Credential URL" />
            </div>
          </div>
        </EntryCard>
      ))}
    </div>
  );
}

function LanguagesPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, languages: draft.languages.map((l, i) => i === idx ? { ...l, [field]: value } : l) });
  const remove = (idx: number) =>
    setDraft({ ...draft, languages: draft.languages.filter((_, i) => i !== idx) });

  if (!draft.languages.length) return <EmptyState message="No languages detected" />;

  return (
    <div className="space-y-2">
      {draft.languages.map((lang, i) => (
        <div key={lang.id} className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 hover:border-white/[0.1] transition-all">
          <Globe className="w-3.5 h-3.5 text-white/15 shrink-0" />
          <input
            className="flex-1 bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/15"
            value={lang.name}
            onChange={e => update(i, "name", e.target.value)}
            placeholder="Language"
          />
          <select
            className="text-[12px] bg-white/[0.04] text-white/50 outline-none rounded-md px-2 py-1 border border-white/[0.06] cursor-pointer hover:bg-white/[0.06] transition-all"
            value={lang.proficiency}
            onChange={e => update(i, "proficiency", e.target.value)}
          >
            {["Native", "Fluent", "Professional", "Conversational", "Beginner"].map(p => (
              <option key={p} value={p} className="bg-[#0A0E1B]">{p}</option>
            ))}
          </select>
          <button type="button" onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 p-0.5 text-white/20 hover:text-red-400 transition-all">
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Section config ── */

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "personal", label: "Personal" },
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "education", label: "Education" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "languages", label: "Languages" },
];

/* ── Import status bar ── */

function StatusBar({ resume, meta }: { resume: Resume; meta: ImportMeta }) {
  const confidence = overallConfidence(resume);
  const confColor = confidence >= 90 ? "text-emerald-400" : confidence >= 70 ? "text-amber-400" : "text-red-400";

  const stats = [
    { label: "experience", count: resume.experience.length, icon: <Briefcase className="w-3 h-3" /> },
    { label: "skills", count: resume.skills.length, icon: <Wrench className="w-3 h-3" /> },
    { label: "projects", count: resume.projects.length, icon: <FolderOpen className="w-3 h-3" /> },
    { label: "certs", count: resume.certifications.length, icon: <Award className="w-3 h-3" /> },
    { label: "languages", count: resume.languages.length, icon: <Globe className="w-3 h-3" /> },
  ];

  return (
    <div className="px-5 py-3 border-b border-white/[0.05] bg-gradient-to-r from-emerald-500/[0.04] via-transparent to-transparent">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status badge */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[13px] font-semibold text-white/90">Import Complete</span>
          <span className={clsx("text-[13px] font-bold", confColor)}>{confidence}%</span>
        </div>

        <div className="h-4 w-px bg-white/[0.08]" />

        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {stats.filter(s => s.count > 0).map(s => (
            <span key={s.label} className="inline-flex items-center gap-1.5 text-[11px] text-white/40 font-medium">
              <span className="text-white/20">{s.icon}</span>
              <span className="text-white/60 font-semibold">{s.count}</span>
              {s.label}
            </span>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Extraction method badge */}
          <span className={clsx(
            "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
            meta.path === "ai"
              ? "border-violet-500/25 bg-violet-500/10 text-violet-400"
              : "border-amber-500/25 bg-amber-500/10 text-amber-400"
          )}>
            {meta.path === "ai" ? <Sparkles className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
            {meta.path === "ai" ? "AI Extraction" : "Regex Fallback"}
          </span>
          {meta.truncated && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-white/40">
              {Math.round(meta.charCount / 1000)}k chars
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */

export function ImportReviewScreen({ resume, meta, onConfirm, onCancel }: ImportReviewScreenProps) {
  const [draft, setDraft] = useState<Resume>(resume);
  const [activeSection, setActiveSection] = useState<SectionKey>("personal");
  const [showRaw, setShowRaw] = useState(false);

  const confidences = useMemo(() =>
    Object.fromEntries(SECTIONS.map(s => [s.key, sectionConfidence(s.key, draft)])) as Record<SectionKey, Confidence>,
    [draft],
  );

  const renderPanel = () => {
    switch (activeSection) {
      case "personal": return <PersonalPanel draft={draft} setDraft={setDraft} />;
      case "summary": return <SummaryPanel draft={draft} setDraft={setDraft} />;
      case "experience": return <ExperiencePanel draft={draft} setDraft={setDraft} />;
      case "education": return <EducationPanel draft={draft} setDraft={setDraft} />;
      case "skills": return <SkillsPanel draft={draft} setDraft={setDraft} />;
      case "projects": return <ProjectsPanel draft={draft} setDraft={setDraft} />;
      case "certifications": return <CertificationsPanel draft={draft} setDraft={setDraft} />;
      case "languages": return <LanguagesPanel draft={draft} setDraft={setDraft} />;
    }
  };

  const activeLabel = SECTIONS.find(s => s.key === activeSection)?.label ?? "";
  const activeCount = SECTION_COUNTS[activeSection]?.(draft) ?? 0;
  const confidence = overallConfidence(draft);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] bg-[#080B16] flex flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <header className="h-11 shrink-0 border-b border-white/[0.05] bg-[#0B0E1C]/80 backdrop-blur-sm flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
            Back to Builder
          </button>
          <div className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-white/10" />
            <span className="text-[11px] font-semibold text-white/50">Review Imported Resume</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {meta.rawText && (
            <button
              type="button"
              onClick={() => setShowRaw(v => !v)}
              className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all",
                showRaw
                  ? "bg-blue-500/15 text-blue-300 border border-blue-500/20"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.05] border border-transparent",
              )}
            >
              {showRaw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showRaw ? "Hide source" : "View source text"}
            </button>
          )}
        </div>
      </header>

      {/* ── Status bar ── */}
      <StatusBar resume={draft} meta={meta} />

      {/* ── Body ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Section sidebar ── */}
        <nav className="w-[220px] shrink-0 border-r border-white/[0.05] bg-[#0A0D1A] overflow-y-auto py-3 px-2">
          {SECTIONS.map(({ key, label }, idx) => {
            const level = confidences[key];
            const isActive = activeSection === key;
            const count = SECTION_COUNTS[key]?.(draft) ?? 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={clsx(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] transition-all text-left mb-0.5",
                  isActive
                    ? "bg-blue-500/10 text-white/90 border border-blue-500/15"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.03] border border-transparent",
                )}
              >
                <span className={clsx(
                  "flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold shrink-0 transition-all",
                  isActive
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-white/[0.04] text-white/20",
                )}>
                  {SECTION_ICONS[key]}
                </span>
                <span className="flex-1 font-medium truncate">{label}</span>
                {count > 0 && (
                  <span className={clsx(
                    "text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                    isActive ? "bg-blue-500/15 text-blue-400" : "bg-white/[0.05] text-white/25",
                  )}>
                    {count}
                  </span>
                )}
                <ConfidenceBar level={level} />
              </button>
            );
          })}

          {/* Overall progress */}
          <div className="mt-4 mx-2 pt-3 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-wider">Overall</span>
              <span className={clsx("text-[11px] font-bold", {
                "text-emerald-400": confidence >= 90,
                "text-amber-400": confidence >= 70 && confidence < 90,
                "text-red-400": confidence < 70,
              })}>{confidence}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${confidence}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={clsx("h-full rounded-full transition-colors", {
                  "bg-emerald-500": confidence >= 90,
                  "bg-amber-500": confidence >= 70 && confidence < 90,
                  "bg-red-500": confidence < 70,
                })}
              />
            </div>
          </div>
        </nav>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-5">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-blue-400">
                  {SECTION_ICONS[activeSection]}
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-white/90 tracking-tight">{activeLabel}</h2>
                  {activeCount > 0 && (
                    <p className="text-[11px] text-white/25 mt-0.5">
                      {activeCount} {activeCount === 1 ? "entry" : "entries"} detected
                    </p>
                  )}
                </div>
              </div>
              <ConfidencePill level={confidences[activeSection]} />
            </div>

            {/* Panel content */}
            {renderPanel()}
          </div>
        </div>

        {/* ── Raw text panel ── */}
        <AnimatePresence>
          {showRaw && meta.rawText && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-l border-white/[0.05] bg-[#0A0D1A] overflow-hidden flex flex-col"
            >
              <div className="px-4 py-2.5 border-b border-white/[0.05] flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-white/20" />
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Source Text</span>
              </div>
              <pre className="flex-1 overflow-y-auto p-4 text-[11px] text-white/30 leading-relaxed whitespace-pre-wrap font-mono">
                {meta.rawText}
                {meta.truncated && (
                  <span className="block mt-2 text-amber-400/50 not-italic">
                    [Preview limited — full text was used for extraction]
                  </span>
                )}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Footer ── */}
      <footer className="h-14 shrink-0 border-t border-white/[0.05] bg-[#0B0E1C]/80 backdrop-blur-sm flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/25">Confidence</span>
            <span className={clsx("text-[12px] font-bold", {
              "text-emerald-400": confidence >= 90,
              "text-amber-400": confidence >= 70 && confidence < 90,
              "text-red-400": confidence < 70,
            })}>{confidence}%</span>
          </div>
          <div className="h-3 w-px bg-white/[0.06]" />
          <span className="text-[11px] text-white/20">All fields are editable</span>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-[12px] font-medium text-white/35 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draft)}
            className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[12px] font-semibold bg-blue-500 text-white hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-400/30 active:scale-[0.98]"
          >
            Continue to Builder
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
