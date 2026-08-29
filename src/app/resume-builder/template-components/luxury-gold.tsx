"use client";
import { generateTemplate } from "./_template-factory";
import { fontFamilies } from "@/lib/resume-design-system";

export const LuxuryGoldPreview = generateTemplate({
  theme: { ink: "#1c1917", body: "#44403c", muted: "#78716c", light: "#a8a29e", accent: "#a16207", border: "#d6d3d1", bulletChar: "◆" },
  fontFamily: fontFamilies.garamond,
  header: "gold-accent",
});
