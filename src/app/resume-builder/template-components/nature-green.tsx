"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Nature Green — two-column sidebar, education-first, grouped skills */
export const NatureGreenPreview = generateTemplate({
  theme: { ink: "#14532d", body: "#166534", muted: "#15803d", light: "#86efac", accent: "#15803d", border: "#bbf7d0", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "left",
  layout: "two-column-sidebar",
  sidebarPosition: "right",
  sectionOrder: ["summary", "education", "experience", "projects", "certs", "achievements", "languages", "interests", "skills"],
  sectionTitleStyle: "minimal",
  skillStyle: "grouped",
  bullet: "▸",
});
