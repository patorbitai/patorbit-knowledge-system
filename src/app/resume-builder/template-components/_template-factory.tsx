"use client";

import React from "react";
import type { Resume } from "@/types/resume";
import {
  FormattedDescription,
  ContactRow,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationsList,
  AchievementsList,
  LanguagesList,
  type SectionTheme,
} from "./shared";
import { fontFamilies, layout } from "@/lib/resume-design-system";

/**
 * Enhanced Template Factory — generates structurally diverse resume templates.
 *
 * Each template config controls:
 *   1. Color theme
 *   2. Font family
 *   3. Header variant (5 options)
 *   4. Layout variant (single-column, two-column, banner, compact)
 *   5. Section ordering
 *   6. Spacing density
 *   7. Skill presentation (chips, inline, grouped, dots)
 *   8. Bullet character
 *   9. Sidebar content
 */

export interface TemplateConfig {
  /** Color theme for the template */
  theme: SectionTheme;
  /** Font family */
  fontFamily: string;
  /** Header variant */
  header: "centered" | "left" | "dark-bar" | "gold-accent" | "minimal" | "split-contact" | "bold-banner";
  /** Layout variant */
  layout?: "single" | "two-column-sidebar" | "banner" | "compact";
  /** Section ordering (default: standard order) */
  sectionOrder?: ("summary" | "experience" | "skills" | "projects" | "education" | "certs" | "achievements" | "languages" | "interests")[];
  /** Spacing density */
  density?: "compact" | "normal" | "spacious";
  /** Skill presentation style */
  skillStyle?: "chips" | "inline" | "grouped" | "dots";
  /** Section bullet character */
  bullet?: string;
  /** Accent light color (for tags, badges) */
  accentLight?: string;
  /** Page background color */
  backgroundColor?: string;
  /** Whether to show a sidebar for skills/education */
  sidebar?: boolean;
  /** Sidebar position (for two-column) */
  sidebarPosition?: "left" | "right";
  /** Section title style */
  sectionTitleStyle?: "underline" | "bordered" | "minimal" | "boxed";
}

/** Standard section titles */
const TITLES = {
  summary: "Professional Summary",
  experience: "Professional Experience",
  projects: "Projects",
  skills: "Technical Skills",
  education: "Education",
  certs: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  interests: "Interests",
};

/** Spacing scale */
const SPACING = {
  compact: { sectionGap: 10, entryGap: 8, bulletGap: 1, padding: "28px 24px 16px" },
  normal: { sectionGap: 16, entryGap: 12, bulletGap: 2, padding: "40px 32px 20px" },
  spacious: { sectionGap: 20, entryGap: 14, bulletGap: 3, padding: "48px 36px 24px" },
};

// ── Header Components ──────────────────────────────────────────────────────

function HeaderCentered({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  return (
    <header style={{ marginBottom: 16, textAlign: "center" }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: 12, fontWeight: 500, color: theme.accent || theme.muted, marginTop: 3 }}>{resume.title}</p>
      )}
      <div style={{ fontSize: 9, color: theme.muted, marginTop: 6, lineHeight: 1.6 }}>
        {[resume.email, resume.phone, resume.address].filter(Boolean).join(" | ")}
      </div>
      {resume.social && (
        <div style={{ fontSize: 9, color: theme.accent || theme.muted, marginTop: 2, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 10px" }}>
          {resume.social.linkedin && <span>{resume.social.linkedin}</span>}
          {resume.social.github && <span>{resume.social.github}</span>}
          {resume.social.website && <span>{resume.social.website}</span>}
        </div>
      )}
    </header>
  );
}

