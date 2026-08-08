"use client";
import { Resume, FormattedDescription, SocialLinks } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";

export function DarkElegancePreview({ resume }: { resume: Resume }) {
  const ink = "#111827";
  const accent = "#1e293b";
  const muted = "#4b5563";
  const rule = "#e2e8f0";
  const subtleBg = "#f8fafc";

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="mb-6 break-inside-avoid">
      <h2
        className="text-[10px] font-bold uppercase tracking-[0.22em] mb-3 pb-2 border-b"
        style={{ color: accent, borderColor: rule }}
      >
        {title}
      </h2>
      {children}
    </section>
  );

  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none overflow-hidden"
      style={{ fontFamily: fontFamilies.sans, color: ink }}
    >
      {/* Header — charcoal left border accent, white background */}
      <header
        className="px-8 py-7 border-l-4"
        style={{ borderLeftColor: accent, backgroundColor: subtleBg, borderBottom: `1px solid ${rule}` }}
      >
        <h1
          className="text-[2rem] font-bold tracking-tight leading-none"
          style={{ color: ink }}
        >
          {resume.name || "Your Name"}
        </h1>
        <p
          className="mt-2 text-[13px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: muted }}
        >
          {resume.title || "Professional Title"}
        </p>

        {/* Contact row — no emojis for ATS */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[11px]" style={{ color: muted }}>
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.address && <span>{resume.address}</span>}
          {resume.nationality && <span>{resume.nationality}</span>}
        </div>

        {resume.social && (
          <div className="mt-2">
            <SocialLinks social={resume.social} color={muted} size="xs" />
          </div>
        )}
      </header>

      <main className="px-8 py-7">
        {resume.summary && (
          <Section title="Profile">
            <div className="text-[12.5px] leading-relaxed" style={{ color: ink }}>
              <FormattedDescription text={resume.summary} color={ink} mutedColor={muted} size="sm" />
            </div>
          </Section>
        )}

        {resume.experience.length > 0 && (
          <Section title="Experience">
            <div className="space-y-5">
              {resume.experience.map((e) => (
                <article key={e.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[13px] font-semibold" style={{ color: ink }}>
                      {e.position}
                    </h3>
                    <span className="shrink-0 text-[11px]" style={{ color: muted }}>
                      {e.duration || [e.startDate, e.endDate || "Present"].filter(Boolean).join(" – ")}
                    </span>
                  </div>
                  <p className="text-[12px] font-medium mt-0.5" style={{ color: muted }}>
                    {e.company}
                    {e.location && <span className="font-normal"> · {e.location}</span>}
                  </p>
                  {e.description && (
                    <div className="mt-1.5 text-[12px] leading-relaxed">
                      <FormattedDescription text={e.description} color={ink} mutedColor={muted} />
                    </div>
                  )}
                  {e.bulletPoints && e.bulletPoints.length > 0 && (
                    <ul className="mt-1.5 ml-4 list-disc list-outside space-y-0.5 text-[12px] leading-relaxed" style={{ color: ink }}>
                      {e.bulletPoints.map((bp, i) => <li key={i}>{bp}</li>)}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        {resume.education.length > 0 && (
          <Section title="Education">
            <div className="space-y-3">
              {resume.education.map((e) => (
                <article key={e.id} className="flex items-baseline justify-between gap-4 break-inside-avoid">
                  <div>
                    <h3 className="text-[13px] font-semibold" style={{ color: ink }}>{e.school}</h3>
                    <p className="text-[12px] mt-0.5" style={{ color: muted }}>
                      {e.degree}{e.field && ` in ${e.field}`}
                      {e.honors && ` · ${e.honors}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px]" style={{ color: muted }}>
                    {e.year}{e.gpa && ` · GPA ${e.gpa}`}
                  </span>
                </article>
              ))}
            </div>
          </Section>
        )}

        {resume.skills.length > 0 && (
          <Section title="Skills">
            <div className="flex flex-wrap gap-x-5 gap-y-1.5">
              {resume.skills.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 text-[12px]">
                  <span
                    className="inline-block w-1 h-1 rounded-full shrink-0"
                    style={{ backgroundColor: accent }}
                    aria-hidden
                  />
                  <span style={{ color: ink }}>{s.name}</span>
                  {s.level && (
                    <span className="text-[11px]" style={{ color: muted }}>({s.level})</span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {resume.projects.length > 0 && (
          <Section title="Projects">
            <div className="space-y-4">
              {resume.projects.map((p) => (
                <article key={p.id} className="break-inside-avoid">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[13px] font-semibold" style={{ color: ink }}>{p.name}</h3>
                    {p.tech && (
                      <span className="shrink-0 text-[11px]" style={{ color: muted }}>{p.tech}</span>
                    )}
                  </div>
                  {p.role && (
                    <p className="text-[12px] font-medium mt-0.5" style={{ color: muted }}>{p.role}</p>
                  )}
                  {p.description && (
                    <div className="mt-1 text-[12px] leading-relaxed">
                      <FormattedDescription text={p.description} color={ink} mutedColor={muted} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </Section>
        )}

        {resume.certifications.length > 0 && (
          <Section title="Certifications">
            <div className="space-y-1.5">
              {resume.certifications.map((c) => (
                <div key={c.id} className="flex items-baseline justify-between gap-4 text-[12px] break-inside-avoid">
                  <span className="font-medium" style={{ color: ink }}>{c.name}</span>
                  <span className="shrink-0" style={{ color: muted }}>
                    {[c.issuer, c.date].filter(Boolean).join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {resume.achievements.length > 0 && (
          <Section title="Achievements">
            <div className="space-y-1">
              {resume.achievements.map((a) => (
                <p key={a.id} className="text-[12px] leading-relaxed" style={{ color: ink }}>
                  {a.description}
                </p>
              ))}
            </div>
          </Section>
        )}

        <div className="grid grid-cols-2 gap-x-10">
          {resume.languages.length > 0 && (
            <Section title="Languages">
              {resume.languages.map((l) => (
                <p key={l.id} className="text-[12px] mb-1" style={{ color: ink }}>
                  {l.name}
                  <span className="ml-1.5" style={{ color: muted }}>({l.proficiency})</span>
                </p>
              ))}
            </Section>
          )}

          {resume.interests.length > 0 && (
            <Section title="Interests">
              <p className="text-[12px]" style={{ color: muted }}>
                {resume.interests.map((i) => i.name).join(", ")}
              </p>
            </Section>
          )}
        </div>

        {resume.references.length > 0 && (
          <Section title="References">
            {resume.references.map((r) => (
              <p key={r.id} className="text-[12px] mb-1" style={{ color: ink }}>
                <span className="font-medium">{r.name}</span>
                {r.position && <span style={{ color: muted }}> — {r.position}</span>}
                {r.company && <span style={{ color: muted }}>, {r.company}</span>}
              </p>
            ))}
          </Section>
        )}
      </main>
    </div>
  );
}
