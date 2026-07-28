"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function LuxuryGoldPreview({ resume }: { resume: Resume }) {
  const banner = "#1c1917", gold = "#d97706", light = "#fbbf24", body = "#fffbeb", text = "#292524", muted = "#78716c";
  return (
    <div className="rounded-lg shadow-2xl" style={{ fontFamily: "'Fraunces', serif", backgroundColor: body, color: text }}>
      <header className="p-8 text-center" style={{ backgroundColor: banner, color: "white" }}>
        <h1 className="text-4xl font-black tracking-wider">{resume.name || "Your Name"}</h1>
        <p className="mt-2 text-lg font-medium" style={{ color: light }}>{resume.title || "Professional Title"}</p>
        <div className="mt-4 flex justify-center gap-x-6 text-sm" style={{ color: "#e7e5e4" }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
        {resume.social && <div className="mt-3 flex justify-center"><SocialLinks social={resume.social} color="#e7e5e4" size="sm" /></div>}
        <div className="w-1/2 h-px mx-auto mt-6" style={{ background: `linear-gradient(to right, transparent, ${gold}, transparent)` }} />
      </header>
      <main className="grid grid-cols-3 gap-8 p-8 text-sm">
        <div className="col-span-2 space-y-6">
          {resume.summary && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Profile</h2><FormattedDescription text={resume.summary} color={text} mutedColor={muted} /></div>}
          {resume.experience.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Experience</h2>{resume.experience.map(e => <article key={e.id} className="mb-4"><h3 className="text-base font-bold">{e.position}</h3><p className="font-semibold" style={{ color: gold }}>{e.company}{e.location && ` | ${e.location}`}</p><p className="text-xs" style={{ color: muted }}>{e.duration}</p>{e.description && <FormattedDescription text={e.description} color={text} mutedColor={muted} />}</article>)}</div>}
          {resume.projects.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Projects</h2>{resume.projects.map(p => <article key={p.id} className="mb-3"><h3 className="text-base font-bold">{p.name}</h3><p className="text-sm font-semibold" style={{ color: gold }}>{p.role}</p>{p.description && <FormattedDescription text={p.description} color={text} mutedColor={muted} />}</article>)}</div>}
        </div>
        <div className="col-span-1 space-y-6">
          {resume.education.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Education</h2>{resume.education.map(edu => <article key={edu.id}><h3 className="text-base font-bold">{edu.school}</h3><p className="text-sm" style={{ color: muted }}>{edu.degree}</p><p className="text-xs" style={{ color: muted }}>{edu.year}</p></article>)}</div>}
          {resume.skills.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Skills</h2><ul className="list-disc list-inside" style={{ color: gold }}>{resume.skills.map(s => <li key={s.id}><span style={{ color: text }}>{s.name}</span></li>)}</ul></div>}
          {resume.certifications.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Certifications</h2>{resume.certifications.map(c => <p key={c.id} className="text-sm mb-1">{c.name}</p>)}</div>}
          {resume.languages.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Languages</h2>{resume.languages.map(l => <p key={l.id} className="text-sm">{l.name} <span style={{ color: muted }}>({l.proficiency})</span></p>)}</div>}
          {resume.achievements.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Awards</h2>{resume.achievements.map(a => <p key={a.id} className="text-sm mb-1">⭐ {a.description}</p>)}</div>}
          {resume.interests.length > 0 && <div><h2 className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: gold }}>Interests</h2><p className="text-sm" style={{ color: muted }}>{resume.interests.map(i => i.name).join(", ")}</p></div>}
        </div>
      </main>
    </div>
  );
}
