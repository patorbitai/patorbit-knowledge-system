"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const ExecutivePreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#c9a84c", border: "#d1d5db", bulletChar: "◆" },
  fontFamily: fontFamilies.garamond,
  header: "dark-bar",
  layout: "banner",
  density: "spacious",
  sectionOrder: ["summary", "experience", "education", "skills", "certs", "achievements", "languages"],
  sectionTitleStyle: "bordered",
  skillStyle: "chips",
  bullet: "◆",
});
