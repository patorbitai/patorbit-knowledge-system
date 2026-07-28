"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function ModernCleanPreview({ resume }: { resume: Resume }) {
  const accent = "#334155", ink = "#0f172a", muted = "#64748b", border = "#e2e8f0";
  const Section = ({ title, children, showBorder = true }: { title: string; children: React.ReactNode; showBorder?: boolean }) => <section className="mb-6">{showBorder && <h2 className="text-xs font-bold uppercase tracking-widest mb-3 pb-2 border-b-2" style={{ color: accent, borderColor: border }}>{title}</h2>}{!showBorder && <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: accent }}>{title}</h2>}{children}</section>;
  return (
    <div className="bg-white rounded-lg shadow-2xl" style={{ fontFamily: "'Inter', sans-serif", color: ink }}>
      <main className="p-8">
        <header className="grid grid-cols-3 gap-8 mb-8 items-center">
          <div className="col-span-2">
            <h1 className="text-4xl font-extralight tracking-tight" style={{ color: ink }}>{resume.name || "Your Name"}</h1>
            <p className="mt-1 text-lg font-light" style={{ color: accent }}>{resume.title || "Professional Title"}</p>
          </div>
          <div className="text-right text-xs" style={{ color: muted }}>
            {resume.email && <p>{resume.email}</p>}
            {resume.phone && <p>{resume.phone}</p>}
            {resume.address && <p>{resume.address}</p>}
            <div className="mt-2 flex justify-end"><SocialLinks social={resume.social} color={muted} size="sm" /></div>
          </div>
        </header>
        {resume.summary && <p className="mb-8 text-sm italic" style={{ color: muted }}><FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" /></p>}
        <div className="grid grid-cols-3 gap-x-8">
          <div className="col-span-2 space-y-6">
            {resume.experience.length > 0 && <Section title="Experience">{resume.experience.map(exp => <article key={exp.id}><div className="flex justify-between items-baseline"><h3 className="text-base font-semibold" style={{ color: accent }}>{exp.position}</h3><span className="text-xs font-medium" style={{ color: muted }}>{exp.duration}</span></div><p className="text-sm" style={{ color: muted }}>{exp.company}{exp.location && ` | ${exp.location}`}</p>{exp.description && <div className="mt-1 text-sm"><FormattedDescription text={exp.description} color={ink} mutedColor={muted} /></div>}</article>)}</Section>}
            {resume.projects.length > 0 && <Section title="Projects">{resume.projects.map(p => <article key={p.id}><h3 className="text-base font-semibold" style={{ color: accent }}>{p.name}</h3>{p.role && <p className="text-sm" style={{ color: muted }}>{p.role}</p>}{p.description && <div className="mt-1 text-sm"><FormattedDescription text={p.description} color={ink} mutedColor={muted} /></div>}</article>)}</Section>}
          </div>
          <div className="col-span-1 space-y-6">
            {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <article key={edu.id}><h3 className="text-base font-semibold" style={{ color: accent }}>{edu.school}</h3><p className="text-sm" style={{ color: muted }}>{edu.degree}</p><p className="text-xs" style={{ color: muted }}>{edu.year}</p></article>)}</Section>}
            {resume.skills.length > 0 && <Section title="Skills">{resume.skills.map(skill => <div key={skill.id} className="mb-2"><p className="text-sm font-semibold">{skill.name}</p><div className="h-1.5 w-full rounded-full mt-1" style={{ backgroundColor: border }}><div className="h-full rounded-full" style={{ width: skill.level === "Expert" ? "100%" : skill.level === "Advanced" ? "75%" : "50%", backgroundColor: accent }} /></div></div>)}</Section>}
            {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="text-sm mb-1">{c.name}</p>)}</Section>}
            {resume.languages.length > 0 && <Section title="Languages">{resume.languages.map(l => <p key={l.id} className="text-sm">{l.name} <span style={{ color: muted }}>({l.proficiency})</span></p>)}</Section>}
          </div>
        </div>
      </main>
    </div>
  );
}
