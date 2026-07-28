"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function ExecutivePreview({ resume }: { resume: Resume }) {
  const bannerBg = "#111827", primary = "#f59e0b", text = "#1f2937", muted = "#6b7280";
  return (
    <div className="bg-white text-black rounded-lg shadow" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <div className="px-6 pt-7 pb-5" style={{ backgroundColor: bannerBg }}>
        <h1 className="text-2xl font-bold text-white tracking-wide">{resume.name || "Your Name"}</h1>
        <p className="text-base mt-1 font-medium" style={{ color: primary }}>{resume.title || "Professional Title"}</p>
        <div className="flex flex-wrap gap-x-3 mt-2 text-xs" style={{ color: "#9ca3af" }}>
          {resume.email && <span>✉ {resume.email}</span>}{resume.phone && <span>📞 {resume.phone}</span>}{resume.address && <span>📍 {resume.address}</span>}
        </div>
        {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color="#9ca3af" size="xs" /></div>}
      </div>
      <div className="p-6 space-y-5 text-sm">
        {resume.summary && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Profile</h2><div className="w-8 h-0.5 mb-2" style={{ backgroundColor: primary }} /><FormattedDescription text={resume.summary} color={primary} mutedColor={muted} /></div>}
        {resume.experience.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Experience</h2><div className="w-8 h-0.5 mb-2" style={{ backgroundColor: primary }} />{resume.experience.slice(0, 3).map(exp => (<div key={exp.id} className="mb-2"><div className="flex justify-between"><span className="text-base font-semibold" style={{ color: text }}>{exp.position}</span><span className="text-xs italic" style={{ color: muted }}>{exp.duration}</span></div><p className="text-sm italic" style={{ color: muted }}>{exp.company}{exp.location && ` — ${exp.location}`}</p>{exp.description && <FormattedDescription text={exp.description} color={primary} mutedColor={muted} />}</div>))}</div>}
        {resume.education.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Education</h2><div className="w-8 h-0.5 mb-2" style={{ backgroundColor: primary }} />{resume.education.slice(0, 2).map(edu => (<div key={edu.id} className="flex justify-between mb-1"><span className="text-sm font-semibold" style={{ color: text }}>{edu.school}</span><span className="text-xs italic" style={{ color: muted }}>{edu.degree}{edu.field ? `, ${edu.field}` : ""}</span></div>))}</div>}
        {resume.skills.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Core Competencies</h2><div className="w-8 h-0.5 mb-2" style={{ backgroundColor: primary }} /><div className="flex flex-wrap gap-2">{resume.skills.slice(0, 8).map(s => (<span key={s.id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${primary}15`, color: text }}>{s.name}{s.level && s.level !== "Intermediate" && <span className="ml-1 opacity-60">({s.level})</span>}</span>))}</div></div>}
        {resume.projects.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Projects</h2><div className="w-8 h-0.5 mb-2" style={{ backgroundColor: primary }} />{resume.projects.slice(0, 3).map(p => (<div key={p.id} className="mb-1"><span className="text-sm font-semibold" style={{ color: text }}>{p.name}</span>{p.tech && <span className="text-xs ml-1" style={{ color: muted }}>| {p.tech}</span>}{p.description && <FormattedDescription text={p.description} color={primary} mutedColor={muted} />}</div>))}</div>}
        {resume.certifications.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Certifications</h2><div className="w-8 h-0.5 mb-2" style={{ backgroundColor: primary }} />{resume.certifications.slice(0, 2).map(c => (<p key={c.id} className="text-sm" style={{ color: text }}>{c.name}{c.issuer && <span className="text-xs ml-1" style={{ color: muted }}>— {c.issuer}</span>}</p>))}</div>}
        {resume.languages.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Languages</h2><div className="flex flex-wrap gap-2">{resume.languages.slice(0, 4).map(l => (<span key={l.id} className="text-xs" style={{ color: text }}>{l.name}{l.proficiency && <span className="ml-1" style={{ color: muted }}>({l.proficiency})</span>}</span>))}</div></div>}
        {resume.interests.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Interests</h2><p className="text-xs" style={{ color: muted }}>{resume.interests.slice(0, 5).map(i => i.name).join(" · ")}</p></div>}
        {resume.achievements.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>Achievements</h2>{resume.achievements.slice(0, 3).map(a => <p key={a.id} className="text-xs mb-0.5" style={{ color: text }}>🏆 {a.description}</p>)}</div>}
        {resume.references.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: primary }}>References</h2>{resume.references.slice(0, 2).map(r => (<p key={r.id} className="text-xs" style={{ color: muted }}>{r.name}{r.position && ` — ${r.position}`}{r.company && ` at ${r.company}`}</p>))}</div>}
      </div>
    </div>
  );
}