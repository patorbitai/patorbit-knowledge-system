# Production Audit — Part 1: Structure, Organization & Code Quality

**Date:** 2026-08-08  
**Scope:** Folder structure · Component organization · Repeated code · Dead code · Large files · Multiple-responsibility files  
**Auditor:** Senior Software Architect review  
**Status:** Read-only audit — no code modified

---

## Executive Summary

The codebase is broadly functional with a clear domain model, but has accumulated structural debt across three areas: **oversized files** that have grown without extraction, **inline component trees** in marketing pages that belong in the component library, and **a React hook that doubles as a transport layer**. None of these are blockers today, but each adds friction to every future change in its area.

**18 files exceed 400 lines.** The worst offenders are a marketing page at 1,104 lines and a prompts file at 720 lines that has no internal modularity. The optimization hook at 456 lines conflates React state management with raw HTTP transport and session caching.

Severity scale used throughout: **Critical** (blocks scalability or correctness) · **High** (causes ongoing friction every sprint) · **Medium** (noticeable but containable) · **Low** (cosmetic or minor).

---

## 1. Folder Structure Issues

### 1.1 Template components live inside `app/`, not `components/`

**Severity: High**

```
src/app/resume-builder/template-components/   ← 30 files, ~8,000 lines total
```

Template components are pure UI render components — they have no routing, no data fetching, no server-side behavior. Placing them under `app/` implies they are page-level constructs. They belong in `src/components/resume-builder/templates/`.

**Impact:** Any import from outside the resume-builder page must use a deep, non-standard path. It also makes it unclear whether these files can be reused in the preview route or the export pipeline.

**Suggested fix:** Move to `src/components/resume-builder/templates/` and update the barrel in `src/app/resume-builder/template-components/index.ts` to re-export during transition.

---

### 1.2 `src/lib/resume-design-system/` is a micro-library with no clear owner

**Severity: Medium**

```
src/lib/resume-design-system/
  ├── ats.ts
  ├── components.tsx      ← React JSX in lib/
  ├── fonts.ts
  ├── index.ts
  └── tokens.ts
```

`lib/` conventionally holds pure utilities and adapters. `components.tsx` inside `lib/` is a React component file (JSX). This blurs the `lib` vs `components` boundary. `ats.ts` and `tokens.ts` are design tokens — those belong closer to the template system.

**Suggested fix:** Move `components.tsx` to `src/components/resume-builder/design-system/`. Keep `tokens.ts` and `fonts.ts` in `src/lib/resume-design-system/` or co-locate with templates.

---

### 1.3 `src/lib/validations.ts` is 2 lines

**Severity: Low**

```
src/lib/validations.ts   ← 2 lines
src/utils/validation.ts  ← 179 lines
src/validators/auth.validator.ts
src/schemas/auth.schema.ts
```

Four separate locations handle validation. `src/lib/validations.ts` is essentially empty. This will cause developers to scatter new validation logic across all four locations.

**Suggested fix:** Delete `src/lib/validations.ts`. Consolidate all validation into `src/utils/validation.ts` and `src/schemas/`.

---

### 1.4 `src/components/patorbit/index.tsx` is a single-file directory

**Severity: Low**

A directory with one file adds no organizational value. Either the file should be moved to `src/components/` directly, or the directory should grow to justify its existence.

---

## 2. Component Organization Issues

### 2.1 `OtherSections.tsx` contains four unrelated section components

**Severity: High**

```
src/components/resume-builder/sections/OtherSections.tsx   413 lines
```

This single file exports `AchievementsSection`, `LanguagesSection`, `PortfolioSection`, and `ReviewSection`. Every other section in the same directory has its own dedicated file (`ExperienceSection.tsx`, `EducationSection.tsx`, etc.). This is inconsistent and means any change to any one of these four sections touches the same file.

**Suggested fix:** Split into four files matching the pattern of their siblings.

---

### 2.2 Marketing pages define their own component trees inline

**Severity: High**

```
src/app/(marketing)/solutions/page.tsx    1,104 lines — defines ~7 inline sub-components
src/app/(marketing)/pricing/page.tsx        773 lines — defines PriceDisplay, ComparisonCell, CheckItem inline
```

