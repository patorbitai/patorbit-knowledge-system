"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  ArrowLeft, FileText, ChevronRight, AlertTriangle, CheckCircle2,
  Eye, EyeOff, X, User, Briefcase, GraduationCap, Wrench, FolderOpen,
  Award, Globe, MessageSquare, Sparkles, Shield, FileSearch,
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
  personal: <User className="w-4 h-4" />,
  summary: <MessageSquare className="w-4 h-4" />,
  experience: <Briefcase className="w-4 h-4" />,
  education: <GraduationCap className="w-4 h-4" />,
  skills: <Wrench className="w-4 h-4" />,
  projects: <FolderOpen className="w-4 h-4" />,
  certifications: <Award className="w-4 h-4" />,
  languages: <Globe className="w-4 h-4" />,
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
  high: { color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/25", label: "High" },
  medium: { color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/25", label: "Review" },
  low: { color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/25", label: "Missing" },
} as const;

function ConfidencePill({ level }: { level: Confidence }) {
  const c = CONFIDENCE_CONFIG[level];
  return (
    <span className={clsx("inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1 rounded-full border", c.bg, c.border, c.color)}>
      <span className={clsx("w-2 h-2 rounded-full", { "bg-emerald-400": level === "high", "bg-amber-400": level === "medium", "bg-red-400": level === "low" })} />
      {c.label}
    </span>
  );
}

function ConfidenceDot({ level }: { level: Confidence }) {
  return (
    <span className={clsx("inline-block w-2.5 h-2.5 rounded-full shrink-0", {
      "bg-emerald-400": level === "high",
      "bg-amber-400": level === "medium",
      "bg-red-400": level === "low",
    })} />
  );
}

/* ── Shared input styles ── */

const inputCls = (empty: boolean) => clsx(
  "w-full rounded-lg px-3 py-2 text-[13px] leading-snug text-white/90 bg-white/[0.04] border outline-none transition",
  "focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20",
  empty
    ? "border-amber-500/40 bg-amber-500/5 placeholder:text-amber-500/60"
    : "border-white/[0.08] placeholder:text-slate-500",
);

const textareaCls = (empty: boolean) => clsx(
  "w-full rounded-lg px-3 py-2 text-[13px] leading-relaxed text-white/90 bg-white/[0.04] border outline-none transition resize-none",
  "focus:border-blue-500/50 focus:bg-white/[0.06] focus:ring-1 focus:ring-blue-500/20",
  empty
    ? "border-amber-500/40 bg-amber-500/5 placeholder:text-amber-500/60"
    : "border-white/[0.08] placeholder:text-slate-500",
);

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-slate-300 mb-1.5">{children}</label>;
}

function EntryCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 space-y-3 shadow-sm shadow-black/20">
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition"
        aria-label="Remove entry"
      >
        <X className="w-4 h-4" />
      </button>
      {children}
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
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel>Name</FieldLabel><input className={inputCls(!draft.name)} value={draft.name} onChange={f("name")} placeholder="Not detected" /></div>
        <div><FieldLabel>Title / Headline</FieldLabel><input className={inputCls(!draft.title)} value={draft.title} onChange={f("title")} placeholder="Not detected" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel>Email</FieldLabel><input className={inputCls(!draft.email)} value={draft.email} onChange={f("email")} placeholder="Not detected" /></div>
        <div><FieldLabel>Phone</FieldLabel><input className={inputCls(!draft.phone)} value={draft.phone} onChange={f("phone")} placeholder="Not detected" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><FieldLabel>Address</FieldLabel><input className={inputCls(!draft.address)} value={draft.address} onChange={f("address")} placeholder="Not detected" /></div>
        <div><FieldLabel>Nationality</FieldLabel><input className={inputCls(!draft.nationality)} value={draft.nationality} onChange={f("nationality")} placeholder="Not detected" /></div>
      </div>
      <div className="pt-1 border-t border-white/[0.06]">
        <h3 className="text-[12px] font-bold text-slate-300 uppercase tracking-[0.12em] mb-3 mt-4">Social Links</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><FieldLabel>LinkedIn</FieldLabel><input className={inputCls(!draft.social.linkedin)} value={draft.social.linkedin} onChange={sf("linkedin")} placeholder="Not detected" /></div>
          <div><FieldLabel>GitHub</FieldLabel><input className={inputCls(!draft.social.github)} value={draft.social.github} onChange={sf("github")} placeholder="Not detected" /></div>
          <div><FieldLabel>Website</FieldLabel><input className={inputCls(!draft.social.website)} value={draft.social.website} onChange={sf("website")} placeholder="Not detected" /></div>
          <div><FieldLabel>Portfolio</FieldLabel><input className={inputCls(!draft.social.portfolio)} value={draft.social.portfolio} onChange={sf("portfolio")} placeholder="Not detected" /></div>
        </div>
      </div>
    </div>
  );
}

function SummaryPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  return (
    <div className="space-y-3">
      <FieldLabel>Professional Summary</FieldLabel>
      <textarea
        className={textareaCls(!draft.summary)}
        rows={6}
        value={draft.summary}
        onChange={e => setDraft({ ...draft, summary: e.target.value })}
        placeholder="Not detected"
      />
    </div>
  );
}

function ExperiencePanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, experience: draft.experience.map((e, i) => i === idx ? { ...e, [field]: value } : e) });
  const remove = (idx: number) =>
    setDraft({ ...draft, experience: draft.experience.filter((_, i) => i !== idx) });
  if (!draft.experience.length)
    return <p className="text-sm text-slate-500 italic">No experience entries detected.</p>;
  return (
    <div className="space-y-4">
      {draft.experience.map((exp, i) => (
        <EntryCard key={exp.id} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Company</FieldLabel><input className={inputCls(!exp.company)} value={exp.company} onChange={e => update(i, "company", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Position</FieldLabel><input className={inputCls(!exp.position)} value={exp.position} onChange={e => update(i, "position", e.target.value)} placeholder="Not detected" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Duration</FieldLabel><input className={inputCls(!exp.duration)} value={exp.duration} onChange={e => update(i, "duration", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Location</FieldLabel><input className={inputCls(!exp.location)} value={exp.location} onChange={e => update(i, "location", e.target.value)} placeholder="Not detected" /></div>
          </div>
          <div><FieldLabel>Description</FieldLabel><textarea className={textareaCls(!exp.description)} rows={5} value={exp.description} onChange={e => update(i, "description", e.target.value)} placeholder="Not detected" /></div>
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
  if (!draft.education.length)
    return <p className="text-sm text-slate-500 italic">No education entries detected.</p>;
  return (
    <div className="space-y-4">
      {draft.education.map((edu, i) => (
        <EntryCard key={edu.id} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>School</FieldLabel><input className={inputCls(!edu.school)} value={edu.school} onChange={e => update(i, "school", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Degree</FieldLabel><input className={inputCls(!edu.degree)} value={edu.degree} onChange={e => update(i, "degree", e.target.value)} placeholder="Not detected" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Field of Study</FieldLabel><input className={inputCls(!edu.field)} value={edu.field} onChange={e => update(i, "field", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Year</FieldLabel><input className={inputCls(!edu.year)} value={edu.year} onChange={e => update(i, "year", e.target.value)} placeholder="Not detected" /></div>
          </div>
          <div><FieldLabel>GPA / Honors</FieldLabel><input className={inputCls(!edu.gpa)} value={edu.gpa} onChange={e => update(i, "gpa", e.target.value)} placeholder="Not detected" /></div>
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
  if (!draft.skills.length)
    return <p className="text-sm text-slate-500 italic">No skills detected.</p>;
  return (
    <div className="grid grid-cols-2 gap-2">
      {draft.skills.map((skill, i) => (
        <div key={skill.id} className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <input
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-600"
            value={skill.name}
            onChange={e => update(i, "name", e.target.value)}
            placeholder="Skill name"
          />
          <button type="button" onClick={() => remove(i)} className="p-0.5 text-slate-700 hover:text-red-400 transition">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

function ProjectsPanel({ draft, setDraft }: { draft: Resume; setDraft: (r: Resume) => void }) {
  const update = (idx: number, field: string, value: string) =>
    setDraft({ ...draft, projects: draft.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p) });
  const remove = (idx: number) =>
    setDraft({ ...draft, projects: draft.projects.filter((_, i) => i !== idx) });
  if (!draft.projects.length)
    return <p className="text-sm text-slate-500 italic">No projects detected.</p>;
  return (
    <div className="space-y-4">
      {draft.projects.map((proj, i) => (
        <EntryCard key={proj.id} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Project Name</FieldLabel><input className={inputCls(!proj.name)} value={proj.name} onChange={e => update(i, "name", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Link</FieldLabel><input className={inputCls(!proj.link)} value={proj.link} onChange={e => update(i, "link", e.target.value)} placeholder="Not detected" /></div>
          </div>
          <div><FieldLabel>Tech Stack</FieldLabel><input className={inputCls(!proj.tech)} value={proj.tech} onChange={e => update(i, "tech", e.target.value)} placeholder="Not detected" /></div>
          <div><FieldLabel>Description</FieldLabel><textarea className={textareaCls(!proj.description)} rows={5} value={proj.description} onChange={e => update(i, "description", e.target.value)} placeholder="Not detected" /></div>
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
  if (!draft.certifications.length)
    return <p className="text-sm text-slate-500 italic">No certifications detected.</p>;
  return (
    <div className="space-y-4">
      {draft.certifications.map((cert, i) => (
        <EntryCard key={cert.id} onRemove={() => remove(i)}>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Name</FieldLabel><input className={inputCls(!cert.name)} value={cert.name} onChange={e => update(i, "name", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Issuer</FieldLabel><input className={inputCls(!cert.issuer)} value={cert.issuer} onChange={e => update(i, "issuer", e.target.value)} placeholder="Not detected" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FieldLabel>Date</FieldLabel><input className={inputCls(!cert.date)} value={cert.date} onChange={e => update(i, "date", e.target.value)} placeholder="Not detected" /></div>
            <div><FieldLabel>Link</FieldLabel><input className={inputCls(!cert.link)} value={cert.link} onChange={e => update(i, "link", e.target.value)} placeholder="Not detected" /></div>
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
  if (!draft.languages.length)
    return <p className="text-sm text-slate-500 italic">No languages detected.</p>;
  return (
    <div className="space-y-2">
      {draft.languages.map((lang, i) => (
        <div key={lang.id} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <input
            className="flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-slate-600"
            value={lang.name}
            onChange={e => update(i, "name", e.target.value)}
            placeholder="Language"
          />
          <select
            className="text-[12px] bg-transparent text-slate-400 outline-none border-none cursor-pointer"
            value={lang.proficiency}
            onChange={e => update(i, "proficiency", e.target.value)}
          >
            {["Native", "Fluent", "Professional", "Conversational", "Beginner"].map(p => (
              <option key={p} value={p} className="bg-[#0A0E1B]">{p}</option>
            ))}
          </select>
          <button type="button" onClick={() => remove(i)} className="p-0.5 text-slate-700 hover:text-red-400 transition">
            <X className="w-3.5 h-3.5" />
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

/* ── Import summary banner ── */

function ImportSummary({ resume, meta }: { resume: Resume; meta: ImportMeta }) {
  const items: { label: string; ok: boolean }[] = [
    { label: `${resume.experience.length} experience entr${resume.experience.length === 1 ? "y" : "ies"}`, ok: resume.experience.length > 0 },
    { label: `${resume.skills.length} skill${resume.skills.length === 1 ? "" : "s"}`, ok: resume.skills.length > 0 },
    { label: `${resume.projects.length} project${resume.projects.length === 1 ? "" : "s"}`, ok: resume.projects.length > 0 },
    { label: `${resume.certifications.length} certification${resume.certifications.length === 1 ? "" : "s"}`, ok: resume.certifications.length > 0 },
    { label: "Phone missing", ok: false, hide: !!resume.phone },
    { label: "Email missing", ok: false, hide: !!resume.email },
  ].filter((i): i is { label: string; ok: boolean } => !("hide" in i && i.hide));

  const confidence = overallConfidence(resume);
  const confidenceColor = confidence >= 90 ? "text-emerald-400" : confidence >= 70 ? "text-amber-400" : "text-red-400";

  return (
    <div className="px-6 py-3 border-b border-white/[0.06] bg-white/[0.02] flex flex-wrap items-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-blue-400" />
        <span className="text-sm font-semibold text-white">Import Complete</span>
        <span className={clsx("text-sm font-bold", confidenceColor)}>{confidence}%</span>
        <span className="text-[11px] text-slate-500">confidence</span>
      </div>
      <div className="h-3 w-px bg-white/[0.06]" />
      <div className="flex flex-wrap items-center gap-3">
        {items.map(item => (
          <span key={item.label} className={clsx("inline-flex items-center gap-1 text-[11px]", item.ok ? "text-slate-400" : "text-amber-400")}>
            {item.ok
              ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              : <AlertTriangle className="w-3 h-3 text-amber-400" />}
            {item.label}
          </span>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded border font-medium",
          meta.path === "ai"
            ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
            : "border-amber-500/30 bg-amber-500/10 text-amber-400"
        )}>
          {meta.path === "ai" ? "AI extraction" : "Regex fallback"}
        </span>
        {meta.truncated && (
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-400">
            Truncated ({Math.round(meta.charCount / 1000)}k chars)
          </span>
        )}
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-[60] bg-[#070911] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="h-12 shrink-0 border-b border-white/[0.06] bg-[#080C18] flex items-center justify-between px-4 gap-4">
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
              {showRaw ? "Hide original" : "View original text"}
            </button>
          )}
        </div>
      </header>

      {/* Summary banner */}
      <ImportSummary resume={draft} meta={meta} />

      {/* Body: sidebar + content (+ optional raw panel) */}
      <div className="flex-1 flex overflow-hidden">

        {/* Section nav */}
        <nav className="w-[260px] shrink-0 border-r border-white/[0.06] bg-[#080C18] overflow-y-auto py-4 px-3 space-y-1">
          {SECTIONS.map(({ key, label }, idx) => {
            const level = confidences[key];
            const isActive = activeSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] transition-all text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500/15 to-cyan-500/10 text-white border border-blue-500/20 shadow-sm shadow-blue-500/5"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] border border-transparent",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                  style={{ backgroundColor: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(148,163,184,0.08)', color: isActive ? '#60a5fa' : '#64748b' }}>
                  {SECTION_ICONS[key]}
                </span>
                <span className="flex-1 font-medium">{label}</span>
                <ConfidenceDot level={level} />
              </button>
            );
          })}
        </nav>

        {/* Editable panel */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="w-full px-8 py-5">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white tracking-tight">{activeLabel}</h2>
              <ConfidencePill level={confidences[activeSection]} />
            </div>
            {renderPanel()}
          </div>
        </div>

        {/* Raw text panel */}
        <AnimatePresence>
          {showRaw && meta.rawText && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-l border-white/[0.06] bg-[#080C18] overflow-hidden flex flex-col"
            >
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-300">Original Resume Text</span>
              </div>
              <pre className="flex-1 overflow-y-auto p-4 text-[12px] text-slate-400 leading-relaxed whitespace-pre-wrap font-mono">
                {meta.rawText}
                {meta.truncated && (
                  <span className="block mt-2 text-amber-400/70 not-italic">
                    [Preview limited to first 6,000 chars — full text was used for extraction]
                  </span>
                )}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="h-14 shrink-0 border-t border-white/[0.06] bg-[#080C18] flex items-center justify-between px-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-500">
          <span>Overall confidence:</span>
          <span className={clsx("font-bold", {
            "text-emerald-400": overallConfidence(draft) >= 90,
            "text-amber-400": overallConfidence(draft) >= 70 && overallConfidence(draft) < 90,
            "text-red-400": overallConfidence(draft) < 70,
          })}>{overallConfidence(draft)}%</span>
          <span className="text-slate-600">· All fields are editable above</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(draft)}
            className="flex items-center gap-1.5 px-6 py-2 rounded-lg text-[13px] font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
          >
            Continue to Builder
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
