"use client";

import React, { Fragment, type ReactNode } from "react";
import { Resume, FormattedDescription, ContactRow, ContactValue, SocialLink, SOCIAL_ROW_KEYS } from "./shared";
import {
  fontFamilies,
  layout,
  formatDuration,
  typeSize,
  spaceSize,
} from "@/lib/resume-design-system";
import { useResumeStyle } from "@/components/resume/StyleScope";
import { useResumePlanContext } from "@/components/resume/ResumePlanContext";
import type { SectionType } from "@/lib/resume-planner";

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
        fontSize: typeSize("section"),
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: C.navy,
        margin: "0 0 9px 0",
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
// ── Skills Section ─────────────────────────────────────────────────────────
function SkillsSection({ skills }: { skills: Resume["skills"] }) {
  const { config: styleConfig } = useResumeStyle();
  const presentation = styleConfig.skillPresentation;

  // Native default ("tags" sentinel) and list/inline → restrained inline
  // list; only an explicit "pills" choice renders chips.
  if (presentation !== "pills") {
    return (
      <section style={{ marginBottom: spaceSize("sectionGap") }}>
        <SectionTitle>Technical Skills</SectionTitle>
        <p style={{ fontSize: typeSize("body"), color: C.body, lineHeight: 1.6 }}>
          {skills.map((s) => s.name).join(" · ")}
        </p>
      </section>
    );
  }

  const isPills = presentation === "pills";
  return (
    <section style={{ marginBottom: spaceSize("sectionGap") }}>
      <SectionTitle>Technical Skills</SectionTitle>
      <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 5 : 4 }}>
        {skills.map((s) => (
          <span
            key={s.id}
            style={{
              display: "inline-block",
              fontSize: typeSize("skill"),
              fontWeight: 500,
              color: C.navy,
              backgroundColor: "#f1f5f9",
              border: `1px solid ${C.border}`,
              padding: isPills ? "2px 9px" : "1.5px 7px",
              borderRadius: isPills ? 9999 : 3,
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
  // Plan-driven section order (§2/§5): when a content plan exists it decides
  // both ORDER and INCLUSION, so hierarchy adapts to the target role.
  // Without a plan (bare preview) this template's native order is preserved.
  const plan = useResumePlanContext();
  const DEFAULT_ORDER: SectionType[] = [
    "summary", "experience", "skills", "projects", "education",
    "certs", "languages", "achievements", "interests",
  ];

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
                fontSize: typeSize("name"),
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
                  fontSize: typeSize("title"),
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
              <p style={{ fontSize: typeSize("meta"), color: C.light, lineHeight: 1.6 }}><ContactValue value={resume.email} kind="email" /></p>
            )}
            {resume.phone && (
              <p style={{ fontSize: typeSize("meta"), color: C.light, lineHeight: 1.6 }}><ContactValue value={resume.phone} kind="phone" /></p>
            )}
            {resume.address && (
              <p style={{ fontSize: typeSize("meta"), color: C.light, lineHeight: 1.6 }}><ContactValue value={resume.address} kind="text" /></p>
            )}
            {SOCIAL_ROW_KEYS.map((key, i) =>
              resume.social?.[key] ? (
                <SocialLink
                  key={key}
                  href={resume.social[key]}
                  style={{ fontSize: typeSize("meta"), color: C.gold, marginTop: i === 0 ? 2 : 0, display: "block" }}
                />
              ) : null,
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ───────────────────────────────────────────────── */}
      {/* No top/bottom padding — the paginator's safe areas (40/20) handle header/footer
          space on every page. Adding padding here would stack with safe areas on page 2+,
          wasting ~50px of vertical space. */}
      <div style={{ paddingLeft: 32, paddingRight: 32, marginBottom: 0 }}>

        {(() => {
          const nodes: Partial<Record<SectionType, ReactNode>> = {
            summary: resume.summary && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Professional Profile</SectionTitle>
            <div style={{ fontSize: typeSize("body"), lineHeight: 1.65, color: C.body }}>
              <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
            </div>
          </section>
        ),
        experience: resume.experience.length > 0 && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Professional Experience</SectionTitle>
            {resume.experience.map((exp) => {
              const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
              return (
                <div key={exp.id} style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
                  {/* Company + Date */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>
                      {exp.company}
                    </span>
                    {dateStr && (
                      <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
                        {dateStr}
                      </span>
                    )}
                  </div>

                  {/* Position */}
                  <div style={{ fontSize: typeSize("body"), color: C.body, marginTop: spaceSize("metaGap"), lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 600 }}>{exp.position}</span>
                    {exp.employmentType && <span style={{ color: C.muted }}> · {exp.employmentType}</span>}
                    {exp.location && <span style={{ color: C.muted }}> · {exp.location}</span>}
                  </div>

                  {/* Description */}
                  {exp.description && (
                    <div style={{ marginTop: spaceSize("roleGap"), fontSize: typeSize("body"), lineHeight: 1.6, color: C.body }}>
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
                            fontSize: typeSize("body"),
                            lineHeight: 1.5,
                            color: C.body,
                            paddingLeft: 12,
                            position: "relative",
                            marginBottom: spaceSize("bulletGap"),
                          }}
                        >
                          <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet"), top: 2 }}>{bChar || "●"}</span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Tech */}
                  {exp.techUsed && (
                    <div style={{ fontSize: typeSize("skill"), color: C.muted, marginTop: spaceSize("metaGap"), lineHeight: 1.5 }}>
                      {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ),
        skills: resume.skills.length > 0 && (
          <SkillsSection skills={resume.skills} />
        ),
        projects: resume.projects.length > 0 && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Projects</SectionTitle>
            {resume.projects.map((p) => {
              const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
              return (
                <div key={p.id} style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: C.ink }}>{p.name}</span>
                    {dateStr && <span style={{ fontSize: typeSize("meta"), color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                  </div>
                  {p.role && <div style={{ fontSize: typeSize("body"), color: C.body, fontWeight: 500, marginTop: spaceSize("metaGap") }}>{p.role}</div>}
                  {p.tech && (
                    <div style={{ fontSize: typeSize("skill"), color: C.muted, marginTop: spaceSize("metaGap"), lineHeight: 1.5 }}>
                      {p.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).join(" · ")}
                    </div>
                  )}
                  {p.description && (
                    <div style={{ marginTop: spaceSize("metaGap"), fontSize: typeSize("body"), lineHeight: 1.5, color: C.body }}>
                      <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} size="xs" />
                    </div>
                  )}
                  {p.bulletPoints && p.bulletPoints.length > 0 && (
                    <ul style={{ margin: "3px 0 0 0", padding: 0, listStyle: "none" }}>
                      {p.bulletPoints.map((bp, i) => (
                        <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
                          <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet"), top: 2 }}>{bChar || "●"}</span>
                          {bp}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        ),
        education: resume.education.length > 0 && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Education</SectionTitle>
            {resume.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: C.ink }}>{edu.school}</span>
                  {edu.year && <span style={{ fontSize: typeSize("meta"), color: C.muted, whiteSpace: "nowrap" }}>{edu.year}</span>}
                </div>
                <div style={{ fontSize: typeSize("role"), color: C.body, marginTop: spaceSize("metaGap") }}>
                  {(edu.degree || edu.field) && <span style={{ fontWeight: 500 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>}
                  {edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}
                  {edu.honors && <span style={{ color: C.muted }}> · {edu.honors}</span>}
                  {edu.location && <span style={{ color: C.muted }}> · {edu.location}</span>}
                </div>
              </div>
            ))}
          </section>
        ),
        certs: resume.certifications.length > 0 && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Certifications</SectionTitle>
            {resume.certifications.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: spaceSize("bulletGap") }}>
                <div>
                  <span style={{ fontSize: typeSize("body"), fontWeight: 600, color: C.ink }}>{c.name}</span>
                  {c.issuer && <span style={{ fontSize: typeSize("meta"), color: C.muted }}> — {c.issuer}</span>}
                </div>
                {c.date && <span style={{ fontSize: typeSize("meta"), color: C.muted, whiteSpace: "nowrap" }}>{c.date}</span>}
              </div>
            ))}
          </section>
        ),
        languages: resume.languages.length > 0 && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Languages</SectionTitle>
            <div style={{ fontSize: typeSize("body"), color: C.body, display: "flex", flexWrap: "wrap", gap: "0 16px" }}>
              {resume.languages.map((l) => (
                <span key={l.id}>
                  {l.name}
                  {l.proficiency && <span style={{ color: C.muted }}> ({l.proficiency})</span>}
                </span>
              ))}
            </div>
          </section>
        ),
        achievements: resume.achievements.length > 0 && (
          <section style={{ marginBottom: spaceSize("sectionGap") }}>
            <SectionTitle>Achievements</SectionTitle>
            {resume.achievements.map((a) => (
              <div key={a.id} style={{ fontSize: typeSize("body"), color: C.body, marginBottom: spaceSize("bulletGap") }}>
                {a.title && <span style={{ fontWeight: 600 }}>{a.title}</span>}
                {a.title && a.description && <span> — </span>}
                {a.description && <span>{a.description}</span>}
                {a.date && <span style={{ color: C.muted, fontSize: typeSize("meta") }}> ({a.date})</span>}
              </div>
            ))}
          </section>
        ),
        interests: resume.interests.length > 0 && (
          <section>
            <SectionTitle>Interests</SectionTitle>
            <p style={{ fontSize: typeSize("body"), color: C.muted, lineHeight: 1.6 }}>
              {resume.interests.map((i) => i.name).join(" · ")}
            </p>
          </section>
        ),
        };
        const order = plan ? plan.sections.map((s) => s.type) : DEFAULT_ORDER;
        return order.map((type) => (
          <Fragment key={type}>{nodes[type]}</Fragment>
        ));
      })()}
      </div>
    </div>
  );
}
