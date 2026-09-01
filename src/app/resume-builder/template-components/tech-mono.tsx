"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const TechMonoPreview = generateTemplate({
  theme: { ink: "#064e3b", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#059669", border: "#d1fae5", bulletChar: ">" },
  fontFamily: fontFamilies.mono,
  header: "left",
  density: "compact",
  sectionOrder: ["experience", "skills", "projects", "education", "summary", "certs", "achievements", "languages"],
  sectionTitleStyle: "minimal",
  skillStyle: "dots",
  bullet: ">",
});
