"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const SwissDesignPreview = generateTemplate({
  theme: { ink: "#18181b", body: "#27272a", muted: "#71717a", light: "#a1a1aa", accent: "#dc2626", border: "#e4e4e7", bulletChar: "▸" },
  fontFamily: fontFamilies.sans,
  header: "left",
});
