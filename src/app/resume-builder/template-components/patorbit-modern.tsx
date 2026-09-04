"use client";

import React from "react";
import { Resume, FormattedDescription, ContactRow, normalizeSocialUrl, socialUrlLabel } from "./shared";
import {
  fontFamilies,
  typography,
  spacing,
  layout,
  formatDuration,
} from "@/lib/resume-design-system";
import { useResumeStyle } from "@/components/resume/StyleScope";

/**
 * Patorbit Modern — Premium single-column resume template.
 *
 * Design language:
 *   - Dark navy header bar with white name + gold accent
 *   - Clean single-column body with subtle section dividers
 *   - Professional typography hierarchy
 *   - Skill chips with accent color
 *   - ATS-friendly linear layout
 *
 * Typography:
 *   Name:       24px / 800 / white on dark
 *   Title:      12px / 500 / gold
 *   Section:    9px  / 700 / uppercase / navy
 *   Entry:      11px / 700 (company) + 10px (position)
 *   Body:       10px / 400 / 1.6
 *   Caption:    9px  / 400
 */

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  navy:      "#0f172a",
  navyLight: "#1e293b",
  gold:      "#d97706",
  goldLight: "#fef3c7",
  ink:       "#0f172a",
  body:      "#334155",
  muted:     "#64748b",
  light:     "#94a3b8",
  border:    "#e2e8f0",
  accent:    "#2563eb",
  accentLight: "#dbeafe",
  white:     "#ffffff",
};

// ── Section Title ──────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: C.navy,
        margin: "0 0 8px 0",
        paddingBottom: 4,
        borderBottom: `1.5px solid ${C.navy}`,
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}

// ── Skill Chip ─────────────────────────────────────────────────────────────
function SkillChip({ skill }: { skill: Resume["skills"][0] }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 500,
        color: C.navy,
        backgroundColor: "#f1f5f9",
        border: `1px solid ${C.border}`,
        padding: "2px 8px",
        borderRadius: 4,
        lineHeight: 1.5,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      {skill.name}
    </span>
  );
}

