"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function TimelineProPreview({ resume }: { resume: Resume }) {
  const p = "#0d9488", t = "#1f2937", m = "#6b7280";
  return (
    <div className="bg-white text-black rounded-lg shadow overflow-hidden" style={{ fontFamily: "'Lato', 'Helvetica Neue', sans-serif" }}>
      <div className="p-6 space-y-5">
        <div className="text-center pb-3" style={{ borderBottom: `2px solid ${p}` }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: t }}>{resume.name || "Your Name"}</h1>
          <p className="text-sm font-medium mt-0.5" style={{ color: p }}>{resume.title || "Professional Title"}</p>
          <div className="flex flex-wrap justify-center gap-x-3 mt-1 text-xs" style={{ color: m }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
          {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={m} size="xs" /></div>}
        </div>
        {resume.summary && <div className="pl-3 italic" style={{ borderLeft: `3px solid ${p}` }}><FormattedDescription text={resume.summary} color={t} mutedColor={m} size="sm" /></div>}
        {resume.experience.length > 0 && <div className="relative ml-2 space-y-4">{resume.experience.slice(0, 3).map((exp, idx) => (<div key={exp.id} className="relative pl-6"><div className="absolute left-0 top-0 w-3 h-3 rounded-full border-2" style={{ borderColor: p, backgroundColor: idx === 0 ? p : "white" }} /><div className="absolute left-[5px] top-3 w-0.5 h-[calc(100%+8px)]" style={{ backgroundColor: `${p}30` }} /><div className="flex justify-between"><span className="text-sm font-bold" style={{ color: t }}>{exp.position}</span><span className="text-xs" style={{ color: m }}>{exp.duration}</span></div><p className="text-xs font-medium" style={{ color: p }}>{exp.company}</p>{exp.description && <FormattedDescription text={exp.description} color={p} mutedColor={m} />}</div>))}</div>}
        {resume.education.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: p }}>Education</p>{resume.education.slice(0, 2).map(e => (<div key={e.id} className="flex justify-between mb-1"><span className="text-sm font-semibold" style={{ color: t }}>{e.school}</span><span className="text-xs" style={{ color: m }}>{e.degree}{e.field ? `, ${e.field}` : ""}{e.year ? ` · ${e.year}` : ""}</span></div>))}</div>}
        {resume.skills.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: p }}>Skills</p><div className="flex flex-wrap gap-2">{resume.skills.slice(0, 8).map(s => (<span key={s.id} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: `${p}10`, color: p }}>{s.name}</span>))}</div></div>}
        {resume.projects.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: p }}>Projects</p>{resume.projects.slice(0, 2).map(proj => (<div key={proj.id} className="mb-1"><div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: t }}>{proj.name}</span><span className="text-xs" style={{ color: m }}>{proj.tech}</span></div>{proj.description && <FormattedDescription text={proj.description} color={p} mutedColor={m} />}</div>))}</div>}
        {resume.languages.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: p }}>Languages</p><p className="text-xs" style={{ color: m }}>{resume.languages.slice(0, 4).map(l => `${l.name} (${l.proficiency})`).join(" · ")}</p></div>}
      </div>
    </div>
  );
}