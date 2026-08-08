# Performance Audit

**Date:** 2026-08-08  
**Scope:** Render efficiency · Zustand · Expensive components · AI request deduplication · Bundle size · Lazy loading · Server/client boundaries  
**Status:** Read-only audit — no code modified

---

## Executive Summary

Five issues have significant impact today and should be addressed before scaling traffic or adding new features. The most serious are:

1. **`ResumePreview` always mounted off-screen** — a full template render fires on every keystroke even when the export modal is closed.
2. **`startAnalysis()` fires on every page hydration** — an AI network request triggered without user intent on every page load.
3. **Side effect during render in `OptimizationPanel`** — `onResumeChange` called in the render phase causes a render cascade.
4. **`mammoth` (~1.3 MB) in the initial bundle** — a DOCX parser that is only needed during import is never lazy-loaded.
5. **Whole-store subscriptions throughout the resume builder** — every keystroke re-renders unrelated components.

Severity scale: **Critical** (correctness issue or always-on perf hit) · **High** (measurable user-visible lag) · **Medium** (technical debt that grows with scale) · **Low** (minor, addressable in passing).

---

## 1. Unnecessary Renders

### 1.1 Side effect during render — `OptimizationPanel`

**Severity: Critical**  
**File:** `src/components/resume-builder/optimization/OptimizationPanel.tsx:215–220`

```tsx
if (summaryDraft !== prevDraftRef.current) {
  prevDraftRef.current = summaryDraft;
  if (summaryStreaming && summaryDraft) {
    onResumeChange({ ...resume, summary: summaryDraft }); // called in render phase
  }
}
```

`onResumeChange` is a state-setter called directly in the render body (not inside `useEffect`). This triggers a parent state update mid-render, which re-renders the parent, which re-renders `OptimizationPanel`, which triggers the same block again. In React 19 strict mode this fires twice per update.

**Fix:** Move to `useEffect`:
```tsx
useEffect(() => {
  if (summaryStreaming && summaryDraft) {
    onResumeChange((prev) => ({ ...prev, summary: summaryDraft }));
  }
}, [summaryDraft, summaryStreaming]);
```

---

### 1.2 Inline array + anonymous functions in `ExperienceSection` per-entry render

**Severity: High**  
**File:** `src/components/resume-builder/sections/ExperienceSection.tsx:311–319`

```tsx
<AIActionDropdown
  items={[
    { label: "ATS Optimize", onClick: () => handleAIRewrite(exp.id, "ats") },
    { label: "Improve Impact", onClick: () => handleAIRewrite(exp.id, "impact") },
    ...
  ]}
/>
```

A new array and new function references are allocated on every render for every experience entry. Any ancestor re-render defeats memoization of `AIActionDropdown`. Same pattern in `SkillsSection.tsx:63–68`.

**Fix:** `useMemo` keyed on `exp.id`, or define the items array outside the map if IDs are stable.

---

### 1.3 `expAIError` array constructed inside `.map()` on every render

**Severity: Medium**  
**File:** `src/components/resume-builder/sections/ExperienceSection.tsx:188–194`

```tsx
const expAIError = [
  aiActions[`exp-${exp.id}-bullets`],
  ...["ats", "impact", "concise", "expanded", "professional"].map((t) => aiActions[`exp-${exp.id}-${t}`]),
].find(...);
```

A new array including a nested `.map()` is constructed on every render for every entry. Use a `useMemo` keyed on `[aiActions, exp.id]`.

---

### 1.4 `Passport` and its sub-components re-render on every resume field change

**Severity: High**  
**File:** `src/components/identity/Passport.tsx:333–334`

```tsx
const resume    = useResumeBuilder((s) => s.resume);       // full object
const claims    = useResumeBuilder((s) => s.resume.claims ?? []); // new [] each time
```

