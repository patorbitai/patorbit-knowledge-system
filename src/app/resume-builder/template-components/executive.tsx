"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function ExecutivePreview({ resume }: { resume: Resume }) {
  const bannerBg = "#0f172a", primary = "#c9b068", text = "#1f2937", muted = "#6b7280", border = "#e2e8f0";
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-6 break-inside-avoid">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] mb-3 pb-1.5 border-b-2" style={{ color: primary, borderColor: primary }}>
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <div className="bg-white text-black rounded-xl shadow-2xl overflow-hidden print:shadow-none print:rounded-none" style={{ fontFamily: fontFamilies.garamond }}>
      <header className="px-10 py-8 text-center" style={{ backgroundColor: bannerBg, borderBottom: `4px solid ${primary}` }}>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide">{resume.name || "Your Name"}</h1>
        <p className="mt-2 text-base sm:text-lg font-medium tracking-wider" style={{ color: primary }}>{resume.title || "Professional Title"}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs sm:text-sm" style={{ color: "#d1d5db" }}>
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.address && <span>{resume.address}</span>}
        </div>
        {resume.social && (
          <div className="mt-3 flex justify-center">
            <SocialLinks social={resume.social} color="#94a3b8" size="sm" />
          </div>
        )}
      </header>

      <main className="p-10 text-sm leading-relaxed" style={{ color: text }}>
        {resume.summary && (
          <Section title="Executive Summary">
            <div className="text-[13px] leading-relaxed" style={{ color: text }}>
              <FormattedDescription text={resume.summary} color={text} mutedColor={muted} size="sm" />
            </div>
          </Section>
        )}

        {resume.experience.length > 0 && (
          <Section title="Professional Experience">
            <div className="space-y-5">
              {resume.experience.map(exp => (
                <article key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline gap-3">
                    <h3 className="text-[15px] font-bold" style={{ color: text }}>{exp.position}</h3>
                    <span className="shrink-0 text-xs font-semibold" style={{ color: muted }}>
                      {exp.duration || [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" – ")}
                    </span>
                  </div>
                  <p className="text-sm font-semibold italic mt-0.5" style={{ color: primary }}>
                    {exp.company}{exp.location && ` · ${exp.location}`}
                  </p>
                  {exp.description && (
                    <div className="mt-1.5 text-[13px] leading-relaxed">
                      <FormattedDescription text={exp.description} color={text} mutedColor={muted} />
                    </div>
                  )}
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul className="mt-1.5 ml-4 list-disc list-outside space-y-1 text-[13px]" style={{ color: text }}>
                      {exp.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
          <div className="space-y-6">
            {resume.education.length > 0 && (
              <Section title="Education">
                <div className="space-y-3">
                  {resume.education.map(edu => (
                    <article key={edu.id} className="break-inside-avoid">
                      <h3 className="text-sm font-bold" style={{ color: text }}>{edu.school}</h3>
                      <p className="text-xs italic" style={{ color: muted }}>
                        {edu.degree}{edu.field && `, ${edu.field}`} {edu.year && `(${edu.year})`}
                      </p>
                    </article>
                  ))}
                </div>
              </Section>
            )}

            {resume.projects.length > 0 && (
              <Section title="Key Projects">
                <div className="space-y-3">
                  {resume.projects.map(p => (
                    <article key={p.id} className="break-inside-avoid">
                      <h3 className="text-sm font-bold" style={{ color: text }}>{p.name}</h3>
                      {p.role && <p className="text-xs italic font-medium" style={{ color: primary }}>{p.role}</p>}
                      {p.description && (
                        <div className="text-xs mt-1">
                          <FormattedDescription text={p.description} color={text} mutedColor={muted} />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-6">
            {resume.skills.length > 0 && (
              <Section title="Core Competencies">
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map(skill => (
                    <span key={skill.id} className="px-2 py-0.5 rounded text-xs font-medium border" style={{ borderColor: border, backgroundColor: "#f8fafc", color: text }}>
                      {skill.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {resume.certifications.length > 0 && (
              <Section title="Certifications">
                <div className="space-y-1.5">
                  {resume.certifications.map(c => (
                    <div key={c.id} className="text-xs">
                      <span className="font-bold" style={{ color: text }}>{c.name}</span>
                      {c.issuer && <span style={{ color: muted }}> — {c.issuer}</span>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {resume.achievements && resume.achievements.length > 0 && (
              <Section title="Key Achievements">
                <div className="space-y-1.5">
                  {resume.achievements.map(a => (
                    <div key={a.id} className="text-xs">
                      <span className="font-bold" style={{ color: text }}>{a.title}</span>
                      {a.description && <p style={{ color: muted, marginTop: 1 }}>{a.description}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {resume.languages.length > 0 && (
              <Section title="Languages">
                <div className="space-y-1">
                  {resume.languages.map(l => (
                    <div key={l.id} className="text-xs flex justify-between">
                      <span className="font-medium" style={{ color: text }}>{l.name}</span>
                      <span style={{ color: muted }}>{l.proficiency}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {resume.interests && resume.interests.length > 0 && (
              <Section title="Affiliations & Interests">
                <p className="text-xs leading-relaxed" style={{ color: muted }}>
                  {resume.interests.map(i => i.name).join(" · ")}
                </p>
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
