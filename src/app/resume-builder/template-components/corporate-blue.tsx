"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const CorporateBluePreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#1e40af", muted: "#3b82f6", light: "#93c5fd", accent: "#1d4ed8", border: "#bfdbfe", bulletChar: "▸" },
  fontFamily: fontFamilies.sans,
  header: "left",
});