The `resume.claims ?? []` selector creates a new array reference when `claims` is nullish, causing a spurious re-render on every store update. `Passport` re-renders on every keystroke in any resume field even if the passport-relevant fields haven't changed. None of the four sub-components (`IdentityHeader`, `CareerSnapshot`, `TrustSnapshot`, `ProfessionalHighlights`) are wrapped in `React.memo`.

**Fix:** Use field-specific selectors; wrap sub-components in `React.memo`; use `useShallow` where multiple fields are needed.

---

### 1.5 `RightCopilot` re-renders on every keystroke; `progress()` computed at render time

**Severity: High**  
**File:** `src/components/resume-builder/RightCopilot.tsx:97–101`

```tsx
const resume   = useResumeBuilder((s) => s.resume);   // full object — re-renders on every keystroke
const progress = useResumeBuilder((s) => s.progress); // function ref — not reactive
```

`progress()` is called at render time (line 206), iterating over all resume sections. Every keystroke causes a full re-render of the entire right panel and all its `CollapsibleCard`, `MissingItem`, and `SuggestionItem` children — none memoized.

**Fix:** Subscribe to the specific computed output, not `s.resume` wholesale. Derive `progress` as a memoized selector outside the store. Wrap stable leaf components in `React.memo`.

---

### 1.6 `Hero.tsx` calls `setTimeout` inside a state updater

**Severity: Medium**  
**File:** `src/components/landing/Hero.tsx:262–269`; `src/components/marketing/Hero.tsx:240–253`

```tsx
setTrustScore((s) => {
  if (s >= 84) return s;
  const next = Math.min(84, s + 2);
  setTimeout(countUp, 18); // side effect inside updater
  return next;
});
```

State updaters must be pure. In React concurrent mode the updater can be called speculatively multiple times, spawning multiple overlapping `setTimeout` chains. The animation runs at ~55 fps (18ms interval) producing ~55 re-renders/second on the hero while active.

**Fix:** Use `useEffect` with `requestAnimationFrame` or a ref-tracked interval. Cancel on unmount.

---

## 2. Zustand Store

### 2.1 Whole-store subscriptions — every keystroke re-renders every subscriber

**Severity: High**  
**File:** `src/store/resume-builder.ts`; consumers in `sections/*.tsx`, `RightCopilot.tsx`, `Passport.tsx`

Components subscribing with `useResumeBuilder((s) => s.resume)` receive the entire resume object. Because every field mutation (`updateField`, `updateExperience`, etc.) spreads a new `resume` reference, all subscribers re-render on every keystroke in any field — including components that only care about `resume.skills` or `resume.personalInfo`.

**Fix:** Use field-granular selectors. For components needing multiple fields:
```tsx
const { name, email } = useResumeBuilder(
  useShallow((s) => ({ name: s.resume.personalInfo.name, email: s.resume.personalInfo.email }))
);
```

---

### 2.2 `progress`, `sectionComplete`, `evidenceForClaim` stored as functions — not reactive

**Severity: High**  
**File:** `src/store/resume-builder.ts:339–358`

```tsx
progress:         () => { ... },
resumeScore:      () => get().analysis?.resumeScore?.overall ?? null,
sectionComplete:  (section) => { ... },
evidenceForClaim: (claimId) => get().evidence.filter(...),
```

These are imperative functions stored in the state object. Calling `progress()` in a component reads `get()` at call time — Zustand does not track these reads reactively. Components calling `progress()` will not re-render when the computed value changes unless an unrelated reactive field also changes.

**Fix:** Move derived computations outside the store as plain selector functions, then use them with `useResumeBuilder`:
```tsx
export function selectProgress(state: ResumeBuilderState) {
  return computeProgress(state.resume); // same logic, now reactive
}
const progress = useResumeBuilder(selectProgress);
```

---

### 2.3 `startAnalysis()` fires automatically on every page hydration

**Severity: Critical**  
**File:** `src/store/resume-builder.ts:367–377`

