"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";

export function CreativeBurstPreview({ resume }: { resume: Resume }) {
  const purple = "#7c3aed", pink = "#c026d3", ink = "#312e81", muted = "#6b7280";
  const dots = (level: string) => level === "Expert" ? 4 : level === "Advanced" ? 3 : level === "Intermediate" ? 2 : 1;
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mb-4"><h2 className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em]" style={{ color: purple }}>✦ {title}</h2>{children}</section>;
  return <div className="relative overflow-hidden rounded-lg bg-white shadow" style={{ fontFamily: "'Plus Jakarta Sans', 'Segoe UI', sans-serif", color: ink }}>
    <div className="absolute inset-y-0 left-0 w-2" style={{ background: `linear-gradient(180deg, ${purple}, ${pink})` }} />
    <div className="p-6 pl-8">
      <header className="relative mb-5 overflow-hidden rounded-2xl px-5 py-4" style={{ background: `linear-gradient(120deg, ${purple}12, ${pink}18)` }}>
        <div className="absolute -right-5 -top-7 h-20 w-20 rounded-full" style={{ backgroundColor: `${pink}18` }} />
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em]" style={{ color: pink }}>Hello, I&apos;m</p>
        <h1 className="text-2xl font-black leading-tight">{resume.name || "Your Name"}<span style={{ color: pink }}>.</span></h1>
        <p className="mt-1 text-sm font-semibold" style={{ color: purple }}>{resume.title || "Creative Professional"}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs" style={{ color: muted }}>{resume.email && <span>{resume.email}</span>}{resume.phone && <span>{resume.phone}</span>}{resume.address && <span>{resume.address}</span>}</div>
        {resume.social && <div className="mt-2"><SocialLinks social={resume.social} color={purple} size="xs" /></div>}
      </header>
      {resume.summary && <Section title="My Story"><div className="rounded-xl p-3" style={{ backgroundColor: `${purple}08` }}><FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" /></div></Section>}
      {resume.experience.length > 0 && <Section title="Experience">{resume.experience.map(exp => <div key={exp.id} className="relative mb-3 pl-4 last:mb-0"><span className="absolute left-0 top-1.5 h-2 w-2 rotate-45" style={{ backgroundColor: pink }} /><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{exp.position}</h3><p className="text-xs font-semibold" style={{ color: purple }}>{exp.company}{exp.location && ` · ${exp.location}`}</p></div><span className="shrink-0 text-[10px] font-medium" style={{ color: muted }}>{exp.duration}</span></div>{exp.description && <FormattedDescription text={exp.description} color={purple} mutedColor={muted} />}{exp.achievements && <FormattedDescription text={exp.achievements} color={pink} mutedColor={muted} />}</div>)}</Section>}
      {resume.education.length > 0 && <Section title="Education"><div className="grid grid-cols-2 gap-2">{resume.education.map(edu => <div key={edu.id} className="rounded-xl border p-3" style={{ borderColor: `${purple}25` }}><h3 className="text-sm font-bold">{edu.school}</h3><p className="text-xs" style={{ color: muted }}>{edu.degree}{edu.field && ` · ${edu.field}`}</p><p className="text-[10px] font-semibold" style={{ color: pink }}>{edu.year}{edu.gpa && ` · GPA ${edu.gpa}`}</p></div>)}</div></Section>}
      {resume.skills.length > 0 && <Section title="Skills"><div className="grid grid-cols-2 gap-x-5 gap-y-2">{resume.skills.map(skill => <div key={skill.id}><div className="flex items-center justify-between text-xs"><span className="font-semibold">{skill.name}</span>{skill.category && <span className="text-[9px]" style={{ color: muted }}>{skill.category}</span>}</div><div className="mt-1 flex gap-1">{[1,2,3,4].map(dot => <span key={dot} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: dot <= dots(skill.level) ? (dot === 4 ? pink : purple) : `${purple}18` }} />)}</div></div>)}</div></Section>}
      {resume.projects.length > 0 && <Section title="Projects"><div className="grid grid-cols-2 gap-2">{resume.projects.map(project => <div key={project.id} className="rounded-xl p-3" style={{ backgroundColor: `${pink}08` }}><div className="flex justify-between gap-2"><h3 className="text-sm font-bold">{project.name}</h3>{project.status && <span className="text-[9px] font-bold" style={{ color: pink }}>{project.status}</span>}</div>{project.role && <p className="text-[10px] font-semibold" style={{ color: purple }}>{project.role}</p>}{project.description && <FormattedDescription text={project.description} color={purple} mutedColor={muted} />}{project.tech && <p className="mt-1 text-[10px]" style={{ color: purple }}>{project.tech}</p>}</div>)}</div></Section>}
      {resume.certifications.length > 0 && <Section title="Certifications"><div className="flex flex-wrap gap-2">{resume.certifications.map(cert => <span key={cert.id} className="rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: `${purple}10`, color: purple }}>{cert.name}{cert.issuer && ` · ${cert.issuer}`}</span>)}</div></Section>}
      {resume.achievements.length > 0 && <Section title="Highlights">{resume.achievements.map(item => <p key={item.id} className="mb-1 text-xs" style={{ color: muted }}>✦ {item.description}</p>)}</Section>}
      <div className="grid grid-cols-2 gap-5 border-t pt-4" style={{ borderColor: `${purple}20` }}>
        {resume.languages.length > 0 && <Section title="Languages"><div className="flex flex-wrap gap-2">{resume.languages.map(language => <span key={language.id} className="text-xs"><b>{language.name}</b> <span style={{ color: muted }}>· {language.proficiency}</span></span>)}</div></Section>}
        {resume.interests.length > 0 && <Section title="Interests"><p className="text-xs" style={{ color: muted }}>{resume.interests.map(interest => interest.name).join(" ✦ ")}</p></Section>}
      </div>
      {resume.references.length > 0 && <Section title="References"><div className="grid grid-cols-2 gap-2">{resume.references.map(ref => <p key={ref.id} className="text-xs"><b>{ref.name}</b>{ref.position && ` · ${ref.position}`}{ref.company && `, ${ref.company}`}</p>)}</div></Section>}
    </div>
  </div>;
}