function HeaderLeft({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  return (
    <header style={{ marginBottom: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: 12, fontWeight: 500, color: theme.accent || theme.muted, marginTop: 3 }}>{resume.title}</p>
      )}
      <div style={{ fontSize: 9, color: theme.muted, marginTop: 6, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        {resume.email && <span>{resume.email}</span>}
        {resume.phone && <span>{resume.phone}</span>}
        {resume.address && <span>{resume.address}</span>}
      </div>
      {resume.social && (
        <div style={{ fontSize: 9, color: theme.accent || theme.muted, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
          {resume.social.linkedin && <span>{resume.social.linkedin}</span>}
          {resume.social.github && <span>{resume.social.github}</span>}
          {resume.social.website && <span>{resume.social.website}</span>}
        </div>
      )}
    </header>
  );
}

function HeaderDarkBar({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || "#d97706";
  return (
    <div style={{ backgroundColor: theme.ink, padding: "28px 32px 22px", color: "#ffffff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
            {resume.name || "Your Name"}
          </h1>
          {resume.title && (
            <p style={{ fontSize: 12, fontWeight: 500, color: accent, marginTop: 4, letterSpacing: "0.02em" }}>{resume.title}</p>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {resume.email && <p style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>{resume.email}</p>}
          {resume.phone && <p style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>{resume.phone}</p>}
          {resume.address && <p style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.6 }}>{resume.address}</p>}
          {resume.social?.linkedin && <p style={{ fontSize: 9, color: accent, marginTop: 2 }}>{resume.social.linkedin}</p>}
          {resume.social?.github && <p style={{ fontSize: 9, color: accent }}>{resume.social.github}</p>}
        </div>
      </div>
    </div>
  );
}

function HeaderGoldAccent({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || "#b45309";
  return (
    <header style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${accent}` }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.ink, letterSpacing: "-0.01em", lineHeight: 1.1, margin: 0 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: 13, fontWeight: 500, color: accent, marginTop: 4, letterSpacing: "0.03em" }}>{resume.title}</p>
      )}
      <div style={{ fontSize: 9, color: theme.muted, marginTop: 8, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        {resume.email && <span>{resume.email}</span>}
        {resume.phone && <span>{resume.phone}</span>}
        {resume.address && <span>{resume.address}</span>}
      </div>
      {resume.social && (
        <div style={{ fontSize: 9, color: accent, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
          {resume.social.linkedin && <span>{resume.social.linkedin}</span>}
          {resume.social.github && <span>{resume.social.github}</span>}
          {resume.social.website && <span>{resume.social.website}</span>}
        </div>
      )}
    </header>
  );
}

function HeaderMinimal({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  return (
    <header style={{ marginBottom: 12, textAlign: "center" }}>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: theme.ink, margin: 0, lineHeight: 1.2 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && <p style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>{resume.title}</p>}
      <p style={{ fontSize: 9, color: theme.muted, marginTop: 4, lineHeight: 1.6 }}>
        {[resume.email, resume.phone, resume.address].filter(Boolean).join(" | ")}
      </p>
      {resume.social && (
        <p style={{ fontSize: 9, color: theme.muted, marginTop: 2 }}>
          {[resume.social.linkedin, resume.social.github, resume.social.website].filter(Boolean).join(" | ")}
        </p>
      )}
    </header>
  );
}

function HeaderSplitContact({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || theme.muted;
  return (
    <header style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid ${theme.border || "#e2e8f0"}`, paddingBottom: 12 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
          {resume.name || "Your Name"}
        </h1>
        {resume.title && (
          <p style={{ fontSize: 12, fontWeight: 500, color: accent, marginTop: 3 }}>{resume.title}</p>
        )}
      </div>
      <div style={{ textAlign: "right", fontSize: 9, color: theme.muted, lineHeight: 1.6, flexShrink: 0 }}>
        {resume.email && <div>{resume.email}</div>}
        {resume.phone && <div>{resume.phone}</div>}
        {resume.address && <div>{resume.address}</div>}
        {resume.social?.linkedin && <div style={{ color: accent }}>{resume.social.linkedin}</div>}
        {resume.social?.github && <div style={{ color: accent }}>{resume.social.github}</div>}
      </div>
    </header>
  );
}

function HeaderBoldBanner({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || "#dc2626";
  return (
    <div style={{ backgroundColor: accent, padding: "32px 32px 24px", color: "#ffffff", marginBottom: 0 }}>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.1, margin: 0, textTransform: "uppercase" }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.85)", marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{resume.title}</p>
      )}
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        {resume.email && <span>{resume.email}</span>}
        {resume.phone && <span>{resume.phone}</span>}
        {resume.address && <span>{resume.address}</span>}
      </div>
    </div>
  );
}

// ── Section Title Variants ─────────────────────────────────────────────────

function SectionTitleUnderline({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color, margin: "0 0 8px 0", paddingBottom: 4, borderBottom: `1.5px solid ${color}`, lineHeight: 1 }}>
      {children}
    </h2>
  );
}

function SectionTitleBordered({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", margin: "0 0 8px 0", padding: "3px 8px", backgroundColor: color, lineHeight: 1, display: "inline-block" }}>
      {children}
    </h2>
  );
}

function SectionTitleMinimal({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: 10, fontWeight: 600, color, margin: "0 0 6px 0", paddingBottom: 3, borderBottom: `0.5px solid ${color}30`, lineHeight: 1 }}>
      {children}
    </h2>
  );
}

