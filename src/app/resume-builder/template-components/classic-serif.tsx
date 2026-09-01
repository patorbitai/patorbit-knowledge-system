"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const ClassicSerifPreview = generateTemplate({
  theme: { ink: "#1e3a8a", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#1e3a8a", border: "#d1d5db", bulletChar: "•" },
  fontFamily: fontFamilies.playfair,
  header: "gold-accent",
  density: "spacious",
  sectionOrder: ["summary", "experience", "education", "skills", "certs", "achievements", "languages"],
  sectionTitleStyle: "underline",
  skillStyle: "chips",
  bullet: "•",
});
