"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function ModernCleanPreview({ resume }: { resume: Resume }) {
  const accent = "#1e40af";
  const ink = "#111827";
  const muted = "#6b7280";
  const border = "#e5e7eb";
  const subheader = "#374151";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-6">
      <h2
        className="text-[11px] font-bold uppercase tracking-[0.18em] mb-4 pb-2 border-b break-after-avoid"
        style={{ color: accent, borderColor: border }}
      >
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none"
      style={{ fontFamily: fontFamilies.sans, color: ink }}
    >
      <main className="p-8 print:p-6">
        <header className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          <div className="sm:col-span-2">
            <h1 className="text-[2.25rem] font-bold tracking-tight leading-tight" style={{ color: ink }}>
              {resume.name || "Your Name"}
            </h1>
            <p className="mt-2 text-[15px] font-semibold tracking-wide" style={{ color: accent }}>
              {resume.title || "Professional Title"}
            </p>
          </div>
          <div className="sm:text-right text-[11px] leading-relaxed" style={{ color: muted }}>
            {resume.email && <p className="break-all">{resume.email}</p>}
            {resume.phone && <p>{resume.phone}</p>}
            {resume.address && <p>{resume.address}</p>}
            <div className="mt-1 sm:flex sm:justify-end">
              <SocialLinks social={resume.social} color={muted} size="sm" />
            </div>
          </div>
        </header>

        <div className="border-b mt-6 mb-8" style={{ borderColor: border }} />

        {resume.summary && (
          <Section title="Professional Profile">
            <div className="text-[12.5px] leading-relaxed" style={{ color: ink }}>
              <FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" />
            </div>
          </Section>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-y-6 lg:gap-x-10">
          <div className="lg:col-span-2 space-y-6">
            {resume.experience.length > 0 && (
              <Section title="Experience">
                <div className="space-y-6">
                  {resume.experience.map((exp) => (
                    <article key={exp.id} className="pb-6 last:pb-0 border-b last:border-b-0 break-inside-avoid" style={{ borderColor: border }}>
                      <div className="flex justify-between items-baseline gap-3">
                        <h3 className="text-[13px] font-semibold" style={{ color: ink }}>
                          {exp.position}
                        </h3>
                        <span className="text-[11px] shrink-0" style={{ color: muted }}>
                          {exp.duration || [exp.startDate, exp.endDate || "Present"].filter(Boolean).join(" – ")}
                        </span>
                      </div>
                      <p className="text-[13px] font-medium mt-0.5" style={{ color: subheader }}>
                        {exp.company}
                        {exp.location && (
                          <span className="text-[11px] font-normal ml-1.5" style={{ color: muted }}>
                            · {exp.location}
                          </span>
                        )}
                      </p>
                      {exp.description && (
                        <div className="mt-2 text-[12.5px] leading-[1.65]">
                          <FormattedDescription text={exp.description} color={ink} mutedColor={muted} />
                        </div>
                      )}
                      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                        <ul className="mt-2 ml-4 list-disc list-outside space-y-1 text-[12.5px] leading-[1.6]" style={{ color: ink }}>
                          {exp.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                        </ul>
                      )}
                    </article>
                  ))}
                </div>
              </Section>
            )}

            {resume.projects.length > 0 && (
              <Section title="Projects">
                <div className="space-y-4">
                  {resume.projects.map((p) => (
                    <article key={p.id}>
                      <h3 className="text-[13px] font-semibold" style={{ color: ink }}>{p.name}</h3>
                      {p.role && <p className="text-[11px] font-medium mt-0.5" style={{ color: subheader }}>{p.role}</p>}
                      {p.description && (
                        <div className="mt-1 text-[12.5px] leading-[1.65]">
                          <FormattedDescription text={p.description} color={ink} mutedColor={muted} />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              </Section>
            )}
          </div>

          <div className="lg:col-span-1 space-y-6">
            {resume.education.length > 0 && (
              <Section title="Education">
                {resume.education.map((edu) => (
                  <article key={edu.id} className="mb-4 last:mb-0">
                    <h3 className="text-[13px] font-semibold" style={{ color: ink }}>{edu.school}</h3>
                    <p className="text-[12px] font-medium mt-0.5" style={{ color: ink }}>
                      {edu.degree}{edu.field && ` in ${edu.field}`}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: muted }}>
                      {edu.year}{edu.gpa && ` · GPA ${edu.gpa}`}
                    </p>
                  </article>
                ))}
              </Section>
            )}

            {resume.skills.length > 0 && (
              <Section title="Skills">
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills.map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-medium"
                      style={{ backgroundColor: "#f1f5f9", color: subheader }}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {resume.certifications.length > 0 && (
              <Section title="Certifications">
                {resume.certifications.map((c) => (
                  <div key={c.id} className="mb-3 last:mb-0">
                    <p className="text-[12px] font-semibold" style={{ color: ink }}>{c.name}</p>
                    {(c.issuer || c.date) && (
                      <p className="text-[11px] mt-0.5" style={{ color: muted }}>
                        {[c.issuer, c.date].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {resume.languages.length > 0 && (
              <Section title="Languages">
                {resume.languages.map((l) => (
                  <p key={l.id} className="text-[12px] mb-1">
                    {l.name} <span style={{ color: muted }}>({l.proficiency})</span>
                  </p>
                ))}
              </Section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
