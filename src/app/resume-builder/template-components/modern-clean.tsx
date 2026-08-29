"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function ModernCleanPreview({ resume }: { resume: Resume }) {
  const accent = "#0ea5e9";
  const ink = "#0f172a";
  const muted = "#64748b";
  const border = "#e2e8f0";
  const cardBg = "#f8fafc";
  const subheader = "#334155";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-2">
      <div className="flex items-center gap-3 mb-1.5 pb-1 border-b" style={{ borderColor: border }}>
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: ink }}>
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      {children}
    </section>
  );

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none" style={{ fontFamily: fontFamilies.sans, color: ink, padding: '40px 32px 30px' }}>
      <main className="p-4 print:p-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b" style={{ borderColor: border }}>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: ink }}>
              {resume.name || "Your Name"}
            </h1>
            <p className="mt-0.5 text-sm font-semibold tracking-wide" style={{ color: accent }}>
              {resume.title || "Professional Title"}
            </p>
          </div>
          <div className="text-[11px] space-y-0.5 text-left sm:text-right" style={{ color: muted }}>
            {resume.email && <p>{resume.email}</p>}
            {resume.phone && <p>{resume.phone}</p>}
            {resume.address && <p>{resume.address}</p>}
            {resume.social && (
              <div className="mt-0.5 flex sm:justify-end">
                <SocialLinks social={resume.social} color={muted} size="sm" />
              </div>
            )}
          </div>
        </header>

        <div className="mt-3 space-y-2">
          {resume.summary && (
            <Section title="Professional Summary">
              <div className="text-[11px] leading-relaxed" style={{ color: ink }}>
                <FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="xs" />
              </div>
            </Section>
          )}

          {resume.experience.length > 0 && (
            <Section title="Work Experience">
              <div className="space-y-1.5">
                {resume.experience.map((exp) => (
                  <article key={exp.id}>
                    <div className="flex justify-between items-baseline gap-3">
                      <h3 className="text-[11px] font-bold" style={{ color: ink }}>
                        {exp.position}
                      </h3>
                      <span className="text-[10px] font-medium shrink-0" style={{ color: muted }}>
                        {exp.duration || [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                    <p className="text-[10px] font-semibold mt-0.5" style={{ color: subheader }}>
                      {exp.company}
                      {exp.location && <span className="font-normal text-slate-400"> · {exp.location}</span>}
                    </p>
                    {exp.description && (
                      <div className="mt-1 text-[11px] leading-relaxed">
                        <FormattedDescription text={exp.description} color={ink} mutedColor={muted} />
                      </div>
                    )}
                    {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                      <ul className="mt-0.5 ml-4 list-disc list-outside space-y-0 text-[10px]" style={{ color: ink }}>
                        {exp.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                      </ul>
                    )}
                    {exp.achievements && (
                      <div className="mt-1 text-[11px] leading-relaxed">
                        <FormattedDescription text={exp.achievements} color={ink} mutedColor={muted} />
                      </div>
                    )}
                    {exp.techUsed && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {exp.techUsed.split(/[,;]\s*/).filter(Boolean).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium border" style={{ backgroundColor: cardBg, borderColor: border, color: subheader }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {resume.education.length > 0 && (
            <Section title="Education">
              <div className="space-y-2">
                {resume.education.map((edu) => (
                  <article key={edu.id}>
                    <h3 className="text-[11px] font-bold" style={{ color: ink }}>{edu.school}</h3>
                    <p className="text-[10px] font-medium mt-0.5" style={{ color: subheader }}>
                      {edu.degree}{edu.field && `, ${edu.field}`}
                    </p>
                    <div className="text-[10px] flex flex-wrap gap-x-3" style={{ color: muted }}>
                      {edu.year && <span>{edu.year}</span>}
                      {edu.gpa && <span>GPA: {edu.gpa}</span>}
                      {edu.location && <span>{edu.location}</span>}
                    </div>
                    {edu.honors && <p className="text-[10px] italic" style={{ color: muted }}>{edu.honors}</p>}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {resume.projects.length > 0 && (
            <Section title="Projects">
              <div className="space-y-1">
                {resume.projects.map((p) => (
                  <article key={p.id} className="p-1.5 rounded border" style={{ backgroundColor: cardBg, borderColor: border }}>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-[11px] font-bold" style={{ color: ink }}>{p.name}</h3>
                      {p.status && p.status !== 'Completed' && (
                        <span className="text-[8px] px-1 py-0.5 rounded-full font-medium shrink-0 border" style={{ borderColor: border, color: accent }}>{p.status}</span>
                      )}
                    </div>
                    {p.description && (
                      <div className="text-[10px] mt-0.5">
                        <FormattedDescription text={p.description} color={ink} mutedColor={muted} />
                      </div>
                    )}
                    {p.tech && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.tech.split(/[,;]\s*/).filter(Boolean).map((t, i) => (
                          <span key={i} className="px-1 py-0.5 rounded text-[8px] font-medium border" style={{ backgroundColor: cardBg, borderColor: border, color: subheader }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {p.bulletPoints && p.bulletPoints.length > 0 && (
                      <ul className="mt-0.5 ml-3 list-disc list-outside space-y-0 text-[9px]" style={{ color: ink }}>
                        {p.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                      </ul>
                    )}
                    {p.link && (
                      <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target="_blank" rel="noopener noreferrer" className="text-[9px] mt-0.5 inline-block hover:underline" style={{ color: accent }}>{p.link.replace(/^https?:\/\//, '')}</a>
                    )}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {resume.skills.length > 0 && (
            <Section title="Skills & Expertise">
              <div className="flex flex-wrap gap-1">
                {resume.skills.map((s) => (
                  <span
                    key={s.id}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium border"
                    style={{ backgroundColor: cardBg, borderColor: border, color: ink }}
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {resume.certifications.length > 0 && (
            <Section title="Certifications">
              <div className="space-y-1">
                {resume.certifications.map((c) => (
                  <div key={c.id} className="text-[10px]">
                    <span className="font-bold" style={{ color: ink }}>{c.name}</span>
                    {c.issuer && <span style={{ color: muted }}> — {c.issuer}</span>}
                    {c.date && <span style={{ color: muted }}> ({c.date})</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {resume.languages.length > 0 && (
            <Section title="Languages">
              <div className="flex flex-wrap gap-x-3 gap-y-0">
                {resume.languages.map((l) => (
                  <span key={l.id} className="text-[10px]">
                    <span style={{ color: ink }}>{l.name}</span>
                    {l.proficiency && <span style={{ color: muted }}> — {l.proficiency}</span>}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
