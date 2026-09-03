"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/**
 * Two-Column Balanced — genuine two-column layout where the LEFT column holds
 * narrative sections (summary, experience, projects) and the RIGHT column holds
 * reference sections (skills, education, languages). This is structurally
 * different from sidebar layouts because both columns carry primary content.
 */
export const TwoColumnBalancedPreview = generateTemplate({
  theme: {
    ink: "#0f172a",
    body: "#334155",
    muted: "#64748b",
    light: "#94a3b8",
    accent: "#4f46e5",
    border: "#e2e8f0",
    bulletChar: "\u25b8",
  },
  fontFamily: fontFamilies.jakarta,
  header: "left",
  layout: "two-column-balanced",
  density: "normal",
  sectionOrder: [
    "summary",
    "experience",
    "projects",
    "skills",
    "education",
    "certs",
    "achievements",
    "languages",
  ],
  sectionTitleStyle: "underline",
  skillStyle: "grouped",
  bullet: "\u25b8",
});
