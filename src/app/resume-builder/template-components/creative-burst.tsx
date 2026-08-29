"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const CreativeBurstPreview = generateTemplate({
  theme: { ink: "#0f172a", body: "#334155", muted: "#64748b", light: "#94a3b8", accent: "#7c3aed", border: "#e2e8f0", bulletChar: "✦" },
  fontFamily: fontFamilies.jakarta,
  header: "centered",
});