// ── Skills Section ─────────────────────────────────────────────────────────
function SkillsSection({ skills }: { skills: Resume["skills"] }) {
  const { config: styleConfig } = useResumeStyle();
  const presentation = styleConfig.skillPresentation;

  if (presentation === "inline" || presentation === "list") {
    return (
      <section style={{ marginBottom: 16 }}>
        <SectionTitle>Technical Skills</SectionTitle>
        <p style={{ fontSize: 10, color: C.body, lineHeight: 1.6 }}>
          {skills.map((s) => s.name).join(" · ")}
        </p>
      </section>
    );
  }

  const isPills = presentation === "pills";
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle>Technical Skills</SectionTitle>
      <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 6 : 0 }}>
        {skills.map((s) => (
          <span
            key={s.id}
            style={{
              display: "inline-block",
              fontSize: 9,
              fontWeight: 500,
              color: C.navy,
              backgroundColor: "#f1f5f9",
              border: `1px solid ${C.border}`,
              padding: isPills ? "3px 12px" : "2px 8px",
              borderRadius: isPills ? 9999 : 4,
              lineHeight: 1.5,
              marginRight: isPills ? 0 : 4,
              marginBottom: isPills ? 0 : 4,
            }}
          >
            {s.name}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function PatorbitModernPreview({ resume, bulletChar: bChar }: { resume: Resume; bulletChar?: string }) {
  return (
    <div
      style={{
        fontFamily: fontFamilies.jakarta,
        color: C.body,
        maxWidth: layout.pageWidth,
      }}
    >
      {/* ── HEADER BAR ────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: C.navy,
          padding: "28px 32px 22px",
          color: C.white,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
          {/* Name + Title */}
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: C.white,
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
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.gold,
                  marginTop: 4,
                  letterSpacing: "0.02em",
                }}
              >
                {resume.title}
              </p>
            )}
          </div>

          {/* Contact Info */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            {resume.email && (
              <p style={{ fontSize: 9, color: C.light, lineHeight: 1.6 }}>{resume.email}</p>
            )}
            {resume.phone && (
              <p style={{ fontSize: 9, color: C.light, lineHeight: 1.6 }}>{resume.phone}</p>
            )}
            {resume.address && (
              <p style={{ fontSize: 9, color: C.light, lineHeight: 1.6 }}>{resume.address}</p>
            )}
            {resume.social?.linkedin && (
              <a href={normalizeSocialUrl(resume.social.linkedin)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: C.gold, marginTop: 2, display: "block" }}>{socialUrlLabel(resume.social.linkedin)}</a>
            )}
            {resume.social?.github && (
              <a href={normalizeSocialUrl(resume.social.github)} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, color: C.gold, display: "block" }}>{socialUrlLabel(resume.social.github)}</a>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────── */}
      {/* No top/bottom padding — the paginator's safe areas (40/20) handle header/footer
          space on every page. Adding padding here would stack with safe areas on page 2+,
          wasting ~50px of vertical space. */}
      <div style={{ paddingLeft: 32, paddingRight: 32, marginBottom: 0 }}>

        {/* Summary */}
        {resume.summary && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Professional Profile</SectionTitle>
            <div style={{ fontSize: 10, lineHeight: 1.65, color: C.body }}>
              <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
            </div>
          </section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Professional Experience</SectionTitle>
            {resume.experience.map((exp) => {
              const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
              return (
                <div key={exp.id} style={{ marginBottom: 12 }}>
                  {/* Company + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>
                      {exp.company}
                    </span>
                    {dateStr && (
                      <span style={{ fontSize: 9, fontWeight: 500, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {dateStr}
                      </span>
                    )}
                  </div>

                  {/* Position */}
                  <div style={{ fontSize: 10, color: C.body, marginTop: 1, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{exp.position}</span>
                    {exp.employmentType && <span style={{ color: C.muted }}> · {exp.employmentType}</span>}
                    {exp.location && <span style={{ color: C.muted }}> · {exp.location}</span>}
                  </div>

                  {/* Description */}
                  {exp.description && (
                    <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.6, color: C.body }}>
                      <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
                    </div>
                  )}

                  {/* Bullets */}
                  {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                    <ul style={{ margin: "4px 0 0 0", padding: 0, listStyle: "none" }}>
                      {exp.bulletPoints.map((bp, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 10,
                            lineHeight: 1.5,
                            color: C.body,
                            paddingLeft: 12,
                            position: "relative",
                            marginBottom: 2,
                          }}
                        >
                          <span style={{ position: "absolute", left: 0, color: C.gold, fontSize: 8, top: 2 }}>{bChar || "●"}</span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Tech */}
                  {exp.techUsed && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                      {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 8,
                            fontWeight: 500,
                            color: C.navy,
                            backgroundColor: C.goldLight,
                            padding: "1px 6px",
                            borderRadius: 3,
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <SkillsSection skills={resume.skills} />
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Projects</SectionTitle>
            {resume.projects.map((p) => {
              const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
              return (
                <div key={p.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{p.name}</span>
                    {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                  </div>
                  {p.role && <div style={{ fontSize: 10, color: C.body, fontWeight: 500, marginTop: 1 }}>{p.role}</div>}
                  {p.tech && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
                      {p.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                        <span key={i} style={{ fontSize: 8, fontWeight: 500, color: C.navy, backgroundColor: C.goldLight, padding: "1px 5px", borderRadius: 3 }}>{t}</span>
                      ))}
                    </div>
                  )}
                  {p.description && (
                    <div style={{ marginTop: 3, fontSize: 10, lineHeight: 1.5, color: C.body }}>
                      <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} size="xs" />
                    </div>
                  )}
                  {p.bulletPoints && p.bulletPoints.length > 0 && (
                    <ul style={{ margin: "3px 0 0 0", padding: 0, listStyle: "none" }}>
                      {p.bulletPoints.map((bp, i) => (
                        <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: 1 }}>
                          <span style={{ position: "absolute", left: 0, color: C.gold, fontSize: 8, top: 2 }}>{bChar || "●"}</span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Education</SectionTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{edu.school}</span>
                  {edu.year && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{edu.year}</span>}
                </div>
                <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>
                  <span style={{ fontWeight: 500 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
                  {edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}
                </div>
                {edu.honors && <div style={{ fontSize: 9, color: C.muted, marginTop: 1, fontStyle: "italic" }}>{edu.honors}</div>}
                {edu.location && <div style={{ fontSize: 9, color: C.light, marginTop: 1 }}>{edu.location}</div>}
              </div>
            ))}
          </section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Certifications</SectionTitle>
            {resume.certifications.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: C.ink }}>{c.name}</span>
                  {c.issuer && <span style={{ fontSize: 9, color: C.muted }}> — {c.issuer}</span>}
                </div>
                {c.date && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{c.date}</span>}
              </div>
            ))}
          </section>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Languages</SectionTitle>
            <div style={{ fontSize: 10, color: C.body, display: "flex", flexWrap: "wrap", gap: "0 16px" }}>
              {resume.languages.map((l) => (
                <span key={l.id}>
                  {l.name}
                  {l.proficiency && <span style={{ color: C.muted }}> ({l.proficiency})</span>}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        {resume.achievements.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionTitle>Achievements</SectionTitle>
            {resume.achievements.map((a) => (
              <div key={a.id} style={{ fontSize: 10, color: C.body, marginBottom: 3 }}>
                {a.title && <span style={{ fontWeight: 600 }}>{a.title}</span>}
                {a.title && a.description && <span> — </span>}
                {a.description && <span>{a.description}</span>}
                {a.date && <span style={{ color: C.muted, fontSize: 9 }}> ({a.date})</span>}
              </div>
            ))}
          </section>
        )}

        {/* Interests */}
        {resume.interests.length > 0 && (
          <section>
            <SectionTitle>Interests</SectionTitle>
            <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
              {resume.interests.map((i) => i.name).join(" · ")}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
