"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { PaginatedResumeSheet } from "@/components/resume/PaginatedResumeSheet";
import type { ResumeTemplate } from "@/app/resume-builder/templates";
import type { Resume } from "@/types/resume";
import { GALLERY_SAMPLE_RESUME } from "./gallery-sample-resume";
import { A4 } from "@/lib/resume-design-system/geometry";

const PAGE_WIDTH = A4.widthPx;
const PAGE_HEIGHT = A4.heightPx;
/** Zoom bounds, in percent of the A4 sheet. */
const MIN_ZOOM = 50;
const MAX_ZOOM = 150;
const ZOOM_STEP = 10;
/** Auto-fit scale is clamped to the same 50%–150% range as manual zoom. */
const MIN_FIT = 0.5;
const MAX_FIT = 1.5;

export interface FullTemplatePreviewProps {
  /** Template to preview when the modal opens. */
  templateId: string;
  /** Ordered list of templates for Previous / Next navigation. */
  templates: ResumeTemplate[];
  onClose: () => void;
  /** Called with the currently viewed template id when "Use This Template" is clicked. */
  onUseTemplate: (id: string) => void;
}

export function FullTemplatePreview({
  templateId,
  templates,
  onClose,
  onUseTemplate,
}: FullTemplatePreviewProps) {
  const [activeId, setActiveId] = useState(templateId);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  /** Auto-fit ratio (0.5–1.5) computed from the available stage area. */
  const [fitScale, setFitScale] = useState(1);
  /** User zoom override in percent; null means "follow the auto-fit default". */
  const [zoom, setZoom] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  const template = templates.find((t) => t.id === activeId) ?? templates[0];
  const index = templates.findIndex((t) => t.id === activeId);

  const resume: Resume = useMemo(
    () => ({ ...GALLERY_SAMPLE_RESUME, templateId: activeId }),
    [activeId],
  );

  // Count how many A4 pages the rendered resume spans, so multi-page
  // templates expose Page 1 / Page 2 … navigation.
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
  }, [activeId]);

  // Auto-fit the A4 page to the available stage area (50%–150%). The user's
  // manual zoom (if any) overrides this; Reset returns to the fit value.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) {
        setFitScale(Math.min(MAX_FIT, Math.max(MIN_FIT, Math.min(w / PAGE_WIDTH, h / PAGE_HEIGHT))));
      }
    };
    fit();
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(fit);
      ro.observe(el);
    }
    return () => ro?.disconnect();
  }, [activeId]);

  // Reset to page 1 whenever the viewed template changes. Done as a
  // render-phase adjustment (not an effect) to avoid a cascading render.
  const [lastActiveId, setLastActiveId] = useState(activeId);
  if (lastActiveId !== activeId) {
    setLastActiveId(activeId);
    setPage(1);
  }

  const goTemplate = useCallback(
    (dir: -1 | 1) => {
      setActiveId((cur) => {
        const i = Math.max(0, templates.findIndex((t) => t.id === cur));
        const next = templates[(i + dir + templates.length) % templates.length];
        return next?.id ?? cur;
      });
    },
    [templates],
  );

  const goPage = useCallback(
    (dir: -1 | 1) => {
      setPage((p) => Math.min(pages, Math.max(1, p + dir)));
    },
    [pages],
  );

  // Effective zoom: the user's manual override, or the auto-fit default.
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

  // Keyboard: Escape closes, arrows switch templates, +/= zoom in, - zoom out,
  // 0 resets zoom. Typing shortcuts are ignored while an editable element is
  // focused so they never interfere with text/input behaviour.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);
      if (e.key === "Escape") {
        onClose();
      } else if (isEditable) {
        return;
      } else if (e.key === "ArrowLeft") {
        goTemplate(-1);
      } else if (e.key === "ArrowRight") {
        goTemplate(1);
      } else if (e.key === "+" || e.key === "=") {
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
  }, [onClose, goTemplate, zoomIn, zoomOut, resetZoom]);

  const pageButtons = Array.from({ length: pages }, (_, i) => i + 1);

  // Client-only: the portal target only exists in the browser. This component
  // is mounted on user interaction, so this is a defensive guard.
  if (typeof document === "undefined") return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${template.name} preview`}
      data-testid="full-template-preview"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[60] flex flex-col bg-[#04070e]/95 backdrop-blur-md text-white"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
        {/* Header */}
        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-8 py-4 border-b border-white/[0.08] shrink-0">
          <button
            type="button"
            onClick={() => goTemplate(-1)}
            aria-label="Previous template"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 shrink-0 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0 text-center">
            <h3 className="text-sm md:text-lg font-semibold text-white tracking-tight truncate">
              {template.name}
            </h3>
            <p className="text-[10px] md:text-[11px] text-slate-500 mt-0.5">
              {index + 1} of {templates.length} · {pages} page{pages > 1 ? "s" : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => goTemplate(1)}
            aria-label="Next template"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 shrink-0 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-white/[0.1] mx-1 hidden sm:block shrink-0" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            data-testid="preview-close"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: zoom controls + page navigation */}
        <div className="flex items-center justify-center gap-3 flex-wrap pt-3 pb-1 px-4 shrink-0">
          {/* Zoom controls */}
          <div
            className="flex items-center gap-0.5 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1"
            role="group"
            aria-label="Zoom controls"
            data-testid="zoom-controls"
          >
            <button
              type="button"
              onClick={zoomOut}
              disabled={effectiveZoom <= MIN_ZOOM}
              aria-label="Zoom out"
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="min-w-[46px] text-center text-xs font-semibold text-slate-200 tabular-nums" data-testid="zoom-percent">
              {effectiveZoom}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              disabled={effectiveZoom >= MAX_ZOOM}
              aria-label="Zoom in"
              className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/[0.1] mx-1" />
            <button
              type="button"
              onClick={resetZoom}
              aria-label="Reset zoom"
              className="inline-flex items-center gap-1 px-2 py-1.5 rounded-md text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-white/[0.08] transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

        {/* Page navigation strip */}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-1.5" data-testid="preview-page-nav">
            <button
              type="button"
              onClick={() => goPage(-1)}
              disabled={page === 1}
              aria-label="Previous page"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 cursor-pointer"
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
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 cursor-pointer ${
                  page === n
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent"
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        </div>

        {/* Resume stage */}
        <div
          ref={stageRef}
          className="flex-1 min-h-0 flex items-start justify-center overflow-auto px-4 md:px-8 py-4"
        >
          <div
            className="relative bg-white rounded-sm shadow-[0_24px_80px_rgba(0,0,0,0.6)] shrink-0"
            style={{ width: PAGE_WIDTH * scale, height: PAGE_HEIGHT * scale }}
          >
            <div
              data-testid="preview-page-viewport"
              className="absolute inset-0 overflow-hidden"
              style={{ backgroundColor: "#ffffff" }}
            >
              {/* Scaled A4 sheet; translated up by (page-1) page heights. The
                  scale() is applied first so the translation stays in the
                  scaled coordinate space. */}
              <div
                data-testid="preview-page-sheet"
                style={{
                  width: PAGE_WIDTH,
                  transform: `scale(${scale}) translateY(-${(page - 1) * PAGE_HEIGHT}px)`,
                  transformOrigin: "top left",
                }}
              >
                {/* Real A4 pages: the same paginated sheet the PDF export
                    renders, so the Gallery is representative of the resume. */}
                <div ref={measureRef}>
                  <PaginatedResumeSheet resume={resume} template={template} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-4 md:px-8 py-4 border-t border-white/[0.08] shrink-0">
          <span className="text-[10px] md:text-[11px] text-slate-500 hidden sm:block">
            Preview shows realistic sample data — your resume content is preserved.
          </span>
          <button
            type="button"
            onClick={() => onUseTemplate(activeId)}
            data-testid="use-this-template"
            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 shadow-[0_8px_24px_rgba(6,182,212,0.25)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Use This Template
          </button>
        </div>
    </motion.div>,
    document.body,
  );
}
