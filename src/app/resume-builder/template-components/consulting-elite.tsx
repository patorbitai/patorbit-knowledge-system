"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const ConsultingElitePreview = generateTemplate({
  theme: { ink: "#0d1b2a", body: "#1e293b", muted: "#52637a", light: "#94a3b8", accent: "#1d4ed8", border: "#dde3ea", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "left",
  layout: "compact",
  density: "compact",
  sectionOrder: ["summary", "experience", "skills", "education", "certs", "projects"],
  sectionTitleStyle: "minimal",
  skillStyle: "grouped",
  bullet: "▸",
});
