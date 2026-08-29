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
 * Template Factory — generates professional resume templates from config.
 *
 * Each template only needs to define:
 *   1. A color theme (SectionTheme)
 *   2. A header style
 *   3. Optional unique elements (sidebar, gradient, etc.)
 *
 * The factory handles all section rendering using shared components.
 */

export interface TemplateConfig {
  /** Color theme for the template */
  theme: SectionTheme;
  /** Font family */
  fontFamily: string;
  /** Header variant */
  header: "centered" | "left" | "dark-bar" | "gold-accent" | "minimal";
  /** Whether to show a sidebar for skills/education */
  sidebar?: boolean;
  /** Section bullet character */
  bullet?: string;
  /** Accent light color (for tags, badges) */
  accentLight?: string;
  /** Page background color (default: white) */
  backgroundColor?: string;
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

/** Section heading component */
function SectionHeading({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <h2
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        color,
        margin: "0 0 8px 0",
        paddingBottom: 4,
        borderBottom: `1.5px solid ${color}`,
        lineHeight: 1,
      }}
    >
      {children}
    </h2>
  );
}

/** Header: Centered */
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

/** Header: Left-aligned */
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

/** Header: Dark bar */
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

/** Header: Gold accent line */
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

/** Header: Minimal (centered, thin) */
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

/** Skills section — chip style */
function SkillsChips({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {skills.map((s) => (
        <span
          key={s.id}
          style={{
            fontSize: 9,
            fontWeight: 500,
            color: theme.body,
            backgroundColor: theme.border ? theme.border + "40" : "#f1f5f9",
            border: `1px solid ${theme.border || "#e2e8f0"}`,
            padding: "2px 8px",
            borderRadius: 4,
            lineHeight: 1.5,
          }}
        >
          {s.name}
          {s.level && s.level !== "Intermediate" && (
            <span style={{ color: theme.muted, fontWeight: 400 }}> · {s.level}</span>
          )}
        </span>
      ))}
    </div>
  );
}

/** Skills section — inline text */
function SkillsInline({ skills, theme }: { skills: Resume["skills"]; theme: SectionTheme }) {
  return (
    <p style={{ fontSize: 10, color: theme.body, lineHeight: 1.6 }}>
      {skills.map((s) => s.name).join(" · ")}
    </p>
  );
}

/** Interests section */
function InterestsInline({ interests, theme }: { interests: Resume["interests"]; theme: SectionTheme }) {
  return (
    <p style={{ fontSize: 10, color: theme.muted, lineHeight: 1.6 }}>
      {interests.map((i) => i.name).join(" · ")}
    </p>
  );
}

/**
 * Generate a complete professional resume template from a config.
 */
export function generateTemplate(config: TemplateConfig) {
  return function TemplatePreview({ resume }: { resume: Resume }) {
    const { theme, fontFamily, header, bullet, backgroundColor = "#ffffff" } = config;
    const themedSection = { ...theme, bulletChar: bullet };

    const HeaderComp =
      header === "centered" ? HeaderCentered :
      header === "dark-bar" ? HeaderDarkBar :
      header === "gold-accent" ? HeaderGoldAccent :
      header === "minimal" ? HeaderMinimal :
      HeaderLeft;

    return (
      <div
        style={{
          fontFamily,
          color: theme.body,
          maxWidth: layout.pageWidth,
          padding: "40px 32px 30px",
          backgroundColor,
        }}
      >
        <HeaderComp resume={resume} theme={theme} />

        {/* Summary */}
        {resume.summary && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.summary}</SectionHeading>
            <div style={{ fontSize: 10, lineHeight: 1.65, color: theme.body }}>
              <FormattedDescription text={resume.summary} color={theme.body} mutedColor={theme.muted} size="xs" />
            </div>
          </section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.experience}</SectionHeading>
            {resume.experience.map((exp) => (
              <ExperienceEntry key={exp.id} exp={exp} theme={themedSection} />
            ))}
          </section>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.skills}</SectionHeading>
            <SkillsChips skills={resume.skills} theme={theme} />
          </section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.projects}</SectionHeading>
            {resume.projects.map((p) => (
              <ProjectEntry key={p.id} proj={p} theme={themedSection} />
            ))}
          </section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.education}</SectionHeading>
            {resume.education.map((edu) => (
              <EducationEntry key={edu.id} edu={edu} theme={themedSection} />
            ))}
          </section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.certs}</SectionHeading>
            <CertificationsList certs={resume.certifications} theme={themedSection} />
          </section>
        )}

        {/* Achievements */}
        {resume.achievements.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.achievements}</SectionHeading>
            <AchievementsList achievements={resume.achievements} theme={themedSection} />
          </section>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <section style={{ marginBottom: 16 }}>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.languages}</SectionHeading>
            <LanguagesList languages={resume.languages} theme={themedSection} />
          </section>
        )}

        {/* Interests */}
        {resume.interests.length > 0 && (
          <section>
            <SectionHeading color={theme.accent || theme.muted}>{TITLES.interests}</SectionHeading>
            <InterestsInline interests={resume.interests} theme={theme} />
          </section>
        )}
      </div>
    );
  };
}