function SectionTitleBoxed({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color, margin: "0 0 8px 0", padding: "4px 10px", border: `1px solid ${color}`, lineHeight: 1, display: "inline-block" }}>
      {children}
    </h2>
  );
}

// ── Skill Presentation Variants ────────────────────────────────────────────

function SkillsChips({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {skills.map((s) => (
        <span key={s.id} style={{ fontSize: 9, fontWeight: 500, color: theme.body, backgroundColor: theme.border ? theme.border + "40" : "#f1f5f9", border: `1px solid ${theme.border || "#e2e8f0"}`, padding: "2px 8px", borderRadius: 4, lineHeight: 1.5 }}>
          {s.name}
          {s.level && s.level !== "Intermediate" && <span style={{ color: theme.muted, fontWeight: 400 }}> · {s.level}</span>}
        </span>
      ))}
    </div>
  );
}

function SkillsInline({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  return (
    <p style={{ fontSize: 10, color: theme.body, lineHeight: 1.6 }}>
      {skills.map((s) => s.name).join(" · ")}
    </p>
  );
}

function SkillsGrouped({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
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
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {groups.map(([group, names]) => (
        <div key={group} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <span style={{ flexShrink: 0, minWidth: 80, maxWidth: 110, fontSize: 9, fontWeight: 600, color: theme.ink }}>{group}</span>
          <span style={{ fontSize: 10, color: theme.body, lineHeight: 1.6 }}>{names.join(" · ")}</span>
        </div>
      ))}
    </div>
  );
}

function SkillsDots({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  const levelDots: Record<string, number> = { Expert: 4, Advanced: 3, Intermediate: 2, Beginner: 1 };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
      {skills.map((s) => (
        <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 10, color: theme.body }}>{s.name}</span>
          <span style={{ display: "flex", gap: 2 }}>
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: i < (levelDots[s.level] || 2) ? (theme.accent || theme.muted) : (theme.border || "#e2e8f0") }} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Interests ──────────────────────────────────────────────────────────────

function InterestsInline({ interests, theme }: { interests: Resume["interests"]; theme: SectionTheme }) {
  return (
    <p style={{ fontSize: 10, color: theme.muted, lineHeight: 1.6 }}>
      {interests.map((i) => i.name).join(" · ")}
    </p>
  );
}

// ── Main Template Generator ────────────────────────────────────────────────

export function generateTemplate(config: TemplateConfig) {
  return function TemplatePreview({ resume, bulletChar: bulletCharOverride }: { resume: Resume; bulletChar?: string }) {
    const { theme, fontFamily, header, bullet, backgroundColor = "#ffffff" } = config;
    const density = config.density || "normal";
    const spacing = SPACING[density];
    const layoutVariant = config.layout || "single";
    const skillStyle = config.skillStyle || "chips";
    const sectionOrder = config.sectionOrder || ["summary", "experience", "skills", "projects", "education", "certs", "achievements", "languages", "interests"];
    const sectionTitleStyle = config.sectionTitleStyle || "underline";

    // bulletChar override from style config takes precedence over template default
    const themedSection = { ...theme, bulletChar: bulletCharOverride || bullet };

    const HeaderComp =
      header === "centered" ? HeaderCentered :
      header === "dark-bar" ? HeaderDarkBar :
      header === "gold-accent" ? HeaderGoldAccent :
      header === "minimal" ? HeaderMinimal :
      header === "split-contact" ? HeaderSplitContact :
      header === "bold-banner" ? HeaderBoldBanner :
      HeaderLeft;

    const SectionTitle =
      sectionTitleStyle === "bordered" ? SectionTitleBordered :
      sectionTitleStyle === "minimal" ? SectionTitleMinimal :
      sectionTitleStyle === "boxed" ? SectionTitleBoxed :
      SectionTitleUnderline;

    const SkillsComp =
      skillStyle === "inline" ? SkillsInline :
      skillStyle === "grouped" ? SkillsGrouped :
      skillStyle === "dots" ? SkillsDots :
      SkillsChips;

    const renderSection = (key: string) => {
      switch (key) {
        case "summary":
          return resume.summary ? (
            <section key="summary" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.summary}</SectionTitle>
              <div style={{ fontSize: 10, lineHeight: 1.65, color: theme.body }}>
                <FormattedDescription text={resume.summary} color={theme.body} mutedColor={theme.muted} size="xs" />
              </div>
            </section>
          ) : null;
        case "experience":
          return resume.experience.length > 0 ? (
            <section key="experience" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.experience}</SectionTitle>
              {resume.experience.map((exp) => (
                <ExperienceEntry key={exp.id} exp={exp} theme={themedSection} />
              ))}
            </section>
          ) : null;
        case "skills":
          return resume.skills.length > 0 ? (
            <section key="skills" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.skills}</SectionTitle>
              <SkillsComp skills={resume.skills} theme={theme} />
            </section>
          ) : null;
        case "projects":
          return resume.projects.length > 0 ? (
            <section key="projects" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.projects}</SectionTitle>
              {resume.projects.map((p) => (
                <ProjectEntry key={p.id} proj={p} theme={themedSection} />
              ))}
            </section>
          ) : null;
        case "education":
          return resume.education.length > 0 ? (
            <section key="education" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.education}</SectionTitle>
              {resume.education.map((edu) => (
                <EducationEntry key={edu.id} edu={edu} theme={themedSection} />
              ))}
            </section>
          ) : null;
        case "certs":
          return resume.certifications.length > 0 ? (
            <section key="certs" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.certs}</SectionTitle>
              <CertificationsList certs={resume.certifications} theme={themedSection} />
            </section>
          ) : null;
        case "achievements":
          return resume.achievements.length > 0 ? (
            <section key="achievements" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.achievements}</SectionTitle>
              <AchievementsList achievements={resume.achievements} theme={themedSection} />
            </section>
          ) : null;
        case "languages":
          return resume.languages.length > 0 ? (
            <section key="languages" style={{ marginBottom: spacing.sectionGap }}>
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.languages}</SectionTitle>
              <LanguagesList languages={resume.languages} theme={themedSection} />
            </section>
          ) : null;
        case "interests":
          return resume.interests.length > 0 ? (
            <section key="interests">
              <SectionTitle color={theme.accent || theme.muted}>{TITLES.interests}</SectionTitle>
              <InterestsInline interests={resume.interests} theme={theme} />
            </section>
          ) : null;
        default:
          return null;
      }
    };

    // Two-column sidebar layout
    if (layoutVariant === "two-column-sidebar") {
      const mainSections = sectionOrder.filter(s => !["skills", "education"].includes(s));
      const sideSections = sectionOrder.filter(s => ["skills", "education"].includes(s));
      const sidebarOnRight = config.sidebarPosition !== "left";

      const mainContent = <>{mainSections.map(renderSection)}</>;
      const sideContent = <>{sideSections.map(renderSection)}</>;

      return (
        <div style={{ fontFamily, color: theme.body, maxWidth: layout.pageWidth, padding: spacing.padding, backgroundColor, display: "flex", gap: 20 }}>
          {sidebarOnRight ? (
            <>
              <div style={{ flex: 1 }}>{HeaderComp ? <HeaderComp resume={resume} theme={theme} /> : null}{mainContent}</div>
              <div style={{ width: 180, borderLeft: `1px solid ${theme.border || "#e2e8f0"}`, paddingLeft: 16 }}>{sideContent}</div>
            </>
          ) : (
            <>
              <div style={{ width: 180, borderRight: `1px solid ${theme.border || "#e2e8f0"}`, paddingRight: 16 }}>{sideContent}</div>
              <div style={{ flex: 1 }}>{HeaderComp ? <HeaderComp resume={resume} theme={theme} /> : null}{mainContent}</div>
            </>
          )}
        </div>
      );
    }

    // Banner layout (full-width colored header)
    if (layoutVariant === "banner") {
      return (
        <div style={{ fontFamily, color: theme.body, maxWidth: layout.pageWidth, backgroundColor }}>
          <HeaderComp resume={resume} theme={theme} />
          <div style={{ padding: spacing.padding }}>
            {sectionOrder.map(renderSection)}
          </div>
        </div>
      );
    }

    // Compact layout (denser, smaller)
    if (layoutVariant === "compact") {
      const compactSpacing = SPACING.compact;
      return (
        <div style={{ fontFamily, color: theme.body, maxWidth: layout.pageWidth, padding: compactSpacing.padding, backgroundColor, fontSize: 9 }}>
          {HeaderComp ? <HeaderComp resume={resume} theme={theme} /> : null}
          {sectionOrder.map(renderSection)}
        </div>
      );
    }

    // Default: single column
    return (
      <div style={{ fontFamily, color: theme.body, maxWidth: layout.pageWidth, padding: spacing.padding, backgroundColor }}>
        {HeaderComp ? <HeaderComp resume={resume} theme={theme} /> : null}
        {sectionOrder.map(renderSection)}
      </div>
    );
  };
}