```tsx
onRehydrateStorage: () => (state) => {
  if (state) {
    state.setSaveStatus("saved");
    if (hasSufficientData(state.resume)) {
      state.startAnalysis(); // AI request fires on every page load without user intent
    }
  }
},
```

An AI analysis API request is sent unconditionally on every page load if the user has resume data. This competes with the S5-2 debounced auto-score and fires regardless of whether the optimization panel is even open.

**Fix:** Remove from `onRehydrateStorage`. The debounced auto-score in `OptimizationPanel` already handles refreshing the score when the panel is opened and the resume has changed.

---

### 2.4 No `useShallow` usage anywhere in the codebase

**Severity: Medium**

Zero results for `useShallow` across all of `src/`. Some pages make 6+ separate `useResumeBuilder` calls to destructure individual fields, creating 6 independent subscriptions. A single `useShallow` call with an object selector would be cleaner and avoids redundant subscription overhead.

---

### 2.5 Correct: array mutations all return new references ✓

`makeArrayHelpers` at `src/store/resume-builder.ts:117–131` correctly uses spread, `.map()`, `.filter()`. No in-place mutations detected.

---

## 3. Expensive Components

### 3.1 `ResumePreview` always mounted off-screen — re-renders on every keystroke

**Severity: Critical**  
**File:** `src/components/resume-builder/ExportModal.tsx:181–192`

```tsx
<div
  id="pdf-export-target"
  className="fixed -left-[9999px] top-0 print:static print:left-auto"
  style={{ width: "210mm" }}
>
  <ResumePreview resume={resume} templateId={template} />
</div>
```

`ResumePreview` is rendered unconditionally in the DOM, off-screen, even when the export modal is closed. `resume` is a live prop — every keystroke triggers a full re-render of the print-ready A4 template in the background. This is the most impactful performance issue in the codebase today.

**Fix:** Mount only when printing is requested. Unmount via `useEffect` after `window.onafterprint` fires, or wrap the component in `React.memo` with a custom `areEqual` that does a deep comparison on fields that actually affect print layout.

---

### 3.2 `TemplateGallery` renders all templates without virtualization

**Severity: Medium**  
**File:** `src/components/resume-builder/TemplateGallery.tsx:222–333`

`filteredTemplates.map(...)` renders every matching card simultaneously. `MiniaturePreview` uses `IntersectionObserver` per card (good), but Framer Motion layout animations and hover states are active for all rendered cards. Linear growth as template count increases.

**Fix:** `@tanstack/react-virtual` for the grid. At ~30 templates the impact is acceptable, but plan ahead.

---

### 3.3 `MiniaturePreview` creates a new resume object on every render

**Severity: Low**  
**File:** `src/components/resume-builder/MiniaturePreview.tsx:170`

```tsx
const resume: Resume = { ...SAMPLE_RESUME, templateId }; // new reference every render
```

**Fix:** `const resume = useMemo(() => ({ ...SAMPLE_RESUME, templateId }), [templateId]);`

---

### 3.4 `overallConfidence` called twice in `ImportReviewScreen` render

**Severity: Low**  
**File:** `src/components/resume-builder/ImportReviewScreen.tsx:597–600`

`overallConfidence(draft)` iterates all sections with weighted scoring, called twice in the same render. Capture once: `const confidence = overallConfidence(draft);`

---

### 3.5 `Hero.tsx` runs a ~55fps animation loop

**Severity: Medium**  
**File:** `src/components/marketing/Hero.tsx:240–253`

`setTimeout(countUp, 18)` fires ~55 times/second during the trust-score counter animation, each call triggering `setState` and a full Hero re-render. `AnimatePresence` runs concurrently.

**Fix:** Replace with `requestAnimationFrame` using start-time delta so increment is frame-rate-aware, not interval-based. Cancel on unmount.

---

## 4. AI Request Deduplication

### 4.1 No `AbortController` cleanup on hook unmount

