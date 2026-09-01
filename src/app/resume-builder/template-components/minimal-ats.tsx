"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const MinimalAtsPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#1e293b", muted: "#64748b", light: "#94a3b8", accent: "#64748b", border: "#e2e8f0", bulletChar: "•" },
  fontFamily: fontFamilies.jakarta,
  header: "minimal",
  density: "normal",
  sectionOrder: ["summary", "experience", "skills", "education", "certs", "projects", "achievements", "languages"],
  sectionTitleStyle: "minimal",
  skillStyle: "inline",
  bullet: "•",
});
