"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const CreativePortfolioPreview = generateTemplate({
  theme: { ink: "#1e1b4b", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#7c3aed", border: "#e5e7eb", bulletChar: "✦" },
  fontFamily: fontFamilies.jakarta,
  header: "centered",
  layout: "two-column-sidebar",
  sidebarPosition: "left",
  sectionOrder: ["summary", "experience", "projects", "certs", "achievements", "languages", "interests", "skills", "education"],
  sectionTitleStyle: "boxed",
  skillStyle: "chips",
  bullet: "✦",
});
