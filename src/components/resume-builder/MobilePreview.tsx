"use client";

import { useMemo } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { getActiveTemplate } from "@/components/resume/ResumePreview";
import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import { A4 } from "@/lib/resume-design-system/geometry";

/**
 * MobilePreview — a lightweight, crash-safe resume preview for mobile viewports.
 * Unlike LiveStylePreview, it does NOT use useLayoutEffect, ResizeObserver,
 * or complex zoom/fit logic that can crash in a fixed overlay context.
 */
export function MobilePreview() {
  const resume = useResumeBuilder((s) => s.resume);
  const styleConfig = useResumeBuilder((s) => s.styleConfigs[s.activeResumeId]);
  const template = useMemo(() => getActiveTemplate(resume), [resume]);

  // Scale to fit mobile viewport width
  const viewportWidth = typeof window !== "undefined" ? Math.min(window.innerWidth, 500) : 380;
  const scale = Math.max(0.35, Math.min(0.65, viewportWidth / A4.widthPx));

  return (
    <div className="flex flex-col h-full items-center" data-testid="mobile-preview">
      {/* Zoom info */}
      <div className="shrink-0 px-4 py-2 text-[10px] text-gray-400 dark:text-slate-500 text-center">
        A4 Preview • {Math.round(scale * 100)}%
      </div>

      {/* Preview container */}
      <div className="flex-1 min-h-0 w-full overflow-auto flex justify-center pb-8">
        <div
          className="bg-white rounded shadow-lg origin-top"
          style={{
            width: A4.widthPx * scale,
            minHeight: A4.heightPx * scale,
          }}
        >
          <div
            style={{
              width: A4.widthPx,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <PaginatedResumeSheet resume={resume} template={template} styleConfig={styleConfig} />
          </div>
        </div>
      </div>
    </div>
  );
}
