"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const StartupVibePreview = generateTemplate({
  theme: { ink: "#064e3b", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#059669", border: "#d1fae5", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "split-contact",
  layout: "two-column-sidebar",
  sidebarPosition: "left",
  sectionOrder: ["summary", "experience", "projects", "certs", "achievements", "languages", "interests", "skills", "education"],
  sectionTitleStyle: "minimal",
  skillStyle: "chips",
  bullet: "▸",
});