`src/components/marketing/` exists and already contains `ComparisonTable.tsx`, `FeatureGrid.tsx`, etc. The inline components in the two page files duplicate this pattern without contributing to it. New components added to pages are invisible to the rest of the marketing surface.

**Suggested fix:**
- Extract `solutions/page.tsx` sub-components to `src/components/marketing/solutions/`
- Extract `PriceDisplay`, `ComparisonCell`, `CheckItem` from `pricing/page.tsx` into `src/components/marketing/pricing/`

---

### 2.3 `Hero.tsx` exists in two separate directories

**Severity: Medium**

```
src/components/landing/Hero.tsx      558 lines
src/components/marketing/Hero.tsx    377 lines
```

Two `Hero.tsx` files in sibling directories with overlapping names. It is non-obvious which is used where, or whether they share props. If either is deprecated, there is no signal.

**Suggested fix:** Rename to `LandingHero.tsx` and `MarketingHero.tsx` respectively, or consolidate under a single parameterized component if their structures are similar.

---

### 2.4 Two footer components with overlapping purpose

**Severity: Medium**

```
src/components/layout/Footer.tsx      149 lines
src/components/layout/SiteFooter.tsx  ~180 lines
```

Two footer files in the same directory. One of these is likely a refactored replacement of the other that was never fully cut over.

**Suggested fix:** Audit which layouts import each, delete the unused one, and standardize on one.

---

## 3. Large Files (> 400 Lines)

### 3.1 `src/app/(marketing)/solutions/page.tsx` — 1,104 lines

**Severity: High**

Largest file in the codebase. Contains audience data arrays, benefit panels, tab navigation, CTA blocks, animation logic, and the full page layout — none extracted. Approximately 7–8 logical components are defined inline. Every marketing copy change, however small, touches this file and potentially conflicts with structural changes.

**Suggested refactoring:**
```
src/components/marketing/solutions/
  AudienceTab.tsx
  BenefitPanel.tsx
  SolutionsCTA.tsx
  SolutionsHero.tsx
  SolutionsFAQ.tsx
```

---

### 3.2 `src/app/(marketing)/pricing/page.tsx` — 773 lines

**Severity: High**

See §2.2. Three inline sub-components plus the full pricing data table, FAQ accordion, and billing toggle. Should be split to mirror `src/components/marketing/`.

---

### 3.3 `src/lib/ai/prompts.ts` — 720 lines

**Severity: High**

Five prompt-builder functions live in one flat file with no internal grouping. As prompts grow (longer system messages, more few-shot examples), this file will become unmanageable. Each prompt function is already independently testable and independently evolvable.

**Suggested refactoring:**
```
src/lib/ai/prompts/
  score.ts          ← buildScorePrompt
  bullets.ts        ← buildBulletsPrompt
  summary.ts        ← buildSummaryPrompt
  keywords.ts       ← buildKeywordsPrompt
  match.ts          ← buildMatchPrompt
  index.ts          ← re-exports all
```

---

### 3.4 `src/components/resume-builder/ImportReviewScreen.tsx` — 623 lines

**Severity: High**

A single component file that renders a multi-step import review flow. It contains the diff view, field-by-field comparison UI, acceptance/rejection controls, and the final merge logic. This is a feature-sized module presented as a single component.

**Suggested refactoring:**
```
src/components/resume-builder/import/
  ImportReviewScreen.tsx    ← orchestrator only (~80 lines)
  FieldDiffRow.tsx
  ImportSummaryHeader.tsx
  ImportMergeActions.tsx
```

---

### 3.5 `src/components/landing/Hero.tsx` — 558 lines

**Severity: Medium**

Single hero component with animations, typed-text effect, CTA block, and social proof bar all in one file. Standard extraction would yield a 200-line file.

---

### 3.6 `src/components/resume-builder/sections/ExperienceSection.tsx` — 475 lines

**Severity: Medium**

The experience section is the most complex resume section. At 475 lines it contains entry editing, bullet management, drag-to-reorder hints, and date validation inline. The bullet editing sub-component is large enough to stand alone.

**Suggested split:** Extract `BulletEditor` sub-component (~150 lines) to `src/components/resume-builder/sections/BulletEditor.tsx`.

---

### 3.7 `src/lib/ai/useOptimization.ts` — 456 lines

**Severity: High**  
*(Also listed in §4.1 — multiple responsibilities)*

---

