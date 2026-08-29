"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const ExecutivePreview = generateTemplate({
  theme: { ink: "#1f2937", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#a16207", border: "#d1d5db", bulletChar: "◆" },
  fontFamily: fontFamilies.garamond,
  header: "gold-accent",
});
