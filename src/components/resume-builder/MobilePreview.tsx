"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { getActiveTemplate } from "@/components/resume/ResumePreview";
import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import { useResumePlan } from "@/lib/resume-planner/react";
import { A4 } from "@/lib/resume-design-system/geometry";
import { InlineEditLayer } from "@/components/resume-builder/inline/InlineEditLayer";
import { EditHint } from "@/components/resume-builder/inline/EditHint";

/**
 * MobilePreview — a lightweight, crash-safe resume preview for mobile viewports.
 * Unlike LiveStylePreview, it does NOT use useLayoutEffect or complex
 * zoom/fit logic that can crash in a fixed overlay context. (M5G D2: one
 * ResizeObserver re-reads the scroller's clientWidth so the fit re-clamps
 * when the vertical scrollbar appears — a plain width read, no zoom loop.)
 */
export function MobilePreview() {
  const resume = useResumeBuilder((s) => s.resume);
  const styleConfig = useResumeBuilder((s) => s.styleConfigs[s.activeResumeId]);
  const template = useMemo(() => getActiveTemplate(resume), [resume]);
  // Same plan as desktop so mobile preview never diverges (§27).
  const plan = useResumePlan();

  // Scale to fit the actual scroller width — not the window. The scroller
  // can be narrower than the viewport (vertical scrollbar / padding), and a
  // window-based scale made the sheet wider than its container, clipping the
  // left edge and adding a horizontal scrollbar (M5G D2). The 0.35–0.65
  // clamps still apply whenever they fit inside the container.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const measure = () => setContainerWidth(el.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    // The vertical scrollbar only appears once the sheet paginates, which
    // narrows the scroller after mount (390 → 374 in the M5G audit) —
    // observe so the fit re-clamps when that happens.
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, []);
  const fallbackWidth = typeof window !== "undefined" ? Math.min(window.innerWidth, 500) : 380;
  const fitWidth = containerWidth && containerWidth > 0 ? containerWidth : fallbackWidth;
  const scale = Math.min(Math.max(0.35, Math.min(0.65, fitWidth / A4.widthPx)), fitWidth / A4.widthPx);

  return (
    <InlineEditLayer>
    <div className="flex flex-col h-full items-center" data-testid="mobile-preview">
      {/* Zoom info */}
      <div className="shrink-0 px-4 py-2 text-[10px] text-gray-400 dark:text-slate-500 text-center">
        A4 Preview • {Math.round(scale * 100)}%
      </div>

      {/* M5A — first-use touch discoverability: one quiet line inside the
          existing meta area, dismissible, gone after the first edit. */}
      <EditHint
        text="Tap any text to edit"
        className="shrink-0 px-4 pb-1 text-[10px] font-medium text-gray-400 dark:text-slate-500 justify-center"
      />

      {/* Preview container */}
      <div ref={scrollerRef} className="flex-1 min-h-0 w-full overflow-auto flex justify-center pb-8">
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
            <PaginatedResumeSheet resume={resume} template={template} styleConfig={styleConfig} plan={plan} />
          </div>
        </div>
      </div>
    </div>
    </InlineEditLayer>
  );
}
