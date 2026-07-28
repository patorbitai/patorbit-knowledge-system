"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function CompactProPreview({ resume }: { resume: Resume }) {
  const slate = "#374151", blue = "#2563eb", muted = "#6b7280", line = "#d1d5db";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section><div className="mb-1 flex items-center gap-2"><h2 className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: blue }}>{title}</h2><span className="h-px flex-1" style={{ backgroundColor: line }} /></div>{children}</section>;
  return <div className="overflow-hidden rounded-lg bg-white shadow" style={{ fontFamily: "Roboto, Arial, sans-serif", color: slate }}>
    <div className="p-5 text-xs">
      <header className="mb-2 flex items-center justify-between gap-4 border-b pb-2" style={{ borderColor: line }}>
        <div className="min-w-0"><h1 className="truncate text-lg font-bold leading-none">{resume.name || "Your Name"}</h1><p className="mt-1 text-xs font-medium" style={{ color: blue }}>{resume.title || "Professional Title"}</p></div>
        <div className="shrink-0 text-right text-[10px] leading-4" style={{ color: muted }}><div>{[resume.email, resume.phone].filter(Boolean).join(" · ")}</div>{resume.address && <div>{resume.address}</div>}{resume.social && <SocialLinks social={resume.social} color={muted} size="xs" />}</div>
      </header>
      <div className="space-y-2">
        {resume.summary && <Section title="Profile"><FormattedDescription text={resume.summary} color={slate} mutedColor={slate} /></Section>}
        {resume.experience.length > 0 && <Section title="Experience">{resume.experience.map(exp => <div key={exp.id} className="mb-1.5 last:mb-0"><div className="flex justify-between gap-2"><p className="font-bold">{exp.position} <span className="font-normal" style={{ color: blue }}>@ {exp.company}</span>{exp.location && <span className="font-normal" style={{ color: muted }}> · {exp.location}</span>}</p><span className="shrink-0 text-[10px]" style={{ color: muted }}>{exp.duration}</span></div>{exp.description && <FormattedDescription text={exp.description} color={blue} mutedColor={slate} />}{exp.techUsed && <p className="text-[10px]" style={{ color: muted }}>Tools: {exp.techUsed}</p>}</div>)}</Section>}
        <div className="grid grid-cols-2 gap-4">
          {resume.education.length > 0 && <Section title="Education">{resume.education.map(edu => <div key={edu.id} className="mb-1"><div className="flex justify-between gap-2"><b>{edu.school}</b><span className="text-[10px]" style={{ color: muted }}>{edu.year}</span></div><p className="text-[10px]">{edu.degree}{edu.field && `, ${edu.field}`}{edu.gpa && ` · ${edu.gpa}`}</p></div>)}</Section>}
          {resume.skills.length > 0 && <Section title="Skills"><div className="flex flex-wrap gap-1">{resume.skills.map(skill => <span key={skill.id} className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "#eff6ff", color: blue }}>{skill.name}{skill.level && <span className="opacity-60"> · {skill.level}</span>}</span>)}</div></Section>}
        </div>
        {resume.projects.length > 0 && <Section title="Projects"><div className="grid grid-cols-2 gap-x-4 gap-y-1">{resume.projects.map(project => <div key={project.id}><div className="flex justify-between"><b>{project.name}</b>{project.startDate && <span className="text-[10px]" style={{ color: muted }}>{project.startDate}–{project.endDate || "Present"}</span>}</div>{project.description && <FormattedDescription text={project.description} color={blue} mutedColor={slate} />}{project.tech && <p className="text-[10px]" style={{ color: muted }}>{project.tech}</p>}</div>)}</div></Section>}
        <div className="grid grid-cols-2 gap-4">
          {resume.certifications.length > 0 && <Section title="Certifications">{resume.certifications.map(cert => <p key={cert.id} className="leading-4"><b>{cert.name}</b>{cert.issuer && <span style={{ color: muted }}> · {cert.issuer}</span>}{cert.date && <span style={{ color: muted }}> ({cert.date})</span>}</p>)}</Section>}
          {resume.achievements.length > 0 && <Section title="Achievements">{resume.achievements.map(item => <p key={item.id} className="leading-4">• {item.description}</p>)}</Section>}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {resume.languages.length > 0 && <Section title="Languages"><p className="text-[10px]">{resume.languages.map(l => `${l.name} (${l.proficiency})`).join(" · ")}</p></Section>}
          {resume.interests.length > 0 && <Section title="Interests"><p className="text-[10px]">{resume.interests.map(i => i.name).join(" · ")}</p></Section>}
          {resume.references.length > 0 && <Section title="References">{resume.references.map(ref => <p key={ref.id} className="text-[10px]"><b>{ref.name}</b>{ref.company && ` · ${ref.company}`}</p>)}</Section>}
        </div>
      </div>
    </div>
  </div>;
}
