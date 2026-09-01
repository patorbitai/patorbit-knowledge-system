"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const AcademicFormalPreview = generateTemplate({
  theme: { ink: "#111827", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#4338ca", border: "#e5e7eb", bulletChar: "•" },
  fontFamily: fontFamilies.garamond,
  header: "centered",
  density: "spacious",
  sectionOrder: ["summary", "education", "experience", "projects", "skills", "certs", "achievements", "languages"],
  sectionTitleStyle: "boxed",
  skillStyle: "inline",
  bullet: "•",
});
