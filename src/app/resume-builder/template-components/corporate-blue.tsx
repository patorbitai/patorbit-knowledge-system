"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const CorporateBluePreview = generateTemplate({
  theme: { ink: "#1e3a8a", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#1e3a8a", border: "#d1d5db", bulletChar: "•" },
  fontFamily: fontFamilies.sans,
  header: "centered",
  density: "normal",
  sectionOrder: ["summary", "experience", "education", "skills", "certs", "projects", "achievements", "languages"],
  sectionTitleStyle: "underline",
  skillStyle: "chips",
  bullet: "•",
});
