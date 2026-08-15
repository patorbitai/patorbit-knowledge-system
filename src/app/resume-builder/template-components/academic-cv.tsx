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

// ── Design tokens — Academic CV ───────────────────────────────────────────────
const C = {
  ink:    "#0f172a",
  body:   "#1e293b",
  muted:  "#475569",
  light:  "#94a3b8",
  accent: "#1e3a5f",
  border: "#cbd5e1",
  rule:   "#1e3a5f",
  white:  "#ffffff",
};

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        ...typography.section,
        color: C.accent,
        borderBottom: `1.5px solid ${C.accent}`,
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
  tertiary,
  date,
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
      {secondary && <p style={{ ...typography.body, fontWeight: 500, color: C.body, marginTop: 1 }}>{secondary}</p>}
      {tertiary && <p style={{ ...typography.caption, color: C.muted, marginTop: 1 }}>{tertiary}</p>}
    </div>
  );
}

// Publications use projects where category === "Publication" (or all projects when
// none are categorised). Conferences use achievements where issuer is set.
function partitionProjects(projects: Resume["projects"]) {
  const hasCategories = projects.some((p) => (p as any).category);
  if (!hasCategories) return { publications: projects, other: [] };
  const publications = projects.filter((p) => (p as any).category?.toLowerCase() === "publication");
  const other = projects.filter((p) => (p as any).category?.toLowerCase() !== "publication");
  return { publications, other };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function AcademicCvPreview({ resume }: { resume: Resume }) {
  const { publications, other: researchProjects } = partitionProjects(resume.projects);

  const contactParts = [
    resume.email,
    resume.phone,
    resume.address,
    resume.social?.linkedin,
    resume.social?.github,
    resume.social?.website,
    resume.social?.portfolio,
  ].filter(Boolean) as string[];

  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none"
      style={{
        fontFamily: fontFamilies.garamond,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: `${spacing[8]} ${layout.marginH}`,
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header style={{ marginBottom: spacing[6], textAlign: "center" }}>
        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            color: C.ink,
            letterSpacing: "-0.01em",
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
              fontWeight: 400,
              color: C.muted,
              marginTop: spacing[1],
              fontStyle: "italic",
            }}
          >
            {resume.title}
          </p>
        )}

        {contactParts.length > 0 && (
          <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[2], lineHeight: 1.8 }}>
            <ContactRow parts={contactParts} linkedin={resume.social?.linkedin} github={resume.social?.github} />
          </p>
        )}

        <div style={{ width: 40, height: 2, backgroundColor: C.accent, borderRadius: 1, margin: `${spacing[3]} auto 0` }} />
      </header>

      {/* ── RESEARCH SUMMARY ───────────────────────────────────────── */}
      {resume.summary && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Research Summary</SectionHeading>
          <div style={{ ...typography.body, color: C.body, lineHeight: 1.8 }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ─────────────────────────────────────────────── */}
      {resume.experience.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Academic Positions</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
            {resume.experience.map((exp) => (
              <article key={exp.id} className="break-inside-avoid">
                <EntryHeader
                  primary={exp.position || exp.company}
                  secondary={
                    exp.position
                      ? <>{exp.company}{exp.location && <span style={{ color: C.muted, fontWeight: 400 }}> · {exp.location}</span>}</>
                      : exp.location || undefined
                  }
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
                      <li key={i} style={{ marginBottom: 3, lineHeight: 1.7 }}>{bp}</li>
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
                    <>{edu.degree}{edu.field && ` in ${edu.field}`}{edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}</>
                  }
                  date={edu.year}
                />
                {edu.honors && (
                  <p style={{ ...typography.caption, color: C.muted, marginTop: 2, fontStyle: "italic" }}>{edu.honors}</p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── PUBLICATIONS (projects categorised as Publication, or all projects) */}
      {publications.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Publications</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {publications.map((p) => (
              <article key={p.id} className="break-inside-avoid">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, lineHeight: 1.4 }}>{p.name}</span>
                  {p.startDate && <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>{formatDuration(undefined, p.startDate, p.endDate)}</span>}
                </div>
                {p.role && <p style={{ ...typography.body, fontStyle: "italic", color: C.muted, marginTop: 1 }}>{p.role}</p>}
                {p.description && (
                  <div style={{ marginTop: spacing[1] }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} />
                  </div>
                )}
                {p.link && <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[1] }}>{p.link}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── RESEARCH PROJECTS ──────────────────────────────────────── */}
      {researchProjects.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Research Projects</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
            {researchProjects.map((p) => (
              <article key={p.id} className="break-inside-avoid">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink }}>{p.name}</span>
                  {p.startDate && <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>{formatDuration(undefined, p.startDate, p.endDate)}</span>}
                </div>
                {p.role && <p style={{ ...typography.body, fontWeight: 500, color: C.body, marginTop: 1 }}>{p.role}</p>}
                {p.description && (
                  <div style={{ marginTop: spacing[2] }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} />
                  </div>
                )}
                {p.bulletPoints && p.bulletPoints.length > 0 && (
                  <ul style={{ margin: `${spacing[2]} 0 0 ${spacing[4]}`, padding: 0, listStyleType: "disc", ...typography.body, color: C.body }}>
                    {p.bulletPoints.map((bp, i) => <li key={i} style={{ marginBottom: 3, lineHeight: 1.7 }}>{bp}</li>)}
                  </ul>
                )}
                {p.link && <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[1] }}>{p.link}</p>}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── AWARDS & GRANTS (achievements) ─────────────────────────── */}
      {resume.achievements.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Awards, Grants &amp; Honours</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
            {resume.achievements.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                <div>
                  {a.title && <span style={{ ...typography.body, fontWeight: 700, color: C.ink }}>{a.title}</span>}
                  {a.description && (
                    <span style={{ ...typography.body, color: C.body }}>
                      {a.title ? " — " : ""}{a.description}
                    </span>
                  )}
                  {a.issuer && <span style={{ ...typography.caption, color: C.muted, display: "block", marginTop: 1 }}>{a.issuer}</span>}
                </div>
                {a.date && <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>{a.date}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CERTIFICATIONS ─────────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Certifications &amp; Training</SectionHeading>
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

      {/* ── SKILLS ─────────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Skills &amp; Expertise</SectionHeading>
          <p style={{ ...typography.body, color: C.body, lineHeight: 1.8 }}>
            {resume.skills.map((s) => s.name).join("  ·  ")}
          </p>
        </section>
      )}

      {/* ── LANGUAGES ──────────────────────────────────────────────── */}
      {resume.languages.length > 0 && (
        <section>
          <SectionHeading>Languages</SectionHeading>
          <p style={{ ...typography.body, color: C.body, lineHeight: 1.8 }}>
            {resume.languages.map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name)).join("  ·  ")}
          </p>
        </section>
      )}
    </div>
  );
}
