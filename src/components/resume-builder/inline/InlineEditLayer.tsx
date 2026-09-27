"use client";

/**
 * M4 Phase 3 / M5A — click-to-edit layer for the live resume preview.
 *
 * Wraps the rendered sheet, resolves the CLICKED TEXT back to a resume field
 * (content-based — works across all templates without touching template
 * markup) and opens the structured InlinePopover next to the click.
 *
 * M5A discoverability: the same resolution walk runs on hover (mouse/pen
 * only) and marks the editable region with `data-rs-edit-hover`, which CSS
 * turns into a pointer cursor plus a restrained hover ring — so exactly the
 * regions that would open the popover advertise themselves, nothing else.
 * The mark is removed the moment the pointer leaves the region, and the
 * first popover open dismisses the first-use EditHint.
 *
 * Placement rules:
 *  - The layer must live OUTSIDE any CSS-transformed ancestor (the preview
 *    scales the sheet with transform: scale()), otherwise position:fixed in
 *    the popover resolves against the transformed box instead of the
 *    viewport. Callers mount this around the whole preview region, not
 *    around the scaled sheet.
 *  - The click handler only wraps the SHEET SIBLING, never the popover, so
 *    typing/controls inside the popover never re-trigger resolution.
 *  - Clicks on anchors inside the sheet are intercepted (edit, don't
 *    navigate); the social popover offers an explicit "Open link". This
 *    layer wraps EVERY LiveStylePreview mount — including the standalone
 *    /resume-builder/preview page — so anchor clicks there also open the
 *    editor instead of navigating (verified in the M5 audit). The popover's
 *    "Open link" is the sanctioned way out.
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { resolveInlineTarget, type InlineTarget } from "./resolveInlineTarget";
import { InlinePopover, type PopoverAnchor } from "./InlinePopover";
import { dismissEditHint } from "./edit-hint";
import type { Resume } from "@/types/resume";

/** Above this many characters a click is "structural" (section/whole page),
 *  not a field — resolving it would make containment rules misfire. */
const MAX_RESOLVABLE_CHARS = 600;

/** Element whose text resolves to a resume field, plus that field. */
type EditableHit = { el: HTMLElement; target: InlineTarget };

/**
 * Climb from the event target to the innermost element whose text resolves
 * to a resume field. Shared by click and hover so the hover affordance can
 * never disagree with what a click actually does.
 */
function resolveEditableFrom(
  start: EventTarget | null,
  resume: Resume,
): EditableHit | null {
  let el = start as HTMLElement | null;
  while (el) {
    const raw = el.textContent ?? "";
    if (raw.trim() && raw.length <= MAX_RESOLVABLE_CHARS) {
      const target = resolveInlineTarget(resume, raw);
      if (target) return { el, target };
    }
    if (raw.length > MAX_RESOLVABLE_CHARS) break; // too structural
    el = el.parentElement;
  }
  return null;
}

export function InlineEditLayer({ children }: { children: React.ReactNode }) {
  const resume = useResumeBuilder((s) => s.resume);
  const [state, setState] = useState<{
    target: InlineTarget;
    anchor: PopoverAnchor;
  } | null>(null);

  /* ── M5A hover affordance — pointer devices only, never touch ── */
  const hoverElRef = useRef<HTMLElement | null>(null);

  const clearHover = useCallback(() => {
    const el = hoverElRef.current;
    if (el) {
      el.removeAttribute("data-rs-edit-hover");
      el.style.cursor = "";
      hoverElRef.current = null;
    }
  }, []);

  const handlePointerOver = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === "touch") return; // taps open the popover directly
      const target = e.target as HTMLElement | null;
      // Still inside the already-marked region — nothing to re-resolve.
      if (
        hoverElRef.current &&
        target &&
        hoverElRef.current.contains(target)
      ) {
        return;
      }
      const hit = resolveEditableFrom(target, resume);
      if (hit?.el === hoverElRef.current) return;
      clearHover();
      if (hit) {
        hit.el.setAttribute("data-rs-edit-hover", "");
        hit.el.style.cursor = "pointer";
        hoverElRef.current = hit.el;
      }
    },
    [resume, clearHover],
  );

  useEffect(() => clearHover, [clearHover]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      const hit = resolveEditableFrom(e.target, resume);
      if (hit) {
        const rect = hit.el.getBoundingClientRect();
        e.preventDefault();
        // First real edit interaction ends the first-use hint everywhere.
        dismissEditHint();
        setState({
          target: hit.target,
          anchor: {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        });
        return;
      }
      // Unresolvable click (whitespace, chrome) → close any open editor.
      setState(null);
    },
    [resume],
  );

  const retarget = useCallback((target: InlineTarget) => {
    setState((s) => (s ? { ...s, target } : s));
  }, []);

  const close = useCallback(() => setState(null), []);

  return (
    <>
      {/* Sheet content — click + hover capture live here (not on the popover).
          display:contents keeps the caller's flex/height chain intact: the
          wrapper generates no box, but events still bubble through it. */}
      <div
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerLeave={clearHover}
        data-testid="inline-edit-layer"
        style={{ display: "contents" }}
      >
        {children}
      </div>
      {state && (
        <InlinePopover
          target={state.target}
          anchor={state.anchor}
          onRetarget={retarget}
          onClose={close}
        />
      )}
    </>
  );
}
