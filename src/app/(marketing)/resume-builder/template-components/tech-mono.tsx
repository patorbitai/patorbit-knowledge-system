"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function TechMonoPreview({ resume }: { resume: Resume }) {
  const p = "#047857", t = "#064e3b", m = "#6b7280";
  return (
    <div className="bg-white text-black rounded-lg shadow overflow-hidden" style={{ fontFamily: "'SF Mono', 'Menlo', 'Consolas', monospace" }}>
      <div className="p-6 space-y-4">
        <div className="pb-3 mb-2" style={{ borderBottom: `2px solid ${p}` }}>
          <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full bg-red-400" /><div className="w-2 h-2 rounded-full bg-yellow-400" /><div className="w-2 h-2 rounded-full bg-green-400" /><span className="text-[10px] ml-2 opacity-50" style={{ color: m }}>~/$</span></div>
          <h1 className="text-lg font-bold tracking-tight" style={{ color: t }}>{resume.name || "Your Name"}</h1>
          <p className="text-sm mt-0.5" style={{ color: p }}>$ <span className="text-black/70">{resume.title || "Professional Title"}</span></p>
          <div className="flex flex-wrap gap-x-3 text-xs mt-1.5" style={{ color: m }}>{resume.email && <span>✉ {resume.email}</span>}{resume.phone && <span>📞 {resume.phone}</span>}{resume.address && <span>📍 {resume.address}</span>}</div>
          {resume.social && <div className="mt-1"><SocialLinks social={resume.social} color={m} size="xs" /></div>}
        </div>
        {resume.summary && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// summary</p><FormattedDescription text={resume.summary} color={p} mutedColor={t} /></div>}
        {resume.experience.length > 0 && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// experience</p>{resume.experience.slice(0, 3).map(exp => (<div key={exp.id} className="pl-3 mb-2" style={{ borderLeft: `1px dashed ${p}40` }}><div className="flex justify-between items-baseline"><span className="text-sm font-bold" style={{ color: t }}>{exp.position}</span><span className="text-xs" style={{ color: m }}>{exp.duration}</span></div><p className="text-xs" style={{ color: m }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>{exp.description && <FormattedDescription text={exp.description} color={p} mutedColor={m} />}</div>))}</div>}
        {resume.education.length > 0 && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// education</p>{resume.education.slice(0, 2).map(edu => (<div key={edu.id} className="flex justify-between mb-1"><span className="text-sm" style={{ color: t }}>{edu.school}</span><span className="text-xs" style={{ color: m }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}{edu.year ? ` (${edu.year})` : ""}</span></div>))}</div>}
        {resume.skills.length > 0 && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// skills</p><div className="grid grid-cols-2 gap-1">{resume.skills.slice(0, 8).map(s => (<div key={s.id} className="text-xs" style={{ color: t }}><span className="font-bold">{s.name}</span>{s.level && <span className="ml-1" style={{ color: m }}>[{s.level}]</span>}{s.years && <span className="ml-1" style={{ color: m }}>({s.years}y)</span>}</div>))}</div></div>}
        {resume.projects.length > 0 && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// projects</p>{resume.projects.slice(0, 2).map(proj => (<div key={proj.id} className="mb-1"><span className="text-sm font-bold" style={{ color: t }}>{proj.name}</span>{proj.tech && <span className="text-xs ml-1" style={{ color: m }}>| {proj.tech}</span>}{proj.description && <FormattedDescription text={proj.description} color={p} mutedColor={m} />}</div>))}</div>}
        {resume.certifications.length > 0 && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// certifications</p>{resume.certifications.slice(0, 2).map(c => (<p key={c.id} className="text-xs" style={{ color: t }}>{c.name}{c.issuer && <span className="ml-1" style={{ color: m }}>— {c.issuer}</span>}</p>))}</div>}
        {resume.languages.length > 0 && <div><p className="text-xs font-bold mb-1" style={{ color: p }}>// languages</p><p className="text-xs" style={{ color: m }}>{resume.languages.slice(0, 4).map(l => `${l.name} (${l.proficiency})`).join(", ")}</p></div>}
      </div>
    </div>);
}