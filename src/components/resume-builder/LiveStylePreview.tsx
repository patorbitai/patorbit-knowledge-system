"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw } from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { getActiveTemplate } from "@/components/resume/ResumePreview";
import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import { A4 } from "@/lib/resume-design-system/geometry";

const PAGE_WIDTH = A4.widthPx;
const PAGE_HEIGHT = A4.heightPx;
/** Manual zoom bounds, in percent of the fit-to-panel size. */
const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 10;
/** Auto-fit lower bound — the sheet is never shrunk below 50%. */
const MIN_FIT = 0.5;

/**
 * LiveStylePreview — a self-contained, store-driven resume preview.
 *
 * Renders ONE instance of the real ResumePreview with the user's current
 * resume, templateId, and ResumeStyleConfig straight from the store, so every
 * customization change is visible immediately. The sheet is auto-fit,
 * zoomable (50%–150%), and multi-page resumes expose Page 1 / Page 2 …
 * navigation. It never touches resume content and never uses sample data.
 *
 * fitMode: "width" fits the sheet to the panel width (Customize workspace);
 *          "contain" fits the current A4 page fully into the available area
 *          (Professional Preview — the resume as the hero).
 * maxFit:  upper bound for auto-fit. 1 = natural size; >1 allows upscaling.
 */
export function LiveStylePreview({
  fitMode = "width",
  maxFit = 1,
}: {
  fitMode?: "width" | "contain";
  maxFit?: number;
}) {
  const resume = useResumeBuilder((s) => s.resume);
  const styleConfig = useResumeBuilder((s) => s.styleConfigs[s.activeResumeId]);
  const template = useMemo(() => getActiveTemplate(resume), [resume]);

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [fitScale, setFitScale] = useState(1);
  const [zoom, setZoom] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // Count how many A4 pages the rendered resume spans.
  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      const height = el.scrollHeight;
      if (height > 0) setPages(Math.max(1, Math.ceil(height / PAGE_HEIGHT)));
    };
    measure();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    return () => ro?.disconnect();
  }, [resume.templateId]);

  // Auto-fit the A4 sheet to the available stage area. "width" scales to the
  // panel width; "contain" fits the whole current page (width AND height) so
  // the resume fills the viewport without cropping. Bounded by [MIN_FIT, maxFit].
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      let next: number;
      if (fitMode === "contain") {
        const h = el.clientHeight;
        if (h <= 0) return;
        next = Math.min(w / PAGE_WIDTH, h / PAGE_HEIGHT);
      } else {
        next = w / PAGE_WIDTH;
      }
      setFitScale(Math.min(maxFit, Math.max(MIN_FIT, next)));
    };
    fit();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(fit);
      ro.observe(el);
    }
    return () => ro?.disconnect();
  }, [fitMode, maxFit]);

  // Reset to page 1 when the template changes (render-phase adjustment).
  const [lastTemplateId, setLastTemplateId] = useState(resume.templateId);
  if (lastTemplateId !== resume.templateId) {
    setLastTemplateId(resume.templateId);
    setPage(1);
    setZoom(null);
  }

  const defaultZoom = Math.round(fitScale * 100);
  const effectiveZoom = zoom ?? defaultZoom;
  const scale = effectiveZoom / 100;

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(MAX_ZOOM, (z ?? defaultZoom) + ZOOM_STEP));
  }, [defaultZoom]);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(MIN_ZOOM, (z ?? defaultZoom) - ZOOM_STEP));
  }, [defaultZoom]);

  const resetZoom = useCallback(() => {
    setZoom(null);
  }, []);

  const goPage = useCallback((dir: -1 | 1) => {
    setPage((p) => Math.min(pages, Math.max(1, p + dir)));
  }, [pages]);

  // Keyboard: +/= zoom in, - zoom out, 0 reset to fit. Ignored while an
  // editable element is focused so typing is never hijacked.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (isEditable) return;
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetZoom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIn, zoomOut, resetZoom]);

  const pageButtons = Array.from({ length: pages }, (_, i) => i + 1);

  return (
    <div
      role="region"
      aria-label="Live resume preview"
      data-testid="live-style-preview"
      className="flex flex-col h-full min-h-0"
    >
      {/* Toolbar: zoom + page navigation */}
      <div className="sticky top-0 z-10 flex items-center justify-center gap-3 flex-wrap px-4 py-2 bg-white/90 dark:bg-[#0A0E1B]/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/[0.06] shrink-0">
        <div
          className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-gray-100 dark:bg-white/[0.03] p-1"
          role="group"
          aria-label="Zoom controls"
          data-testid="live-zoom-controls"
        >
          <button
            type="button"
            onClick={zoomOut}
            disabled={effectiveZoom <= MIN_ZOOM}
            aria-label="Zoom out"
            className="p-1.5 rounded-md text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="min-w-[46px] text-center text-xs font-semibold text-gray-900 dark:text-slate-200 tabular-nums" data-testid="live-zoom-percent">
            {effectiveZoom}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={effectiveZoom >= MAX_ZOOM}
            aria-label="Zoom in"
            className="p-1.5 rounded-md text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-gray-300 dark:bg-white/[0.1] mx-1" />
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold text-gray-500 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-center gap-1.5" data-testid="live-page-nav">
            <button
              type="button"
              onClick={() => goPage(-1)}
              disabled={page === 1}
              aria-label="Previous page"
              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageButtons.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                aria-label={`Page ${n}`}
                aria-current={page === n ? "page" : undefined}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  page === n
                    ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => goPage(1)}
              disabled={page === pages}
              aria-label="Next page"
              className="p-1.5 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        <span className="text-[10px] text-gray-400 dark:text-slate-500 hidden lg:inline">
          {pages} page{pages > 1 ? "s" : ""} · A4
        </span>
      </div>

      {/* Stage — top-aligned sheet (items-start), horizontally centered, with a
          small intentional gap below the toolbar (~16px) and room to scroll past
          the bottom. The gap is padding, independent of zoom level or page. */}
      <div ref={stageRef} data-testid="live-stage" className="flex-1 min-h-0 flex items-start justify-center overflow-auto overscroll-contain px-4 pt-2 pb-10">
        <div
          className="relative bg-white rounded-sm shadow-[0_24px_80px_rgba(0,0,0,0.6)] shrink-0"
          style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
        >
          <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: "#ffffff" }}>
            {/* Scaled A4 sheet; translated up by (page-1) page heights. scale()
                is applied first so the translation stays in the scaled space. */}
            <div
              data-testid="live-page-sheet"
              style={{
                width: PAGE_WIDTH,
                transform: `scale(${scale}) translateY(-${(page - 1) * PAGE_HEIGHT}px)`,
                transformOrigin: "top left",
              }}
            >
              {/* Real A4 pages — the same canonical page frame the Gallery and
                  the PDF export use, so all three stay pixel-aligned. */}
              <div ref={measureRef}>
                <PaginatedResumeSheet resume={resume} template={template} styleConfig={styleConfig} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
