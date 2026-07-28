"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function StartupVibePreview({ resume }: { resume: Resume }) {
  const p = "#047857", sBg = "#022c22", sText = "#a7f3d0", accent = "#10b981", bodyT = "#064e3b";
  return (
    <div className="bg-white text-black rounded-lg shadow overflow-hidden" style={{ fontFamily: "'Poppins', 'Segoe UI', sans-serif" }}>
      <div className="flex min-h-[500px]">
        <div className="flex-1 p-5 space-y-4">
          <div className="pb-3" style={{ borderBottom: `2px solid ${accent}30` }}>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: bodyT }}>{resume.name || "Your Name"}</h1>
            <p className="text-sm font-medium mt-0.5" style={{ color: p }}>🚀 {resume.title || "Professional Title"}</p>
            <div className="flex flex-wrap gap-x-3 mt-1.5 text-xs" style={{ color: p }}>{resume.email && <span>✉ {resume.email}</span>}{resume.phone && <span>📞 {resume.phone}</span>}{resume.address && <span>📍 {resume.address}</span>}</div>
            {resume.social && <div className="mt-1"><SocialLinks social={resume.social} color={p} size="xs" /></div>}
          </div>
          {resume.summary && <FormattedDescription text={resume.summary} color={bodyT} mutedColor={p} size="sm" />}
          {resume.experience.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: p }}>Hustle History</p>{resume.experience.slice(0, 3).map(e => (<div key={e.id} className="mb-2"><div className="flex justify-between"><span className="text-sm font-bold" style={{ color: bodyT }}>{e.position}</span><span className="text-xs" style={{ color: p }}>{e.duration}</span></div><p className="text-xs" style={{ color: p }}>{e.company} · {e.location}</p>{e.description && <FormattedDescription text={e.description} color={bodyT} mutedColor={p} />}</div>))}</div>}
          {resume.education.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: p }}>Education</p>{resume.education.slice(0, 2).map(e => (<div key={e.id} className="flex justify-between"><span className="text-sm" style={{ color: bodyT }}>{e.school}</span><span className="text-xs" style={{ color: p }}>{e.degree}{e.year ? ` · ${e.year}` : ""}</span></div>))}</div>}
          {resume.projects.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: p }}>Side Projects</p>{resume.projects.slice(0, 2).map(proj => (<div key={proj.id} className="mb-1"><span className="text-sm font-bold" style={{ color: bodyT }}>{proj.name}</span>{proj.tech && <span className="text-xs ml-1" style={{ color: p }}>| {proj.tech}</span>}{proj.description && <FormattedDescription text={proj.description} color={bodyT} mutedColor={p} />}</div>))}</div>}
        </div>
        <div className="w-[160px] shrink-0 p-4 flex flex-col gap-3" style={{ backgroundColor: sBg, color: sText }}>
          <div className="text-center mb-2"><div className="w-12 h-12 rounded-2xl mx-auto mb-1 flex items-center justify-center text-xl" style={{ backgroundColor: `${accent}30` }}>🚀</div></div>
          {resume.skills.length > 0 && <div><p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Stack</p>{resume.skills.slice(0, 6).map(s => (<div key={s.id} className="flex gap-1"><span className="text-xs font-medium">{s.name}</span>{s.level && <span className="text-[10px] opacity-60">{s.level}</span>}</div>))}</div>}
          {resume.certifications.length > 0 && <div><p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Badges</p>{resume.certifications.slice(0, 2).map(c => (<p key={c.id} className="text-xs">🏅 {c.name}</p>))}</div>}
          {resume.languages.length > 0 && <div><p className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-60">Languages</p>{resume.languages.slice(0, 3).map(l => (<p key={l.id} className="text-xs">{l.name}</p>))}</div>}
        </div>
      </div>
    </div>
  );
}