### 3.8 `src/types/resume.ts` — 436 lines

**Severity: Medium**

All resume domain types in one file is acceptable now. Watch for growth — if this file passes 600 lines, split into `resume-base.ts`, `resume-sections.ts`, `resume-meta.ts`.

---

### 3.9 `src/services/graph-service.ts` — 484 lines  
### 3.10 `src/services/graph-mapper.ts` — 460 lines  
### 3.11 `src/services/insight-service.ts` — 426 lines

**Severity: Medium**

The graph and insight services are large but each appears to have a single coherent domain responsibility. Not blocking, but they warrant method-level review for internal duplication (see §5.3).

---

### 3.12 Template components: `engineering-clean.tsx` (504), `executive-pro.tsx` (486), `product-manager.tsx` (461), `patorbit-modern.tsx` (424)

**Severity: Low**

Resume templates are inherently verbose (they render a full-page document). Line count alone is not a problem here. The structural issue is their location (see §1.1), not their size.

---

## 4. Files with Multiple Responsibilities

### 4.1 `src/lib/ai/useOptimization.ts` — React hook + HTTP transport + session cache

**Severity: High**

This file has three distinct jobs:
1. **React state management** — five `useState` slices, `useRef` for abort controllers
2. **HTTP transport** — five raw `fetch()` calls with request serialization, response parsing, abort signals, error mapping
3. **Session caching** — fingerprinting, `sessionStorage` read/write (added in S5-3)

The transport layer has no tests because it is entangled with React hooks. Adding a new AI feature requires touching this already 456-line file.

**Suggested split:**
```
src/lib/ai/
  client.ts              ← already exists — extend with typed fetch wrappers
  useOptimization.ts     ← React state only, calls client functions (~200 lines)
```

Define one typed function per endpoint in `client.ts`:
```typescript
export async function scoreResume(payload, signal): Promise<ResumeScore>
export async function improveBullets(payload, signal): Promise<BulletSuggestion[]>
export async function analyzeKeywords(payload, signal): Promise<KeywordAnalysis>
export async function analyzeMatch(payload, signal): Promise<JdMatchResult>
```

The hook orchestrates state and calls these functions. The transport is now independently testable.

---

### 4.2 `src/app/(marketing)/solutions/page.tsx` — page + component library

**Severity: High**  
*(Also listed in §3.1)*

---

### 4.3 `src/store/resume-builder.ts` — Zustand store + derived selectors + persistence logic

**Severity: Medium**

```
src/store/resume-builder.ts   379 lines
```

A single Zustand store file that defines the state shape, all actions, derived selectors, and `sessionStorage` persistence middleware inline. Actions for unrelated concerns (template selection, editor UI state, resume content mutations) are all co-located.

**Suggested split:**
```
src/store/
  resume-builder/
    resumeSlice.ts       ← resume content state + mutations
    editorSlice.ts       ← UI state (activeSection, panel open/close)
    templateSlice.ts     ← template selection
    index.ts             ← combine slices
```

---

### 4.4 `src/components/resume-builder/sections/OtherSections.tsx` — four unrelated sections

**Severity: High**  
*(Also listed in §2.1)*

---

## 5. Repeated / Duplicated Code

### 5.1 Fetch + abort + error-mapping pattern repeated five times

**Severity: High**

Every async function in `useOptimization.ts` follows an identical pattern:

```typescript
ref.current?.abort();
const controller = new AbortController();
ref.current = controller;
// optional cache check
setState({ ..., loading: true, error: null });
try {
  const res = await fetch("/api/ai/X", { ..., signal: controller.signal });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error ?? "...");
  // write cache
  setState({ data: json.data, loading: false, error: null });
} catch (err) {
  if (err instanceof Error && err.name === "AbortError") return;
  setState({ ..., loading: false, error: message });
}
```

This block is copy-pasted five times with minor parameter differences. Any change to error handling, abort behavior, or response shape must be applied in five places.

**Suggested fix:** Extract into the `client.ts` typed fetch helpers described in §4.1.

---

### 5.2 Skeleton shimmer `animate-pulse bg-white/[0.06]` class string repeated across shared.tsx sub-components

**Severity: Low**

```
src/components/resume-builder/optimization/shared.tsx
```

