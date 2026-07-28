"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function ClassicSerifPreview({ resume }: { resume: Resume }) {
  const navy = "#1e3a8a", ink = "#1f2937", muted = "#4b5563", line = "#d1d5db";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-6"><h2 className="text-sm font-bold uppercase tracking-[0.12em] mb-3 border-b pb-1.5" style={{ color: navy, borderColor: line }}><span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: navy }} />{title}</h2>{children}</section>;
  return (
    <div className="bg-white text-black rounded-lg shadow-2xl" style={{ fontFamily: "'Playfair Display', serif" }}>
      <main className="p-8">
        <header className="text-center pb-6 mb-6 border-b-2 border-t-2 pt-4" style={{ borderColor: navy }}>
          <h1 className="text-4xl font-bold tracking-wide" style={{ color: navy }}>{resume.name || "Your Name"}</h1>
          <p className="text-lg italic mt-2" style={{ color: muted }}>{resume.title || "Professional Title"}</p>
          <div className="flex flex-wrap justify-center gap-x-4 mt-3 text-sm" style={{ color: muted }}>{resume.email && <span>{resume.email}</span>}| {resume.phone && <span>{resume.phone}</span>}| {resume.address && <span>{resume.address}</span>}{resume.pronouns && <span>| {resume.pronouns}</span>}</div>
          {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={muted} size="sm" /></div>}
        </header>
        {resume.summary && <Section title="Professional Summary"><FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" /></Section>}
        {resume.experience.length > 0 && <Section title="Professional Experience">{resume.experience.map(exp => <article key={exp.id} className="mb-4"><div className="flex justify-between items-baseline gap-3"><h3 className="text-lg font-bold" style={{ color: ink }}>{exp.position}</h3><span className="shrink-0 text-sm italic" style={{ color: muted }}>{exp.duration}</span></div><p className="text-base italic" style={{ color: navy }}>{exp.company}{exp.location && `, ${exp.location}`}</p>{exp.description && <div className="mt-1 pl-4 border-l-2" style={{ borderColor: `${navy}30` }}><FormattedDescription text={exp.description} color={ink} mutedColor={muted} /></div>}</article>)}</Section>}
        <div className="grid grid-cols-2 gap-8">
          <div>{resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <article key={edu.id} className="mb-3"><h3 className="text-base font-bold" style={{ color: navy }}>{edu.school}</h3><p className="text-sm">{edu.degree}{edu.field && `, ${edu.field}`}</p><p className="text-sm italic" style={{ color: muted }}>{edu.year}</p></article>)}</Section>}</div>
          <div>{resume.skills.length > 0 && <Section title="Areas of Expertise">{resume.skills.map(s => <p key={s.id} className="text-sm mb-1">→ {s.name}</p>)}</Section>}</div>
        </div>
        {resume.projects.length > 0 && <Section title="Selected Projects">{resume.projects.map(p => <article key={p.id} className="mb-3"><h3 className="text-base font-bold" style={{ color: ink }}>{p.name}</h3><p className="text-sm italic" style={{ color: muted }}>{p.role} | {p.tech}</p>{p.description && <FormattedDescription text={p.description} color={ink} mutedColor={muted} />}</article>)}</Section>}
        <div className="grid grid-cols-2 gap-8">
          <div>{resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="text-sm mb-1">→ {c.name}</p>)}</Section>}</div>
          <div>{resume.achievements.length > 0 && <Section title="Honors">{resume.achievements.map(a => <p key={a.id} className="text-sm mb-1">→ {a.description}</p>)}</Section>}</div>
        </div>
        <div className="mt-6 text-sm text-center" style={{ color: muted }}>{resume.languages.length > 0 && <p className="mb-1">Languages: {resume.languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</p>}{resume.interests.length > 0 && <p>Interests: {resume.interests.map(i => i.name).join(", ")}</p>}</div>
      </main>
    </div>
  );
}
