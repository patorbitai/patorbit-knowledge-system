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
    <section className="mb-4 break-inside-avoid">
      <div className="flex items-center gap-3 mb-3 pb-2 border-b" style={{ borderColor: border }}>
        <h2 className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: ink }}>
          {title}
        </h2>
        <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
      </div>
      {children}
    </section>
  );

  return (
    <div className="bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none" style={{ fontFamily: fontFamilies.sans, color: ink }}>
      <main className="p-8 print:p-5">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b" style={{ borderColor: border }}>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: ink }}>
              {resume.name || "Your Name"}
            </h1>
            <p className="mt-1 text-sm font-semibold tracking-wide" style={{ color: accent }}>
              {resume.title || "Professional Title"}
            </p>
          </div>
          <div className="text-xs space-y-1 text-left sm:text-right" style={{ color: muted }}>
            {resume.email && <p>{resume.email}</p>}
            {resume.phone && <p>{resume.phone}</p>}
            {resume.address && <p>{resume.address}</p>}
            {resume.social && (
              <div className="mt-1 flex sm:justify-end">
                <SocialLinks social={resume.social} color={muted} size="sm" />
              </div>
            )}
          </div>
        </header>

        <div className="mt-6 space-y-4">
          {resume.summary && (
            <Section title="Professional Summary">
              <div className="text-[13px] leading-relaxed" style={{ color: ink }}>
                <FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" />
              </div>
            </Section>
          )}

          {resume.experience.length > 0 && (
            <Section title="Work Experience">
              <div className="space-y-6">
                {resume.experience.map((exp) => (
                  <article key={exp.id} className="break-inside-avoid">
                    <div className="flex justify-between items-baseline gap-3">
                      <h3 className="text-sm font-bold" style={{ color: ink }}>
                        {exp.position}
                      </h3>
                      <span className="text-xs font-medium shrink-0" style={{ color: muted }}>
                        {exp.duration || [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" – ")}
                      </span>
                    </div>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: subheader }}>
                      {exp.company}
                      {exp.location && <span className="font-normal text-slate-400"> · {exp.location}</span>}
                    </p>
                    {exp.description && (
                      <div className="mt-2 text-[12.5px] leading-relaxed">
                        <FormattedDescription text={exp.description} color={ink} mutedColor={muted} />
                      </div>
                    )}
                    {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                      <ul className="mt-1.5 ml-4 list-disc list-outside space-y-1 text-[12.5px]" style={{ color: ink }}>
                        {exp.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                      </ul>
                    )}
                    {exp.achievements && (
                      <div className="mt-1.5 text-[12.5px] leading-relaxed">
                        <FormattedDescription text={exp.achievements} color={ink} mutedColor={muted} />
                      </div>
                    )}
                    {exp.techUsed && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {exp.techUsed.split(/[,;]\s*/).filter(Boolean).map((t, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[10px] font-medium border" style={{ backgroundColor: cardBg, borderColor: border, color: subheader }}>{t}</span>
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
                  <div className="space-y-4">
                    {resume.education.map((edu) => (
                      <article key={edu.id} className="break-inside-avoid">
                        <h3 className="text-xs font-bold" style={{ color: ink }}>{edu.school}</h3>
                        <p className="text-xs font-medium mt-0.5" style={{ color: subheader }}>
                          {edu.degree}{edu.field && `, ${edu.field}`}
                        </p>
                        <div className="text-[11px] flex flex-wrap gap-x-3" style={{ color: muted }}>
                          {edu.year && <span>{edu.year}</span>}
                          {edu.gpa && <span>GPA: {edu.gpa}</span>}
                          {edu.location && <span>{edu.location}</span>}
                        </div>
                        {edu.honors && <p className="text-[11px] italic" style={{ color: muted }}>{edu.honors}</p>}
                      </article>
                    ))}
                  </div>
                </Section>
              )}

              {resume.projects.length > 0 && (
                <Section title="Projects">
                  <div className="space-y-4">
                    {resume.projects.map((p) => (
                      <article key={p.id} className="break-inside-avoid p-3 rounded-lg border" style={{ backgroundColor: cardBg, borderColor: border }}>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-xs font-bold" style={{ color: ink }}>{p.name}</h3>
                          {p.status && p.status !== 'Completed' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: cardBg, borderColor: border, color: accent, border: `1px solid ${border}` }}>{p.status}</span>
                          )}
                        </div>
                        {p.description && (
                          <div className="text-[11px] mt-1">
                            <FormattedDescription text={p.description} color={ink} mutedColor={muted} />
                          </div>
                        )}
                        {p.tech && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {p.tech.split(/[,;]\s*/).filter(Boolean).map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-medium border" style={{ backgroundColor: cardBg, borderColor: border, color: subheader }}>{t}</span>
                            ))}
                          </div>
                        )}
                        {p.bulletPoints && p.bulletPoints.length > 0 && (
                          <ul className="mt-1 ml-3 list-disc list-outside space-y-0.5 text-[11px]" style={{ color: ink }}>
                            {p.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                          </ul>
                        )}
                        {p.link && (
                          <a href={p.link.startsWith('http') ? p.link : `https://${p.link}`} target="_blank" rel="noopener noreferrer" className="text-[10px] mt-1 inline-block hover:underline" style={{ color: accent }}>{p.link.replace(/^https?:\/\//, '')}</a>
                        )}
                      </article>
                    ))}
                  </div>
                </Section>
              )}
              {resume.skills.length > 0 && (
                <Section title="Skills & Expertise">
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.map((s) => (
                      <span
                        key={s.id}
                        className="px-2.5 py-1 rounded-md text-xs font-medium border"
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
                  <div className="space-y-2">
                    {resume.certifications.map((c) => (
                      <div key={c.id} className="text-xs">
                        <div>
                          {c.link ? (
                            <a href={c.link.startsWith('http') ? c.link : `https://${c.link}`} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline" style={{ color: ink }}>{c.name}</a>
                          ) : (
                            <span className="font-bold" style={{ color: ink }}>{c.name}</span>
                          )}
                          {c.issuer && <span style={{ color: muted }}> — {c.issuer}</span>}
                          {c.date && <span style={{ color: muted }}> ({c.date})</span>}
                        </div>
                        {c.description && <p className="text-[11px] mt-0.5" style={{ color: muted }}>{c.description}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {resume.languages.length > 0 && (
                <Section title="Languages">
                  <div className="space-y-1">
                    {resume.languages.map((l) => (
                      <div key={l.id} className="text-xs flex justify-between">
                        <span style={{ color: ink }}>{l.name}</span>
                        <span style={{ color: muted }}>{l.proficiency}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

          {resume.achievements.length > 0 && (
            <Section title="Achievements">
              <div className="space-y-2">
                {resume.achievements.map((a) => (
                  <article key={a.id} className="break-inside-avoid">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xs font-bold" style={{ color: ink }}>{a.title}</h3>
                      {a.date && <span className="text-[10px]" style={{ color: muted }}>{a.date}</span>}
                    </div>
                    {a.description && <p className="text-[11px] mt-0.5" style={{ color: muted }}>{a.description}</p>}
                    {a.issuer && <p className="text-[10px]" style={{ color: muted }}>Issued by {a.issuer}</p>}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {resume.interests.length > 0 && (
            <Section title="Interests">
              <div className="flex flex-wrap gap-1.5">
                {resume.interests.map((i) => (
                  <span key={i.id} className="px-2 py-0.5 rounded-md text-[11px] border" style={{ borderColor: border, color: subheader }}>{i.name}</span>
                ))}
              </div>
            </Section>
          )}

          {resume.references.length > 0 && (
            <Section title="References">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resume.references.map((r) => (
                  <article key={r.id} className="break-inside-avoid">
                    <p className="text-xs font-bold" style={{ color: ink }}>{r.name}</p>
                    {r.position && r.company && <p className="text-[11px]" style={{ color: subheader }}>{r.position}, {r.company}</p>}
                    {r.email && <p className="text-[10px]" style={{ color: muted }}>{r.email}</p>}
                    {r.phone && <p className="text-[10px]" style={{ color: muted }}>{r.phone}</p>}
                  </article>
                ))}
              </div>
            </Section>
          )}
        </div>
      </main>
    </div>
  );
}
