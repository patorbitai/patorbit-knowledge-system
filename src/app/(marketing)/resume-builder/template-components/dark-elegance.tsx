"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function DarkElegancePreview({ resume }: { resume: Resume }) {
  const bg = "#0f172a", accent = "#60a5fa", text = "#f3f4f6", muted = "#9ca3af";
  return (
    <div className="rounded-lg shadow overflow-hidden" style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", backgroundColor: bg }}>
      <div className="px-6 pt-8 pb-6 text-center" style={{ backgroundColor: "#111827" }}>
        <h1 className="text-2xl font-bold text-white tracking-wide">{resume.name || "Your Name"}</h1>
        <p className="text-sm mt-1 font-medium" style={{ color: accent }}>{resume.title || "Professional Title"}</p>
        <div className="flex flex-wrap justify-center gap-x-4 mt-3 text-xs" style={{ color: muted }}>{resume.email && <span>✉ {resume.email}</span>}{resume.phone && <span>📞 {resume.phone}</span>}{resume.address && <span>📍 {resume.address}</span>}</div>
        {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={muted} size="xs" /></div>}
      </div>
      <div className="p-6 space-y-5 text-sm" style={{ color: text }}>
        {resume.summary && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Profile</h2><FormattedDescription text={resume.summary} color={accent} mutedColor={muted} /></div>}
        {resume.experience.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Experience</h2>{resume.experience.slice(0, 3).map(e => (<div key={e.id} className="p-3 rounded-lg mb-2" style={{ backgroundColor: "#1e293b" }}><div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: text }}>{e.position}</span><span className="text-xs" style={{ color: muted }}>{e.duration}</span></div><p className="text-xs" style={{ color: accent }}>{e.company}{e.location ? ` · ${e.location}` : ""}</p>{e.description && <FormattedDescription text={e.description} color={accent} mutedColor={muted} />}</div>))}</div>}
        {resume.education.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Education</h2>{resume.education.slice(0, 2).map(e => (<div key={e.id} className="flex justify-between mb-1"><span className="text-sm" style={{ color: text }}>{e.school}</span><span className="text-xs" style={{ color: muted }}>{e.degree}{e.year ? ` · ${e.year}` : ""}</span></div>))}</div>}
        {resume.skills.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Skills</h2><div className="flex flex-wrap gap-2">{resume.skills.slice(0, 8).map(s => (<span key={s.id} className="text-xs px-2.5 py-1 rounded-md" style={{ backgroundColor: "#1e293b", color: muted }}>{s.name}</span>))}</div></div>}
        {resume.projects.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Projects</h2>{resume.projects.slice(0, 2).map(p => (<div key={p.id} className="p-3 rounded-lg mb-1" style={{ backgroundColor: "#1e293b" }}><div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: text }}>{p.name}</span><span className="text-xs" style={{ color: muted }}>{p.tech}</span></div>{p.description && <FormattedDescription text={p.description} color={accent} mutedColor={muted} />}</div>))}</div>}
        {resume.languages.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Languages</h2><p className="text-xs" style={{ color: muted }}>{resume.languages.slice(0, 4).map(l => `${l.name} (${l.proficiency})`).join(", ")}</p></div>}
        {resume.achievements.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: accent }}>Achievements</h2>{resume.achievements.slice(0, 3).map(a => <p key={a.id} className="text-xs mb-0.5">✦ {a.description}</p>)}</div>}
      </div>
    </div>
  );
}