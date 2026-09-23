"use client";

import React, { Fragment, type ReactNode } from "react";
import { Resume, FormattedDescription, ContactRow } from "./shared";
import {
  fontFamilies,
  typography,
  spacing,
  layout,
  formatDuration,
} from "@/lib/resume-design-system";
import { useResumeStyle } from "@/components/resume/StyleScope";
import { useResumePlanContext } from "@/components/resume/ResumePlanContext";
import type { SectionType } from "@/lib/resume-planner";

/**
 * Executive Pro — Premium executive resume template.
 *
 * Design language:
 *   - Elegant gold-accented header with serif font
 *   - Clean single-column layout
 *   - Professional gold accents on section headings
 *   - Sophisticated typography hierarchy
 *
 * Typography (Garamond):
 *   Name:      26px / 700
 *   Title:     13px / 500 / gold
 *   Section:   9px  / 700 / uppercase / gold
 *   Entry:     11px / 700 + 10px
 *   Body:      10px / 400 / 1.65
 */

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  ink:     "#1f2937",
  body:    "#374151",
  muted:   "#6b7280",
  light:   "#9ca3af",
  gold:    "#b45309",
  goldLight: "#fef3c7",
  border:  "#d1d5db",
  divider: "#e5e7eb",
  white:   "#ffffff",
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
        color: C.gold,
        margin: "0 0 8px 0",
        paddingBottom: 4,
        borderBottom: `1.5px solid ${C.gold}`,
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}

// ── Skills Section ─────────────────────────────────────────────────────────
function SkillsSection({ skills }: { skills: Resume["skills"] }) {
  const { config: styleConfig } = useResumeStyle();
  const presentation = styleConfig.skillPresentation;

  if (presentation === "inline" || presentation === "list") {
    return (
      <section style={{ marginBottom: 16 }}>
        <SectionTitle>Core Competencies</SectionTitle>
        <p style={{ fontSize: 10, color: C.body, lineHeight: 1.6 }}>
          {skills.map((s) => s.name).join(" · ")}
        </p>
      </section>
    );
  }

  const isPills = presentation === "pills";
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle>Core Competencies</SectionTitle>
      <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 6 : "4px 16px" }}>
        {skills.map((s) => (
          <span key={s.id} style={{
            fontSize: 10,
            color: C.body,
            padding: isPills ? "2px 10px" : 0,
            borderRadius: isPills ? 9999 : 0,
            backgroundColor: isPills ? C.goldLight : "transparent",
          }}>
            {s.name}
          </span>
        ))}
      </div>
    </section>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function ExecutiveProPreview({ resume, bulletChar: bChar }: { resume: Resume; bulletChar?: string }) {
  // Plan-driven section order (§2/§5): when a content plan exists it decides
  // both ORDER and INCLUSION, so hierarchy adapts to the target role.
  // Without a plan (bare preview) this template's native order is preserved.
  const plan = useResumePlanContext();
  const DEFAULT_ORDER: SectionType[] = [
    "summary", "experience", "skills", "projects", "education",
    "certs", "achievements", "languages", "interests",
  ];

  return (
    <div
      style={{
        fontFamily: fontFamilies.garamond,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: "40px 32px 20px",
        backgroundColor: C.white,
      }}
    >
      <header style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.gold}` }}>
        <h1
          style={{
            fontSize: 26,
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
          <p style={{ fontSize: 13, fontWeight: 500, color: C.gold, marginTop: 4, letterSpacing: "0.03em" }}>
            {resume.title}
          </p>
        )}

        {/* Contact */}
        <div style={{ fontSize: 9, color: C.muted, marginTop: 8, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.address && <span>{resume.address}</span>}
        </div>
        {resume.social && (
          <div style={{ fontSize: 9, color: C.gold, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
            {resume.social.linkedin && <span>{resume.social.linkedin}</span>}
            {resume.social.github && <span>{resume.social.github}</span>}
            {resume.social.website && <span>{resume.social.website}</span>}
          </div>
        )}
      </header>

      {(() => {
        const nodes: Partial<Record<SectionType, ReactNode>> = {
          summary: resume.summary && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Executive Summary</SectionTitle>
          <div style={{ fontSize: 10, lineHeight: 1.65, color: C.body }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      ),
      experience: resume.experience.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Professional Experience</SectionTitle>
          {resume.experience.map((exp) => {
            const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
            return (
              <div key={exp.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{exp.company}</span>
                  {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{dateStr}</span>}
                </div>
                <div style={{ fontSize: 10, color: C.body, marginTop: 1, fontStyle: "italic" }}>
                  <span style={{ fontWeight: 500 }}>{exp.position}</span>
                  {exp.employmentType && <span style={{ color: C.muted, fontStyle: "normal" }}> · {exp.employmentType}</span>}
                  {exp.location && <span style={{ color: C.muted, fontStyle: "normal" }}> · {exp.location}</span>}
                </div>
                {exp.description && (
                  <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.65, color: C.body }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul style={{ margin: "4px 0 0 0", padding: 0, listStyle: "none" }}>
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: 10, lineHeight: 1.55, color: C.body, paddingLeft: 12, position: "relative", marginBottom: 2 }}>
                        <span style={{ position: "absolute", left: 0, color: C.gold, fontSize: 8, top: 2 }}>{bChar || "◆"}</span>
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
                {exp.techUsed && (
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 4, fontStyle: "italic" }}>
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
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Key Projects</SectionTitle>
          {resume.projects.map((p) => {
            const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
            return (
              <div key={p.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{p.name}</span>
                  {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                </div>
                {p.role && <div style={{ fontSize: 10, color: C.body, fontWeight: 500, marginTop: 1, fontStyle: "italic" }}>{p.role}</div>}
                {p.description && (
                  <div style={{ marginTop: 3, fontSize: 10, lineHeight: 1.55, color: C.body }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {p.bulletPoints && p.bulletPoints.length > 0 && (
                  <ul style={{ margin: "3px 0 0 0", padding: 0, listStyle: "none" }}>
                    {p.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: 1 }}>
                        <span style={{ position: "absolute", left: 0, color: C.gold, fontSize: 8, top: 2 }}>{bChar || "◆"}</span>
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
      ),
      certs: resume.certifications.length > 0 && (
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
      ),
      achievements: resume.achievements.length > 0 && (
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
      ),
      languages: resume.languages.length > 0 && (
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
      ),
      interests: resume.interests.length > 0 && (
        <section>
          <SectionTitle>Interests</SectionTitle>
          <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
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
  );
}
