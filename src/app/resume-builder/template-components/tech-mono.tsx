"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function TechMonoPreview({ resume }: { resume: Resume }) {
  const bg = "#0d1117", fg = "#c9d1d9", green = "#3fb950", accent = "#58a6ff", comment = "#8b949e", orange = "#ffa657";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-5"><p className="text-xs font-bold mb-2" style={{ color: comment }}>{title}</p>{children}</section>;
  return (
    <div className="rounded-lg shadow-2xl overflow-hidden border" style={{ fontFamily: fontFamilies.mono, backgroundColor: bg, color: fg, borderColor: "#30363d" }}>
      <div className="flex items-center gap-1.5 px-4 py-2" style={{ backgroundColor: "#161b22", borderBottom: "1px solid #30363d" }}>
        <span className="w-2.5 h-2.5 rounded-full bg-red-500" /><span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /><span className="w-2.5 h-2.5 rounded-full bg-green-500" /><span className="text-xs ml-2" style={{ color: comment }}>~/resume.sh</span>
      </div>
      <main className="p-6 text-sm leading-relaxed">
        <div className="mb-4">
          <p style={{ color: green }}>$ <span style={{ color: fg }}>cat personal_info.md</span></p>
          <h1 className="text-xl font-bold mt-1" style={{ color: accent }}>{resume.name || "Your Name"}</h1>
          <p style={{ color: comment }}># {resume.title || "Professional Title"}</p>
          <div className="mt-2 text-xs" style={{ color: comment }}>{resume.email && <p># {resume.email}</p>}{resume.phone && <p># {resume.phone}</p>}{resume.address && <p># {resume.address}</p>}</div>
          {resume.social && <div className="mt-1" style={{ color: comment }}><SocialLinks social={resume.social} color={comment} size="xs" /></div>}
        </div>
        <hr className="my-4 border-dashed" style={{ borderColor: "#30363d" }} />
        {resume.summary && <Section title="# summary.md"><FormattedDescription text={resume.summary} color={fg} mutedColor={comment} /></Section>}
        {resume.experience.length > 0 && <Section title="# experience.log">{resume.experience.map(e => <article key={e.id} className="mb-3 pl-3" style={{ borderLeft: `1px dashed ${comment}40` }}><div className="flex justify-between"><span className="font-bold" style={{ color: accent }}>{e.position}</span><span style={{ color: comment }}>#{e.duration}</span></div><p className="text-xs" style={{ color: orange }}>@ {e.company}{e.location && ` (${e.location})`}</p>{e.description && <FormattedDescription text={e.description} color={fg} mutedColor={comment} />}<p className="text-xs" style={{ color: comment }}>{'>'} git log --oneline</p></article>)}</Section>}
        {resume.education.length > 0 && <Section title="# education.yml">{resume.education.map(edu => <p key={edu.id} className="mb-1"><span className="font-bold" style={{ color: accent }}>{edu.school}</span><span className="text-xs ml-1" style={{ color: comment }}>// {edu.degree}{edu.field && `, ${edu.field}`} ({edu.year})</span></p>)}</Section>}
        {resume.skills.length > 0 && <Section title="# skills.json">{resume.skills.map(s => <p key={s.id} className="mb-1"><span style={{ color: orange }}>"{s.name}"</span>: <span style={{ color: green }}>"{s.level}"</span><span style={{ color: comment }}>, // {s.years}y</span></p>)}</Section>}
        {resume.projects.length > 0 && <Section title="# projects/README.md">{resume.projects.map(p => <article key={p.id} className="mb-2"><div className="flex"><span className="font-bold" style={{ color: accent }}>{p.name}</span>{p.tech && <span className="ml-2" style={{ color: comment }}>| {p.tech}</span>}</div>{p.description && <FormattedDescription text={p.description} color={fg} mutedColor={comment} />}</article>)}</Section>}
        <hr className="my-4 border-dashed" style={{ borderColor: "#30363d" }} />
        <div className="grid grid-cols-2 gap-4 text-xs" style={{ color: comment }}>{resume.certifications.length > 0 && <div><p className="font-bold mb-1" style={{ color: green }}>$ certs</p>{resume.certifications.map(c => <p key={c.id}>{'>'} {c.name}</p>)}</div>}{resume.languages.length > 0 && <div><p className="font-bold mb-1" style={{ color: green }}>$ lang</p>{resume.languages.map(l => <p key={l.id}>| {l.name} [{l.proficiency}]</p>)}</div>}{resume.achievements.length > 0 && <div className="col-span-2"><p className="font-bold mb-1" style={{ color: green }}>$ achievements</p>{resume.achievements.map(a => <p key={a.id}>{'>'} {a.description}</p>)}</div>}{resume.interests.length > 0 && <div className="col-span-2"><p className="font-bold mb-1" style={{ color: green }}>$ interests</p><p>{resume.interests.map(i => i.name).join(" | ")}</p></div>}</div>
      </main>
    </div>
  );
}
