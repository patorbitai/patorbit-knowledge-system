"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Creative Burst — two-column sidebar, projects-first, bold accent strip */
export const CreativeBurstPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#7c3aed", border: "#e2e8f0", bulletChar: "✦" },
  fontFamily: fontFamilies.jakarta,
  header: "split-contact",
  layout: "two-column-sidebar",
  sidebarPosition: "left",
  sectionOrder: ["summary", "projects", "experience", "certs", "achievements", "languages", "interests", "skills", "education"],
  sectionTitleStyle: "bordered",
  skillStyle: "chips",
  bullet: "✦",
});
