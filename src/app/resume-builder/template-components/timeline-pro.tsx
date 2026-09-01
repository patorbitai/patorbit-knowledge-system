"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Timeline Pro — left accent bar header, experience-first, spaced, chips */
export const TimelineProPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#0284c7", border: "#bae6fd", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "gold-accent",
  density: "spacious",
  sectionOrder: ["summary", "experience", "education", "skills", "projects", "certs", "achievements", "languages"],
  sectionTitleStyle: "underline",
  skillStyle: "chips",
  bullet: "▸",
});
