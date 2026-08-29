"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  buildStyleRules,
  buildStyleVars,
  getTemplateStyleSupport,
  resolveStyleConfig,
  type ResumeStyleConfig,
  type StyleOptionKey,
} from "@/lib/resume-design-system/style-config";

interface ResumeStyleContextValue {
  /** Resolved, clamped style config for the current sheet. */
  config: ResumeStyleConfig;
  /** Options the current template supports for customization. */
  supported: Set<StyleOptionKey>;
}

const ResumeStyleContext = createContext<ResumeStyleContextValue | null>(null);

/** Read the resolved style config inside a styled sheet. */
export function useResumeStyle(): ResumeStyleContextValue {
  const ctx = useContext(ResumeStyleContext);
  if (!ctx) {
    return { config: resolveStyleConfig(), supported: getTemplateStyleSupport("modern-clean") };
  }
  return ctx;
}

/**
 * StyleScope is the single seam where ResumeStyleConfig reaches the sheet.
 * It wraps the rendered template in a `data-rs-scope` element that carries the
 * style values as CSS custom properties and injects a scoped stylesheet. An
 * untouched (default) config emits no override rules, so templates render
 * exactly as designed until the user customizes them.
 */
export function StyleScope({
  config,
  templateId,
  children,
}: {
  config?: Partial<ResumeStyleConfig>;
  templateId: string;
  children: React.ReactNode;
}) {
  const resolved = useMemo(() => resolveStyleConfig(config), [config]);
  const supported = useMemo(() => getTemplateStyleSupport(templateId), [templateId]);
  const vars = useMemo(() => buildStyleVars(resolved), [resolved]);
  const rules = useMemo(() => buildStyleRules(resolved, supported), [resolved, supported]);

  const ctxValue = useMemo(() => ({ config: resolved, supported }), [resolved, supported]);

  return (
    <ResumeStyleContext.Provider value={ctxValue}>
      <div data-rs-scope style={vars as React.CSSProperties}>
        {children}
        {rules && <style>{rules}</style>}
      </div>
    </ResumeStyleContext.Provider>
  );
}
