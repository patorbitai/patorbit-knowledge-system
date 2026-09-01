"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

/** Premium Slate — centered header, boxed titles, experience-first, chips, normal density */
export const PremiumSlatePreview = generateTemplate({
  theme: { ink: "#1e293b", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#475569", border: "#e2e8f0", bulletChar: "•" },
  fontFamily: fontFamilies.sans,
  header: "centered",
  density: "normal",
  sectionOrder: ["summary", "experience", "skills", "projects", "education", "certs", "achievements", "languages"],
  sectionTitleStyle: "boxed",
  skillStyle: "chips",
  bullet: "•",
});
