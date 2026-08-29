"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const DarkElegancePreview = generateTemplate({
  theme: { ink: "#f1f5f9", body: "#e2e8f0", muted: "#94a3b8", light: "#64748b", accent: "#c084fc", border: "#334155", bulletChar: "▸" },
  fontFamily: fontFamilies.garamond,
  header: "centered",
  backgroundColor: "#0f172a",
});
