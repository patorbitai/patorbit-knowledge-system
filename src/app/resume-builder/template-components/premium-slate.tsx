"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function PremiumSlatePreview({ resume }: { resume: Resume }) {
  const slate = "#475569", accent = "#6366f1", bg = "#f1f5f9", ink = "#1e293b", muted = "#64748b";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-5"><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>{title}</h2>{children}</section>;
  return (
    <div className="rounded-lg shadow-2xl" style={{ fontFamily: "'Work Sans', sans-serif", backgroundColor: bg, color: ink }}>
      <header className="p-6 text-center" style={{ backgroundColor: slate }}>
        <h1 className="text-2xl font-bold text-white tracking-tight">{resume.name || "Your Name"}</h1>
        <p className="mt-1 text-sm text-white/80">{resume.title || "Professional Title"}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 text-xs text-white/70">{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
        {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color="#d1d5db" size="xs" /></div>}
      </header>
      <main className="p-6 text-xs">
        {resume.summary && <Section title="Professional Summary"><FormattedDescription text={resume.summary} color={accent} mutedColor={muted} size="sm" /></Section>}
        {resume.experience.length > 0 && <Section title="Work Experience">{resume.experience.map(e => <article key={e.id} className="mb-4"><div className="flex justify-between gap-3"><h3 className="text-sm font-semibold" style={{ color: ink }}>{e.position}</h3><span className="shrink-0 text-[10px]" style={{ color: muted }}>{e.duration}</span></div><p className="font-medium" style={{ color: accent }}>{e.company}{e.location && ` · ${e.location}`}</p>{e.description && <FormattedDescription text={e.description} color={accent} mutedColor={muted} />}</article>)}</Section>}
        <div className="grid grid-cols-2 gap-6">
          {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <article key={edu.id} className="mb-2"><h3 className="text-sm font-semibold" style={{ color: ink }}>{edu.school}</h3><p className="text-xs" style={{ color: muted }}>{edu.degree}{edu.field && `, ${edu.field}`}</p><p className="text-[10px]" style={{ color: muted }}>{edu.year}{edu.gpa && ` · GPA ${edu.gpa}`}</p></article>)}</Section>}
          {resume.skills.length > 0 && <Section title="Skills & Expertise">{resume.skills.map(s => <div key={s.id} className="mb-1"><p className="text-xs font-medium" style={{ color: ink }}>{s.name}</p><div className="h-1.5 w-full rounded-full" style={{ backgroundColor: "#d1d5db" }}><div className="h-full rounded-full" style={{ width: s.level === "Expert" ? "95%" : s.level === "Advanced" ? "75%" : "50%", backgroundColor: accent }} /></div></div>)}</Section>}
        </div>
        {resume.projects.length > 0 && <Section title="Key Projects">{resume.projects.map(p => <article key={p.id} className="mb-3"><h3 className="text-sm font-semibold" style={{ color: ink }}>{p.name}</h3>{p.role && <p className="text-xs font-medium" style={{ color: accent }}>{p.role}</p>}{p.description && <FormattedDescription text={p.description} color={accent} mutedColor={muted} />}{p.tech && <p className="mt-1 text-[10px]" style={{ color: muted }}>Tech: {p.tech}</p>}</article>)}</Section>}
        <div className="grid grid-cols-2 gap-6">
          {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="text-xs mb-1"><b>{c.name}</b>{c.issuer && `, ${c.issuer}`}</p>)}</Section>}
          {resume.languages.length > 0 && <Section title="Languages">{resume.languages.map(l => <p key={l.id} className="text-xs">{l.name} <span style={{ color: muted }}>({l.proficiency})</span></p>)}</Section>}
        </div>
        {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.map(a => <p key={a.id} className="text-xs mb-1">— {a.description}</p>)}</Section>}
        {resume.interests.length > 0 && <Section title="Interests"><p className="text-xs" style={{ color: muted }}>{resume.interests.map(i => i.name).join(" · ")}</p></Section>}
        {resume.references.length > 0 && <Section title="References">{resume.references.map(r => <p key={r.id} className="text-xs mb-1"><b>{r.name}</b>{r.position && ` — ${r.position}`}{r.company && `, ${r.company}`}</p>)}</Section>}
      </main>
    </div>
  );
}
