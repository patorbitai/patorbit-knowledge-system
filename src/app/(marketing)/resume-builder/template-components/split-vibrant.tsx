"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function SplitVibrantPreview({ resume }: { resume: Resume }) {
  const sBg = "#0f172a", sText = "#cbd5e1", bText = "#1e293b", accent = "#38bdf8";
  return (
    <div className="bg-white text-black rounded-lg shadow overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif" }}>
      <div className="flex min-h-[500px]">
        <div className="w-[220px] shrink-0 p-5 flex flex-col gap-4" style={{ backgroundColor: sBg, color: sText }}>
          <div><h1 className="text-base font-bold text-white leading-tight">{resume.name || "Your Name"}</h1><p className="text-xs mt-0.5" style={{ color: accent }}>{resume.title || "Professional Title"}</p></div>
          <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-white/60">Contact</p><div className="space-y-1 text-xs">{resume.email && <p>✉ {resume.email}</p>}{resume.phone && <p>📞 {resume.phone}</p>}{resume.address && <p>📍 {resume.address}</p>}</div>{resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={sText} size="xs" /></div>}</div>
          {resume.skills.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-white/60">Skills</p>{resume.skills.slice(0, 6).map(s => (<div key={s.id} className="mb-1"><div className="flex justify-between text-xs"><span>{s.name}</span><span className="opacity-60">{s.level}</span></div><div className="h-1 rounded-full mt-0.5" style={{ backgroundColor: "#ffffff20" }}><div className="h-full rounded-full" style={{ width: s.level === "Expert" ? "90%" : s.level === "Advanced" ? "70%" : "50%", backgroundColor: accent }} /></div></div>))}</div>}
          {resume.education.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-white/60">Education</p>{resume.education.slice(0, 1).map(edu => (<div key={edu.id}><p className="text-sm font-medium text-white">{edu.school}</p><p className="text-xs opacity-70">{edu.degree}{edu.year ? ` · ${edu.year}` : ""}</p></div>))}</div>}
          {resume.languages.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5 text-white/60">Languages</p>{resume.languages.slice(0, 3).map(l => (<p key={l.id} className="text-xs">{l.name} - {l.proficiency}</p>))}</div>}
        </div>
        <div className="flex-1 p-5 space-y-4" style={{ color: bText }}>
          {resume.summary && <div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>About</p><FormattedDescription text={resume.summary} color={accent} mutedColor={bText} /></div>}
          {resume.experience.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: accent }}>Experience</p>{resume.experience.slice(0, 3).map(exp => (<div key={exp.id} className="relative pl-4 border-l-2 mb-3" style={{ borderColor: `${accent}40` }}><div className="absolute w-2 h-2 rounded-full -left-[5px] top-1.5" style={{ backgroundColor: accent }} /><div className="flex justify-between"><span className="text-sm font-semibold">{exp.position}</span><span className="text-xs opacity-60">{exp.duration}</span></div><p className="text-xs opacity-70">{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>{exp.description && <FormattedDescription text={exp.description} color={accent} mutedColor={`${bText}99`} />}</div>))}</div>}
          {resume.projects.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Projects</p>{resume.projects.slice(0, 2).map(p => (<div key={p.id} className="mb-1.5"><div className="flex justify-between"><span className="text-sm font-semibold">{p.name}</span>{p.tech && <span className="text-xs opacity-60">{p.tech}</span>}</div>{p.description && <FormattedDescription text={p.description} color={accent} mutedColor={`${bText}99`} size="xs" />}</div>))}</div>}
          {resume.certifications.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Certifications</p>{resume.certifications.slice(0, 2).map(c => (<p key={c.id} className="text-xs mb-0.5"><span className="font-medium">{c.name}</span>{c.issuer && <span className="opacity-60"> — {c.issuer}</span>}</p>))}</div>}
          {resume.interests.length > 0 && <div><p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accent }}>Interests</p><p className="text-xs opacity-70">{resume.interests.slice(0, 5).map(i => i.name).join(" · ")}</p></div>}
        </div>
      </div>
    </div>
  );
}