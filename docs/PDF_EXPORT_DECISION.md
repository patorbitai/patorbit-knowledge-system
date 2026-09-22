# PDF Export — Architecture Decision

**Status:** Accepted · **Date:** 2026-09-22 · **Phase:** 1.4 of the workflow-hardening brief

## Question

Is browser-print-based PDF export intentional, or should Patorbit move to
programmatic (server/client) PDF generation?

## Inspection results

Runtime dependencies were checked for a PDF generation library:

| Candidate | Present? |
| --- | --- |
| `jspdf` / `pdf-lib` / `pdfkit` / `@react-pdf/*` / `html2pdf` | **No** |
| `docx` (Word export) | Yes — powers DOCX export |
| `playwright` / `@playwright/test` | Yes, but **e2e/dev only** — not a server runtime dependency |

The DOCX path (`exportToDocx`) is programmatic; the PDF path renders the real
resume DOM (`#pdf-export-target`, actual template + fonts + style config) and
calls `window.print()`.

## Decision

**Browser print remains the PDF mechanism.** Reasons:

1. **Fidelity.** The print path renders the *actual* template DOM — every
   template, custom style config, and webfont works with zero divergence.
   A programmatic path (e.g. html-to-PDF) historically mis-renders pagination,
   fonts, and template-specific layout, and would need per-template QA.
2. **No runtime PDF library exists in the stack.** Adopting one means a new
   runtime dependency + a second rendering pipeline — a large rewrite the
   brief explicitly warns against ("Do not blindly rewrite it").
3. **Playwright is not a production PDF service.** It is an e2e devDependency;
   shipping a headless browser per export is disproportionate.
4. **User expectation.** "Print / Save as PDF" opens the browser print dialog,
   where the user picks *Save as PDF* — the dominant, zero-surprise UX.

## Guarantees verified

- **Explicit UX** — the export option is labelled
  *"Print / Save as PDF — Opens browser print dialog — save as PDF or print
  directly"*. No ambiguity.
- **Analytics fire reliably** — `resume_export_started` and `resume_exported`
  are queued with an **immediate** `sendBeacon` flush *before* `window.print()`
  is called, because the print dialog blocks the main thread and would
  otherwise drop debounced events (this actually happened in acceptance
  testing — fixed in `scheduleFlush()`).
- **Correct, approved-only content** — export prints the *active* resume.
  A tailored resume only exists from `applyTailorSuggestions()`, which builds
  from a clone of the master and applies only accepted/edited changes, with
  blocked (unsupported) fragments stripped. Tests:
  `src/lib/__tests__/tailor-review.test.ts` (Cases 5–6, fabrication guards),
  `src/components/resume-builder/__tests__/export-consistency.test.tsx`,
  `all-templates-export-validation.test.tsx`.
- **Master profile untouched** — printing reads the DOM of one resume; the
  store's master is never mutated by export.

## Revisit when

- Server-side PDF becomes a hard requirement (e.g. server-generated bundles
  attached to applications), **and**
- a maintained renderer (e.g. a Playwright-based print service or a
  template-faithful HTML→PDF library) is accepted as a runtime dependency
  with per-template visual regression coverage.
