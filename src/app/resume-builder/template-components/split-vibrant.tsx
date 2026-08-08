"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function SplitVibrantPreview({ resume }: { resume: Resume }) {
  const sidebarBg = "#0f172a", accent = "#38bdf8", ink = "#1e293b", muted = "#64748b";
  const SideSection = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-5"><h2 className="text-xs font-bold uppercase tracking-widest mb-2 text-white/70">{title}</h2>{children}</section>;
  return (
    <div className="bg-white text-black rounded-lg shadow-2xl overflow-hidden" style={{ fontFamily: fontFamilies.sans }}>
      <div className="flex min-h-[600px]">
        <aside className="w-[240px] shrink-0 p-5 flex flex-col gap-4" style={{ backgroundColor: sidebarBg }}>
          <div className="flex flex-col items-center pb-3 border-b border-white/10">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-2" style={{ backgroundColor: `${accent}25` }}>{(resume.name || "Y")[0]}</div>
            <h1 className="text-white font-bold text-center text-sm tracking-wide">{resume.name || "Your Name"}</h1>
            <p className="text-xs mt-0.5 text-center" style={{ color: accent }}>{resume.title || "Professional Title"}</p>
          </div>
          <SideSection title="Contact">
            <div className="text-xs text-white/70 space-y-1">{resume.email && <p>✉ {resume.email}</p>}{resume.phone && <p>📞 {resume.phone}</p>}{resume.address && <p>📍 {resume.address}</p>}</div>
            {resume.social && <div className="mt-1"><SocialLinks social={resume.social} color="#94a3b8" size="xs" /></div>}
          </SideSection>
          {resume.skills.length > 0 && <SideSection title="Skills">{resume.skills.map(s => <div key={s.id} className="mb-2"><div className="flex justify-between text-xs text-white/80"><span>{s.name}</span><span className="text-white/50">{s.level}</span></div><div className="mt-0.5 h-1.5 w-full rounded-full bg-white/15"><div className="h-full rounded-full" style={{ width: s.level === "Expert" ? "90%" : s.level === "Advanced" ? "70%" : s.level === "Intermediate" ? "50%" : "30%", backgroundColor: accent }} /></div></div>)}</SideSection>}
          {resume.education.length > 0 && <SideSection title="Education">{resume.education.map(e => <div key={e.id} className="mb-2"><p className="text-xs font-medium text-white">{e.school}</p><p className="text-xs text-white/60">{e.degree}{e.field && `, ${e.field}`}</p><p className="text-xs text-white/50">{e.year}</p></div>)}</SideSection>}
          {resume.languages.length > 0 && <SideSection title="Languages">{resume.languages.map(l => <p key={l.id} className="text-xs text-white/70">{l.name} <span className="text-white/50">({l.proficiency})</span></p>)}</SideSection>}
        </aside>
        <main className="flex-1 p-6 space-y-6 text-sm leading-relaxed">
          {resume.summary && <div className="p-4 rounded-xl" style={{ backgroundColor: `${accent}08` }}><FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" /></div>}
          {resume.experience.length > 0 && <section><h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accent }}>Experience</h2>{resume.experience.map(e => <article key={e.id} className="relative pl-4 mb-4"><div className="absolute left-0 top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: accent }} /><div className="absolute left-[3px] top-4 bottom-0 w-0.5" style={{ backgroundColor: `${accent}20` }} /><div className="flex justify-between"><h3 className="text-sm font-semibold" style={{ color: ink }}>{e.position}</h3><span className="text-xs shrink-0" style={{ color: muted }}>{e.duration}</span></div><p className="text-xs font-medium" style={{ color: accent }}>{e.company}{e.location && ` · ${e.location}`}</p>{e.description && <FormattedDescription text={e.description} color={ink} mutedColor={muted} />}</article>)}</section>}
          {resume.certifications.length > 0 && <section><h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accent }}>Certifications</h2><div className="flex flex-wrap gap-2">{resume.certifications.map(c => <span key={c.id} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${accent}10`, color: accent }}>{c.name}</span>)}</div></section>}
          {resume.projects.length > 0 && <section><h2 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: accent }}>Projects</h2><div className="grid grid-cols-2 gap-3">{resume.projects.map(p => <article key={p.id} className="p-3 rounded-xl" style={{ backgroundColor: `${accent}05` }}><h3 className="text-sm font-semibold" style={{ color: ink }}>{p.name}</h3><p className="text-xs" style={{ color: muted }}>{p.role}{p.tech && ` | ${p.tech}`}</p>{p.description && <FormattedDescription text={p.description} color={ink} mutedColor={muted} />}</article>)}</div></section>}
          <div className="flex justify-between text-xs" style={{ color: muted }}>{resume.achievements.length > 0 && <div>{resume.achievements.map(a => <p key={a.id}>✦ {a.description}</p>)}</div>}{resume.interests.length > 0 && <div className="text-right">{resume.interests.map(i => i.name).join(" · ")}</div>}</div>
        </main>
      </div>
    </div>
  );
}
