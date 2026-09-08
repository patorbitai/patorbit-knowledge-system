"use client";

import { useMemo, type ReactNode } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { FONT_OPTIONS, DEFAULT_STYLE_CONFIG, type ResumeStyleConfig } from "@/lib/resume-design-system/style-config";
import { fontFamilies } from "@/lib/resume-design-system/fonts";

/** Resolve the CSS font-family string from a stored style config. */
function resolveFontFamily(stored?: ResumeStyleConfig): string {
  const config = stored ?? DEFAULT_STYLE_CONFIG;
  const option = FONT_OPTIONS.find((f) => f.id === config.fontFamily);
  return option?.stack ?? fontFamilies.sans;
}

/**
 * ResumeFont — applies the active resume's configured font to its children.
 *
 * Use this wrapper around resume content in the editor (view-mode cards,
 * section headers, descriptions, etc.) so the editor visually matches the
 * preview/export typography.
 *
 * Application UI elements (buttons, labels, navigation, modals) should NOT
 * be wrapped — they keep the system/UI font.
 */
export function ResumeFont({ children, className }: { children: ReactNode; className?: string }) {
  const styleConfig = useResumeBuilder((s) => s.styleConfigs[s.activeResumeId]);
  const fontFamily = useMemo(() => resolveFontFamily(styleConfig), [styleConfig]);

  return (
    <span style={{ fontFamily }} className={className}>
      {children}
    </span>
  );
}
