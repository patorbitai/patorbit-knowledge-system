"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const DarkElegancePreview = generateTemplate({
  theme: { ink: "#111827", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#374151", border: "#e5e7eb", bulletChar: "▸" },
  fontFamily: fontFamilies.sans,
  header: "dark-bar",
  layout: "banner",
  density: "compact",
  sectionOrder: ["experience", "skills", "projects", "education", "summary", "certs", "achievements", "languages"],
  sectionTitleStyle: "minimal",
  skillStyle: "dots",
  bullet: "▸",
});
