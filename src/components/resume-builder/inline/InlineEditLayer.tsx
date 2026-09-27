"use client";

/**
 * M4 Phase 3 — click-to-edit layer for the live resume preview.
 *
 * Wraps the rendered sheet, resolves the CLICKED TEXT back to a resume field
 * (content-based — works across all 32 templates without touching template
 * markup) and opens the structured InlinePopover next to the click.
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
 *    navigate); the social popover offers an explicit "Open link". The
 *    standalone /resume-builder/preview page has NO layer, so links there
 *    navigate normally.
 */
import React, { useCallback, useState } from "react";
import { useResumeBuilder } from "@/store/resume-builder";
import { resolveInlineTarget, type InlineTarget } from "./resolveInlineTarget";
import { InlinePopover, type PopoverAnchor } from "./InlinePopover";

/** Above this many characters a click is "structural" (section/whole page),
 *  not a field — resolving it would make containment rules misfire. */
const MAX_RESOLVABLE_CHARS = 600;

export function InlineEditLayer({ children }: { children: React.ReactNode }) {
  const resume = useResumeBuilder((s) => s.resume);
  const [state, setState] = useState<{
    target: InlineTarget;
    anchor: PopoverAnchor;
  } | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      let el = e.target as HTMLElement | null;
      while (el) {
        const raw = el.textContent ?? "";
        if (raw.trim() && raw.length <= MAX_RESOLVABLE_CHARS) {
          const target = resolveInlineTarget(resume, raw);
          if (target) {
            const rect = el.getBoundingClientRect();
            e.preventDefault();
            setState({
              target,
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
        }
        if (raw.length > MAX_RESOLVABLE_CHARS) break; // too structural
        el = el.parentElement;
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
      {/* Sheet content — click capture lives here (not on the popover).
          display:contents keeps the caller's flex/height chain intact: the
          wrapper generates no box, but events still bubble through it. */}
      <div
        onClick={handleClick}
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
