"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const SwissDesignPreview = generateTemplate({
  theme: { ink: "#1e293b", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#4338ca", border: "#e2e8f0", bulletChar: "–" },
  fontFamily: fontFamilies.sans,
  header: "left",
  layout: "compact",
  density: "compact",
  sectionOrder: ["experience", "skills", "projects", "education", "certs", "achievements", "languages", "summary"],
  sectionTitleStyle: "boxed",
  skillStyle: "grouped",
  bullet: "–",
});
