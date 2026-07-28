"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function ModernCleanPreview({ resume }: { resume: Resume }) {
  const c = { primary: "#1e293b", muted: "#475569", border: "#cbd5e1", text: "#0f172a", accent: "#334155" };
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4"><div className="flex items-center gap-2 mb-1.5"><span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.primary }}>{title}</span><div className="h-px flex-1" style={{ backgroundColor: c.border }} /></div>{children}</div>
  );
  return (
    <div className="bg-white text-black rounded-lg shadow overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div className="p-6 space-y-4 text-sm">
        <div className="text-center pb-3" style={{ borderBottom: `2px solid ${c.primary}` }}>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: c.text }}>{resume.name || "Your Name"}</h1>
          <p className="text-sm mt-0.5" style={{ color: c.muted }}>{resume.title || "Professional Title"}</p>
          <div className="flex flex-wrap justify-center gap-x-3 text-xs mt-1.5" style={{ color: c.muted }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
          {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={c.muted} size="xs" /></div>}
        </div>
        {resume.summary && <Section title="Summary"><FormattedDescription text={resume.summary} color={c.primary} mutedColor={c.muted} size="sm" /></Section>}
        {resume.experience.length > 0 && <Section title="Experience">{resume.experience.slice(0, 3).map(exp => (<div key={exp.id} className="mb-2 last:mb-0"><div className="flex justify-between items-start"><div><span className="text-sm font-semibold" style={{ color: c.text }}>{exp.position}</span><span className="text-xs ml-1" style={{ color: c.primary }}>at {exp.company}</span>{exp.location && <span className="text-xs ml-1" style={{ color: c.muted }}>— {exp.location}</span>}</div><span className="text-xs shrink-0 ml-2" style={{ color: c.muted }}>{exp.duration}</span></div>{exp.description && <FormattedDescription text={exp.description} color={c.primary} mutedColor={c.muted} />}</div>))}</Section>}
        {resume.education.length > 0 && <Section title="Education">{resume.education.slice(0, 2).map(edu => (<div key={edu.id} className="flex justify-between mb-1"><div><span className="text-sm font-semibold" style={{ color: c.text }}>{edu.school}</span><span className="text-xs ml-1" style={{ color: c.muted }}>— {edu.degree}{edu.field ? `, ${edu.field}` : ""}</span></div><span className="text-xs" style={{ color: c.muted }}>{edu.year}</span></div>))}</Section>}
        {resume.skills.length > 0 && <Section title="Skills"><div className="flex flex-wrap gap-1.5">{resume.skills.slice(0, 10).map(s => (<span key={s.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${c.primary}12`, color: c.primary }}>{s.name}{s.category && <span className="ml-0.5 opacity-70">· {s.category}</span>}{s.level && s.level !== "Intermediate" && <span className="ml-0.5 opacity-70">· {s.level}</span>}{s.years && <span className="ml-0.5 opacity-70">· {s.years}y</span>}</span>))}</div></Section>}
        {resume.projects.length > 0 && <Section title="Projects">{resume.projects.slice(0, 3).map(p => (<div key={p.id} className="mb-1 last:mb-0"><div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: c.text }}>{p.name}</span><div className="flex gap-1.5 text-xs" style={{ color: c.muted }}>{p.startDate && <span>{p.startDate} - {p.endDate || 'Present'}</span>}</div></div><div className="text-xs" style={{ color: c.primary }}>{p.role && <span className="mr-2">{p.role}</span>}{p.tech && <span>| {p.tech}</span>}</div>{p.description && <FormattedDescription text={p.description} color={c.primary} mutedColor={c.muted} />}{p.link && <a href={p.link} className="text-xs block" style={{ color: c.accent }} target="_blank" rel="noopener noreferrer">{p.link}</a>}</div>))}</Section>}
        {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.slice(0, 2).map(c => (<div key={c.id} className="flex items-center gap-1.5 mb-1"><span className="text-xs" style={{ color: c.accent }}>▸</span><span className="text-sm" style={{ color: c.text }}>{c.name}</span>{c.issuer && <span className="text-xs" style={{ color: c.muted }}>— {c.issuer}</span>}</div>))}</Section>}
        {resume.languages.length > 0 && <Section title="Languages"><div className="flex flex-wrap gap-2">{resume.languages.slice(0, 5).map(l => (<span key={l.id} className="text-xs" style={{ color: c.text }}>{l.name}{l.proficiency && <span className="ml-1 text-xs" style={{ color: c.muted }}>({l.proficiency})</span>}</span>))}</div></Section>}
        {resume.interests.length > 0 && <Section title="Interests"><p className="text-xs" style={{ color: c.muted }}>{resume.interests.slice(0, 6).map(i => i.name).join(" · ")}</p></Section>}
        {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.slice(0, 3).map(a => (<p key={a.id} className="text-xs mb-0.5" style={{ color: c.text }}>🏆 {a.description}</p>))}</Section>}
        {resume.references.length > 0 && <Section title="References">{resume.references.slice(0, 2).map(r => (<p key={r.id} className="text-xs" style={{ color: c.muted }}>{r.name}{r.position && ` — ${r.position}`}{r.company && ` at ${r.company}`}</p>))}</Section>}
      </div>
    </div>
  );
}