**Severity: High**  
**File:** `src/lib/ai/useOptimization.ts`

Five abort refs are never cleaned up when the component unmounts. If the user navigates away mid-request, the fetch completes, `setState` fires on an unmounted component (warning in React 18+), and the result is written to the `sessionStorage` cache for an operation the user abandoned.

**Fix:**
```tsx
useEffect(() => {
  return () => {
    scoreAbortRef.current?.abort();
    keywordsAbortRef.current?.abort();
    matchAbortRef.current?.abort();
    summaryAbortRef.current?.abort();
    Object.values(bulletAbortRefs.current).forEach((c) => c.abort());
  };
}, []);
```

---

### 4.2 `generateSummary` has no cache layer

**Severity: Medium**  
**File:** `src/lib/ai/useOptimization.ts:339–410`

All four JSON-response operations check `readCache` before fetching. `generateSummary` (SSE stream) does not — repeated clicks with identical inputs each start a new stream. The abort-before-start pattern prevents concurrent streams but discards any partially streamed draft.

The practical mitigation: preserve `summaryDraft` in state (already done) and surface a "Re-generate?" confirmation when inputs haven't changed since the last draft.

---

### 4.3 Auto-score + manual Analyze: confirmed no double-request risk ✓

The fingerprint cache check means if the manual click fires first and caches the result, the3-second auto-score timer hits the cache immediately — no network request. The `scoreAbortRef` abort-before-start also guards against any race. Safe as-is.

---

## 5. Bundle Size

### 5.1 `mammoth` (~1.3 MB) likely in initial bundle

**Severity: High**  
**File:** `package.json`; `src/utils/resume-parser.ts`

`mammoth` is a DOCX-to-HTML parser needed only when the user imports a file. If `resume-parser.ts` is statically imported anywhere in the client bundle, the full 1.3 MB ships on first load.

**Fix:** Dynamic import at the point of use:
```tsx
const { default: mammoth } = await import("mammoth");
```
Or lazy-load the entire import flow (see §6.1).

---

### 5.2 `html2canvas` and `jspdf` — likely dead weight

**Severity: High**  
**File:** `package.json`

`ExportModal` uses `window.print()`. If neither `html2canvas` nor `jspdf` appears in any current code path, both should be removed — together ~700 KB from the dependency graph.

**Verification:** `grep -r "html2canvas\|jspdf" src/` — if no results, `npm uninstall html2canvas jspdf`.

---

### 5.3 `framer-motion` (~300 KB) not tree-shaken

**Severity: Medium**  
**File:** Multiple components

Framer Motion is the largest active runtime dependency. The `LazyMotion` API can cut the runtime by ~50%:
```tsx
// _app or root layout
import { LazyMotion, domAnimation } from "framer-motion";
<LazyMotion features={domAnimation}>
  {children}
</LazyMotion>

// In components, use `m` instead of `motion`
import { m } from "framer-motion";
<m.div animate={{ opacity: 1 }} />
```

---

### 5.4 `pdf-parse` — verify server-only

**Severity: Medium**

`pdf-parse` is Node.js-only. Verify it is only imported inside a server Route Handler (`export const runtime = "nodejs"`), never in client components. If bundled client-side it will fail at runtime.

---

### 5.5 `lucide-react` — named imports confirmed ✓

All imports use named destructuring (`import { X, Loader2 } from "lucide-react"`). Tree-shaking is effective. No `import *` patterns found.

---

## 6. Lazy Loading / Dynamic Imports

### 6.1 Zero `dynamic()` or `React.lazy()` usage found

**Severity: High**

A search across all of `src/` returns no `next/dynamic`, `React.lazy`, or `import()` in component files. Every component ships in the initial bundle.

**Components that should be lazy-loaded:**

