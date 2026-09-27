"use client";
import { Resume, FormattedDescription, ContactRow, ContactValue, SocialLinkRow } from "./shared";
import { fontFamilies, typeSize, spaceSize } from "@/lib/resume-design-system";
import { useResumeStyle } from "@/components/resume/StyleScope";
import { FONT_OPTIONS, DEFAULT_STYLE_CONFIG, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { Fragment, type ReactNode } from "react";
import { useResumePlanContext } from "@/components/resume/ResumePlanContext";
import type { SectionType } from "@/lib/resume-planner";

const FONT_MAP: Record<string, string> = Object.fromEntries(FONT_OPTIONS.map(f => [f.id, f.stack]));

/**
 * Modern Clean — Professional single-column resume template.
 *
 * Design inspired by top ATS-friendly resume templates (resume.io, Enhancv,
 * ResumeWorded). All sizes/colors/spacing come from the centralized
 * --resume-* design tokens (M4B): near-black headings, neutral dividers,
 * dark-neutral body, accent reserved for links. Section gap20 / entry gap14 /
 * bullet gap5 / heading gap9.
 */

// ── Color Palette ──────────────────────────────────────────────────────────
const C = {
  ink:     "#0f172a",   // Primary text (slate-900)
  body:    "#334155",   // Body text (slate-700)
  muted:   "#64748b",   // Secondary text (slate-500)
  light:   "#94a3b8",   // Tertiary text (slate-400)
  accent:  "#2563eb",   // Accent blue (blue-600)
  accentLight: "#dbeafe", // Light accent bg (blue-100)
  border:  "#e2e8f0",   // Borders (slate-200)
  divider: "#cbd5e1",   // Section divider (slate-300)
  white:   "#ffffff",
};

// ── Section Heading ────────────────────────────────────────────────────────
/** Effective colors for this sheet: user style-config overrides (body/heading/
 *  accent) fall back to the template's native palette. Section titles and the
 *  name (h1/h2) follow `heading`; body text and bullets follow `body`; link
 *  rows follow `accent`. Company/school labels and metadata keep the native
 *  ink/muted — a heading-color choice must not recolor the whole document. */
function useEffectiveColors() {
  const { config: sc, supported } = useResumeStyle();
  const bodyColor = sc.bodyColor && supported.has("bodyColor") && sc.bodyColor !== DEFAULT_STYLE_CONFIG.bodyColor ? sc.bodyColor : C.body;
  const accentColor = sc.accentColor && supported.has("accentColor") && sc.accentColor !== DEFAULT_STYLE_CONFIG.accentColor ? sc.accentColor : C.accent;
  const headingColor = sc.headingColor && supported.has("headingColor")
    ? (sc.headingColor === "accent" ? accentColor : sc.headingColor === "ink" ? C.ink : sc.headingColor)
    : C.ink;
  return { ...C, body: bodyColor, accent: accentColor, heading: headingColor };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  const EC = useEffectiveColors();
  return (
    <div style={{ marginBottom: spaceSize("headingGap") }}>
      <h2
        style={{
          fontSize: typeSize("section"),
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: EC.heading,
          margin: 0,
          paddingBottom: 4,
          borderBottom: `1.5px solid ${C.divider}`,
          lineHeight: 1,
        }}
      >
        {children}
      </h2>
    </div>
  );
}

// ── Experience Entry ───────────────────────────────────────────────────────
function ExperienceEntry({ exp, bulletChar: bChar }: { exp: Resume["experience"][0]; bulletChar?: string }) {
  const EC = useEffectiveColors();
  const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
  return (
    <div style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: EC.ink, lineHeight: 1.3 }}>
          {exp.company}
        </span>
        {dateStr && (
          <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: C.muted, whiteSpace: "nowrap", flexShrink: 0 }}>
            {dateStr}
          </span>
        )}
      </div>

      <div style={{ fontSize: typeSize("role"), color: EC.body, marginTop: spaceSize("metaGap"), lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>{exp.position}</span>
        {exp.employmentType && (
          <span style={{ color: C.muted }}> · {exp.employmentType}</span>
        )}
        {exp.location && (
          <span style={{ color: C.muted }}> · {exp.location}</span>
        )}
      </div>

      {exp.description && (
        <div style={{ marginTop: spaceSize("roleGap"), fontSize: typeSize("body"), lineHeight: 1.6, color: EC.body }}>
          <FormattedDescription text={exp.description} color={EC.body} mutedColor={C.muted} size="xs" />
        </div>
      )}

      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
        <ul style={{ margin: `${spaceSize("roleGap")} 0 0 0`, padding: 0, listStyle: "none" }}>
          {exp.bulletPoints.map((bp, i) => (
            <li
              key={i}
              style={{
                fontSize: typeSize("body"),
                lineHeight: 1.5,
                color: EC.body,
                paddingLeft: 12,
                position: "relative",
                marginBottom: spaceSize("bulletGap"),
              }}
            >
              <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet") }}>{bChar || "▸"}</span>
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
}

// ── Education Entry ────────────────────────────────────────────────────────
function EducationEntry({ edu }: { edu: Resume["education"][0] }) {
  const EC = useEffectiveColors();
  const details: React.ReactNode[] = [];
  if (edu.degree || edu.field) {
    details.push(<span key="deg" style={{ fontWeight: 500 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>);
  }
  if (edu.gpa) details.push(<span key="gpa" style={{ color: C.muted }}> · GPA {edu.gpa}</span>);
  if (edu.honors) details.push(<span key="hon" style={{ color: C.muted }}> · {edu.honors}</span>);
  if (edu.location) details.push(<span key="loc" style={{ color: C.muted }}> · {edu.location}</span>);
  return (
    <div style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: EC.ink }}>{edu.school}</span>
        {edu.year && (
          <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: C.muted, whiteSpace: "nowrap" }}>{edu.year}</span>
        )}
      </div>
      {details.length > 0 && (
        <div style={{ fontSize: typeSize("role"), color: EC.body, marginTop: spaceSize("metaGap") }}>
          {details}
        </div>
      )}
    </div>
  );
}

// ── Project Entry ──────────────────────────────────────────────────────────
function ProjectEntry({ proj, bulletChar: bChar }: { proj: Resume["projects"][0]; bulletChar?: string }) {
  const EC = useEffectiveColors();
  const dateStr = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
  return (
    <div style={{ marginBottom: spaceSize("itemGap"), breakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: typeSize("company"), fontWeight: 700, color: EC.ink }}>{proj.name}</span>
        {dateStr && (
          <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>
        )}
      </div>
      {proj.role && (
        <div style={{ fontSize: typeSize("role"), color: EC.body, fontWeight: 500, marginTop: spaceSize("metaGap") }}>{proj.role}</div>
      )}
      {proj.tech && (
        <div style={{ fontSize: typeSize("skill"), color: C.muted, marginTop: spaceSize("metaGap"), lineHeight: 1.5 }}>
          {proj.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).join(" · ")}
        </div>
      )}
      {proj.description && (
        <div style={{ marginTop: spaceSize("metaGap"), fontSize: typeSize("body"), lineHeight: 1.5, color: EC.body }}>
          <FormattedDescription text={proj.description} color={EC.body} mutedColor={C.muted} size="xs" />
        </div>
      )}
      {proj.bulletPoints && proj.bulletPoints.length > 0 && (
        <ul style={{ margin: `${spaceSize("metaGap")} 0 0 0`, padding: 0, listStyle: "none" }}>
          {proj.bulletPoints.map((bp, i) => (
            <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: EC.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
              <span style={{ position: "absolute", left: 0, color: C.muted, fontSize: typeSize("bullet") }}>{bChar || "▸"}</span>
              {bp}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Skills Section (consumes style context for presentation) ──────────────
function SkillsSection({ skills }: { skills: Resume["skills"] }) {
  const { config: sc, supported } = useResumeStyle();
  const presentation = sc.skillPresentation;
  const DEFAULT_PRESENTATION = DEFAULT_STYLE_CONFIG.skillPresentation;
  // Native default for this professional template: grouped by category when
  // categories exist, otherwise a restrained inline list. Explicit user
  // choices (tags/pills/list/inline) always win.
  const sectionGap = sc.sectionSpacing && supported.has("sectionSpacing") && sc.sectionSpacing !== DEFAULT_STYLE_CONFIG.sectionSpacing ? sc.sectionSpacing : undefined;
  const sectionStyle: React.CSSProperties = { marginBottom: sectionGap ? `${sectionGap}px` : spaceSize("sectionGap") };

  if (presentation === "inline" || presentation === "list" || (presentation === DEFAULT_PRESENTATION && !skills.some((s) => (s.category || "").trim()))) {
    return (
      <section style={sectionStyle}>
        <SectionTitle>Technical Skills</SectionTitle>
        <p style={{ fontSize: typeSize("body"), color: C.body, lineHeight: 1.6 }}>
          {skills.map((s) => s.name).join(" · ")}
        </p>
      </section>
    );
  }

  // Explicit "pills" renders chips; the default "tags" sentinel follows the
  // template-native path above (inline/grouped) — professional resumes do not
  // lead with UI chips.
  if (presentation === "pills") {
    const isPills = presentation === "pills";
    return (
      <section style={sectionStyle}>
        <SectionTitle>Technical Skills</SectionTitle>
        <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 5 : 4 }}>
          {skills.map((s) => (
            <span
              key={s.id}
              style={{
                fontSize: typeSize("skill"),
                fontWeight: 500,
                color: C.body,
                backgroundColor: "#f1f5f9",
                border: `1px solid ${C.border}`,
                padding: isPills ? "2px 9px" : "1.5px 7px",
                borderRadius: isPills ? 9999 : 3,
                lineHeight: 1.5,
              }}
            >
              {s.name}
              {s.level && s.level !== "Intermediate" && (
                <span style={{ color: C.muted, fontWeight: 400 }}> · {s.level}</span>
              )}
            </span>
          ))}
        </div>
      </section>
    );
  }

  // Native default with categories → grouped rows (group label · values).
  const SKILL_GROUP_ORDER = ["Languages", "Frameworks", "Cloud", "Databases", "DevOps", "AI/ML", "Tools"];
  const map = new Map<string, string[]>();
  for (const s of skills) {
    const raw = (s.category || "").trim();
    const bucket = SKILL_GROUP_ORDER.find((g) => g.toLowerCase() === raw.toLowerCase()) ?? (raw || "Tools");
    if (!map.has(bucket)) map.set(bucket, []);
    map.get(bucket)!.push(s.name);
  }
  const groups = [...map.entries()].sort(([a], [b]) => {
    const ia = SKILL_GROUP_ORDER.indexOf(a);
    const ib = SKILL_GROUP_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a.localeCompare(b);
  });
  return (
    <section style={sectionStyle}>
      <SectionTitle>Technical Skills</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {groups.map(([group, names]) => (
          <div key={group} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ flexShrink: 0, minWidth: 80, maxWidth: 110, fontSize: typeSize("skill"), fontWeight: 600, color: C.ink }}>{group}</span>
            <span style={{ fontSize: typeSize("body"), color: C.body, lineHeight: 1.6 }}>{names.join(" · ")}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function ModernCleanPreview({ resume, bulletChar: bulletCharProp }: { resume: Resume; bulletChar?: string }) {
  const { config: sc, supported } = useResumeStyle();

  // Compute effective values from user style config
  const font = sc.fontFamily && supported.has("fontFamily") ? (FONT_MAP[sc.fontFamily] || fontFamilies.sans) : fontFamilies.sans;
  // Effective colors (user body/heading/accent overrides) — shared hook so
  // headers, entries, bullets and link rows all resolve the same values.
  const EC = useEffectiveColors();
  // Spacing: token defaults (--resume-section-gap20px / --resume-item-gap14px),
  // user overrides apply through the scoped rules (and here where measurable).
  const sectionGap = sc.sectionSpacing && supported.has("sectionSpacing") && sc.sectionSpacing !== DEFAULT_STYLE_CONFIG.sectionSpacing ? `${sc.sectionSpacing}px` : spaceSize("sectionGap");

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
        fontFamily: font,
        color: EC.body,
        maxWidth: 794,
        padding: "40px 32px 20px",
        backgroundColor: C.white,
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <h1
          style={{
            fontSize: typeSize("name"),
            fontWeight: 800,
            color: EC.heading,
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
          color: EC.ink,
          marginTop: 3,
          letterSpacing: "0.01em",
            }}
          >
            {resume.title}
          </p>
        )}

        {/* Contact row */}
        <div
          style={{
            fontSize: typeSize("meta"),
          color: C.muted,
          marginTop: 6,
          lineHeight: 1.6,
          display: "flex",
          flexWrap: "wrap",
          gap: "0 12px",
          }}
        >
          <ContactValue value={resume.email} kind="email" />
          <ContactValue value={resume.phone} kind="phone" />
          <ContactValue value={resume.address} kind="text" />
        </div>

        {/* Social links — accent is reserved for links */}
        {resume.social && (
          <div style={{ fontSize: typeSize("meta"), color: EC.accent, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
            <SocialLinkRow social={resume.social} />
          </div>
        )}
      </header>

      {(() => {
        const nodes: Partial<Record<SectionType, ReactNode>> = {
          summary: resume.summary && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionTitle>Professional Summary</SectionTitle>
          <div style={{ fontSize: typeSize("body"), lineHeight: 1.65, color: C.body }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      ),
      experience: resume.experience.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionTitle>Professional Experience</SectionTitle>
          {resume.experience.map((exp) => (
            <ExperienceEntry key={exp.id} exp={exp} bulletChar={bulletCharProp} />
          ))}
        </section>
      ),
      projects: resume.projects.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionTitle>Projects</SectionTitle>
          {resume.projects.map((p) => (
            <ProjectEntry key={p.id} proj={p} bulletChar={bulletCharProp} />
          ))}
        </section>
      ),
      skills: resume.skills.length > 0 && (
        <SkillsSection skills={resume.skills} />
      ),
      education: resume.education.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionTitle>Education</SectionTitle>
          {resume.education.map((edu) => (
            <EducationEntry key={edu.id} edu={edu} />
          ))}
        </section>
      ),
      certs: resume.certifications.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
          <SectionTitle>Certifications</SectionTitle>
          {resume.certifications.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: spaceSize("bulletGap") }}>
              <div>
                <span style={{ fontSize: typeSize("body"), fontWeight: 600, color: C.ink }}>{c.name}</span>
                {c.issuer && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: C.muted }}> — {c.issuer}</span>}
              </div>
              {c.date && <span style={{ fontSize: typeSize("meta"), fontWeight: 400, color: C.muted, whiteSpace: "nowrap" }}>{c.date}</span>}
            </div>
          ))}
        </section>
      ),
      achievements: resume.achievements.length > 0 && (
        <section style={{ marginBottom: sectionGap }}>
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
        <section style={{ marginBottom: sectionGap }}>
          <SectionTitle>Languages</SectionTitle>
          <div style={{ fontSize: typeSize("body"), color: C.body, lineHeight: 1.6 }}>
            {resume.languages.map((l, li) => (
              <span key={l.id}>
                {li > 0 && <span style={{ color: C.muted }}> · </span>}
                {l.name}
                {l.proficiency && <span style={{ color: C.muted }}> — {l.proficiency}</span>}
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
