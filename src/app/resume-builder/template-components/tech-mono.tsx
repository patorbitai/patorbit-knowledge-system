"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const TechMonoPreview = generateTemplate({
  theme: {
    ink: "#e2e8f0",
    body: "#cbd5e1",
    muted: "#94a3b8",
    light: "#64748b",
    accent: "#38bdf8",
    border: "#334155",
    bulletChar: "→",
  },
  fontFamily: fontFamilies.mono,
  header: "centered",
  backgroundColor: "#0f172a",
});
