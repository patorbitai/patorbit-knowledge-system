"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const BannerBoldPreview = generateTemplate({
  theme: { ink: "#1f2937", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#dc2626", border: "#e5e7eb", bulletChar: "▸" },
  fontFamily: fontFamilies.sans,
  header: "bold-banner",
  layout: "banner",
  density: "normal",
  sectionOrder: ["summary", "experience", "skills", "projects", "education", "certs", "achievements", "languages"],
  sectionTitleStyle: "bordered",
  skillStyle: "chips",
  bullet: "▸",
});
