"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Academic CV — education-first, serif, spacious, boxed titles, inline skills */
export const AcademicCvPreview = generateTemplate({
  theme: { ink: "#1f2937", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#1d4ed8", border: "#d1d5db", bulletChar: "•" },
  fontFamily: fontFamilies.garamond,
  header: "centered",
  density: "spacious",
  sectionOrder: ["summary", "education", "experience", "projects", "skills", "certs", "achievements", "languages"],
  sectionTitleStyle: "boxed",
  skillStyle: "inline",
  bullet: "•",
});
