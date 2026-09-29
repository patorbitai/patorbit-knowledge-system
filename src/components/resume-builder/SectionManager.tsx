"use client";

/**
 * M4 §6 — document-level section management for THIS resume version.
 *
 * - Show / hide supported sections (resume-version scoped: the prefs live on
 *   the resume document, so the Master Profile's order can never change).
 * - Reorder sections; the planner applies the same prefs to every template
 *   and to preview ≡ DOCX ≡ print.
 * - Empty sections offer an "Add" shortcut into the right editor instead of
 *   pretending content exists (no fabricated fields).
 *
 * The list mirrors what will ACTUALLY render: `plan.sections` is the real
 * planner output (content + user order), so what you see here is what the
 * resume draws. Shared logic lives in @/lib/section-prefs.
 */
import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { useResumeBuilder } from "@/store/resume-builder";
import { useResumePlan } from "@/lib/resume-planner/react";
import type { ResumeSectionKey, SectionPrefs } from "@/types/resume";
import {
  SECTION_META,
  computeSectionOrder,
  hideSection,
  moveInSectionOrder,
  sectionHasContent,
  showSection,
} from "@/lib/section-prefs";

export function SectionManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const resume = useResumeBuilder((s) => s.resume);
  const setSectionPrefs = useResumeBuilder((s) => s.setSectionPrefs);
  const setActiveSection = useResumeBuilder((s) => s.setActiveSection);
  const plan = useResumePlan();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = useState("");

  // M5E — focus moves into the dialog on open (the close button) and returns
  // to the "Manage sections" button on close. The opener must be captured
  // BEFORE any autofocus steals activeElement, so focus-in is deferred.
  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    }, 0);
    return () => {
      clearTimeout(t);
      const opener = openerRef.current;
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open]);

  // Escape closes (professional dialog behavior) and Tab stays inside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = dialogRef.current;
      if (!root) return;
      const focusables = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const prefs: SectionPrefs = resume.sectionPrefs ?? {};
  const hidden = new Set<ResumeSectionKey>(prefs.hidden ?? []);
  const visibleOrder = plan.sections.map((s) => s.type as ResumeSectionKey);
  const view = computeSectionOrder(resume, visibleOrder, prefs);
  const currentOrder = view.order;
  const emptyRows = (Object.keys(SECTION_META) as ResumeSectionKey[]).filter(
    (k) => !sectionHasContent(resume, k),
  );

  const toggleHidden = (key: ResumeSectionKey) => {
    const next = hidden.has(key)
      ? showSection(prefs, currentOrder, key)
      : hideSection(prefs, currentOrder, key);
    setSectionPrefs(next);
    setAnnouncement(
      `${SECTION_META[key].label} ${hidden.has(key) ? "shown" : "hidden"}.`,
    );
  };

  const move = (key: ResumeSectionKey, dir: -1 | 1) => {
    const before = currentOrder.indexOf(key);
    const next = moveInSectionOrder(currentOrder, key, dir);
    if (next === currentOrder) return;
    setSectionPrefs({
      order: next,
      ...(prefs.hidden?.length ? { hidden: prefs.hidden } : {}),
    });
    setAnnouncement(
      `${SECTION_META[key].label} moved to position ${before + dir + 1} of ${next.length}.`,
    );
  };

  const reset = () => {
    setSectionPrefs({});
    setAnnouncement("Section order and visibility reset to default.");
  };

  const goToEditor = (sectionId: (typeof SECTION_META)[ResumeSectionKey]["editorSection"]) => {
    if (sectionId) setActiveSection(sectionId);
    onClose();
  };

  const renderRow = (key: ResumeSectionKey, position: number) => {
    const isUserHidden = hidden.has(key);
    const isAutoDropped = view.autoDropped.includes(key);
    const visible = visibleOrder.includes(key);
    // Only the LAST visible content section can't be hidden.
    const canHide = visible && visibleOrder.length > 1;
    const label = SECTION_META[key].label;
    return (
      <li
        key={key}
        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.04] group/row"
      >
        <span className="w-5 text-[10px] text-gray-400 dark:text-slate-500 tabular-nums text-right">
          {position}
        </span>
        <span
          className={`flex-1 text-xs truncate ${
            isUserHidden || isAutoDropped
              ? "text-gray-400 dark:text-slate-500 line-through decoration-gray-300 dark:decoration-slate-600"
              : "text-gray-800 dark:text-slate-200"
          }`}
        >
          {label}
          {isAutoDropped && (
            <span className="ml-1.5 text-[10px] no-underline text-gray-400 dark:text-slate-500">
              (not shown in this plan)
            </span>
          )}
        </span>

        {/* Reorder */}
        <button
          type="button"
          onClick={() => move(key, -1)}
          disabled={position <= 1}
          aria-label={`Move ${label} up`}
          className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => move(key, 1)}
          disabled={position >= currentOrder.length}
          aria-label={`Move ${label} down`}
          className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
        >
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        {/* Visibility */}
        {isAutoDropped ? (
          <span
            className="p-1 text-gray-300 dark:text-slate-600"
            title="Dropped automatically by this plan (e.g. interests on a job-targeted resume)"
          >
            <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
        ) : (
          <button
            type="button"
            onClick={() => toggleHidden(key)}
            disabled={isUserHidden ? false : !canHide}
            aria-label={isUserHidden ? `Show ${label}` : `Hide ${label}`}
            aria-pressed={isUserHidden}
            title={isUserHidden ? "Show section" : "Hide section"}
            className="p-1 rounded text-gray-400 dark:text-slate-500 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-400 cursor-pointer"
          >
            {isUserHidden ? (
              <EyeOff className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </li>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Section manager"
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#0C1222] border border-gray-200 dark:border-white/[0.08] shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/[0.06] shrink-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <Layers className="w-4 h-4 text-cyan-500" aria-hidden="true" />
            Sections
            <span className="text-[10px] font-normal text-gray-400 dark:text-slate-500">
              — this resume only
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close section manager"
            className="p-1.5 rounded-md text-gray-400 dark:text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-4 py-3 overflow-y-auto">
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mb-3">
            Show, hide and reorder sections for this resume version. Your
            Master Profile keeps its own order — switching templates keeps
            this order too.
          </p>

          <ul className="space-y-0.5" data-testid="section-manager-list">
            {currentOrder.map((key, i) => renderRow(key, i + 1))}
          </ul>

          {emptyRows.length > 0 && (
            <>
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mt-4 mb-1.5">
                Add content
              </h4>
              <ul className="space-y-0.5">
                {emptyRows.map((row) => (
                  <li
                    key={row}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                  >
                    <span className="flex-1 text-xs text-gray-400 dark:text-slate-500 truncate">
                      {SECTION_META[row].label}
                    </span>
                    {SECTION_META[row].editorSection ? (
                      <button
                        type="button"
                        onClick={() => goToEditor(SECTION_META[row].editorSection)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/10 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                        Add
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-300 dark:text-slate-600">
                        no editor
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-white/[0.06] shrink-0">
          <p aria-live="polite" className="text-[11px] text-gray-500 dark:text-slate-400 truncate pr-2">
            {announcement}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
