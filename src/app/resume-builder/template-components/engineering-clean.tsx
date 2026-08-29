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
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: C.accent,
        margin: "0 0 8px 0",
        paddingBottom: 4,
        borderBottom: `1px solid ${C.border}`,
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}

// ── Tech Tag ───────────────────────────────────────────────────────────────
function TechTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 8,
        fontWeight: 500,
        color: C.accent,
        backgroundColor: C.tag,
        border: `1px solid ${C.border}`,
        padding: "1px 6px",
        borderRadius: 3,
        lineHeight: 1.4,
        marginRight: 3,
        marginBottom: 3,
      }}
    >
      {children}
    </span>
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
export function EngineeringCleanPreview({ resume }: { resume: Resume }) {
  const skillGroups = groupSkills(resume.skills);

  return (
    <div
      style={{
        fontFamily: fontFamilies.jakarta,
        color: C.body,
        maxWidth: layout.pageWidth,
        padding: "40px 32px 30px",
        backgroundColor: C.white,
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: 22,
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
          <p style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginTop: 3 }}>
            {resume.title}
          </p>
        )}

        {/* Contact */}
        <div style={{ fontSize: 9, color: C.muted, marginTop: 6, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.address && <span>{resume.address}</span>}
        </div>
        {resume.social && (
          <div style={{ fontSize: 9, color: C.accent, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
            {resume.social.linkedin && <span>{resume.social.linkedin}</span>}
            {resume.social.github && <span>{resume.social.github}</span>}
            {resume.social.website && <span>{resume.social.website}</span>}
          </div>
        )}
      </header>

      {/* ── SUMMARY ────────────────────────────────────────────── */}
      {resume.summary && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Summary</SectionTitle>
          <div style={{ fontSize: 10, lineHeight: 1.65, color: C.body }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ─────────────────────────────────────────── */}
      {resume.experience.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Experience</SectionTitle>
          {resume.experience.map((exp) => {
            const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
            return (
              <div key={exp.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{exp.company}</span>
                  {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>{dateStr}</span>}
                </div>
                <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>
                  <span style={{ fontWeight: 600 }}>{exp.position}</span>
                  {exp.employmentType && <span style={{ color: C.muted }}> · {exp.employmentType}</span>}
                  {exp.location && <span style={{ color: C.muted }}> · {exp.location}</span>}
                </div>
                {exp.description && (
                  <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.6, color: C.body }}>
                    <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
                  </div>
                )}
                {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                  <ul style={{ margin: "4px 0 0 0", padding: 0, listStyle: "none" }}>
                    {exp.bulletPoints.map((bp, i) => (
                      <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: 2 }}>
                        <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: 8, top: 2 }}>▸</span>
                        {bp}
                      </li>
                    ))}
                  </ul>
                )}
                {exp.techUsed && (
                  <div style={{ marginTop: 4 }}>
                    {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <TechTag key={i}>{t}</TechTag>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* ── PROJECTS ────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Projects</SectionTitle>
          {resume.projects.map((p) => {
            const dateStr = [p.startDate, p.endDate].filter(Boolean).join(" – ");
            return (
              <div key={p.id} style={{ marginBottom: 10, borderLeft: `2px solid ${C.border}`, paddingLeft: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{p.name}</span>
                  {dateStr && <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>}
                </div>
                {p.role && <div style={{ fontSize: 10, color: C.body, fontWeight: 500, marginTop: 1 }}>{p.role}</div>}
                {p.tech && (
                  <div style={{ marginTop: 3 }}>
                    {p.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
                      <TechTag key={i}>{t}</TechTag>
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
                        <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: 8, top: 2 }}>▸</span>
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

      {/* ── SKILLS (grouped) ────────────────────────────────────── */}
      {skillGroups.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle>Technical Skills</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {skillGroups.map(([group, names]) => (
              <div key={group} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ flexShrink: 0, minWidth: 80, maxWidth: 110, fontSize: 9, fontWeight: 600, color: C.ink }}>
                  {group}
                </span>
                <span style={{ fontSize: 10, color: C.body, lineHeight: 1.6 }}>
                  {names.join(" · ")}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── EDUCATION ──────────────────────────────────────────── */}
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

      {/* ── CERTIFICATIONS ─────────────────────────────────────── */}
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

      {/* ── ACHIEVEMENTS ────────────────────────────────────────── */}
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

      {/* ── LANGUAGES ──────────────────────────────────────────── */}
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

      {/* ── INTERESTS ──────────────────────────────────────────── */}
      {resume.interests.length > 0 && (
        <section>
          <SectionTitle>Interests</SectionTitle>
          <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
            {resume.interests.map((i) => i.name).join(" · ")}
          </p>
        </section>
      )}
    </div>
  );
}
