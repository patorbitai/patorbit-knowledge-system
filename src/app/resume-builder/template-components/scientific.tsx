"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const ScientificPreview = generateTemplate({
  theme: { ink: "#1f2937", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#166534", border: "#d1fae5", bulletChar: "•" },
  fontFamily: fontFamilies.garamond,
  header: "centered",
});
