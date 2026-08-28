"use client";

import React from "react";
import { Resume, FormattedDescription, SocialLink } from "./shared";
import {
  fontFamilies,
  typography,
  spacing,
  layout,
  formatDuration,
} from "@/lib/resume-design-system";

// ── Design tokens — Patorbit Modern ─────────────────────────────────────────
const colors = {
  ink:      "#0f172a",
  body:     "#1e293b",
  muted:    "#64748b",
  light:    "#94a3b8",
  accent:   "#2563eb",
  accentBg: "#eff6ff",
  border:   "#e2e8f0",
  divider:  "#f1f5f9",
  surface:  "#f8fafc",
  white:    "#ffffff",
};

// ── Local primitives ──────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        ...typography.section,
        color: colors.accent,
        borderBottom: `1.5px solid ${colors.accent}`,
        paddingBottom: spacing[1],
        marginBottom: spacing[2],
      }}
    >
      {children}
    </h2>
  );
}

function EntryRow({
  left,
  right,
}: {
  left: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
      <div style={{ minWidth: 0, flex: 1 }}>{left}</div>
      {right && (
        <div style={{ flexShrink: 0, ...typography.caption, color: colors.muted }}>
          {right}
        </div>
      )}
    </div>
  );
}

function TimelineDot() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        backgroundColor: colors.accent,
        flexShrink: 0,
        marginTop: 5,
      }}
    />
  );
}

function SkillChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...typography.caption,
        fontWeight: 500,
        color: colors.body,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 4,
        paddingInline: 9,
        paddingBlock: 3,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function PatorbitModernPreview({ resume }: { resume: Resume }) {
  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none"
      style={{
        fontFamily: fontFamilies.jakarta,
        color: colors.body,
        maxWidth: layout.pageWidth,
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header
        style={{
          padding: `${spacing[4]} ${layout.marginH} ${spacing[3]}`,
          borderBottom: `2px solid ${colors.accent}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[3] }}>
          {/* Name + title */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                ...typography.display,
                color: colors.ink,
                margin: 0,
              }}
            >
              {resume.name || "Your Name"}
            </h1>
            <p
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: colors.accent,
                marginTop: spacing[1],
                letterSpacing: "0.01em",
              }}
            >
              {resume.title || "Professional Title"}
            </p>
          </div>

          {/* Contact block */}
          <address
            style={{
              ...typography.caption,
              color: colors.muted,
              textAlign: "right",
              lineHeight: 1.8,
              fontStyle: "normal",
              flexShrink: 0,
            }}
          >
            {resume.email && <div>{resume.email}</div>}
            {resume.phone && <div>{resume.phone}</div>}
            {resume.address && <div>{resume.address}</div>}
            {resume.nationality && <div>{resume.nationality}</div>}
            {resume.social && (resume.social.linkedin || resume.social.github || resume.social.website || resume.social.portfolio) && (
              <div style={{ marginTop: 0, textAlign: "right", ...typography.caption, color: colors.muted, lineHeight: 1.6 }}>
                {resume.social.linkedin && <div><SocialLink href={resume.social.linkedin} /></div>}
                {resume.social.github && <div><SocialLink href={resume.social.github} /></div>}
                {resume.social.website && <div>{resume.social.website.replace(/^https?:\/\//, "")}</div>}
                {resume.social.portfolio && <div>{resume.social.portfolio.replace(/^https?:\/\//, "")}</div>}
              </div>
            )}
          </address>
        </div>
      </header>

      {/* ── BODY ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 260px",
          gap: layout.columnGap,
          padding: `${spacing[3]} ${layout.marginH}`,
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN ── */}
        <div>
          {/* Summary */}
          {resume.summary && (
            <section style={{ marginBottom: spacing[2] }}>
              <SectionTitle>Professional Profile</SectionTitle>
              <div style={{ ...typography.body, color: colors.body, lineHeight: 1.6 }}>
                <FormattedDescription text={resume.summary} color={colors.body} mutedColor={colors.muted} size="sm" />
              </div>
            </section>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Experience</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
                {resume.experience.map((exp) => (
                  <article
                    key={exp.id}
                    style={{
                      display: "flex",
                      gap: spacing[2],
                    }}
                  >
                    <TimelineDot />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <EntryRow
                        left={
                          <h3
                            style={{
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              color: colors.ink,
                              margin: 0,
                            }}
                          >
                            {exp.position}
                          </h3>
                        }
                        right={formatDuration(exp.duration, exp.startDate, exp.endDate)}
                      />
                      <p
                        style={{
                          ...typography.label,
                          color: colors.accent,
                          marginTop: 2,
                          marginBottom: exp.description ? spacing[2] : 0,
                        }}
                      >
                        {exp.company}
                        {exp.location && (
                          <span style={{ color: colors.muted, fontWeight: 400 }}>
                            {" "}· {exp.location}
                          </span>
                        )}
                      </p>
                      {exp.description && (
                        <FormattedDescription text={exp.description} color={colors.body} mutedColor={colors.muted} />
                      )}
                      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                        <ul
                          style={{
                            margin: `${spacing[2]} 0 0 ${spacing[4]}`,
                            padding: 0,
                            listStyleType: "disc",
                            ...typography.body,
                            color: colors.body,
                          }}
                        >
                          {exp.bulletPoints.map((bp, i) => (
                            <li key={i} style={{ marginBottom: 3, lineHeight: 1.65 }}>{bp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Projects</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
                {resume.projects.map((p) => (
                  <article key={p.id}>
                    <EntryRow
                      left={
                        <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: colors.ink, margin: 0 }}>
                          {p.name}
                        </h3>
                      }
                      right={p.startDate ? formatDuration(undefined, p.startDate, p.endDate) : undefined}
                    />
                    {p.role && (
                      <p style={{ ...typography.label, color: colors.muted, marginTop: 2 }}>{p.role}</p>
                    )}
                    {p.tech && (
                      <p style={{ ...typography.caption, color: colors.light, marginTop: 2 }}>{p.tech}</p>
                    )}
                    {p.description && (
                      <div style={{ marginTop: spacing[2] }}>
                        <FormattedDescription text={p.description} color={colors.body} mutedColor={colors.muted} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Achievements */}
          {resume.achievements.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Achievements</SectionTitle>
              {resume.achievements.map((a) => (
                <p
                  key={a.id}
                  style={{ ...typography.body, color: colors.body, marginBottom: spacing[1] }}
                >
                  {a.title && <strong style={{ fontWeight: 700, color: colors.ink }}>{a.title}{a.description ? " — " : ""}</strong>}
                  {a.description}
                </p>
              ))}
            </section>
          )}
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div>
          {/* Education */}
          {resume.education.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Education</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
                {resume.education.map((edu) => (
                  <article key={edu.id}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: colors.ink }}>{edu.school}</p>
                    <p style={{ ...typography.body, color: colors.body, marginTop: 2 }}>
                      {edu.degree}{edu.field && ` in ${edu.field}`}
                    </p>
                    <p style={{ ...typography.caption, color: colors.muted, marginTop: 2 }}>
                      {edu.year}{edu.gpa && ` · GPA ${edu.gpa}`}
                    </p>
                    {edu.honors && (
                      <p style={{ ...typography.caption, color: colors.light, fontStyle: "italic", marginTop: 1 }}>
                        {edu.honors}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Skills */}
          {resume.skills.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Skills</SectionTitle>
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[1] }}>
                {resume.skills.map((s) => (
                  <SkillChip key={s.id}>{s.name}</SkillChip>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {resume.certifications.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Certifications</SectionTitle>
              {resume.certifications.map((c) => (
                <div key={c.id} style={{ marginBottom: spacing[3] }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.ink }}>{c.name}</p>
                  {(c.issuer || c.date) && (
                    <p style={{ ...typography.caption, color: colors.muted, marginTop: 2 }}>
                      {[c.issuer, c.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )}

          {/* Languages */}
          {resume.languages.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Languages</SectionTitle>
              {resume.languages.map((l) => (
                <div
                  key={l.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    ...typography.body,
                    marginBottom: spacing[1],
                  }}
                >
                  <span style={{ color: colors.body }}>{l.name}</span>
                  <span style={{ color: colors.muted }}>{l.proficiency}</span>
                </div>
              ))}
            </section>
          )}

          {/* Interests */}
          {resume.interests.length > 0 && (
            <section style={{ marginBottom: spacing[3] }}>
              <SectionTitle>Interests</SectionTitle>
              <p style={{ ...typography.body, color: colors.muted }}>
                {resume.interests.map((i) => i.name).join(" · ")}
              </p>
            </section>
          )}

          {/* References */}
          {resume.references.length > 0 && (
            <section style={{ marginTop: spacing[3] }}>
              <SectionTitle>References</SectionTitle>
              {resume.references.map((r) => (
                <div key={r.id} style={{ marginBottom: spacing[3] }}>
                  <p style={{ fontSize: "0.8rem", fontWeight: 600, color: colors.ink }}>{r.name}</p>
                  {r.position && (
                    <p style={{ ...typography.caption, color: colors.muted }}>{r.position}{r.company && `, ${r.company}`}</p>
                  )}
                  {r.email && (
                    <p style={{ ...typography.caption, color: colors.light }}>{r.email}</p>
                  )}
                </div>
              ))}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