| Component | Reason | Trigger |
|---|---|---|
| `OptimizationPanel` | Framer Motion + 5 optimization sub-components | User clicks AI button |
| `TemplateGallery` | 30 template cards + miniature renders | User opens gallery |
| `ImportReviewScreen` | 623 lines + mammoth | User initiates import |
| `ExportModal` | ResumePreview + print dependencies | User clicks Export |

**Fix pattern:**
```tsx
import dynamic from "next/dynamic";

const OptimizationPanel = dynamic(
  () => import("./optimization/OptimizationPanel"),
  { ssr: false }
);
```

---

### 6.2 All 30 template components statically imported via barrel

**Severity: Medium**  
**File:** `src/app/resume-builder/template-components/index.ts`

Every user downloads all 30 templates on first load regardless of which they use. Dynamic import per `templateId` would code-split by template:
```tsx
const templateMap = {
  "modern-clean":  () => import("./modern-clean"),
  "executive-pro": () => import("./executive-pro"),
  // ...
};
const Component = (await templateMap[templateId]()).default;
```

---

## 7. Server / Client Boundaries

### 7.1 Marketing pages with large inline data may be unnecessarily client-side

**Severity: Medium**  
**File:** `src/app/(marketing)/solutions/page.tsx`; `src/app/(marketing)/pricing/page.tsx`

If either page carries `"use client"`, its large inline data arrays (audience definitions, pricing tiers, comparison table rows) ship as evaluated JavaScript in the bundle. As server components, that data stays server-side.

**Audit action:** Check for `"use client"` at the top of each file. If present, extract interactive islands (FAQ accordion, billing toggle, tab navigation) as client components and keep the data-heavy wrappers as server components.

---

### 7.2 `useOptimization` and `cache.ts` — server boundaries confirmed correct ✓

`useOptimization.ts` has `"use client"` at line 1. `cache.ts` wraps all `sessionStorage` calls in `try/catch` — SSR-safe. Both confirmed correct.

---

## 8. Priority Fix List

Ranked by impact-to-effort ratio:

| # | Issue | File | Severity | Effort |
|---|---|---|---|---|
| 1 | Unmount `ResumePreview` when export modal is closed | `ExportModal.tsx` | Critical | S |
| 2 | Remove `startAnalysis()` from `onRehydrateStorage` | `resume-builder.ts` | Critical | XS |
| 3 | Move summary `onResumeChange` from render body to `useEffect` | `OptimizationPanel.tsx` | Critical | XS |
| 4 | Add unmount cleanup for all abort refs | `useOptimization.ts` | High | XS |
| 5 | Remove `html2canvas` + `jspdf` if unused | `package.json` | High | XS |
| 6 | Dynamic-import `mammoth` at point of use | `resume-parser.ts` | High | XS |
| 7 | Lazy-load `OptimizationPanel`, `TemplateGallery`, `ImportReviewScreen`, `ExportModal` | `page.tsx` entry | High | S |
| 8 | Granular Zustand selectors in `Passport`, `RightCopilot`, section components | 5+ files | High | M |
| 9 | Move `progress`/`sectionComplete` to reactive selector functions | `resume-builder.ts` | High | M |
| 10 | `React.memo` on `Passport` sub-components | `Passport.tsx` | High | S |
| 11 | Stabilize inline arrays/functions in `ExperienceSection`, `SkillsSection` | 2 files | Medium | S |
| 12 | Fix `setTimeout` inside state updater in `Hero.tsx` ×2 | 2 files | Medium | S |
| 13 | Apply `LazyMotion + domAnimation` to reduce Framer Motion bundle | root layout | Medium | S |
| 14 | Dynamic-import template components per `templateId` | `template-components/index.ts` | Medium | M |
| 15 | Audit marketing pages — extract client islands | 2 page files | Medium | M |

**Effort scale:** XS < 30 min · S = 30–90 min · M = half-day

---

*End of Performance Audit. Structural issues documented in `docs/PRODUCTION_AUDIT_PART1.md`.*
