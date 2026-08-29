"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const StartupVibePreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#10b981", border: "#d1fae5", bulletChar: "▸" },
  fontFamily: fontFamilies.jakarta,
  header: "centered",
});
