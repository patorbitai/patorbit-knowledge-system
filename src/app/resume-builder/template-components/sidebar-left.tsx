"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/**
 * Sidebar Left — Contact and skills in a left sidebar, experience in the main column.
 * A common professional layout that gives quick access to contact/skills while
 * giving experience the full reading width.
 */
export const SidebarLeftPreview = generateTemplate({
  theme: {
    ink: "#0f172a",
    body: "#334155",
    muted: "#64748b",
    light: "#94a3b8",
    accent: "#2563eb",
    border: "#e2e8f0",
    bulletChar: "▸",
  },
  fontFamily: fontFamilies.jakarta,
  header: "left",
  layout: "sidebar-left",
  density: "normal",
  sectionOrder: [
    "summary",
    "experience",
    "projects",
    "certs",
    "achievements",
    "languages",
    "skills",
    "education",
    "interests",
  ],
  sectionTitleStyle: "underline",
  skillStyle: "chips",
  bullet: "▸",
});
