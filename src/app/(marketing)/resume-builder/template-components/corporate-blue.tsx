"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function CorporateBluePreview({ resume }: { resume: Resume }) {
  const navy = "#1e3a8a", ink = "#1f2937", muted = "#64748b", pale = "#eff6ff";
  const initial = (resume.name || "Your Name").trim().charAt(0).toUpperCase();
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-4"><div className="mb-2 flex items-center gap-2"><h2 className="text-xs font-bold uppercase tracking-[0.16em]" style={{ color: navy }}>{title}</h2><div className="h-px flex-1" style={{ backgroundColor: `${navy}35` }} /></div>{children}</section>;
  return <div className="overflow-hidden rounded-lg bg-white shadow-2xl" style={{ fontFamily: "Montserrat, 'Segoe UI', sans-serif", color: ink }}>
    <header className="flex items-center gap-4 px-6 py-5 text-white" style={{ backgroundColor: navy }}>
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/70 bg-white/15 text-2xl font-bold">{initial}</div>
      <div className="min-w-0 flex-1"><h1 className="text-2xl font-bold tracking-wide">{resume.name || "Your Name"}</h1><p className="mt-0.5 text-sm text-blue-100">{resume.title || "Professional Title"}</p><div className="mt-2 flex flex-wrap gap-x-3 text-[10px] text-blue-100">{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>{resume.social && <div className="mt-1"><SocialLinks social={resume.social} color="#dbeafe" size="xs" /></div>}</div>
    </header>
    <main className="p-6 text-xs">
      {resume.summary && <Section title="Executive Profile"><FormattedDescription text={resume.summary} color={navy} mutedColor={ink} size="sm" /></Section>}
      {resume.experience.length > 0 && <Section title="Professional Experience"><div className="ml-1 border-l-2 pl-4" style={{ borderColor: navy }}>{resume.experience.map(e => <article key={e.id} className="relative mb-4 last:mb-0"><span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 bg-white" style={{ borderColor: navy }} /><div className="flex justify-between gap-3"><div><h3 className="text-sm font-bold" style={{ color: navy }}>{e.position}</h3><p className="font-semibold">{e.company}{e.location && ` · ${e.location}`}</p></div><span className="shrink-0 text-[10px] font-semibold" style={{ color: muted }}>{e.duration}</span></div>{e.description && <FormattedDescription text={e.description} color={navy} mutedColor={muted} />}{e.achievements && <FormattedDescription text={e.achievements} color={navy} mutedColor={ink} />}</article>)}</div></Section>}
      {resume.education.length > 0 && <Section title="Education"><div className="grid grid-cols-2 gap-3">{resume.education.map(edu => <div key={edu.id} className="border-l-2 pl-3" style={{ borderColor: `${navy}50` }}><h3 className="font-bold" style={{ color: navy }}>{edu.school}</h3><p>{edu.degree}{edu.field && `, ${edu.field}`}</p><p className="text-[10px]" style={{ color: muted }}>{[edu.year, edu.location, edu.gpa && `GPA ${edu.gpa}`].filter(Boolean).join(" · ")}</p></div>)}</div></Section>}
      {resume.skills.length > 0 && <Section title="Core Competencies"><div className="grid grid-cols-3 gap-2">{resume.skills.map(s => <div key={s.id} className="rounded p-2" style={{ backgroundColor: pale }}><p className="font-bold" style={{ color: navy }}>{s.name}</p><p className="text-[10px]" style={{ color: muted }}>{[s.category, s.level, s.years && `${s.years} years`].filter(Boolean).join(" · ")}</p></div>)}</div></Section>}
      {resume.projects.length > 0 && <Section title="Selected Projects"><div className="grid grid-cols-2 gap-3">{resume.projects.map(p => <article key={p.id}><div className="flex justify-between gap-2"><h3 className="font-bold" style={{ color: navy }}>{p.name}</h3>{p.status && <span className="text-[9px]" style={{ color: muted }}>{p.status}</span>}</div>{p.role && <p className="text-[10px] font-semibold">{p.role}</p>}{p.description && <FormattedDescription text={p.description} color={navy} mutedColor={muted} />}{p.tech && <p className="text-[10px]" style={{ color: navy }}>{p.tech}</p>}</article>)}</div></Section>}
      {resume.certifications.length > 0 && <Section title="Certifications"><div className="grid grid-cols-2 gap-2">{resume.certifications.map(c => <p key={c.id}><b>{c.name}</b>{c.issuer && ` — ${c.issuer}`}{c.date && <span style={{ color: muted }}> · {c.date}</span>}</p>)}</div></Section>}
      {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.map(a => <p key={a.id} className="mb-1">• {a.description}</p>)}</Section>}
      <div className="grid grid-cols-2 gap-5 border-t pt-3" style={{ borderColor: `${navy}30` }}>
        {resume.languages.length > 0 && <Section title="Languages"><p>{resume.languages.map(l => `${l.name} — ${l.proficiency}`).join(" · ")}</p></Section>}
        {resume.interests.length > 0 && <Section title="Interests"><p style={{ color: muted }}>{resume.interests.map(i => i.name).join(" · ")}</p></Section>}
      </div>
      {resume.references.length > 0 && <Section title="References"><div className="grid grid-cols-2 gap-2">{resume.references.map(r => <p key={r.id}><b>{r.name}</b>{r.position && `, ${r.position}`}{r.company && ` — ${r.company}`}</p>)}</div></Section>}
    </main>
  </div>;
}
