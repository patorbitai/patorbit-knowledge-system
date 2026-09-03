"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/**
 * Timeline Layout — experience presented as a chronological timeline with a
 * vertical spine, date badges, and dot markers. Structurally different from
 * all other layouts because information flows through time rather than just
 * category sections.
 */
export const TimelineLayoutPreview = generateTemplate({
  theme: {
    ink: "#0f172a",
    body: "#334155",
    muted: "#64748b",
    light: "#94a3b8",
    accent: "#0284c7",
    border: "#bae6fd",
    bulletChar: "\u25b8",
  },
  fontFamily: fontFamilies.jakarta,
  header: "split-contact",
  layout: "timeline",
  density: "normal",
  sectionOrder: [
    "summary",
    "experience",
    "skills",
    "projects",
    "education",
    "certs",
    "achievements",
    "languages",
  ],
  sectionTitleStyle: "underline",
  skillStyle: "chips",
  bullet: "\u25b8",
});
