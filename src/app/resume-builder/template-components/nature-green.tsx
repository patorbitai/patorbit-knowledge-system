"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function NatureGreenPreview({ resume }: { resume: Resume }) {
  const green = "#22c55e", dark = "#166534", ink = "#1a2e05", muted = "#526044", bg = "#f0fdf4";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-5"><h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b-2 pb-1" style={{ color: dark, borderColor: green }}>{title}</h2>{children}</section>;
  return (
    <div className="rounded-lg shadow-2xl" style={{ fontFamily: "'Roboto Slab', 'Georgia', serif", backgroundColor: bg, color: ink }}>
      <header className="p-6 text-center">
        <div className="inline-block rounded-full border-4 p-1" style={{ borderColor: green }}><div className="h-16 w-16 rounded-full bg-slate-200" /></div>
        <h1 className="mt-3 text-3xl font-bold" style={{ color: dark }}>{resume.name || "Your Name"}</h1>
        <p className="mt-1 text-base font-medium" style={{ color: green }}>{resume.title || "Professional Title"}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-x-4 text-xs" style={{ color: muted }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
        {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={muted} size="xs" /></div>}
      </header>
      <main className="p-6 text-sm">
        {resume.summary && <Section title="About Me"><FormattedDescription text={resume.summary} color={dark} mutedColor={muted} size="sm" /></Section>}
        {resume.experience.length > 0 && <Section title="Experience">{resume.experience.map(e => <article key={e.id} className="mb-4"><div className="flex justify-between gap-3"><h3 className="text-base font-bold" style={{ color: dark }}>{e.position}</h3><span className="shrink-0 text-xs font-medium" style={{ color: muted }}>{e.duration}</span></div><p className="text-sm font-medium" style={{ color: green }}>{e.company}{e.location && ` · ${e.location}`}</p>{e.description && <FormattedDescription text={e.description} color={dark} mutedColor={muted} />}</article>)}</Section>}
        <div className="grid grid-cols-2 gap-8">
          <div>
            {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <article key={edu.id} className="mb-2"><h3 className="text-base font-bold" style={{ color: dark }}>{edu.school}</h3><p className="text-sm" style={{ color: muted }}>{edu.degree}{edu.field && `, ${edu.field}`}</p><p className="text-xs" style={{ color: muted }}>{edu.year}</p></article>)}</Section>}
            {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="text-sm mb-1"><b>{c.name}</b>{c.issuer && `, ${c.issuer}`}</p>)}</Section>}
          </div>
          <div>
            {resume.skills.length > 0 && <Section title="Skills">{resume.skills.map(s => <div key={s.id} className="mb-2"><p className="text-sm font-medium" style={{ color: dark }}>{s.name}</p><p className="text-xs" style={{ color: muted }}>{s.category} · {s.level}</p></div>)}</Section>}
            {resume.languages.length > 0 && <Section title="Languages">{resume.languages.map(l => <p key={l.id} className="text-sm">{l.name} <span style={{ color: muted }}>({l.proficiency})</span></p>)}</Section>}
          </div>
        </div>
        {resume.projects.length > 0 && <Section title="Projects">{resume.projects.map(p => <article key={p.id} className="mb-3"><h3 className="text-base font-bold" style={{ color: dark }}>{p.name}</h3>{p.role && <p className="text-sm font-medium" style={{ color: green }}>{p.role}</p>}{p.description && <FormattedDescription text={p.description} color={dark} mutedColor={muted} />}{p.tech && <p className="mt-1 text-xs" style={{ color: muted }}>{p.tech}</p>}</article>)}</Section>}
        {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.map(a => <p key={a.id} className="text-sm mb-1">🌿 {a.description}</p>)}</Section>}
        {resume.interests.length > 0 && <Section title="Interests"><p className="text-sm" style={{ color: muted }}>{resume.interests.map(i => i.name).join(", ")}</p></Section>}
        {resume.references.length > 0 && <Section title="References">{resume.references.map(r => <p key={r.id} className="text-sm mb-1"><b>{r.name}</b>{r.position && ` — ${r.position}`}</p>)}</Section>}
      </main>
    </div>
  );
}
