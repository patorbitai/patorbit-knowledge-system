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
 * Engineering Clean — Professional engineering resume template.
 *
 * Design language:
 *   - Clean single-column with subtle gray section dividers
 *   - Skills grouped by category with clean layout
 *   - Tech tags for experience/project tech stacks
 *   - ATS-friendly, no graphics or sidebars
 *
 * Typography:
 *   Name:      22px / 800
 *   Title:     12px / 500 / muted
 *   Section:   9px  / 700 / uppercase / slate-500
 *   Entry:     11px / 700 + 10px / 400
 *   Body:      10px / 400 / 1.6
 */

// ── Colors ─────────────────────────────────────────────────────────────────
const C = {
  ink:     "#0f172a",
  body:    "#334155",
  muted:   "#64748b",
  light:   "#94a3b8",
  border:  "#e2e8f0",
  accent:  "#475569",
  tag:     "#f1f5f9",
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
        color: C.accent,
        margin: "0 0 9px 0",
        paddingBottom: 4,
        borderBottom: `1px solid ${C.border}`,
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}

// ── Skill Group ────────────────────────────────────────────────────────────
const SKILL_GROUP_ORDER = ["Languages", "Frameworks", "Cloud", "Databases", "DevOps", "AI/ML", "Tools"];

function groupSkills(skills: Resume["skills"]): [string, string[]][] {
  const map = new Map<string, string[]>();
  for (const s of skills) {
    const raw = (s.category || "").trim();
    const bucket = SKILL_GROUP_ORDER.find((g) => g.toLowerCase() === raw.toLowerCase()) ?? (raw || "Tools");
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(s.name);
  }
  return [...map.entries()].sort(([a], [b]) => {
    const ia = SKILL_GROUP_ORDER.indexOf(a);
    const ib = SKILL_GROUP_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
}

// ── Main Component ─────────────────────────────────────────────────────────
export function EngineeringCleanPreview({ resume, bulletChar: bChar }: { resume: Resume; bulletChar?: string }) {
  const skillGroups = groupSkills(resume.skills);

  // Plan-driven section order (§2/§5): when a content plan exists it decides
  // both ORDER and INCLUSION, so hierarchy adapts to the target role.
  // Without a plan (bare preview) this template's native order is preserved.
  const plan = useResumePlanContext();
  const DEFAULT_ORDER: SectionType[] = [
    "summary", "experience", "projects", "skills", "education",
    "certs", "achievements", "languages", "interests",
  ];

  return (
    <div
      style={{
        fontFamily: fontFamilies.jakarta,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: "40px 32px 20px",
        backgroundColor: C.white,
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: typeSize("name"),
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
          <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: C.ink, marginTop: 3 }}>
            {resume.title}
          </p>
        )}

        {/* Contact */}
        <div style={{ fontSize: typeSize("meta"), color: C.muted, marginTop: 6, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          <ContactValue value={resume.email} kind="email" />
          <ContactValue value={resume.phone} kind="phone" />
          <ContactValue value={resume.address} kind="text" />
        </div>
        {resume.social && (
          <div style={{ fontSize: typeSize("meta"), color: C.accent, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
            <SocialLinkRow social={resume.social} />
          </div>
        )}
      </header>

      {(() => {
        const nodes: Partial<Record<SectionType, ReactNode>> = {
          summary: resume.summary && (
        <section style={{ marginBottom: spaceSize("sectionGap") }}>
          <SectionTitle>Summary</SectionTitle>
          <div style={{ fontSize: typeSize("body"), lineHeight: 1.65, color: C.body }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      ),
      experience: resume.experience.length > 0 && (
        <section style={{ marginBottom: spaceSize("sectionGap") }}>
          <SectionTitle>Experience</SectionTitle>
          {resume.experience.map((exp) => {
            const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
            return (
              <div key={exp.id} style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: C.ink }}>{exp.company}</span>
                  {dateStr && <span style={{ fontSize: typeSize("meta"), color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{dateStr}</span>}
                </div>
                <div style={{ fontSize: typeSize("body"), color: C.body, marginTop: spaceSize("metaGap") }}>
                  <span style={{ fontWeight: 600 }}>{exp.position}</span>
                  {exp.employmentType && <span style={{ color: C.muted }}> · {exp.employmentType}</span>}
                  {exp.location && <span style={{ color: C.muted }}> · {exp.location}</span>}
                </div>
                {exp.description && (
                  <div style={{ marginTop: spaceSize("roleGap"), fontSize: typeSize("body"), lineHeight: 1.6, color: C.body }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul style={{ margin: "4px 0 0 0", padding: 0, listStyle: "none" }}>
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
                        <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet"), top: 2 }}>{bChar || "▸"}</span>
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
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
      projects: resume.projects.length > 0 && (
        <section style={{ marginBottom: spaceSize("sectionGap") }}>
          <SectionTitle>Projects</SectionTitle>
          {resume.projects.map((p) => {
            const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
            return (
              <div key={p.id} style={{ marginBottom: spaceSize("itemGap"), borderLeft: `2px solid ${C.border}`, paddingLeft: 12, breakInside: "avoid" }}>
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
                        <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet"), top: 2 }}>{bChar || "▸"}</span>
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
      skills: skillGroups.length > 0 && (
        <section style={{ marginBottom: spaceSize("sectionGap") }}>
          <SectionTitle>Technical Skills</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {skillGroups.map(([group, names]) => (
              <div key={group} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ flexShrink: 0, minWidth: 80, maxWidth: 110, fontSize: typeSize("meta"), fontWeight: 600, color: C.ink }}>
                  {group}
                </span>
                <span style={{ fontSize: typeSize("body"), color: C.body, lineHeight: 1.6 }}>
                  {names.join(" · ")}
                </span>
              </div>
            ))}
          </div>
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
              </div>                <div style={{ fontSize: typeSize("role"), color: C.body, marginTop: spaceSize("metaGap") }}>
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
