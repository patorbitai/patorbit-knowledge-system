"use client";

import React from "react";
import type { Resume } from "@/types/resume";
import {
  FormattedDescription,
  ContactRow,
  ContactValue,
  SocialLink,
  SocialLinkRow,
  ExperienceEntry,
  EducationEntry,
  ProjectEntry,
  CertificationsList,
  AchievementsList,
  LanguagesList,
  type SectionTheme,
} from "./shared";
import { fontFamilies, layout, typeSize, spaceSize } from "@/lib/resume-design-system";
import { useResumeStyle } from "@/components/resume/StyleScope";
import { useResumePlanContext } from "@/components/resume/ResumePlanContext";
import { FONT_OPTIONS, DEFAULT_STYLE_CONFIG } from "@/lib/resume-design-system/style-config";

/** Map font ID to CSS font stack */
const FONT_MAP: Record<string, string> = Object.fromEntries(FONT_OPTIONS.map(f => [f.id, f.stack]));
const DEFAULT_STYLE = DEFAULT_STYLE_CONFIG;

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
  layout?: "single" | "two-column-sidebar" | "sidebar-left" | "banner" | "compact" | "timeline" | "two-column-balanced";
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
  /** Expressive mode (creative families): accent headings + accent glyphs. */
  expressive?: boolean;
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

/** Spacing scale — M4B rhythm tokens (section18–24, item12–18, bullet4–7).
 *  Density presets step within those ranges; pagination compaction is the
 *  planner's job (never micro-type). */
const SPACING = {
  compact: { sectionGap: 16, entryGap: 12, bulletGap: 4, padding: "28px 24px 16px" },
  normal: { sectionGap: 20, entryGap: 14, bulletGap: 5, padding: "40px 32px 20px" },
  spacious: { sectionGap: 24, entryGap: 16, bulletGap: 6, padding: "48px 36px 24px" },
};

// ── Header Components ──────────────────────────────────────────────────────

function HeaderCentered({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const titleColor = theme.accentHeadings ? (theme.accent || theme.muted) : theme.ink;
  return (
    <header style={{ marginBottom: 16, textAlign: "center" }}>
      <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: titleColor, marginTop: 3 }}>{resume.title}</p>
      )}
      <div style={{ fontSize: typeSize("meta"), color: theme.muted, marginTop: 6, lineHeight: 1.6 }}>
        <ContactRow
          parts={[resume.email, resume.phone, resume.address].filter(Boolean)}
          email={resume.email}
          phone={resume.phone}
          separator=" | "
        />
      </div>
      {resume.social && (
        <div style={{ fontSize: typeSize("meta"), color: theme.accent || theme.muted, marginTop: 2, display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 10px" }}>
          <SocialLinkRow social={resume.social} />
        </div>
      )}
    </header>
  );
}

