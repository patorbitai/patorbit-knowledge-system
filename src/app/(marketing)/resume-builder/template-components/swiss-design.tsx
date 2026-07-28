"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function SwissDesignPreview({ resume }: { resume: Resume }) {
  const accent = "#ef4444", ink = "#111827", muted = "#6b7280";
  const Section = ({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) => <section className={className}><h2 className="text-[9px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: accent }}>{title}</h2>{children}</section>;
  return (
    <div className="bg-white text-black rounded-lg shadow-2xl overflow-hidden" style={{ fontFamily: "'Inter', 'Helvetica Neue', sans-serif" }}>
      <div className="grid grid-cols-3 gap-6 p-6">
        <header className="col-span-3 grid grid-cols-3 gap-6 pb-4 border-b" style={{ borderColor: `${accent}30` }}>
          <div className="col-span-2"><h1 className="text-3xl font-black tracking-tighter" style={{ color: ink }}>{resume.name || "Your Name"}</h1><p className="text-sm font-medium tracking-wide" style={{ color: muted }}>{resume.title || "Professional Title"}</p></div>
          <div className="text-right text-[9px] leading-snug" style={{ color: muted }}>{resume.email && <p>{resume.email}</p>}{resume.phone && <p>{resume.phone}</p>}{resume.address && <p>{resume.address}</p>}{resume.social && <SocialLinks social={resume.social} color={muted} size="xs" />}</div>
        </header>
        <div className="col-span-1 space-y-5">
          {resume.summary && <Section title="Profile"><FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="xs" /></Section>}
          {resume.skills.length > 0 && <Section title="Skills">{resume.skills.map(s => <div key={s.id} className="mb-2"><p className="text-[10px] font-bold">{s.name}</p><p className="text-[9px]" style={{ color: muted }}>{s.category} / {s.level}</p></div>)}</Section>}
          {resume.languages.length > 0 && <Section title="Languages">{resume.languages.map(l => <p key={l.id} className="text-[10px]">{l.name} <span style={{ color: muted }}>({l.proficiency})</span></p>)}</Section>}
          {resume.interests.length > 0 && <Section title="Interests"><p className="text-[10px]" style={{ color: muted }}>{resume.interests.map(i => i.name).join(" / ")}</p></Section>}
        </div>
        <div className="col-span-2 space-y-5">
          {resume.experience.length > 0 && <Section title="Experience" className="space-y-4">{resume.experience.map(e => <article key={e.id}><div className="flex justify-between items-baseline"><h3 className="text-sm font-bold" style={{ color: ink }}>{e.position}</h3><span className="text-[9px] font-medium" style={{ color: muted }}>{e.duration}</span></div><p className="text-xs font-medium" style={{ color: accent }}>{e.company}</p>{e.description && <FormattedDescription text={e.description} color={ink} mutedColor={muted} size="xs" />}</article>)}</Section>}
          {resume.education.length > 0 && <Section title="Education" className="space-y-2">{resume.education.map(edu => <article key={edu.id}><h3 className="text-sm font-bold" style={{ color: ink }}>{edu.school}</h3><p className="text-xs" style={{ color: muted }}>{edu.degree}, {edu.field} ({edu.year})</p></article>)}</Section>}
          {resume.projects.length > 0 && <Section title="Projects" className="space-y-3">{resume.projects.map(p => <article key={p.id}><h3 className="text-sm font-bold" style={{ color: ink }}>{p.name}</h3><p className="text-xs" style={{ color: muted }}>{p.tech}</p>{p.description && <FormattedDescription text={p.description} color={ink} mutedColor={muted} size="xs" />}</article>)}</Section>}
          {resume.certifications.length > 0 && <Section title="Certifications" className="space-y-1">{resume.certifications.map(c => <p key={c.id} className="text-xs"><b>{c.name}</b>, {c.issuer} ({c.date})</p>)}</Section>}
          {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.map(a => <p key={a.id} className="text-xs mb-1">▪ {a.description}</p>)}</Section>}
          {resume.references.length > 0 && <Section title="References">{resume.references.map(r => <p key={r.id} className="text-xs mb-1"><b>{r.name}</b>{r.position && ` - ${r.position}`}</p>)}</Section>}
        </div>
      </div>
    </div>
  );
}
