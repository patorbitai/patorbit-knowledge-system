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

// ── Design tokens — Engineering Clean ────────────────────────────────────────
const C = {
  ink:    "#0f172a",
  body:   "#1e293b",
  muted:  "#64748b",
  light:  "#94a3b8",
  border: "#e2e8f0",
  tag:    "#f1f5f9",
  white:  "#ffffff",
};

// ── Grouped skill logic ───────────────────────────────────────────────────────
// Canonical engineering categories in display order.
const SKILL_GROUP_ORDER = [
  "Languages",
  "Frameworks",
  "Cloud",
  "Databases",
  "DevOps",
  "AI/ML",
  "Tools",
];

function groupSkills(skills: Resume["skills"]): [string, string[]][] {
  const map = new Map<string, string[]>();

  for (const s of skills) {
    const raw = (s.category || "").trim();
    // Normalise to canonical bucket or fall through to "Tools"
    const bucket =
      SKILL_GROUP_ORDER.find(
        (g) => g.toLowerCase() === raw.toLowerCase()
      ) ?? (raw || "Tools");
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(s.name);
  }

  // Sort buckets by canonical order, then alphabetically for unknown ones
  const sorted = [...map.entries()].sort(([a], [b]) => {
    const ia = SKILL_GROUP_ORDER.indexOf(a);
    const ib = SKILL_GROUP_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });

  return sorted;
}

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: "0.625rem",
        fontWeight: 700,
        letterSpacing: "0.18em",
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

function TechTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "0.625rem",
        fontWeight: 500,
        color: C.muted,
        backgroundColor: C.tag,
        border: `1px solid ${C.border}`,
        borderRadius: 3,
        paddingInline: 6,
        paddingBlock: 2,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: spacing[3],
        }}
      >
        <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>
          {primary}
        </span>
        {date && (
          <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>
            {date}
          </span>
        )}
      </div>
      {secondary && (
        <p style={{ ...typography.body, color: C.body, marginTop: 2 }}>{secondary}</p>
      )}
      {tertiary && (
        <p style={{ ...typography.caption, color: C.light, marginTop: 2 }}>{tertiary}</p>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function EngineeringCleanPreview({ resume }: { resume: Resume }) {
  const skillGroups = groupSkills(resume.skills);

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
              letterSpacing: "-0.005em",
            }}
          >
            {resume.title}
          </p>
        )}

        {contactParts.length > 0 && (
          <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[2], lineHeight: 1.6 }}>
            <ContactRow parts={contactParts} linkedin={resume.social?.linkedin} github={resume.social?.github} />
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
                      {exp.employmentType && (
                        <span style={{ color: C.light, fontWeight: 400 }}> · {exp.employmentType}</span>
                      )}
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
                {exp.techUsed && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 4,
                      marginTop: spacing[2],
                    }}
                  >
                    {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <TechTag key={i}>{t}</TechTag>
                    ))}
                  </div>
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
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
            {resume.projects.map((p) => (
              <article
                key={p.id}
                className="break-inside-avoid"
                style={{
                  borderLeft: `2px solid ${C.border}`,
                  paddingLeft: spacing[3],
                }}
              >
                {/* Project name + date */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: spacing[3],
                  }}
                >
                  <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink }}>
                    {p.name}
                    {p.status === "In Progress" && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: "0.5625rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: C.muted,
                        }}
                      >
                        In Progress
                      </span>
                    )}
                  </span>
                  {p.startDate && (
                    <span style={{ flexShrink: 0, ...typography.caption, color: C.muted }}>
                      {formatDuration(undefined, p.startDate, p.endDate)}
                    </span>
                  )}
                </div>

                {/* Role */}
                {p.role && (
                  <p style={{ ...typography.body, color: C.body, marginTop: 2 }}>{p.role}</p>
                )}

                {/* Tech stack */}
                {p.tech && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: spacing[1] }}>
                    {p.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <TechTag key={i}>{t}</TechTag>
                    ))}
                  </div>
                )}

                {/* Description */}
                {p.description && (
                  <div style={{ marginTop: spacing[2] }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} />
                  </div>
                )}

                {/* Impact bullets */}
                {p.bulletPoints && p.bulletPoints.length > 0 && (
                  <ul
                    style={{
                      margin: `${spacing[2]} 0 0 ${spacing[4]}`,
                      padding: 0,
                      listStyleType: "disc",
                      ...typography.body,
                      color: C.body,
                    }}
                  >
                    {p.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ marginBottom: 2 }}>{bp}</li>
                    ))}
                  </ul>
                )}

                {/* Links */}
                {p.link && (
                  <p style={{ ...typography.caption, color: C.muted, marginTop: spacing[1] }}>
                    {p.link}
                  </p>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ── SKILLS (grouped) ───────────────────────────────────────── */}
      {skillGroups.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Technical Skills</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
            {skillGroups.map(([group, names]) => (
              <div
                key={group}
                style={{
                  display: "flex",
                  gap: spacing[3],
                  alignItems: "baseline",
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    minWidth: 80,
                    maxWidth: 110,
                    ...typography.caption,
                    fontWeight: 600,
                    color: C.ink,
                  }}
                >
                  {group}
                </span>
                <span style={{ ...typography.body, color: C.body, lineHeight: 1.6 }}>
                  {names.join("  ·  ")}
                </span>
              </div>
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

      {/* ── CERTIFICATIONS ─────────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Certifications</SectionHeading>
          <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
            {resume.certifications.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  gap: spacing[3],
                }}
              >
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
        <section style={{ marginBottom: spacing[6] }}>
          <SectionHeading>Languages</SectionHeading>
          <p style={{ ...typography.body, color: C.body, lineHeight: 1.7 }}>
            {resume.languages
              .map((l) => (l.proficiency ? `${l.name} (${l.proficiency})` : l.name))
              .join("  ·  ")}
          </p>
        </section>
      )}

      {/* ── INTERESTS ──────────────────────────────────────────────── */}
      {resume.interests.length > 0 && (
        <section>
          <SectionHeading>Interests</SectionHeading>
          <p style={{ ...typography.body, color: C.muted }}>
            {resume.interests.map((i) => i.name).join("  ·  ")}
          </p>
        </section>
      )}
    </div>
  );
}