function HeaderLeft({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const titleColor = theme.accentHeadings ? (theme.accent || theme.muted) : theme.ink;
  return (
    <header style={{ marginBottom: 16 }}>
      <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: titleColor, marginTop: 3 }}>{resume.title}</p>
      )}
      <div style={{ fontSize: typeSize("meta"), color: theme.muted, marginTop: 6, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <ContactValue value={resume.email} kind="email" />
        <ContactValue value={resume.phone} kind="phone" />
        <ContactValue value={resume.address} kind="text" />
      </div>
      {resume.social && (
        <div style={{ fontSize: typeSize("meta"), color: theme.accent || theme.muted, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
          <SocialLinkRow social={resume.social} />
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
          <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: "#ffffff", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
            {resume.name || "Your Name"}
          </h1>
          {resume.title && (
            <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: accent, marginTop: 4, letterSpacing: "0.02em" }}>{resume.title}</p>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontSize: typeSize("meta"), color: "#94a3b8", lineHeight: 1.6 }}><ContactValue value={resume.email} kind="email" /></p>
          <p style={{ fontSize: typeSize("meta"), color: "#94a3b8", lineHeight: 1.6 }}><ContactValue value={resume.phone} kind="phone" /></p>
          <p style={{ fontSize: typeSize("meta"), color: "#94a3b8", lineHeight: 1.6 }}><ContactValue value={resume.address} kind="text" /></p>
          <div style={{ fontSize: typeSize("meta"), color: accent, marginTop: 2 }}>
            <SocialLinkRow social={resume.social} style={{ color: accent }} separator=" · " />
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderGoldAccent({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || "#b45309";
  const titleColor = theme.accentHeadings ? accent : theme.ink;
  return (
    <header style={{ marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${accent}` }}>
      <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: theme.ink, letterSpacing: "-0.01em", lineHeight: 1.1, margin: 0 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: titleColor, marginTop: 4, letterSpacing: "0.03em" }}>{resume.title}</p>
      )}
      <div style={{ fontSize: typeSize("meta"), color: theme.muted, marginTop: 8, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <ContactValue value={resume.email} kind="email" />
        <ContactValue value={resume.phone} kind="phone" />
        <ContactValue value={resume.address} kind="text" />
      </div>
      {resume.social && (
        <div style={{ fontSize: typeSize("meta"), color: accent, marginTop: 3, display: "flex", flexWrap: "wrap", gap: "0 10px" }}>
          <SocialLinkRow social={resume.social} />
        </div>
      )}
    </header>
  );
}

function HeaderMinimal({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const titleColor = theme.accentHeadings ? (theme.accent || theme.muted) : theme.ink;
  return (
    <header style={{ marginBottom: 12, textAlign: "center" }}>
      <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: theme.ink, margin: 0, lineHeight: 1.2 }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: titleColor, marginTop: 2 }}>{resume.title}</p>}
      <p style={{ fontSize: typeSize("meta"), color: theme.muted, marginTop: 4, lineHeight: 1.6 }}>
        <ContactRow
          parts={[resume.email, resume.phone, resume.address].filter(Boolean)}
          email={resume.email}
          phone={resume.phone}
          separator=" | "
        />
      </p>
      {resume.social && (
        <p style={{ fontSize: typeSize("meta"), color: theme.muted, marginTop: 2 }}>
          <SocialLinkRow social={resume.social} separator=" | " />
        </p>
      )}
    </header>
  );
}

function HeaderSplitContact({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || theme.muted;
  const titleColor = theme.accentHeadings ? accent : theme.ink;
  return (
    <header style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: `1px solid ${theme.border || "#e2e8f0"}`, paddingBottom: 12 }}>
      <div>
        <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: theme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
          {resume.name || "Your Name"}
        </h1>
        {resume.title && (
          <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: titleColor, marginTop: 3 }}>{resume.title}</p>
        )}
      </div>
      <div style={{ textAlign: "right", fontSize: typeSize("meta"), color: theme.muted, lineHeight: 1.6, flexShrink: 0 }}>
        <div><ContactValue value={resume.email} kind="email" /></div>
        <div><ContactValue value={resume.phone} kind="phone" /></div>
        <div><ContactValue value={resume.address} kind="text" /></div>
        <div style={{ color: accent }}>
          <SocialLinkRow social={resume.social} style={{ color: accent }} separator=" · " />
        </div>
      </div>
    </header>
  );
}

function HeaderBoldBanner({ resume, theme }: { resume: Resume; theme: SectionTheme }) {
  const accent = theme.accent || "#dc2626";
  return (
    <div style={{ backgroundColor: accent, padding: "32px 32px 24px", color: "#ffffff", marginBottom: 0 }}>
      <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: "#ffffff", letterSpacing: "-0.01em", lineHeight: 1.1, margin: 0, textTransform: "uppercase" }}>
        {resume.name || "Your Name"}
      </h1>
      {resume.title && (
        <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: "rgba(255,255,255,0.85)", marginTop: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>{resume.title}</p>
      )}
      <div style={{ fontSize: typeSize("meta"), color: "rgba(255,255,255,0.7)", marginTop: 8, lineHeight: 1.6, display: "flex", flexWrap: "wrap", gap: "0 12px" }}>
        <ContactValue value={resume.email} kind="email" />
        <ContactValue value={resume.phone} kind="phone" />
        <ContactValue value={resume.address} kind="text" />
      </div>
    </div>
  );
}

// ── Section Title Variants ─────────────────────────────────────────────────

function SectionTitleUnderline({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: typeSize("section"), fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color, margin: "0 0 9px 0", paddingBottom: 4, borderBottom: `1.5px solid ${color}`, lineHeight: 1 }}>
      {children}
    </h2>
  );
}

function SectionTitleBordered({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: typeSize("section"), fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#ffffff", margin: "0 0 9px 0", padding: "3px 8px", backgroundColor: color, lineHeight: 1, display: "inline-block" }}>
      {children}
    </h2>
  );
}

function SectionTitleMinimal({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: typeSize("section"), fontWeight: 700, color, margin: "0 0 7px 0", paddingBottom: 3, borderBottom: `0.5px solid ${color}30`, lineHeight: 1 }}>
      {children}
    </h2>
  );
}

function SectionTitleBoxed({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2 style={{ fontSize: typeSize("section"), fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color, margin: "0 0 9px 0", padding: "4px 10px", border: `1px solid ${color}`, lineHeight: 1, display: "inline-block" }}>
      {children}
    </h2>
  );
}

// ── Skill Presentation Variants ────────────────────────────────────────────

function SkillsChips({ skills, theme, skillPresentation }: { skills: Resume["skills"]; theme: SectionTheme; skillPresentation?: string }) {
  const isPills = skillPresentation === "pills";
  return (
    <div data-rs-skills style={{ display: "flex", flexWrap: "wrap", gap: isPills ? 5 : 4 }}>
      {skills.map((s) => (
        <span key={s.id} style={{ fontSize: typeSize("skill"), fontWeight: 500, color: theme.body, backgroundColor: theme.border ? theme.border + "40" : "#f1f5f9", border: `1px solid ${theme.border || "#e2e8f0"}`, padding: isPills ? "2px 9px" : "1.5px 7px", borderRadius: isPills ? 9999 : 3, lineHeight: 1.5 }}>
          {s.name}
          {s.level && s.level !== "Intermediate" && <span style={{ color: theme.muted, fontWeight: 400 }}> · {s.level}</span>}
        </span>
      ))}
    </div>
  );
}

function SkillsInline({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  return (
    <p style={{ fontSize: typeSize("body"), color: theme.body, lineHeight: 1.6 }}>
      {skills.map((s) => s.name).join(" · ")}
    </p>
  );
}

function SkillsGrouped({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  // No categories on any skill → a single "Tools" bucket would look fake;
  // fall back to the restrained inline list instead.
  const anyCategory = skills.some((s) => (s.category || "").trim());
  if (!anyCategory) return <SkillsInline skills={skills} theme={theme} />;
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
          <span style={{ flexShrink: 0, minWidth: 80, maxWidth: 110, fontSize: typeSize("skill"), fontWeight: 600, color: theme.ink }}>{group}</span>
          <span style={{ fontSize: typeSize("body"), color: theme.body, lineHeight: 1.6 }}>{names.join(" · ")}</span>
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
          <span style={{ fontSize: typeSize("skill"), color: theme.body }}>{s.name}</span>
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
    <p style={{ fontSize: typeSize("body"), color: theme.muted, lineHeight: 1.6 }}>
      {interests.map((i) => i.name).join(" · ")}
    </p>
  );
}

// ── Main Template Generator ────────────────────────────────────────────────

export function generateTemplate(config: TemplateConfig) {
  return function TemplatePreview({ resume, bulletChar: bulletCharOverride }: { resume: Resume; bulletChar?: string }) {
    const { theme, fontFamily, header, bullet, backgroundColor = "#ffffff" } = config;
    const density = config.density || "normal";
    // §10 — controlled density: the plan may COMPACT heavy content but never
    // loosens beyond what the template itself chose (min-rank, safe limits).
    const plan = useResumePlanContext();
    const RANK = { compact: 0, normal: 1, spacious: 2 } as const;
    const PLAN_RANK = { compact: 0, balanced: 1, spacious: 2 } as const;
    const effectiveDensity =
      plan && PLAN_RANK[plan.density] < RANK[density]
        ? (plan.density === "balanced" ? "normal" : plan.density)
        : density;
    const spacing = SPACING[effectiveDensity];
    const layoutVariant = config.layout || "single";
    // §2: when a content plan is active its ORDER wins over the template's
    // static default — the template styles, the plan decides structure.
    const sectionOrder = plan
      ? plan.sections.map((s) => s.type)
      : config.sectionOrder || ["summary", "experience", "skills", "projects", "education", "certs", "achievements", "languages", "interests"];
    const compressEducation = plan?.compressedSections.includes("education") ?? false;
    const sectionTitleStyle = config.sectionTitleStyle || "underline";

    // Read ALL user style settings from context — these override template defaults
    const { config: sc, supported } = useResumeStyle();

    // Resolve effective values: user overrides template defaults when supported
    const effectiveFont = sc.fontFamily && supported.has("fontFamily")
      ? (FONT_MAP[sc.fontFamily] || fontFamily)
      : fontFamily;
    const effectiveBodyColor = sc.bodyColor && supported.has("bodyColor") && sc.bodyColor !== DEFAULT_STYLE.bodyColor ? sc.bodyColor : theme.body;
    const effectiveHeadingColor: string = sc.headingColor && supported.has("headingColor")
      ? (sc.headingColor === "accent" ? (sc.accentColor || theme.accent || theme.ink) : sc.headingColor === "ink" ? theme.ink : sc.headingColor)
      : theme.ink;
    const effectiveAccent: string = sc.accentColor && supported.has("accentColor") && sc.accentColor !== DEFAULT_STYLE.accentColor ? sc.accentColor : theme.accent || theme.muted;
    const effectiveTheme: SectionTheme = { ...theme, body: effectiveBodyColor, ink: effectiveHeadingColor, accent: effectiveAccent, bulletChar: bulletCharOverride || bullet, accentHeadings: config.expressive || false, bulletAccent: config.expressive || false };

    // Skill presentation: user overrides template default
    const userSkillPresentation = sc.skillPresentation;
    // "tags" is the platform DEFAULT sentinel — not an explicit user choice —
    // so the template's native skill style (per family) wins unless the user
    // actually diverged (pills/list/inline). Professional families default to
    // grouped/inline lists, never UI chips (M4B).
    const skillStyle = (userSkillPresentation === "pills" || userSkillPresentation === "list" || userSkillPresentation === "inline")
      ? userSkillPresentation
      : (config.skillStyle || "inline");

    // Section title style: user overrides template default
    const effectiveSectionTitleStyle = sc.sectionTitleStyle && supported.has("sectionTitleStyle") && sc.sectionTitleStyle !== DEFAULT_STYLE.sectionTitleStyle ? sc.sectionTitleStyle : sectionTitleStyle;

    // Heading style: user overrides
    const effectiveHeadingTransform = sc.headingStyle && supported.has("headingStyle") && sc.headingStyle !== DEFAULT_STYLE.headingStyle
      ? (sc.headingStyle === "uppercase" ? "uppercase" : sc.headingStyle === "title-case" ? "capitalize" : "none")
      : undefined;
    const effectiveHeadingSpacing = sc.headingStyle === "uppercase" ? "0.08em" : undefined;

    // Spacing overrides from user config
    const effectiveSectionGap = sc.sectionSpacing && supported.has("sectionSpacing") && sc.sectionSpacing !== DEFAULT_STYLE.sectionSpacing ? sc.sectionSpacing : spacing.sectionGap;
    const effectiveEntryGap = sc.entrySpacing && supported.has("entrySpacing") && sc.entrySpacing !== DEFAULT_STYLE.entrySpacing ? sc.entrySpacing : spacing.entryGap;

    const themedSection = effectiveTheme;
    const themedSpacing = { ...spacing, sectionGap: effectiveSectionGap, entryGap: effectiveEntryGap };

    const HeaderComp =
      header === "centered" ? HeaderCentered :
      header === "dark-bar" ? HeaderDarkBar :
      header === "gold-accent" ? HeaderGoldAccent :
      header === "minimal" ? HeaderMinimal :
      header === "split-contact" ? HeaderSplitContact :
      header === "bold-banner" ? HeaderBoldBanner :
      HeaderLeft;

    const SectionTitle =
      effectiveSectionTitleStyle === "bordered" ? SectionTitleBordered :
      effectiveSectionTitleStyle === "minimal" ? SectionTitleMinimal :
      effectiveSectionTitleStyle === "boxed" ? SectionTitleBoxed :
      SectionTitleUnderline;

    const SkillsComp =
      skillStyle === "inline" || skillStyle === "list" ? SkillsInline :
      skillStyle === "grouped" ? SkillsGrouped :
      skillStyle === "dots" ? SkillsDots :
      SkillsChips;

    const renderSection = (key: string) => {
      // Section headings are DARK NEUTRAL by default (professional document,
      // not dashboard); expressive (creative) families opt into accent.
      const secColor = effectiveTheme.accentHeadings
        ? (effectiveTheme.accent || effectiveTheme.muted)
        : effectiveTheme.ink;
      switch (key) {
        case "summary":
          return resume.summary ? (
            <section key="summary" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.summary}</SectionTitle>
              <div style={{ fontSize: typeSize("body"), lineHeight: 1.65, color: effectiveTheme.body }}>
                <FormattedDescription text={resume.summary} color={effectiveTheme.body} mutedColor={effectiveTheme.muted} size="xs" />
              </div>
            </section>
          ) : null;
        case "experience":
          return resume.experience.length > 0 ? (
            <section key="experience" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.experience}</SectionTitle>
              {resume.experience.map((exp) => (
                <ExperienceEntry key={exp.id} exp={exp} theme={themedSection} />
              ))}
            </section>
          ) : null;
        case "skills":
          return resume.skills.length > 0 ? (
            <section key="skills" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.skills}</SectionTitle>
              <SkillsComp skills={resume.skills} theme={effectiveTheme} skillPresentation={userSkillPresentation} />
            </section>
          ) : null;
        case "projects":
          return resume.projects.length > 0 ? (
            <section key="projects" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.projects}</SectionTitle>
              {resume.projects.map((p) => (
                <ProjectEntry key={p.id} proj={p} theme={themedSection} />
              ))}
            </section>
          ) : null;
        case "education":
          return resume.education.length > 0 ? (
            <section key="education" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.education}</SectionTitle>
              {resume.education.map((edu) => (
                <EducationEntry key={edu.id} edu={edu} theme={themedSection} compact={compressEducation} />
              ))}
            </section>
          ) : null;
        case "certs":
          return resume.certifications.length > 0 ? (
            <section key="certs" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.certs}</SectionTitle>
              <CertificationsList certs={resume.certifications} theme={themedSection} />
            </section>
          ) : null;
        case "achievements":
          return resume.achievements.length > 0 ? (
            <section key="achievements" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.achievements}</SectionTitle>
              <AchievementsList achievements={resume.achievements} theme={themedSection} />
            </section>
          ) : null;
        case "languages":
          return resume.languages.length > 0 ? (
            <section key="languages" style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={secColor}>{TITLES.languages}</SectionTitle>
              <LanguagesList languages={resume.languages} theme={themedSection} />
            </section>
          ) : null;
        case "interests":
          return resume.interests.length > 0 ? (
            <section key="interests">
              <SectionTitle color={secColor}>{TITLES.interests}</SectionTitle>
              <InterestsInline interests={resume.interests} theme={effectiveTheme} />
            </section>
          ) : null;
        default:
          return null;
      }
    };

    // Two-column sidebar layout (right sidebar)
    if (layoutVariant === "two-column-sidebar") {
      const mainSections = sectionOrder.filter(s => !["skills", "education"].includes(s));
      const sideSections = sectionOrder.filter(s => ["skills", "education"].includes(s));
      const mainContent = <>{mainSections.map(renderSection)}</>;
      const sideContent = <>{sideSections.map(renderSection)}</>;

      return (
        <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, padding: themedSpacing.padding, backgroundColor, display: "flex", gap: 20 }}>
          <div style={{ flex: 1 }}>{HeaderComp ? <HeaderComp resume={resume} theme={effectiveTheme} /> : null}{mainContent}</div>
          <div style={{ width: 180, borderLeft: `1px solid ${effectiveTheme.border || "#e2e8f0"}`, paddingLeft: 16 }}>{sideContent}</div>
        </div>
      );
    }

    // Left sidebar layout — sidebar on left with contact/skills/education
    if (layoutVariant === "sidebar-left") {
      const mainSections = sectionOrder.filter(s => !["skills", "education", "interests"].includes(s));
      const sideSections = sectionOrder.filter(s => ["skills", "education", "interests"].includes(s));
      const sideContent = <>{sideSections.map(renderSection)}</>;

      return (
        <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, padding: themedSpacing.padding, backgroundColor, display: "flex", gap: 0 }}>
          {/* Left sidebar — colored background */}
          <div style={{ width: 200, backgroundColor: effectiveTheme.ink + "08", borderRight: `1px solid ${effectiveTheme.border || "#e2e8f0"}`, paddingRight: 16, paddingLeft: 0 }}>
            <header style={{ marginBottom: 16 }}>
              <h1 style={{ fontSize: typeSize("name"), fontWeight: 800, color: effectiveTheme.ink, letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>
                {resume.name || "Your Name"}
              </h1>
              {resume.title && (
                <p style={{ fontSize: typeSize("title"), fontWeight: 500, color: effectiveTheme.accentHeadings ? (effectiveTheme.accent || effectiveTheme.muted) : effectiveTheme.ink, marginTop: 3 }}>{resume.title}</p>
              )}
            </header>
            <div style={{ fontSize: typeSize("meta"), color: effectiveTheme.muted, marginBottom: 16, lineHeight: 1.8 }}>
              <div style={{ marginBottom: 2 }}><ContactValue value={resume.email} kind="email" /></div>
              <div style={{ marginBottom: 2 }}><ContactValue value={resume.phone} kind="phone" /></div>
              <div style={{ marginBottom: 2 }}><ContactValue value={resume.address} kind="text" /></div>
              <div style={{ color: effectiveTheme.accent || effectiveTheme.muted, marginBottom: 2 }}>
                <SocialLinkRow
                  social={resume.social}
                  style={{ color: effectiveTheme.accent || effectiveTheme.muted }}
                  separator=" · "
                />
              </div>
            </div>
            {sideContent}
          </div>
          {/* Main content */}
          <div style={{ flex: 1, paddingLeft: 20 }}>
            {mainSections.map(renderSection)}
          </div>
        </div>
      );
    }

    // Timeline layout — vertical chronological spine for experience
    if (layoutVariant === "timeline") {
      const accent = effectiveTheme.accent || effectiveTheme.muted;
      const summarySection = resume.summary ? (
        <section key="summary" style={{ marginBottom: themedSpacing.sectionGap }}>
          <SectionTitle color={accent}>{TITLES.summary}</SectionTitle>
          <div style={{ fontSize: typeSize("body"), lineHeight: 1.65, color: effectiveTheme.body }}>
            <FormattedDescription text={resume.summary} color={effectiveTheme.body} mutedColor={effectiveTheme.muted} size="xs" />
          </div>
        </section>
      ) : null;

      const otherSections = sectionOrder.filter(s => s !== "summary" && s !== "experience").map(renderSection);

      return (
        <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, padding: themedSpacing.padding, backgroundColor }}>
          {HeaderComp ? <HeaderComp resume={resume} theme={effectiveTheme} /> : null}
          {summarySection}
          {/* Timeline experience section */}
          {resume.experience.length > 0 && (
            <section style={{ marginBottom: themedSpacing.sectionGap }}>
              <SectionTitle color={accent}>{TITLES.experience}</SectionTitle>
              <div style={{ position: "relative", paddingLeft: 20 }}>
                {/* Vertical spine */}
                <div style={{ position: "absolute", left: 3, top: 4, bottom: 4, width: 2, backgroundColor: accent + "30", borderRadius: 1 }} />
                {resume.experience.map((exp, idx) => {
                  const dateStr = exp.duration || [exp.startDate, exp.endDate].filter(Boolean).join(" \u2013 ");
                  const b = effectiveTheme.bulletChar || "\u25b8";
                  return (
                    <div key={exp.id} style={{ position: "relative", marginBottom: themedSpacing.entryGap, breakInside: "avoid" }}>
                      {/* Timeline dot */}
                      <div style={{ position: "absolute", left: -20, top: 3, width: 12, height: 12, borderRadius: "50%", backgroundColor: accent, border: `2px solid ${backgroundColor}` }} />
                      {/* Date — secondary meta, never competing with company */}
                      {dateStr && (
                        <div style={{ fontSize: typeSize("meta"), fontWeight: 400, color: effectiveTheme.muted, marginBottom: spaceSize("metaGap"), letterSpacing: "0.03em" }}>
                          {dateStr}
                        </div>
                      )}
                      {/* Company + Position */}
                      <div style={{ fontSize: typeSize("company"), fontWeight: 700, color: effectiveTheme.ink, lineHeight: 1.3 }}>
                        {exp.company}
                      </div>
                      <div style={{ fontSize: typeSize("role"), color: effectiveTheme.body, marginTop: spaceSize("metaGap") }}>
                        <span style={{ fontWeight: 600 }}>{exp.position}</span>
                        {exp.employmentType && <span style={{ color: effectiveTheme.muted }}> \u00b7 {exp.employmentType}</span>}
                        {exp.location && <span style={{ color: effectiveTheme.muted }}> \u00b7 {exp.location}</span>}
                      </div>
                      {exp.description && (
                        <div style={{ marginTop: spaceSize("roleGap"), fontSize: typeSize("body"), lineHeight: 1.6, color: effectiveTheme.body }}>
                          <FormattedDescription text={exp.description} color={effectiveTheme.body} mutedColor={effectiveTheme.muted} size="xs" />
                        </div>
                      )}
                      {exp.bulletPoints && exp.bulletPoints.length > 0 && (
                        <ul style={{ margin: "4px 0 0 0", padding: 0, listStyle: "none" }}>
                          {exp.bulletPoints.map((bp, i) => (
                            <li key={i} style={{ fontSize: typeSize("body"), lineHeight: 1.5, color: effectiveTheme.body, paddingLeft: 12, position: "relative", marginBottom: spaceSize("bulletGap") }}>
                              <span style={{ position: "absolute", left: 0, color: effectiveTheme.bulletAccent ? accent : effectiveTheme.muted, fontSize: typeSize("bullet"), top: 2 }}>{b}</span>
                              {bp}
                            </li>
                          ))}
                        </ul>
                      )}
                      {exp.techUsed && (
                        <div style={{ fontSize: typeSize("skill"), color: effectiveTheme.muted, marginTop: spaceSize("metaGap"), lineHeight: 1.5 }}>
                          {exp.techUsed.split(/[,;]/).map((t) => t.trim()).filter(Boolean).join(" \u00b7 ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {otherSections}
        </div>
      );
    }

    // Two-column balanced layout — summary+experience left, skills+education right
    if (layoutVariant === "two-column-balanced") {
      const leftSections = sectionOrder.filter(s => ["summary", "experience", "projects", "certs", "achievements"].includes(s));
      const rightSections = sectionOrder.filter(s => ["skills", "education", "languages", "interests"].includes(s));
      const leftContent = <>{leftSections.map(renderSection)}</>;
      const rightContent = <>{rightSections.map(renderSection)}</>;

      return (
        <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, padding: themedSpacing.padding, backgroundColor }}>
          {HeaderComp ? <HeaderComp resume={resume} theme={effectiveTheme} /> : null}
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ flex: 1, minWidth: 0 }}>{leftContent}</div>
            <div style={{ width: 240, borderLeft: `1px solid ${effectiveTheme.border || "#e2e8f0"}`, paddingLeft: 20 }}>{rightContent}</div>
          </div>
        </div>
      );
    }

    // Banner layout (full-width colored header)
    if (layoutVariant === "banner") {
      return (
        <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, backgroundColor }}>
          <HeaderComp resume={resume} theme={effectiveTheme} />
          <div style={{ padding: themedSpacing.padding }}>
            {sectionOrder.map(renderSection)}
          </div>
        </div>
      );
    }

    // Compact layout (denser, smaller)
    if (layoutVariant === "compact") {
      const compactSpacing = SPACING.compact;
      return (
        <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, padding: compactSpacing.padding, backgroundColor, fontSize: typeSize("body") }}>
          {HeaderComp ? <HeaderComp resume={resume} theme={effectiveTheme} /> : null}
          {sectionOrder.map(renderSection)}
        </div>
      );
    }

    // Default: single column
    return (
      <div style={{ fontFamily: effectiveFont, color: effectiveTheme.body, maxWidth: layout.pageWidth, padding: themedSpacing.padding, backgroundColor }}>
        {HeaderComp ? <HeaderComp resume={resume} theme={effectiveTheme} /> : null}
        {sectionOrder.map(renderSection)}
      </div>
    );
  };
}
