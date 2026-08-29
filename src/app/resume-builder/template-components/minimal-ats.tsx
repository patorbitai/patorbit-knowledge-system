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

/**
 * Minimal ATS — Pure ATS-friendly resume template.
 *
 * Design: Zero graphics, zero colors, zero sidebars.
 * Just clean text with clear hierarchy. Maximum ATS parseability.
 *
 * Typography:
 *   Name:      20px / 700
 *   Section:   11px / 700 / uppercase / underline
 *   Entry:     11px / 700 + 10px
 *   Body:      10px / 400 / 1.6
 */

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  ink:   "#111827",
  body:  "#374151",
  muted: "#6b7280",
  light: "#9ca3af",
};

// ── Section Title ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        color: C.ink,
        margin: "0 0 6px 0",
        paddingBottom: 3,
        borderBottom: `1px solid ${C.ink}`,
        lineHeight: 1,
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </h2>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function MinimalAtsPreview({ resume }: { resume: Resume }) {
  return (
    <div
      style={{
        fontFamily: fontFamilies.garamond,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: "40px 32px 30px",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{ marginBottom: 12, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.2 }}>
          {resume.name || "Your Name"}
        </h1>
        {resume.title && (
          <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{resume.title}</p>
        )}
        <p style={{ fontSize: 9, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>
          {[resume.email, resume.phone, resume.address].filter(Boolean).join(" | ")}
        </p>
        {resume.social && (
          <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
            {[resume.social.linkedin, resume.social.github, resume.social.website].filter(Boolean).join(" | ")}
          </p>
        )}
      </header>

      {/* ── SUMMARY ────────────────────────────────────────────── */}
      {resume.summary && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Summary</SectionTitle>
          <div style={{ fontSize: 10, lineHeight: 1.65, color: C.body }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ─────────────────────────────────────────── */}
      {resume.experience.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Experience</SectionTitle>
          {resume.experience.map((exp) => {
            const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
            return (
              <div key={exp.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{exp.company}</span>
                  {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                </div>
                <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>
                  <span style={{ fontWeight: 600 }}>{exp.position}</span>
                  {exp.location && <span style={{ color: C.muted }}> — {exp.location}</span>}
                </div>
                {exp.description && (
                  <div style={{ marginTop: 3, fontSize: 10, lineHeight: 1.6, color: C.body }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul style={{ margin: "3px 0 0 0", padding: 0, listStyle: "disc" }}>
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: C.body, marginBottom: 1, marginLeft: 16 }}>{bp}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── PROJECTS ────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Projects</SectionTitle>
          {resume.projects.map((p) => {
            const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
            return (
              <div key={p.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{p.name}</span>
                  {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                </div>
                {p.description && (
                  <div style={{ marginTop: 2, fontSize: 10, lineHeight: 1.5, color: C.body }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {p.bulletPoints && p.bulletPoints.length > 0 && (
                  <ul style={{ margin: "2px 0 0 0", padding: 0, listStyle: "disc" }}>
                    {p.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: C.body, marginBottom: 1, marginLeft: 16 }}>{bp}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── SKILLS ──────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Skills</SectionTitle>
          <p style={{ fontSize: 10, color: C.body, lineHeight: 1.6 }}>
            {resume.skills.map((s) => s.name).join(" · ")}
          </p>
        </section>
      )}

      {/* ── EDUCATION ──────────────────────────────────────────── */}
      {resume.education.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Education</SectionTitle>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{edu.school}</span>
                {edu.year && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{edu.year}</span>}
              </div>
              <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>
                {edu.degree}{edu.field ? ` in ${edu.field}` : ""}
                {edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── CERTIFICATIONS ─────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Certifications</SectionTitle>
          {resume.certifications.map((c) => (
            <div key={c.id} style={{ fontSize: 10, color: C.body, marginBottom: 3 }}>
              {c.name}{c.issuer ? ` — ${c.issuer}` : ""}{c.date ? ` (${c.date})` : ""}
            </div>
          ))}
        </section>
      )}

      {/* ── LANGUAGES ──────────────────────────────────────────── */}
      {resume.languages.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Languages</SectionTitle>
          <p style={{ fontSize: 10, color: C.body }}>
            {resume.languages.map((l) => l.proficiency ? `${l.name} (${l.proficiency})` : l.name).join(" · ")}
          </p>
        </section>
      )}

      {/* ── ACHIEVEMENTS ────────────────────────────────────────── */}
      {resume.achievements.length > 0 && (
        <section style={{ marginBottom: 12 }}>
          <SectionTitle>Achievements</SectionTitle>
          {resume.achievements.map((a) => (
            <div key={a.id} style={{ fontSize: 10, color: C.body, marginBottom: 2 }}>
              {a.title && <strong>{a.title}</strong>}
              {a.title && a.description && " — "}
              {a.description}
            </div>
          ))}
        </section>
      )}

      {/* ── INTERESTS ──────────────────────────────────────────── */}
      {resume.interests.length > 0 && (
        <section>
          <SectionTitle>Interests</SectionTitle>
          <p style={{ fontSize: 10, color: C.muted }}>{resume.interests.map((i) => i.name).join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
