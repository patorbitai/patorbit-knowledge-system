"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function ClassicSerifPreview({ resume }: { resume: Resume }) {
  const p = "#1e3a8a", t = "#1f2937", m = "#6b7280", b = "#d1d5db";
  return (
    <div className="bg-white text-black rounded-lg shadow overflow-hidden" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
      <div className="p-8 space-y-5">
        <div className="text-center pb-4" style={{ borderBottom: `1px solid ${b}` }}>
          <h1 className="text-3xl font-bold tracking-wide" style={{ color: p }}>{resume.name || "Your Name"}</h1>
          <p className="text-base italic mt-1" style={{ color: m }}>{resume.title || "Professional Title"}</p>
          <div className="flex flex-wrap justify-center gap-x-4 mt-2 text-sm" style={{ color: m }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
          {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={m} size="xs" /></div>}
        </div>
        {resume.summary && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Summary</p><div className="pl-4 italic leading-relaxed" style={{ borderLeft: `2px solid ${p}30`, color: t }}><FormattedDescription text={resume.summary} color={p} mutedColor={t} /></div></div>}
        {resume.experience.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Professional Experience</p>{resume.experience.slice(0, 3).map(exp => (<div key={exp.id} className="mb-2"><div className="flex justify-between items-baseline"><span className="text-base font-semibold" style={{ color: t }}>{exp.position}</span><span className="text-xs italic" style={{ color: m }}>{exp.duration}</span></div><p className="text-sm italic" style={{ color: m }}>{exp.company}{exp.location ? ` — ${exp.location}` : ""}</p>{exp.description && <FormattedDescription text={exp.description} color={p} mutedColor={m} />}</div>))}</div>}
        {resume.education.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Education</p>{resume.education.slice(0, 2).map(edu => (<div key={edu.id} className="mb-1"><span className="text-base font-semibold" style={{ color: t }}>{edu.school}</span><span className="text-sm ml-2" style={{ color: m }}>— {edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.year ? ` (${edu.year})` : ""}</span></div>))}</div>}
        {resume.skills.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Areas of Expertise</p><div className="flex flex-wrap gap-x-4 gap-y-1">{resume.skills.slice(0, 10).map(s => (<span key={s.id} className="text-sm" style={{ color: t }}>{s.name}{s.category && <span className="text-xs ml-1" style={{ color: m }}>({s.category})</span>}{s.level && s.level !== "Intermediate" && <span className="text-xs ml-1" style={{ color: m }}>· {s.level}</span>}{s.years && <span className="text-xs ml-1" style={{ color: m }}>· {s.years}y</span>}</span>))}</div></div>}
        {resume.projects.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Selected Projects</p>{resume.projects.slice(0, 3).map(proj => (<div key={proj.id} className="mb-2"><span className="text-base font-semibold" style={{ color: t }}>{proj.name}</span><span className="text-sm ml-2" style={{ color: m }}>— {proj.tech}</span>{proj.description && <FormattedDescription text={proj.description} color={p} mutedColor={m} />}</div>))}</div>}
        {resume.certifications.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Certifications</p>{resume.certifications.slice(0, 2).map(c => (<p key={c.id} className="text-sm" style={{ color: t }}><span className="font-semibold">{c.name}</span>{c.issuer && <span className="text-sm ml-1" style={{ color: m }}>— {c.issuer}</span>}</p>))}</div>}
        {resume.languages.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Languages</p><div className="flex gap-3">{resume.languages.slice(0, 4).map(l => (<span key={l.id} className="text-sm" style={{ color: t }}>{l.name}<span className="text-xs ml-1" style={{ color: m }}>({l.proficiency})</span></span>))}</div></div>}
        {resume.interests.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Interests</p><p className="text-sm italic" style={{ color: m }}>{resume.interests.slice(0, 5).map(i => i.name).join(", ")}</p></div>}
        {resume.achievements.length > 0 && <div><p className="text-xs font-bold uppercase tracking-[0.15em] mb-2" style={{ color: p }}>Achievements</p>{resume.achievements.slice(0, 3).map(a => <p key={a.id} className="text-sm" style={{ color: t }}>— {a.description}</p>)}</div>}
      </div>
    </div>
  );
}