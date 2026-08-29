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

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  // Sidebar
  sidebarBg:    "#1a1f2e",
  sidebarText:  "#e2e5ec",
  sidebarMuted: "#8b93a7",
  sidebarBorder:"#2e3547",
  // Gold accent
  gold:         "#c9a84c",
  goldLight:    "#e8c97e",
  goldDim:      "#8a6f2e",
  // Main body
  ink:          "#0f1520",
  body:         "#1e2535",
  muted:        "#5a6478",
  light:        "#8b93a7",
  border:       "#dde1ea",
  divider:      "#eef0f5",
  surface:      "#f7f8fb",
  white:        "#ffffff",
};

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing[2],
        marginBottom: spacing[3],
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: 18,
          height: 2,
          backgroundColor: C.gold,
          flexShrink: 0,
        }}
      />
      <h2
        style={{
          ...typography.section,
          color: C.muted,
          letterSpacing: "0.16em",
        }}
      >
        {children}
      </h2>
    </div>
  );
}

function DateBadge({ text }: { text: string }) {
  return (
    <span
      style={{
        flexShrink: 0,
        fontSize: "0.625rem",
        fontWeight: 500,
        color: C.muted,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

function GoldDivider() {
  return (
    <div
      style={{
        height: 1,
        background: `linear-gradient(to right, ${C.gold}, transparent)`,
        marginBottom: spacing[3],
        marginTop: spacing[1],
        opacity: 0.4,
      }}
    />
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ExecutiveProPreview({ resume }: { resume: Resume }) {
  return (
    <div
      className="bg-white rounded-lg shadow-2xl print:shadow-none print:rounded-none"
      style={{
        fontFamily: fontFamilies.garamond,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: `40px ${spacing[6]} 30px`,
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header
        style={{
          paddingBottom: spacing[4],
          borderTop: `3px solid ${C.gold}`,
          borderBottom: `3px solid ${C.sidebarBg}`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: spacing[4] }}>
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                margin: 0,
              }}
            >
              {resume.name || "Your Name"}
            </h1>
            <p
              style={{
                fontSize: "0.9375rem",
                fontWeight: 400,
                fontStyle: "italic",
                color: C.gold,
                marginTop: spacing[1],
                letterSpacing: "0.01em",
              }}
            >
              {resume.title || "Executive Title"}
            </p>
          </div>
          <address
            style={{
              fontStyle: "normal",
              textAlign: "right",
              fontSize: "0.6875rem",
              color: C.muted,
              lineHeight: 1.8,
              flexShrink: 0,
            }}
          >
            {resume.email && <div>{resume.email}</div>}
            {resume.phone && <div>{resume.phone}</div>}
            {resume.address && <div>{resume.address}</div>}
            {resume.nationality && <div>{resume.nationality}</div>}
            {resume.social && (resume.social.linkedin || resume.social.github || resume.social.website || resume.social.portfolio) && (
              <div style={{ marginTop: spacing[1], fontSize: "0.625rem", lineHeight: 1.6 }}>
                {resume.social.linkedin && <div><SocialLink href={resume.social.linkedin} /></div>}
                {resume.social.github && <div><SocialLink href={resume.social.github} /></div>}
                {resume.social.website && <div>{resume.social.website.replace(/^https?:\/\//, "")}</div>}
                {resume.social.portfolio && <div>{resume.social.portfolio.replace(/^https?:\/\//, "")}</div>}
              </div>
            )}
          </address>
        </div>
      </header>

      {/* ── SIDEBAR CONTENT (horizontal row) ─────────────────────────── */}
      <div
        style={{
          backgroundColor: C.sidebarBg,
          padding: `${spacing[4]} 0`,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: spacing[4],
        }}
      >
        {/* Education */}
        {resume.education.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: "0.5625rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.gold,
                borderBottom: `1px solid ${C.sidebarBorder}`,
                paddingBottom: spacing[2],
                marginBottom: spacing[2],
              }}
            >
              Education
            </h2>
            {resume.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: spacing[2] }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: C.sidebarText, lineHeight: 1.3 }}>
                  {edu.school}
                </p>
                <p style={{ fontSize: "0.625rem", color: C.gold, marginTop: 1, lineHeight: 1.3 }}>
                  {edu.degree}{edu.field && ` · ${edu.field}`}
                </p>
                <p style={{ fontSize: "0.5625rem", color: C.sidebarMuted, marginTop: 1 }}>
                  {edu.year}{edu.gpa && ` · GPA ${edu.gpa}`}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div>
            <h2
              style={{
                fontSize: "0.5625rem",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.gold,
                borderBottom: `1px solid ${C.sidebarBorder}`,
                paddingBottom: spacing[2],
                marginBottom: spacing[2],
              }}
            >
              Core Skills
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 8px" }}>
              {resume.skills.map((s) => (
                <span
                  key={s.id}
                  style={{
                    fontSize: "0.625rem",
                    color: C.sidebarText,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      backgroundColor: C.gold,
                      flexShrink: 0,
                    }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications + Languages */}
        <div>
          {resume.certifications.length > 0 && (
            <div style={{ marginBottom: spacing[2] }}>
              <h2
                style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: C.gold,
                  borderBottom: `1px solid ${C.sidebarBorder}`,
                  paddingBottom: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                Certifications
              </h2>
              {resume.certifications.map((c) => (
                <div key={c.id} style={{ marginBottom: 3 }}>
                  <p style={{ fontSize: "0.625rem", fontWeight: 600, color: C.sidebarText, lineHeight: 1.3 }}>
                    {c.name}
                  </p>
                  {(c.issuer || c.date) && (
                    <p style={{ fontSize: "0.5625rem", color: C.sidebarMuted, marginTop: 1 }}>
                      {[c.issuer, c.date].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
          {resume.languages.length > 0 && (
            <div>
              <h2
                style={{
                  fontSize: "0.5625rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: C.gold,
                  borderBottom: `1px solid ${C.sidebarBorder}`,
                  paddingBottom: spacing[2],
                  marginBottom: spacing[2],
                }}
              >
                Languages
              </h2>
              {resume.languages.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: "0.625rem", color: C.sidebarText }}>{l.name}</span>
                  <span style={{ fontSize: "0.5625rem", color: C.sidebarMuted }}>{l.proficiency}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div style={{ paddingTop: spacing[4] }}>
        {/* Executive Summary */}
        {resume.summary && (
          <section style={{ marginBottom: spacing[4] }}>
            <SectionTitle>Executive Summary</SectionTitle>
            <div
              style={{
                ...typography.body,
                color: C.body,
                lineHeight: 1.75,
                fontStyle: "italic",
                borderLeft: `2px solid ${C.gold}`,
                paddingLeft: spacing[3],
              }}
            >
              <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="sm" />
            </div>
          </section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <section style={{ marginBottom: spacing[4] }}>
            <SectionTitle>Professional Experience</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[3] }}>
              {resume.experience.map((exp, idx) => (
                <article key={exp.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                    <h3
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: C.ink,
                        margin: 0,
                      }}
                    >
                      {exp.position}
                    </h3>
                    {(exp.duration || exp.startDate) && (
                      <DateBadge text={formatDuration(exp.duration, exp.startDate, exp.endDate)} />
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: C.gold,
                      marginTop: 2,
                      marginBottom: exp.description ? spacing[2] : 0,
                    }}
                  >
                    {exp.company}
                    {exp.location && (
                      <span style={{ color: C.muted, fontWeight: 400 }}> · {exp.location}</span>
                    )}
                  </p>
                  {exp.description && (
                    <div style={{ fontSize: "0.75rem", lineHeight: 1.6 }}>
                      <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} />
                    </div>
                  )}
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul
                      style={{
                        margin: `${spacing[1]} 0 0 ${spacing[4]}`,
                        padding: 0,
                        listStyleType: "disc",
                        fontSize: "0.75rem",
                        lineHeight: 1.6,
                        color: C.body,
                      }}
                    >
                      {exp.bulletPoints.map((bp, i) => (
                        <li key={i} style={{ marginBottom: 1 }}>{bp}</li>
                      ))}
                    </ul>
                  )}
                  {idx < resume.experience.length - 1 && <GoldDivider />}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <section style={{ marginBottom: spacing[4] }}>
            <SectionTitle>Key Initiatives</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: spacing[2] }}>
              {resume.projects.map((p) => (
                <article key={p.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                    <h3 style={{ fontSize: "0.75rem", fontWeight: 700, color: C.ink, margin: 0 }}>
                      {p.name}
                    </h3>
                    {p.startDate && (
                      <DateBadge text={formatDuration(undefined, p.startDate, p.endDate)} />
                    )}
                  </div>
                  {p.role && (
                    <p style={{ fontSize: "0.6875rem", fontStyle: "italic", color: C.gold, marginTop: 2 }}>{p.role}</p>
                  )}
                  {p.tech && (
                    <p style={{ fontSize: "0.625rem", color: C.light, marginTop: 2 }}>{p.tech}</p>
                  )}
                  {p.description && (
                    <div style={{ marginTop: spacing[1], fontSize: "0.75rem", lineHeight: 1.6 }}>
                      <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} />
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {resume.achievements.length > 0 && (
          <section style={{ marginBottom: spacing[4] }}>
            <SectionTitle>Notable Achievements</SectionTitle>
            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: spacing[1],
              }}
            >
              {resume.achievements.map((a) => (
                <li
                  key={a.id}
                  style={{
                    display: "flex",
                    gap: spacing[2],
                    alignItems: "flex-start",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    color: C.body,
                  }}
                >
                  <span style={{ color: C.gold, flexShrink: 0, fontWeight: 700, marginTop: 1 }}>›</span>
                  <span>
                    {a.title && <strong style={{ fontWeight: 700 }}>{a.title}{a.description ? " — " : ""}</strong>}
                    {a.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* References */}
        {resume.references.length > 0 && (
          <section>
            <SectionTitle>References</SectionTitle>
            <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[3] }}>
              {resume.references.map((r) => (
                <div key={r.id} style={{ minWidth: 180 }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 700, color: C.ink }}>{r.name}</p>
                  {r.position && (
                    <p style={{ fontSize: "0.625rem", color: C.muted, marginTop: 1 }}>
                      {r.position}{r.company && `, ${r.company}`}
                    </p>
                  )}
                  {r.email && (
                    <p style={{ fontSize: "0.625rem", color: C.light, marginTop: 1 }}>{r.email}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
