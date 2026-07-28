"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function SidebarElegancePreview({ resume }: { resume: Resume }) {
  const rose = "#881337", roseLight = "#fb7185", ink = "#1c1917", muted = "#78716c";
  const initial = (resume.name || "Your Name").split(" ").map(s => s.charAt(0)).join("").toUpperCase().slice(0, 2);
  const SideSection = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-4"><h2 className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: roseLight }}>{title}</h2>{children}</section>;
  const MainSection = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-5"><div className="mb-2 flex items-center gap-2"><span className="inline-block h-px w-4" style={{ backgroundColor: roseLight }} /><h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: rose }}>{title}</h2></div>{children}</section>;
  return <div className="overflow-hidden rounded-lg bg-white shadow-2xl" style={{ fontFamily: "Lato, 'Segoe UI', sans-serif", color: ink }}>
    <div className="flex min-h-[500px]">
      <div className="flex-1 p-6 text-xs">
        <header className="mb-5 border-b pb-4" style={{ borderColor: `${rose}30` }}>
          <h1 className="text-xl font-black tracking-tight" style={{ color: rose }}>{resume.name || "Your Name"}</h1>
          <p className="mt-0.5 text-sm font-medium" style={{ color: muted }}>{resume.title || "Professional Title"}</p>
          {resume.summary && <div className="mt-3"><FormattedDescription text={resume.summary} color={rose} mutedColor={ink} size="sm" /></div>}
        </header>
        {resume.experience.length > 0 && <MainSection title="Experience">{resume.experience.map(e => <article key={e.id} className="mb-4 last:mb-0"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold" style={{ color: rose }}>{e.position}</h3><p className="font-medium">{e.company}{e.location && ` · ${e.location}`}</p></div><span className="shrink-0 text-[10px]" style={{ color: muted }}>{e.duration}</span></div>{e.description && <FormattedDescription text={e.description} color={rose} mutedColor={ink} />}{e.achievements && <FormattedDescription text={e.achievements} color={roseLight} mutedColor={ink} />}</article>)}</MainSection>}
        {resume.education.length > 0 && <MainSection title="Education">{resume.education.map(edu => <article key={edu.id} className="mb-2 last:mb-0"><div className="flex justify-between"><h3 className="font-bold" style={{ color: rose }}>{edu.school}</h3><span className="text-[10px]" style={{ color: muted }}>{edu.year}</span></div><p>{edu.degree}{edu.field && ` · ${edu.field}`}{edu.gpa && ` · GPA ${edu.gpa}`}</p></article>)}</MainSection>}
        {resume.projects.length > 0 && <MainSection title="Projects">{resume.projects.map(p => <article key={p.id} className="mb-2 last:mb-0"><div className="flex justify-between gap-2"><h3 className="text-sm font-bold" style={{ color: rose }}>{p.name}</h3>{p.status && <span className="text-[9px]" style={{ color: muted }}>{p.status}</span>}</div>{p.role && <p className="text-[10px]">{p.role}</p>}{p.description && <FormattedDescription text={p.description} color={rose} mutedColor={ink} />}{p.tech && <p className="mt-1 text-[10px]" style={{ color: muted }}>{p.tech}</p>}</article>)}</MainSection>}
        {resume.achievements.length > 0 && <MainSection title="Achievements">{resume.achievements.map(a => <p key={a.id} className="mb-1">✦ {a.description}</p>)}</MainSection>}
        {resume.references.length > 0 && <MainSection title="References">{resume.references.map(r => <p key={r.id} className="mb-1"><b>{r.name}</b>{r.position && ` — ${r.position}`}{r.company && ` at ${r.company}`}</p>)}</MainSection>}
      </div>
      <div className="w-[220px] shrink-0 p-5 text-xs leading-relaxed text-white" style={{ backgroundColor: rose }}>
        <div className="mb-5 flex flex-col items-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/60 bg-white/20 text-lg font-black">{initial}</div>
          <h1 className="text-center text-sm font-bold">{resume.name || "Your Name"}</h1>
          <p className="text-center text-xs opacity-70">{resume.title || "Professional Title"}</p>
        </div>
        <div className="space-y-4">
          <SideSection title="Contact"><div className="space-y-1 text-[10px]">{resume.email && <p>{resume.email}</p>}{resume.phone && <p>{resume.phone}</p>}{resume.address && <p>{resume.address}</p>}</div>{resume.social && <div className="mt-2"><SocialLinks social={resume.social} color="#fda4af" size="xs" /></div>}</SideSection>
          {resume.skills.length > 0 && <SideSection title="Skills">{resume.skills.map(s => <div key={s.id} className="mb-2"><div className="flex justify-between text-[10px]"><span>{s.name}</span><span className="opacity-60">{s.level}</span></div><div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full" style={{ width: s.level === "Expert" ? "90%" : s.level === "Advanced" ? "70%" : s.level === "Intermediate" ? "50%" : "30%", backgroundColor: "#fda4af" }} /></div></div>)}</SideSection>}
          {resume.certifications.length > 0 && <SideSection title="Certifications">{resume.certifications.map(c => <p key={c.id} className="mb-1 text-[10px]">{c.name}{c.issuer && <span className="opacity-70"> · {c.issuer}</span>}</p>)}</SideSection>}
          {resume.languages.length > 0 && <SideSection title="Languages">{resume.languages.map(l => <p key={l.id} className="text-[10px]">{l.name} <span className="opacity-70">· {l.proficiency}</span></p>)}</SideSection>}
          {resume.interests.length > 0 && <SideSection title="Interests"><p className="text-[10px] opacity-70">{resume.interests.map(i => i.name).join(" · ")}</p></SideSection>}
        </div>
      </div>
    </div>
  </div>;
}
