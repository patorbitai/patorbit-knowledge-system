"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const SidebarElegancePreview = generateTemplate({
  theme: { ink: "#1e1b4b", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#7c3aed", border: "#e5e7eb", bulletChar: "▸" },
  fontFamily: fontFamilies.sans,
  header: "split-contact",
  layout: "two-column-sidebar",
  sidebarPosition: "right",
  sectionOrder: ["summary", "experience", "projects", "certs", "achievements", "languages", "interests", "skills", "education"],
  sectionTitleStyle: "minimal",
  skillStyle: "chips",
  bullet: "▸",
});
