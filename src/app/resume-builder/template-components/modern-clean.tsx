"use client";
import { Resume, FormattedDescription, ContactRow } from "./shared";
import { fontFamilies } from "@/lib/resume-design-system";
import { useResumeStyle } from "@/components/resume/StyleScope";
import { FONT_OPTIONS, DEFAULT_STYLE_CONFIG, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";

const FONT_MAP: Record<string, string> = Object.fromEntries(FONT_OPTIONS.map(f => [f.id, f.stack]));

/**
 * Modern Clean — Professional single-column resume template.
 *
 * Design inspired by top ATS-friendly resume templates (resume.io, Enhancv,
 * ResumeWorded). Clean typography, consistent spacing, subtle section dividers.
 *
 * Typography scale:
 *   Name:      22px / 800 weight / -0.02em tracking
 *   Title:     13px / 500 weight / accent color
 *   Section:   9px  / 700 weight / uppercase / 0.15em tracking
 *   Entry hdr: 11px / 700 weight (company) + 10px / 400 (position)
 *   Body:      10px / 400 weight / 1.6 line-height
 *   Caption:   9px  / 400 weight
 *
 * Spacing scale (8px grid):
 *   Section gap:    16px
 *   Entry gap:      12px
 *   Bullet gap:     3px
 *   Intra-entry:    4px
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
function SectionTitle({ children, accent }: { children: React.ReactNode; accent?: string }) {
  const color = accent || C.accent;
  return (
    <div style={{ marginBottom: 8 }}>
      <h2
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color,
          margin: 0,
          paddingBottom: 4,
          borderBottom: `1.5px solid ${color}`,
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
  const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" – ");
  return (
    <div style={{ marginBottom: 12 }}>
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

      {/* Position + Location */}
      <div style={{ fontSize: 10, color: C.body, marginTop: 1, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>{exp.position}</span>
        {exp.employmentType && (
          <span style={{ color: C.muted }}> · {exp.employmentType}</span>
        )}
        {exp.location && (
          <span style={{ color: C.muted }}> · {exp.location}</span>
        )}
      </div>

      {/* Description */}
      {exp.description && (
        <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.6, color: C.body }}>
          <FormattedDescription text={exp.description} color={C.body} mutedColor={C.muted} size="xs" />
        </div>
      )}

      {/* Bullet Points */}
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
              <span style={{ position: "absolute", left: 0, color: C.accent, fontSize: 10 }}>{bChar || "▸"}</span>
              {bp}
            </li>
          ))}
        </ul>
      )}

      {/* Tech Used */}
      {exp.techUsed && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
          {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
            <span
              key={i}
              style={{
                fontSize: 8,
                fontWeight: 500,
                color: C.accent,
                backgroundColor: C.accentLight,
                padding: "2px 6px",
                borderRadius: 3,
                lineHeight: 1.4,
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Education Entry ────────────────────────────────────────────────────────
function EducationEntry({ edu }: { edu: Resume["education"][0] }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{edu.school}</span>
        {edu.year && (
          <span style={{ fontSize: 9, fontWeight: 500, color: C.muted, whiteSpace: "nowrap" }}>{edu.year}</span>
        )}
      </div>
      <div style={{ fontSize: 10, color: C.body, marginTop: 1 }}>
        <span style={{ fontWeight: 500 }}>{edu.degree}{edu.field ? ` in ${edu.field}` : ""}</span>
        {edu.gpa && <span style={{ color: C.muted }}> · GPA {edu.gpa}</span>}
      </div>
      {edu.honors && (
        <div style={{ fontSize: 9, color: C.muted, marginTop: 1, fontStyle: "italic" }}>{edu.honors}</div>
      )}
      {edu.location && (
        <div style={{ fontSize: 9, color: C.light, marginTop: 1 }}>{edu.location}</div>
      )}
    </div>
  );
}

// ── Project Entry ──────────────────────────────────────────────────────────
function ProjectEntry({ proj, bulletChar: bChar }: { proj: Resume["projects"][0]; bulletChar?: string }) {
  const dateStr = [proj.startDate, proj.endDate].filter(Boolean).join(" – ");
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.ink }}>{proj.name}</span>
        {dateStr && (
          <span style={{ fontSize: 9, color: C.muted, whiteSpace: "nowrap" }}>{dateStr}</span>
        )}
      </div>
      {proj.role && (
        <div style={{ fontSize: 10, color: C.body, fontWeight: 500, marginTop: 1 }}>{proj.role}</div>
      )}
      {proj.tech && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3 }}>
          {proj.tech.split(/[,;]/).map((t) => t.trim()).filter(Boolean).map((t, i) => (
            <span key={i} style={{ fontSize: 8, fontWeight: 500, color: C.accent, backgroundColor: C.accentLight, padding: "1px 5px", borderRadius: 3 }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {proj.description && (
        <div style={{ marginTop: 3, fontSize: 10, lineHeight: 1.5, color: C.body }}>
          <FormattedDescription text={proj.description} color={C.body} mutedColor={C.muted} size="xs" />
        </div>
      )}
      {proj.bulletPoints && proj.bulletPoints.length > 0 && (
        <ul style={{ margin: "3px 0 0 0", padding: 0, listStyle: "none" }}>
          {proj.bulletPoints.map((bp, i) => (
            <li key={i} style={{ fontSize: 10, lineHeight: 1.5, color: C.body, paddingLeft: 12, position: "relative", marginBottom: 1 }}>
              <span style={{ position: "absolute", left: 0, color: C.accent, fontSize: 10 }}>{bChar || "▸"}</span>
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
  const accent = sc.accentColor && supported.has("accentColor") && sc.accentColor !== DEFAULT_STYLE_CONFIG.accentColor ? sc.accentColor : C.accent;

  if (presentation === "inline" || presentation === "list") {
    return (
      <section style={{ marginBottom: 16 }}>
        <SectionTitle accent={accent}>Technical Skills</SectionTitle>
        <p style={{ fontSize: 10, color: C.body, lineHeight: 1.6 }}>
          {skills.map((s) => s.name).join(" · ")}
        </p>
      </section>
    );
  }

  // Tags or pills (default)
  const isPills = presentation === "pills";
  return (
    <section style={{ marginBottom: 16 }}>
      <SectionTitle accent={accent}>Technical Skills</SectionTitle>
      <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 6 : 4 }}>
        {skills.map((s) => (
          <span
            key={s.id}
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: C.body,
              backgroundColor: "#f1f5f9",
              border: `1px solid ${C.border}`,
              padding: isPills ? "3px 12px" : "2px 8px",
              borderRadius: isPills ? 9999 : 4,
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

// ── Main Component ─────────────────────────────────────────────────────────
export function ModernCleanPreview({ resume, bulletChar: bulletCharProp }: { resume: Resume; bulletChar?: string }) {
  const { config: sc, supported } = useResumeStyle();

  // Compute effective values from user style config
  const font = sc.fontFamily && supported.has("fontFamily") ? (FONT_MAP[sc.fontFamily] || fontFamilies.sans) : fontFamilies.sans;
  const bodyColor = sc.bodyColor && supported.has("bodyColor") && sc.bodyColor !== DEFAULT_STYLE_CONFIG.bodyColor ? sc.bodyColor : C.body;
  const accentColor = sc.accentColor && supported.has("accentColor") && sc.accentColor !== DEFAULT_STYLE_CONFIG.accentColor ? sc.accentColor : C.accent;
  const headingColor = sc.headingColor && supported.has("headingColor")
    ? (sc.headingColor === "accent" ? accentColor : sc.headingColor === "ink" ? C.ink : sc.headingColor)
    : C.ink;
  const sectionGap = sc.sectionSpacing && supported.has("sectionSpacing") && sc.sectionSpacing !== DEFAULT_STYLE_CONFIG.sectionSpacing ? sc.sectionSpacing : 16;
  const entryGap = sc.entrySpacing && supported.has("entrySpacing") && sc.entrySpacing !== DEFAULT_STYLE_CONFIG.entrySpacing ? sc.entrySpacing : 12;

  // Effective colors object (replaces hardcoded C)
  const EC = { ...C, body: bodyColor, accent: accentColor, ink: headingColor };

  const contactParts = [
    resume.email,
    resume.phone,
    resume.address,
  ].filter(Boolean) as string[];

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
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
          color: EC.accent,
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
            fontSize: 9,
          color: C.muted,
          marginTop: 6,
          lineHeight: 1.6,
          display: "flex",
          flexWrap: "wrap",
          gap: "0 12px",
          }}
        >
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.address && <span>{resume.address}</span>}
        </div>

        {/* Social links */}
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
          <SectionTitle accent={EC.accent}>Professional Summary</SectionTitle>
          <div style={{ fontSize: 10, lineHeight: 1.65, color: C.body }}>
            <FormattedDescription text={resume.summary} color={C.body} mutedColor={C.muted} size="xs" />
          </div>
        </section>
      )}

      {/* ── EXPERIENCE ─────────────────────────────────────────── */}
      {resume.experience.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle accent={EC.accent}>Professional Experience</SectionTitle>
          {resume.experience.map((exp) => (
            <ExperienceEntry key={exp.id} exp={exp} bulletChar={bulletCharProp} />
          ))}
        </section>
      )}

      {/* ── PROJECTS ────────────────────────────────────────────── */}
      {resume.projects.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle accent={EC.accent}>Projects</SectionTitle>
          {resume.projects.map((p) => (
            <ProjectEntry key={p.id} proj={p} bulletChar={bulletCharProp} />
          ))}
        </section>
      )}

      {/* ── SKILLS ──────────────────────────────────────────────── */}
      {resume.skills.length > 0 && (
        <SkillsSection skills={resume.skills} />
      )}

      {/* ── EDUCATION ──────────────────────────────────────────── */}
      {resume.education.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle accent={EC.accent}>Education</SectionTitle>
          {resume.education.map((edu) => (
            <EducationEntry key={edu.id} edu={edu} />
          ))}
        </section>
      )}

      {/* ── CERTIFICATIONS ─────────────────────────────────────── */}
      {resume.certifications.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <SectionTitle accent={EC.accent}>Certifications</SectionTitle>
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
          <SectionTitle accent={EC.accent}>Achievements</SectionTitle>
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
          <SectionTitle accent={EC.accent}>Languages</SectionTitle>
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
          <SectionTitle accent={EC.accent}>Interests</SectionTitle>
          <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
            {resume.interests.map((i) => i.name).join(" · ")}
          </p>
        </section>
      )}
    </div>
  );
}
