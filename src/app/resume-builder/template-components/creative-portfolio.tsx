"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const CreativePortfolioPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#ec4899", border: "#f3e8ff", bulletChar: "◆" },
  fontFamily: fontFamilies.jakarta,
  header: "left",
});
