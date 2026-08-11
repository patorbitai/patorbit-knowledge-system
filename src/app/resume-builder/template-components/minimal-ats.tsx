"use client";

import React from "react";
import { Resume, FormattedDescription } from "./shared";
import {
  fontFamilies,
  typography,
  spacing,
  layout,
  formatDuration,
} from "@/lib/resume-design-system";

// ── Design tokens — Minimal ATS ───────────────────────────────────────────────
// Strictly monochrome. Zero accent color. Every value from the design system.
const C = {
  ink:    "#0f172a",
  body:   "#1e293b",
  muted:  "#64748b",
  border: "#e2e8f0",
  white:  "#ffffff",
};

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: C.muted,
        borderBottom: `1px solid ${C.border}`,
        paddingBottom: spacing[2],
        marginBottom: spacing[4],
        marginTop: 0,
      }}
    >
      {children}
    </h2>
  );
}

function EntryHeader({
  primary,
  secondary,
  date,
}: {
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  date?: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: spacing[3],
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 700,
            color: C.ink,
            lineHeight: 1.3,
          }}
        >
          {primary}
        </span>
        {date && (
          <span
            style={{
              flexShrink: 0,
              ...typography.caption,
              color: C.muted,
            }}
          >
            {date}
          </span>
        )}
      </div>
      {secondary && (
        <p
          style={{
            ...typography.body,
            color: C.body,
            marginTop: 2,
          }}
        >
          {secondary}
        </p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function MinimalAtsPreview({ resume }: { resume: Resume }) {
  // Inline contact fields, separated by ·
  const contactParts = [
    resume.email,
    resume.phone,
    resume.address,
    resume.nationality,
    resume.social?.linkedin,
    resume.social?.github,
    resume.social?.website,
    resume.social?.portfolio,
  ].filter(Boolean) as string[];

  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none"
      style={{
        fontFamily: fontFamilies.jakarta,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: `${spacing[8]} ${layout.marginH}`,
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{ marginBottom: spacing[6] }}>
        <h1
          style={{
            fontSize: "1.75rem",
            fontWeight: 800,
            color: C.ink,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {resume.name || "Your Name"}
        </h1>

        {resume.title && (
          <p
            style={{
              fontSize: "0.9375rem",
              fontWeight: 500,
              color: C.body,
              marginTop: spacing[1],
              letterSpacing: "-0.01em",
            }}
          >
            {resume.title}
          </p>
        )}

        {contactParts.length > 0 && (
          <p
            style={{
              ...typography.caption,
              color: C.muted,
              marginTop: spacing[2],
              lineHeight: 1.6,
            }}
          >
            {contactParts.join("  ·  ")}
          </p>
        )}
      </header>

      {/* ── SUMMARY ────────────────────────────────────────────────── */}
      {resume.summary && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Summary</SectionHeading>
          <div style={{ ...typography.body, color: C.body, lineHeight: 1.7 }}>
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
                  primary={exp.company}
                  secondary={
                    <>
                      {exp.position}
                      {exp.location && (
                        <span style={{ color: C.muted, fontWeight: 400 }}> · {exp.location}</span>
                      )}
                    </>
                  }
                  date={formatDuration(exp.duration, exp.startDate, exp.endDate)}
                />
                {exp.description && (
                  <div style={{ marginTop: spacing[2] }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul
                    style={{
                      margin: `${spacing[2]} 0 0 ${spacing[4]}`,
                      padding: 0,
                      listStyleType: "disc",
                      ...typography.body,
                      color: C.body,
                    }}
                  >
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{bp}</li>
                    ))}
                  </ul>
                )}
              </article>
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
                  secondary={
                    <>
                      {edu.degree}{edu.field && ` in ${edu.field}`}
                      {edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}
                    </>
                  }
                  date={edu.year}
                />
                {edu.honors && (
                  <p style={{ ...typography.caption, color: C.muted, marginTop: 2, fontStyle: "italic" }}>
                    {edu.honors}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── PROJECTS ───────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Projects</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {resume.projects.map((p) => (
              <article key={p.id} className="break-inside-avoid">
                <EntryHeader
                  primary={p.name}
                  secondary={p.role}
                  date={p.startDate ? formatDuration(undefined, p.startDate, p.endDate) : undefined}
                />
                {p.tech && (
                  <p style={{ ...typography.caption, color: C.muted, marginTop: 2 }}>
                    {p.tech}
                  </p>
                )}
                {p.description && (
                  <div style={{ marginTop: spacing[2] }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── SKILLS ─────────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Skills</SectionHeading>
          <p style={{ ...typography.body, color: C.body, lineHeight: 1.7 }}>
            {resume.skills.map((s) => s.name).join("  ·  ")}
          </p>
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
                {(c.issuer || c.date) && (
                  <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>
                    {[c.issuer, c.date].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── LANGUAGES ──────────────────────────────────────────────── */}
      {resume.languages.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Languages</SectionHeading>
          <p style={{ ...typography.body, color: C.body, lineHeight: 1.7 }}>
            {resume.languages.map((l) =>
              l.proficiency ? `${l.name} (${l.proficiency})` : l.name
            ).join("  ·  ")}
          </p>
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

      {/* ── REFERENCES ─────────────────────────────────────────────── */}
      {resume.references.length > 0 && (
        <section>
          <SectionHeading>References</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
            {resume.references.map((r) => (
              <div key={r.id}>
                <span style={{ ...typography.body, fontWeight: 700, color: C.ink }}>{r.name}</span>
                {r.position && (
                  <span style={{ ...typography.body, color: C.muted }}>
                    {" — "}{r.position}{r.company && `, ${r.company}`}
                  </span>
                )}
                {r.email && (
                  <p style={{ ...typography.caption, color: C.muted, marginTop: 1 }}>{r.email}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
