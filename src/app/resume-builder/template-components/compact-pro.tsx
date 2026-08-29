"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const CompactProPreview = generateTemplate({
  theme: { ink: "#111827", body: "#374151", muted: "#6b7280", light: "#9ca3af", accent: "#059669", border: "#d1d5db", bulletChar: "–" },
  fontFamily: fontFamilies.sans,
  header: "minimal",
});
