"use client";

import React, { Fragment, type ReactNode } from "react";
import { Resume, FormattedDescription, ContactRow, ContactValue, SocialLinkRow } from "./shared";
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
        fontSize: typeSize("section"),
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: C.gold,
        margin: "0 0 9px 0",
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
      <section style={{ marginBottom: spaceSize("sectionGap") }}>
        <SectionTitle>Core Competencies</SectionTitle>
        <p style={{ fontSize: typeSize("body"), color: C.body, lineHeight: 1.6 }}>
          {skills.map((s) => s.name).join(" · ")}
        </p>
      </section>
    );
  }

  const isPills = presentation === "pills";
  return (
    <section style={{ marginBottom: spaceSize("sectionGap") }}>
      <SectionTitle>Core Competencies</SectionTitle>
      <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 6 : "4px 16px" }}>
        {skills.map((s) => (
          <span key={s.id} style={{
            fontSize: typeSize("body"),
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
            fontSize: typeSize("name"),
            fontWeight: 800,
            color: C.ink,
            letterSpacing: "-0.01em",
            lineHeight: 1.1,
            margin: 0,
          }}
        >
          {resume.name || "Your Name"}
        </h1>

        {resume.title && (
          <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: C.gold, marginTop: 4, letterSpacing: "0.03em" }}>
            {resume.title}
          </p>
        )}

        {/* Contact */}
        <div style={{ fontSize: typeSize("meta"), color: C.muted, marginTop: 8, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <ContactValue value={resume.email} kind="email" />
          <ContactValue value={resume.phone} kind="phone" />
          <ContactValue value={resume.address} kind="text" />
        </div>
        {resume.social && (
          <div style={{ fontSize: typeSize("meta"), color: C.gold, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
            <SocialLinkRow social={resume.social} />
          </div>
        )}
      </header>

      {(() => {
        const nodes: Partial<Record<SectionType, ReactNode>> = {
          summary: resume.summary && (
        <section style={{ marginBottom: spaceSize("sectionGap") }}>
          <SectionTitle>Executive Summary</SectionTitle>
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: C.ink }}>{exp.company}</span>
                  {dateStr && <span style={{ fontSize: typeSize("meta"), color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{dateStr}</span>}
                </div>
                <div style={{ fontSize: typeSize("body"), color: C.body, marginTop: spaceSize("metaGap"), fontStyle: "italic" }}>
                  <span style={{ fontWeight: 500 }}>{exp.position}</span>
                  {exp.employmentType && <span style={{ color: C.muted, fontStyle: "normal" }}> · {exp.employmentType}</span>}
                  {exp.location && <span style={{ color: C.muted, fontStyle: "normal" }}> · {exp.location}</span>}
                </div>
                {exp.description && (
                  <div style={{ marginTop: spaceSize("roleGap"), fontSize: typeSize("body"), lineHeight: 1.65, color: C.body }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul style={{ margin: "4px 0 0 0", padding: 0, listStyle: "none" }}>
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.55, color: C.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
                        <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet"), top: 2 }}>{bChar || "◆"}</span>
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
                {exp.techUsed && (
                  <div style={{ fontSize: typeSize("skill"), color: C.muted, marginTop: spaceSize("roleGap"), fontStyle: "italic" }}>
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
          <SectionTitle>Key Projects</SectionTitle>
          {resume.projects.map((p) => {
            const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
            return (
              <div key={p.id} style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: C.ink }}>{p.name}</span>
                  {dateStr && <span style={{ fontSize: typeSize("meta"), color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                </div>
                {p.role && <div style={{ fontSize: typeSize("body"), color: C.body, fontWeight: 500, marginTop: spaceSize("metaGap"), fontStyle: "italic" }}>{p.role}</div>}
                {p.description && (
                  <div style={{ marginTop: spaceSize("metaGap"), fontSize: typeSize("body"), lineHeight: 1.55, color: C.body }}>
                    <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {p.bulletPoints && p.bulletPoints.length > 0 && (
                  <ul style={{ margin: "3px 0 0 0", padding: 0, listStyle: "none" }}>
                    {p.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
                        <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet"), top: 2 }}>{bChar || "◆"}</span>
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
              <div style={{ fontSize: typeSize("role"), color: C.body, marginTop: spaceSize("metaGap"), fontStyle: "italic" }}>
                {(edu.degree || edu.field) && <span style={{ fontWeight: 500 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>}
                {edu.gpa && <span style={{ color: C.muted, fontStyle: "normal" }}> · GPA {edu.gpa}</span>}
                {edu.honors && <span style={{ color: C.muted, fontStyle: "normal" }}> · {edu.honors}</span>}
                {edu.location && <span style={{ color: C.muted, fontStyle: "normal" }}> · {edu.location}</span>}
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
  );
}
