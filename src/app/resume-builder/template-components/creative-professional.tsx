"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Creative Professional — two-column sidebar, projects-first, boxed section titles */
export const CreativeProfessionalPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#8b5cf6", border: "#e2e8f0", bulletChar: "✦" },
  fontFamily: fontFamilies.jakarta,
  header: "centered",
  layout: "two-column-sidebar",
  sidebarPosition: "right",
  sectionOrder: ["summary", "projects", "experience", "certs", "achievements", "languages", "interests", "skills", "education"],
  sectionTitleStyle: "boxed",
  skillStyle: "chips",
  bullet: "✦",
});
