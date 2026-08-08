"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function ExecutivePreview({ resume }: { resume: Resume }) {
  const bannerBg = "#111827", primary = "#c9b068", text = "#1f2937", muted = "#6b7280";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-6"><h2 className="text-sm font-bold uppercase tracking-widest mb-2 border-b-2 pb-1" style={{ color: primary, borderColor: primary }}>{title}</h2>{children}</section>;
  return (
    <div className="bg-white text-black rounded-lg shadow-2xl" style={{ fontFamily: fontFamilies.garamond }}>
      <header className="px-8 py-6 text-center" style={{ backgroundColor: bannerBg, borderBottom: `4px solid ${primary}` }}>
        <h1 className="text-4xl font-black text-white tracking-wider">{resume.name || "Your Name"}</h1>
        <p className="mt-2 text-lg font-medium" style={{ color: "#e5e7eb" }}>{resume.title || "Professional Title"}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-5 text-sm" style={{ color: "#d1d5db" }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
        {resume.social && <div className="mt-3"><SocialLinks social={resume.social} color="#d1d5db" size="sm" /></div>}
      </header>
      <main className="p-8 text-sm leading-relaxed">
        {resume.summary && <Section title="Executive Summary"><FormattedDescription text={resume.summary} color={text} mutedColor={muted} size="sm" /></Section>}
        {resume.experience.length > 0 && <Section title="Professional Experience">{resume.experience.map(exp => <article key={exp.id} className="mb-5"><div className="flex justify-between items-baseline gap-3"><h3 className="text-lg font-bold" style={{ color: text }}>{exp.position}</h3><span className="shrink-0 text-xs font-medium" style={{ color: muted }}>{exp.duration}</span></div><p className="text-base italic" style={{ color: primary }}>{exp.company}{exp.location && `, ${exp.location}`}</p>{exp.description && <div className="mt-1"><FormattedDescription text={exp.description} color={text} mutedColor={muted} /></div>}</article>)}</Section>}
        <div className="grid grid-cols-5 gap-8">
          <div className="col-span-3">
            {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <article key={edu.id} className="mb-3"><h3 className="text-base font-bold" style={{ color: text }}>{edu.school}</h3><p className="text-sm italic" style={{ color: muted }}>{edu.degree}{edu.field && `, ${edu.field}`} ({edu.year})</p></article>)}</Section>}
            {resume.projects.length > 0 && <Section title="Key Projects">{resume.projects.map(p => <article key={p.id} className="mb-3"><h3 className="text-base font-bold" style={{ color: text }}>{p.name}</h3>{p.role && <p className="text-sm italic" style={{ color: primary }}>{p.role}</p>}{p.description && <FormattedDescription text={p.description} color={text} mutedColor={muted} />}</article>)}</Section>}
          </div>
          <div className="col-span-2">
            {resume.skills.length > 0 && <Section title="Core Skills">{resume.skills.map(skill => <p key={skill.id} className="mb-1 text-sm">∙ {skill.name}</p>)}</Section>}
            {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="text-sm mb-1">{c.name}</p>)}</Section>}
            {resume.languages.length > 0 && <Section title="Languages">{resume.languages.map(l => <p key={l.id} className="text-sm">{l.name} <span style={{ color: muted }}>({l.proficiency})</span></p>)}</Section>}
          </div>
        </div>
      </main>
    </div>
  );
}
