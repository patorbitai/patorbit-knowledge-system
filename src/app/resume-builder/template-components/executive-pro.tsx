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

const SIDEBAR_W = "220px";

// ── Primitives ────────────────────────────────────────────────────────────────

function SidebarSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: spacing[6] }}>
      <h2
        style={{
          fontSize: "0.5625rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: C.gold,
          borderBottom: `1px solid ${C.sidebarBorder}`,
          paddingBottom: spacing[2],
          marginBottom: spacing[3],
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: spacing[6] }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: spacing[2],
          marginBottom: spacing[4],
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
          {title}
        </h2>
      </div>
      {children}
    </section>
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
        display: "grid",
        // Sidebar uses background-color on the cell; repeating-linear-gradient
        // on the outer wrapper fills multi-page overflow with the same dark tone.
        gridTemplateColumns: `${SIDEBAR_W} 1fr`,
        backgroundImage: `linear-gradient(to right, ${C.sidebarBg} ${SIDEBAR_W}, ${C.white} ${SIDEBAR_W})`,
      }}
    >
      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside
        style={{
          backgroundColor: C.sidebarBg,
          padding: `${spacing[8]} ${spacing[5]} ${spacing[6]}`,
          minHeight: "100%",
        }}
      >
        {/* Contact */}
        {(resume.email || resume.phone || resume.address || resume.nationality) && (
          <SidebarSection title="Contact">
            <address style={{ fontStyle: "normal" }}>
              {resume.email && (
                <p style={{ fontSize: "0.6875rem", color: C.sidebarText, marginBottom: spacing[1], wordBreak: "break-all" }}>
                  {resume.email}
                </p>
              )}
              {resume.phone && (
                <p style={{ fontSize: "0.6875rem", color: C.sidebarText, marginBottom: spacing[1] }}>
                  {resume.phone}
                </p>
              )}
              {resume.address && (
                <p style={{ fontSize: "0.6875rem", color: C.sidebarMuted }}>{resume.address}</p>
              )}
              {resume.nationality && (
                <p style={{ fontSize: "0.6875rem", color: C.sidebarMuted, marginTop: spacing[1] }}>{resume.nationality}</p>
              )}
            </address>
            {resume.social && (resume.social.linkedin || resume.social.github || resume.social.website || resume.social.portfolio) && (
              <div style={{ marginTop: spacing[2], fontSize: "0.625rem", color: C.sidebarMuted, lineHeight: 1.7, wordBreak: "break-all" }}>
                {resume.social.linkedin && <div><SocialLink href={resume.social.linkedin} /></div>}
                {resume.social.github && <div><SocialLink href={resume.social.github} /></div>}
                {resume.social.website && <div>{resume.social.website.replace(/^https?:\/\//, "")}</div>}
                {resume.social.portfolio && <div>{resume.social.portfolio.replace(/^https?:\/\//, "")}</div>}
              </div>
            )}
          </SidebarSection>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <SidebarSection title="Education">
            {resume.education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: spacing[3] }} className="break-inside-avoid">
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: C.sidebarText, lineHeight: 1.3 }}>
                  {edu.school}
                </p>
                <p style={{ fontSize: "0.6875rem", color: C.gold, marginTop: 2, lineHeight: 1.3 }}>
                  {edu.degree}{edu.field && ` · ${edu.field}`}
                </p>
                <p style={{ fontSize: "0.625rem", color: C.sidebarMuted, marginTop: 2 }}>
                  {edu.year}{edu.gpa && ` · GPA ${edu.gpa}`}
                </p>
                {edu.honors && (
                  <p style={{ fontSize: "0.625rem", color: C.goldDim, fontStyle: "italic", marginTop: 1 }}>
                    {edu.honors}
                  </p>
                )}
              </div>
            ))}
          </SidebarSection>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <SidebarSection title="Core Skills">
            {resume.skills.map((s) => (
              <div
                key={s.id}
                style={{
                  fontSize: "0.6875rem",
                  color: C.sidebarText,
                  marginBottom: 5,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: C.gold,
                    flexShrink: 0,
                  }}
                />
                {s.name}
              </div>
            ))}
          </SidebarSection>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <SidebarSection title="Certifications">
            {resume.certifications.map((c) => (
              <div key={c.id} style={{ marginBottom: spacing[2] }}>
                <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: C.sidebarText, lineHeight: 1.3 }}>
                  {c.name}
                </p>
                {(c.issuer || c.date) && (
                  <p style={{ fontSize: "0.625rem", color: C.sidebarMuted, marginTop: 1 }}>
                    {[c.issuer, c.date].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </SidebarSection>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <SidebarSection title="Languages">
            {resume.languages.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: "0.6875rem", color: C.sidebarText }}>{l.name}</span>
                <span style={{ fontSize: "0.625rem", color: C.sidebarMuted }}>{l.proficiency}</span>
              </div>
            ))}
          </SidebarSection>
        )}

        {/* Interests */}
        {resume.interests.length > 0 && (
          <SidebarSection title="Interests">
            <p style={{ fontSize: "0.6875rem", color: C.sidebarMuted, lineHeight: 1.6 }}>
              {resume.interests.map((i) => i.name).join("  ·  ")}
            </p>
          </SidebarSection>
        )}
      </aside>

      {/* ── MAIN PANEL ──────────────────────────────────────────────────── */}
      <main style={{ backgroundColor: C.white }}>
        {/* Header */}
        <header
          style={{
            padding: `${spacing[8]} ${spacing[6]} ${spacing[6]}`,
            borderTop: `3px solid ${C.gold}`,
            borderBottom: `3px solid ${C.sidebarBg}`,
          }}
        >
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
        </header>

        {/* Body */}
        <div style={{ padding: `${spacing[5]} ${spacing[6]} ${spacing[8]}` }}>
          {/* Executive Summary */}
          {resume.summary && (
            <MainSection title="Executive Summary">
              <div
                style={{
                  ...typography.body,
                  color: C.body,
                  lineHeight: 1.75,
                  fontStyle: "italic",
                  borderLeft: `2px solid ${C.gold}`,
                  paddingLeft: spacing[3],
                }}
                className="break-inside-avoid"
              >
                <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="sm" />
              </div>
            </MainSection>
          )}

          {/* Experience */}
          {resume.experience.length > 0 && (
            <MainSection title="Professional Experience">
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[5] }}>
                {resume.experience.map((exp, idx) => (
                  <article key={exp.id} className="break-inside-avoid">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                      <h3
                        style={{
                          fontSize: "0.875rem",
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
                        fontSize: "0.8125rem",
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
                      <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} />
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
                    {idx < resume.experience.length - 1 && <GoldDivider />}
                  </article>
                ))}
              </div>
            </MainSection>
          )}

          {/* Projects */}
          {resume.projects.length > 0 && (
            <MainSection title="Key Initiatives">
              <div style={{ display: "flex", flexDirection: "column", gap: spacing[4] }}>
                {resume.projects.map((p) => (
                  <article key={p.id} className="break-inside-avoid">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: spacing[3] }}>
                      <h3 style={{ fontSize: "0.8125rem", fontWeight: 700, color: C.ink, margin: 0 }}>
                        {p.name}
                      </h3>
                      {p.startDate && (
                        <DateBadge text={formatDuration(undefined, p.startDate, p.endDate)} />
                      )}
                    </div>
                    {p.role && (
                      <p style={{ fontSize: "0.75rem", fontStyle: "italic", color: C.gold, marginTop: 2 }}>{p.role}</p>
                    )}
                    {p.tech && (
                      <p style={{ fontSize: "0.6875rem", color: C.light, marginTop: 2 }}>{p.tech}</p>
                    )}
                    {p.description && (
                      <div style={{ marginTop: spacing[2] }}>
                        <FormattedDescription text={p.description} color={C.body} mutedColor={C.muted} />
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </MainSection>
          )}

          {/* Achievements */}
          {resume.achievements.length > 0 && (
            <MainSection title="Notable Achievements">
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  display: "flex",
                  flexDirection: "column",
                  gap: spacing[2],
                }}
                className="break-inside-avoid"
              >
                {resume.achievements.map((a) => (
                  <li
                    key={a.id}
                    style={{
                      display: "flex",
                      gap: spacing[2],
                      alignItems: "flex-start",
                      ...typography.body,
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
            </MainSection>
          )}

          {/* References */}
          {resume.references.length > 0 && (
            <MainSection title="References">
              <div style={{ display: "flex", flexWrap: "wrap", gap: spacing[4] }}>
                {resume.references.map((r) => (
                  <div key={r.id} className="break-inside-avoid" style={{ minWidth: 180 }}>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: C.ink }}>{r.name}</p>
                    {r.position && (
                      <p style={{ fontSize: "0.6875rem", color: C.muted, marginTop: 1 }}>
                        {r.position}{r.company && `, ${r.company}`}
                      </p>
                    )}
                    {r.email && (
                      <p style={{ fontSize: "0.6875rem", color: C.light, marginTop: 1 }}>{r.email}</p>
                    )}
                  </div>
                ))}
              </div>
            </MainSection>
          )}
        </div>
      </main>
    </div>
  );
}
