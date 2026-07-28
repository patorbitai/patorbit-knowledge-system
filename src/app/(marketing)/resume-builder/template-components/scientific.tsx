"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function ScientificPreview({ resume }: { resume: Resume }) {
  const navy = "#1e3a8a", ink = "#1f2937", muted = "#4b5563", line = "#d1d5db";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-5"><h2 className="mb-2 text-sm font-bold" style={{ color: navy }}>§ {title}</h2>{children}</section>;
  return (
    <div className="bg-white text-black rounded-lg shadow-2xl overflow-hidden" style={{ fontFamily: "'Roboto Slab', 'Georgia', serif", color: ink }}>
      <div className="p-8">
        <header className="mb-6 pb-4" style={{ borderBottom: `1px solid ${line}` }}>
          <h1 className="text-2xl font-bold" style={{ color: navy }}>{resume.name || "Your Name"}</h1>
          <p className="text-sm mt-0.5" style={{ color: muted }}>{resume.title || "Professional Title"}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs" style={{ color: muted }}>
            {resume.email && <span><b>Email:</b> {resume.email}</span>}
            {resume.phone && <span><b>Phone:</b> {resume.phone}</span>}
            {resume.address && <span><b>Address:</b> {resume.address}</span>}
            {resume.pronouns && <span><b>Pronouns:</b> {resume.pronouns}</span>}
          </div>
          {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={muted} size="xs" /></div>}
        </header>
        {resume.summary && <Section title="Abstract"><FormattedDescription text={resume.summary} color={ink} mutedColor={ink} size="sm" /></Section>}
        {resume.experience.length > 0 && <Section title="Appointments">{resume.experience.map(e => <article key={e.id} className="mb-4"><div className="flex justify-between"><h3 className="text-base font-bold" style={{ color: navy }}>{e.position}</h3><span className="text-xs" style={{ color: muted }}>{e.duration}</span></div><p className="text-sm italic">{e.company}{e.location && `, ${e.location}`}</p>{e.description && <FormattedDescription text={e.description} color={ink} mutedColor={muted} />}</article>)}</Section>}
        {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <article key={edu.id} className="flex justify-between mb-2"><div><h3 className="text-base font-bold" style={{ color: navy }}>{edu.school}</h3><p className="text-sm">{edu.degree}, {edu.field}</p></div><div className="text-right text-xs" style={{ color: muted }}>{edu.year}</div></article>)}</Section>}
        {resume.skills.length > 0 && <Section title="Technical Skills"><div className="grid grid-cols-2 gap-x-6 gap-y-1">{resume.skills.map(s => <div key={s.id} className="flex justify-between text-sm"><span className="font-semibold">{s.name}</span><span style={{ color: muted }}>{s.level}{s.years && ` (${s.years}y)`}</span></div>)}</div></Section>}
        {resume.projects.length > 0 && <Section title="Publications & Projects">{resume.projects.map(p => <article key={p.id} className="mb-3"><h3 className="text-base font-bold" style={{ color: navy }}>{p.name}</h3><p className="text-sm italic" style={{ color: muted }}>{p.role} • {p.tech}</p>{p.description && <FormattedDescription text={p.description} color={ink} mutedColor={muted} />}</article>)}</Section>}
        {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="text-sm mb-1"><b>{c.name}</b>, {c.issuer} ({c.date})</p>)}</Section>}
        {resume.achievements.length > 0 && <Section title="Honors & Awards">{resume.achievements.map((a, i) => <p key={a.id} className="text-sm mb-1">[{i+1}] {a.description}</p>)}</Section>}
        <div className="grid grid-cols-2 gap-6">
          {resume.languages.length > 0 && <Section title="Languages">{resume.languages.map(l => <p key={l.id} className="text-sm"><b>{l.name}</b> ({l.proficiency})</p>)}</Section>}
          {resume.interests.length > 0 && <Section title="Research Interests"><p className="text-sm italic" style={{ color: muted }}>{resume.interests.map(i => i.name).join(", ")}</p></Section>}
        </div>
        {resume.references.length > 0 && <Section title="References"><p className="text-sm italic" style={{ color: muted }}>Available upon request.</p></Section>}
      </div>
    </div>
  );
}
