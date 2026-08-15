"use client";

import React from "react";
import { Resume, FormattedDescription, ContactRow } from "./shared";
import {
  fontFamilies,
  typography,
  spacing,
  layout,
  formatDuration,
} from "@/lib/resume-design-system";

const C = {
  ink:        "#111827",
  body:       "#1f2937",
  muted:      "#6b7280",
  light:      "#9ca3af",
  accent:     "#7c3aed",
  accentSoft: "#ede9fe",
  accentBd:   "#c4b5fd",
  border:     "#e5e7eb",
  white:      "#ffffff",
};

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: spacing[3], marginBottom: spacing[4] }}>
      <h2 style={{ ...typography.section, color: C.accent, margin: 0, whiteSpace: "nowrap" }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
    </div>
  );
}

function EntryHeader({
  primary, secondary, tertiary, date,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  tertiary?: React.ReactNode;
  date?: string;
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>
          {primary}
        </span>
        {date && <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>{date}</span>}
      </div>
      {secondary && <p style={{ ...typography.body, fontWeight: 600, color: C.accent, marginTop: 1 }}>{secondary}</p>}
      {tertiary && <p style={{ ...typography.caption, color: C.muted, marginTop: 1 }}>{tertiary}</p>}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function CreativeProfessionalPreview({ resume }: { resume: Resume }) {
  const contactParts = [
    resume.email,
    resume.phone,
    resume.address,
    resume.social?.linkedin,
    resume.social?.github,
    resume.social?.portfolio || resume.social?.website,
  ].filter(Boolean) as string[];

  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none"
      style={{ fontFamily: fontFamilies.jakarta, color: C.body, maxWidth: layout.pageWidth, padding: `${spacing[8]} ${layout.marginH}` }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{ marginBottom: spacing[6] }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, color: C.ink, letterSpacing: "-0.03em", lineHeight: 1.05, margin: 0 }}>
          {resume.name || "Your Name"}
        </h1>
        {resume.title && (
          <p style={{ fontSize: "0.9375rem", fontWeight: 600, color: C.accent, marginTop: spacing[1], letterSpacing: "0.01em" }}>
            {resume.title}
          </p>
        )}
        {contactParts.length > 0 && (
          <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[2], lineHeight: 1.8 }}>
            <ContactRow parts={contactParts} linkedin={resume.social?.linkedin} github={resume.social?.github} />
          </p>
        )}
      </header>

      {/* ── SUMMARY ────────────────────────────────────────────────── */}
      {resume.summary && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>About</SectionHeading>
          <div style={{ ...typography.body, color: C.body, lineHeight: 1.8 }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ─────────────────────────────────────────────── */}
      {resume.experience.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Experience</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
            {resume.experience.map((exp) => (
              <article key={exp.id} className="break-inside-avoid">
                <EntryHeader
                  primary={exp.position || exp.company}
                  secondary={exp.position ? <>{exp.company}{exp.location && <span style={{ color: C.muted, fontWeight: 400 }}> · {exp.location}</span>}</> : exp.location || undefined}
                  tertiary={exp.employmentType}
                  date={formatDuration(exp.duration, exp.startDate, exp.endDate)}
                />
                {exp.description && (
                  <div style={{ marginTop: spacing[2] }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul style={{ margin: `${spacing[2]} 0 0 ${spacing[4]}`, padding: 0, listStyleType: "disc", ...typography.body, color: C.body }}>
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ marginBottom: 3, lineHeight: 1.65 }}>{bp}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── PROJECTS (Selected Work) ────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Selected Work</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
            {resume.projects.map((p) => (
              <article key={p.id} className="break-inside-avoid" style={{ borderLeft: `2px solid ${C.accent}`, paddingLeft: spacing[3] }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink }}>
                    {p.name}
                    {p.status === "In Progress" && (
                      <span style={{ marginLeft: 6, fontSize: "0.5625rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: C.accent }}>
                        In Progress
                      </span>
                    )}
                  </span>
                  {p.startDate && <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>{formatDuration(undefined, p.startDate, p.endDate)}</span>}
                </div>
                {p.role && <p style={{ ...typography.body, fontWeight: 600, color: C.accent, marginTop: 2 }}>{p.role}</p>}
                {p.tech && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: spacing[1] }}>
                    {p.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <span key={i} style={{ ...typography.caption, fontWeight: 500, color: C.accent, backgroundColor: C.accentSoft, border: `1px solid ${C.accentBd}`, borderRadius: 3, paddingInline: 6, paddingBlock: 2 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                {p.description && <div style={{ marginTop: spacing[2] }}><FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} /></div>}
                {p.bulletPoints && p.bulletPoints.length > 0 && (
                  <ul style={{ margin: `${spacing[2]} 0 0 ${spacing[4]}`, padding: 0, listStyleType: "disc", ...typography.body, color: C.body }}>
                    {p.bulletPoints.map((bp, i) => <li key={i} style={{ marginBottom: 3, lineHeight: 1.65 }}>{bp}</li>)}
                  </ul>
                )}
                {p.link && <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[1] }}>{p.link}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── SKILLS ─────────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Skills</SectionHeading>
          <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[2] }}>
            {resume.skills.map((s) => (
              <span key={s.id} style={{ ...typography.caption, fontWeight: 500, color: C.accent, backgroundColor: C.accentSoft, border: `1px solid ${C.accentBd}`, borderRadius: 4, paddingInline: 10, paddingBlock: 4 }}>
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── EDUCATION ──────────────────────────────────────────────── */}
      {resume.education.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Education</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {resume.education.map((edu) => (
              <article key={edu.id} className="break-inside-avoid">
                <EntryHeader
                  primary={edu.school}
                  secondary={<>{edu.degree}{edu.field && ` in ${edu.field}`}{edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}</>}
                  date={edu.year}
                />
                {edu.honors && <p style={{ ...typography.caption, color: C.muted, marginTop: 2, fontStyle: "italic" }}>{edu.honors}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── CERTIFICATIONS ─────────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Certifications</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
            {resume.certifications.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                <span style={{ ...typography.body, fontWeight: 600, color: C.ink }}>{c.name}</span>
                {(c.issuer || c.date) && <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>{[c.issuer, c.date].filter(Boolean).join(" · ")}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ACHIEVEMENTS ───────────────────────────────────────────── */}
      {resume.achievements.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Achievements</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
            {resume.achievements.map((a) => (
              <p key={a.id} style={{ ...typography.body, color: C.body }}>
                {a.title && <strong style={{ fontWeight: 700 }}>{a.title}{a.description ? " — " : ""}</strong>}
                {a.description}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* ── LANGUAGES ──────────────────────────────────────────────── */}
      {resume.languages.length > 0 && (
        <section>
          <SectionHeading>Languages</SectionHeading>
          <p style={{ ...typography.body, color: C.body, lineHeight: 1.7 }}>
            {resume.languages.map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name)).join("  ·  ")}
          </p>
        </section>
      )}
    </div>
  );
}