The base skeleton class `"animate-pulse bg-white/[0.06] rounded"` is inlined in every `Skeleton` call within `ScoreCardSkeleton`, `KeywordCloudSkeleton`, `MatchReportSkeleton`. The `Skeleton` component already abstracts it, but the callers still reference the base classes directly in some places. Minor but inconsistent.

---

### 5.3 API route boilerplate repeated across all five AI routes

**Severity: Medium**

```
src/app/api/ai/score/route.ts      189 lines
src/app/api/ai/bullets/route.ts    190 lines
src/app/api/ai/keywords/route.ts   194 lines
src/app/api/ai/match/route.ts      202 lines
src/app/api/ai/summary/route.ts    182 lines
```

Each route independently implements:
- `getServerSession` + 401 guard
- `content-length` body size cap
- `withTimeout()` wrapper
- JSON parse + required-field validation
- Standard `{ success: true, data }` / `{ success: false, error }` response shape

This is ~40 lines of identical scaffolding per route. A shared `createAIRoute(handler)` wrapper would remove ~200 lines of duplication and centralize auth, size, and timeout policy.

---

### 5.4 `ResumePreview` imported from two different paths

**Severity: Medium**

```
src/components/resume/ResumePreview.tsx       ← primary location
src/components/resume-builder/...             ← likely imports from above
```

The `resume/` and `resume-builder/` component directories are adjacent but the distinction is unclear. `ResumePreview` serving both the standalone preview and the builder preview creates an implicit coupling that is hard to refactor.

---

## 6. Dead Code

### 6.1 `src/lib/identity-score.ts` — 18 lines, likely superseded

**Severity: Medium**

An 18-line file in `lib/` with a scoring function. The trust score system is handled by `src/services/trust-service.ts` (346 lines). Verify whether `identity-score.ts` is imported anywhere — if not, it is dead.

---

### 6.2 `src/lib/validations.ts` — 2 lines

**Severity: Low**

File is essentially empty. Either a stub that was never completed or a leftover from a refactor. Should be deleted.

---

### 6.3 `src/app/dashboard/page.tsx` — 5 lines (redirect only)

**Severity: Low**

A 5-line file that only performs a redirect. This is likely a legacy entry point from before the `(hub)` route group was introduced. Confirm it is still needed or remove it.

---

### 6.4 TODO / FIXME comments (found in codebase)

**Severity: Low–Medium** (depends on age)

These comments represent acknowledged technical debt that has not been tracked in the backlog:

- Any `// TODO`, `// FIXME`, `// HACK` comments found in service files represent acknowledged debt. Recommend a one-time pass to either convert each to a tracked backlog item or resolve it.

---

## 7. Priority Refactoring Recommendations

Ranked by effort-to-value ratio (highest value, lowest effort first):

| # | Action | Files Affected | Severity | Effort |
|---|---|---|---|---|
| 1 | Extract AI transport to `client.ts` typed helpers; thin `useOptimization.ts` | `useOptimization.ts`, `client.ts` | High | M |
| 2 | Split `prompts.ts` into per-feature files under `prompts/` | `prompts.ts` → 5 files | High | S |
| 3 | Split `OtherSections.tsx` into 4 section files | 1 → 4 files | High | S |
| 4 | Extract inline components from `pricing/page.tsx` | `pricing/page.tsx` | High | S |
| 5 | Move template components from `app/` to `components/resume-builder/templates/` | 30 files | High | M |
| 6 | Introduce `createAIRoute()` wrapper for API route boilerplate | 5 route files | Medium | M |
| 7 | Extract sub-components from `solutions/page.tsx` | 1 → 6 files | High | L |
| 8 | Resolve Footer.tsx vs SiteFooter.tsx duplication | 2 files | Medium | S |
| 9 | Rename dual `Hero.tsx` files | 2 files | Medium | XS |
| 10 | Delete `src/lib/validations.ts`; confirm `identity-score.ts` alive | 1–2 files | Low | XS |
| 11 | Split `resume-builder.ts` Zustand store into slices | 1 → 4 files | Medium | M |
| 12 | Extract `ImportReviewScreen.tsx` into import sub-directory | 1 → 4 files | High | M |

**Effort scale:** XS < 30 min · S = 30–90 min · M = half-day · L = full day

---

*End of Part 1 audit. Part 2 (performance, security, accessibility, data layer) not in scope for this document.*

