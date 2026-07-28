"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function CompactProPreview({ resume }: { resume: Resume }) {
  const slate = "#374151", blue = "#2563eb", muted = "#6b7280", line = "#d1d5db";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section><div className="mb-1 flex items-center gap-2"><h2 className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: blue }}>{title}</h2><span className="h-px flex-1" style={{ backgroundColor: line }} /></div>{children}</section>;
  return <div className="overflow-hidden rounded-lg bg-white shadow-2xl" style={{ fontFamily: "Roboto, Arial, sans-serif", color: slate }}>
    <div className="p-5 text-xs">
      <header className="mb-2 flex items-center justify-between gap-4 border-b pb-2" style={{ borderColor: line }}>
        <div className="min-w-0"><h1 className="truncate text-lg font-bold leading-none">{resume.name || "Your Name"}</h1><p className="mt-1 text-xs font-medium" style={{ color: blue }}>{resume.title || "Professional Title"}</p></div>
        <div className="shrink-0 text-right text-[10px] leading-4" style={{ color: muted }}><div>{[resume.email, resume.phone].filter(Boolean).join(" · ")}</div>{resume.address && <div>{resume.address}</div>}{resume.social && <SocialLinks social={resume.social} color={muted} size="xs" />}</div>
      </header>
      <div className="space-y-2">
        {resume.summary && <Section title="Profile"><FormattedDescription text={resume.summary} color={slate} mutedColor={slate} /></Section>}
        {resume.experience.length > 0 && <Section title="Experience">{resume.experience.map(e => <div key={e.id} className="mb-1.5 last:mb-0"><div className="flex justify-between gap-2"><p className="font-bold">{e.position} <span className="font-normal" style={{ color: blue }}>@ {e.company}</span>{e.location && <span className="font-normal" style={{ color: muted }}> · {e.location}</span>}</p><span className="shrink-0 text-[10px]" style={{ color: muted }}>{e.duration}</span></div>{e.description && <FormattedDescription text={e.description} color={blue} mutedColor={slate} />}{e.techUsed && <p className="text-[10px]" style={{ color: muted }}>Tools: {e.techUsed}</p>}</div>)}</Section>}
        <div className="grid grid-cols-2 gap-4">
          {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <div key={edu.id} className="mb-1"><div className="flex justify-between gap-2"><b>{edu.school}</b><span className="text-[10px]" style={{ color: muted }}>{edu.year}</span></div><p className="text-[10px]">{edu.degree}{edu.field && `, ${edu.field}`}{edu.gpa && ` · ${edu.gpa}`}</p></div>)}</Section>}
          {resume.skills.length > 0 && <Section title="Skills"><div className="flex flex-wrap gap-1">{resume.skills.map(s => <span key={s.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#eff6ff", color: blue }}>{s.name}{s.level && <span className="opacity-60"> · {s.level}</span>}</span>)}</div></Section>}
        </div>
        {resume.projects.length > 0 && <Section title="Projects"><div className="grid grid-cols-2 gap-x-4 gap-y-1">{resume.projects.map(p => <div key={p.id}><div className="flex justify-between"><b>{p.name}</b>{p.startDate && <span className="text-[10px]" style={{ color: muted }}>{p.startDate}–{p.endDate || "Present"}</span>}</div>{p.description && <FormattedDescription text={p.description} color={blue} mutedColor={slate} />}{p.tech && <p className="text-[10px]" style={{ color: muted }}>{p.tech}</p>}</div>)}</div></Section>}
        <div className="grid grid-cols-2 gap-4">
          {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(c => <p key={c.id} className="leading-4"><b>{c.name}</b>{c.issuer && <span style={{ color: muted }}> · {c.issuer}</span>}{c.date && <span style={{ color: muted }}> ({c.date})</span>}</p>)}</Section>}
          {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.map(a => <p key={a.id} className="leading-4">• {a.description}</p>)}</Section>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {resume.languages.length > 0 && <Section title="Languages"><p className="text-[10px]">{resume.languages.map(l => `${l.name} (${l.proficiency})`).join(" · ")}</p></Section>}
          {resume.interests.length > 0 && <Section title="Interests"><p className="text-[10px]">{resume.interests.map(i => i.name).join(" · ")}</p></Section>}
          {resume.references.length > 0 && <Section title="References">{resume.references.map(r => <p key={r.id} className="text-[10px]"><b>{r.name}</b>{r.company && ` · ${r.company}`}</p>)}</Section>}
        </div>
      </div>
    </div>
  </div>;
}
