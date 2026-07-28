"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function BannerBoldPreview({ resume }: { resume: Resume }) {
  const banner = "#b91c1c", light = "#fca5a5", txt = "#1f2937", m = "#6b7280";
  return <div className="bg-white text-black rounded-lg shadow-2xl overflow-hidden" style={{ fontFamily: "'Montserrat', 'Arial', sans-serif" }}>
    <div className="px-6 pt-8 pb-6 text-center" style={{ backgroundColor: banner }}>
      <h1 className="text-3xl font-black text-white uppercase tracking-tight">{resume.name || "Your Name"}</h1>
      <p className="text-base font-medium mt-1" style={{ color: light }}>{resume.title || "Professional Title"}</p>
      <div className="flex flex-wrap justify-center gap-x-4 mt-3 text-sm" style={{ color: "#fecaca" }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
      {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color="#fecaca" size="xs" /></div>}
    </div>
    <div className="p-6 space-y-5 text-sm">
      {resume.summary && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Profile</h2><FormattedDescription text={resume.summary} color={banner} mutedColor={m} /></div>}
      {resume.experience.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Experience</h2>{resume.experience.map(e => <div key={e.id} className="flex gap-3 mb-2"><div className="w-1 shrink-0 rounded" style={{ backgroundColor: `${banner}30` }} /><div><div className="flex justify-between"><span className="text-sm font-bold" style={{ color: txt }}>{e.position}</span><span className="text-xs" style={{ color: m }}>{e.duration}</span></div><p className="text-xs font-medium" style={{ color: banner }}>{e.company}</p>{e.description && <FormattedDescription text={e.description} color={banner} mutedColor={m} />}</div></div>)}</div>}
      {resume.education.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Education</h2>{resume.education.map(e => <div key={e.id} className="flex justify-between mb-1"><span className="text-sm font-semibold" style={{ color: txt }}>{e.school}</span><span className="text-xs" style={{ color: m }}>{e.degree}{e.field ? `, ${e.field}` : ""}{e.year ? ` (${e.year})` : ""}</span></div>)}</div>}
      {resume.skills.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Skills</h2><div className="grid grid-cols-2 gap-2">{resume.skills.map(s => <div key={s.id}><p className="text-xs font-semibold" style={{ color: txt }}>{s.name}</p><div className="h-1.5 rounded-full mt-0.5" style={{ backgroundColor: "#e5e7eb" }}><div className="h-full rounded-full" style={{ width: s.level === "Expert" ? "100%" : s.level === "Advanced" ? "75%" : "50%", backgroundColor: banner }} /></div></div>)}</div></div>}
      {resume.projects.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Projects</h2>{resume.projects.map(p => <div key={p.id} className="mb-1"><div className="flex justify-between"><span className="text-sm font-semibold" style={{ color: txt }}>{p.name}</span><span className="text-xs" style={{ color: m }}>{p.tech}</span></div>{p.description && <FormattedDescription text={p.description} color={banner} mutedColor={m} />}</div>)}</div>}
      {resume.certifications.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Certifications</h2><div className="flex flex-wrap gap-2">{resume.certifications.map(c => <span key={c.id} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${banner}10`, color: banner }}>{c.name}{c.issuer && ` · ${c.issuer}`}</span>)}</div></div>}
      {resume.languages.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Languages</h2><p className="text-xs" style={{ color: m }}>{resume.languages.map(l => `${l.name} (${l.proficiency})`).join(", ")}</p></div>}
      {resume.achievements.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Achievements</h2>{resume.achievements.map(a => <p key={a.id} className="text-xs mb-1">🏆 {a.description}</p>)}</div>}
      {resume.interests.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>Interests</h2><p className="text-xs" style={{ color: m }}>{resume.interests.map(i => i.name).join(", ")}</p></div>}
      {resume.references.length > 0 && <div><h2 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: banner }}>References</h2>{resume.references.map(r => <p key={r.id} className="text-xs mb-1">{r.name}{r.position && ` — ${r.position}`}{r.company && ` at ${r.company}`}</p>)}</div>}
    </div>
  </div>;
}
