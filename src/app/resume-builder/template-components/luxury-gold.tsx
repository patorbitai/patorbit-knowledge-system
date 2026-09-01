"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const LuxuryGoldPreview = generateTemplate({
  theme: { ink: "#78350f", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#d97706", border: "#fde68a", bulletChar: "◆" },
  fontFamily: fontFamilies.garamond,
  header: "dark-bar",
  layout: "banner",
  density: "spacious",
  sectionOrder: ["summary", "experience", "education", "skills", "certs", "projects", "achievements", "languages"],
  sectionTitleStyle: "bordered",
  skillStyle: "chips",
  bullet: "◆",
});
