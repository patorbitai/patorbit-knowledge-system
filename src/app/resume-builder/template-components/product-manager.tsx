"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Product Manager — experience-first, compact, grouped skills by product area */
export const ProductManagerPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#ea580c", border: "#fed7aa", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "left",
  layout: "compact",
  density: "compact",
  sectionOrder: ["experience", "projects", "skills", "education", "certs", "achievements", "languages", "summary"],
  sectionTitleStyle: "bordered",
  skillStyle: "grouped",
  bullet: "▸",
});
