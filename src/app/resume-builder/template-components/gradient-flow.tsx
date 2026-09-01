"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Gradient Flow — two-column sidebar, experience-first, grouped skills */
export const GradientFlowPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#0891b2", border: "#e2e8f0", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "split-contact",
  layout: "two-column-sidebar",
  sidebarPosition: "right",
  sectionOrder: ["summary", "experience", "projects", "certs", "achievements", "languages", "interests", "skills", "education"],
  sectionTitleStyle: "minimal",
  skillStyle: "grouped",
  bullet: "▸",
});
