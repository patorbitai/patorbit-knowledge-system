"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const AcademicCvPreview = generateTemplate({
  theme: { ink: "#1f2937", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#1d4ed8", border: "#d1d5db", bulletChar: "•" },
  fontFamily: fontFamilies.garamond,
  header: "left",
});
