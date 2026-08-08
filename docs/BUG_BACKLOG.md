# Bug Backlog

**Date:** 2026-08-08  
**Scope:** Functional bugs, logic errors, state management issues, data flow bugs, edge cases  
**Status:** QA audit — functional correctness only

---

## Executive Summary

12 functional bugs identified across Critical/High/Medium/Low severity. The most serious issues are: a side effect during render that causes cascading re-renders (BUG-001), auto-analysis triggering on every page load (BUG-002), and off-screen resume preview rendering on every keystroke (BUG-003). These three bugs together cause significant performance degradation and wasted AI API calls.

Beyond those, the audit found state management issues in the Zustand store (non-reactive function storage), missing abort cleanup in the optimization hook, and several edge-case handling gaps in the import parser and Apply All handler.

Severity scale: **Critical** (blocks core functionality, data loss risk, or always-on cost/perf hit) · **High** (frequent user-visible failures or correctness issues) · **Medium** (edge case failures, affects specific workflows) · **Low** (cosmetic, minor UX inconsistency).

---

## CRITICAL

### BUG-001: Side Effect During Render — Summary Streaming Causes Render Cascade

**File:** `src/components/resume-builder/optimization/OptimizationPanel.tsx:216-220`  
**Category:** State · Rendering  
**Severity:** Critical

**Reproduction:**
1. Open Optimization Panel
2. Generate a professional summary (streaming)
3. Observe React DevTools: re-renders fire continuously during the stream

**Expected:** Summary chunks accumulate in local state; `onResumeChange` is called once after stream completes.

**Actual:** `onResumeChange` is called during render on every chunk, triggering parent re-render → OptimizationPanel re-render → same conditional block fires again. In React 19 strict mode this doubles the update rate.

**Root cause:**
```tsx
// Lines 216-220
if (summaryDraft !== prevDraftRef.current) {
  prevDraftRef.current = summaryDraft;
  if (summaryStreaming && summaryDraft) {
    onResumeChange({ ...resume, summary: summaryDraft }); // SIDE EFFECT IN RENDER
  }
}
```

State updater `onResumeChange` is called directly in the render body (not inside `useEffect`).

**Suggested fix:**
```tsx
useEffect(() => {
  if (summaryStreaming && summaryDraft) {
    onResumeChange((prev) => ({ ...prev, summary: summaryDraft }));
  }
}, [summaryDraft, summaryStreaming, onResumeChange]);
```

---

### BUG-002: `startAnalysis()` Fires on Every Page Hydration — Unbounded AI Cost

**File:** `src/store/resume-builder.ts:367-377`  
**Category:** Logic · API Contract  
**Severity:** Critical

**Reproduction:**
1. Fill out resume to pass `hasSufficientData` check
2. Refresh the page
3. Observe network: POST `/api/ai/...` fires immediately on hydration

**Expected:** AI analysis only fires when user opens OptimizationPanel and clicks "Analyze" or when the 3-second debounced auto-score triggers.

**Actual:** Every page load triggers `startAnalysis()` from `onRehydrateStorage`, sending an AI request without user intent. This competes with the S5-2 debounced auto-score and fires even if the panel is closed.

**Root cause:**
```tsx
// Lines 372-374
if (hasSufficientData(state.resume)) {
  state.startAnalysis(); // Fires on every page load
}
```

**Suggested fix:** Remove this block entirely. The S5-2 debounced auto-score in `OptimizationPanel.tsx:192-199` already handles refreshing the score when the panel is open and resume changes.

---

### BUG-003: `ResumePreview` Always Mounted Off-Screen — Full Template Render on Every Keystroke

**File:** `src/components/resume-builder/ExportModal.tsx:183-190`  
**Category:** Rendering · Performance  
**Severity:** Critical

**Reproduction:**
1. Close the export modal (default state)
2. Type in any resume field
3. Observe: every keystroke triggers a full A4 template render in the background

**Expected:** `ResumePreview` is mounted only when print is requested, then unmounted after print completes.

**Actual:** `ResumePreview` is rendered unconditionally in the DOM at `position: fixed; left: -9999px` even when the export modal is closed. The `resume` prop is live — every keystroke in any field triggers a full re-render of the entire print-ready template.

**Root cause:**
```tsx
// Lines 183-190
<div
  id="pdf-export-target"
  aria-hidden="true"
  className="fixed -left-[9999px] top-0 print:static print:left-auto"
  style={{ width: "210mm", backgroundColor: "#fff" }}
>
  <ResumePreview resume={resume} template={template} />
</div>
```

The div lives outside `AnimatePresence`, so it persists regardless of modal open state.

**Suggested fix:**
```tsx
{isPrinting && (
  <div id="pdf-export-target" className="fixed -left-[9999px] top-0 print:static print:left-auto" style={{width:"210mm"}}>
    <ResumePreview resume={resume} template={template} />
  </div>
)}
```

Add `isPrinting` state, set it true in `handleExportPdf`, mount the preview, then fire `window.print()` after a triple-rAF. Unmount via `window.onafterprint`.

---

## HIGH

### BUG-004: `progress()` and `sectionComplete()` Stored as Functions — Not Reactive

**File:** `src/store/resume-builder.ts:339-358`  
**Category:** State · Logic  
**Severity:** High

**Reproduction:**
1. Open Resume Builder
2. Fill out Personal section (name, email, phone)
3. Observe left sidebar: "Sections complete" counter does not update
4. Click a different section, then click back: counter now shows 1/9

**Expected:** Counter updates immediately when a section becomes complete.

**Actual:** `progress()` and `sectionComplete()` are stored as function references in the Zustand state object. Components calling `progress()` use `get()` at call time — Zustand does not track these reads reactively. Components only re-render when other reactive fields change.

**Root cause:**
```tsx
// Lines 339-358
progress: () => {
  const sections: SectionId[] = ["personal", "experience", ...];
  const complete = sections.filter((sec) => get().sectionComplete(sec));
  return Math.round((complete.length / sections.length) * 100);
},
sectionComplete: (section: SectionId) => {
  const { resume } = get();
  // ... logic
}
```

These are imperative functions, not reactive derived state.

**Suggested fix:** Move to external selector functions:
```tsx
// Outside the store
export function selectProgress(state: ResumeBuilderState) {
  const sections: SectionId[] = ["personal", "experience", ...];
  const complete = sections.filter(sec => selectSectionComplete(state, sec));
  return Math.round((complete.length / sections.length) * 100);
}

export function selectSectionComplete(state: ResumeBuilderState, section: SectionId): boolean {
  const { resume } = state;
  // same logic as before
}

// In component
const progress = useResumeBuilder(selectProgress);
const isPersonalComplete = useResumeBuilder(s => selectSectionComplete(s, "personal"));
```

---

### BUG-005: No Unmount Cleanup for Abort Refs — setState on Unmounted Component

**File:** `src/lib/ai/useOptimization.ts:126-131`  
**Category:** State · Error Handling  
**Severity:** High

**Reproduction:**
1. Open Optimization Panel
2. Click "Analyze Resume" (starts AI request)
3. Immediately close panel (unmount)
4. Observe console: "Can't perform a React state update on an unmounted component" warning

**Expected:** In-flight requests are aborted on unmount; no setState after unmount.

**Actual:** Five abort refs (`scoreAbortRef`, `bulletAbortRefs`, `keywordsAbortRef`, `matchAbortRef`, `summaryAbortRef`) are never cleaned up. If user navigates away mid-request, fetch completes, `setState` fires on unmounted component, and the result is written to sessionStorage for an abandoned operation.

**Root cause:** Missing `useEffect` cleanup:
```tsx
// Lines 126-131 — refs declared, never cleaned up
const scoreAbortRef    = useRef<AbortController | null>(null);
const bulletAbortRefs  = useRef<Record<string, AbortController>>({});
const keywordsAbortRef = useRef<AbortController | null>(null);
const matchAbortRef    = useRef<AbortController | null>(null);
const summaryAbortRef  = useRef<AbortController | null>(null);
```

**Suggested fix:**
```tsx
useEffect(() => {
  return () => {
    scoreAbortRef.current?.abort();
    keywordsAbortRef.current?.abort();
    matchAbortRef.current?.abort();
    summaryAbortRef.current?.abort();
    Object.values(bulletAbortRefs.current).forEach(c => c.abort());
  };
}, []);
```

---

### BUG-006: Apply All Bounds Check Uses Stale Cached Suggestions

**File:** `src/components/resume-builder/optimization/OptimizationPanel.tsx:235-255`  
**Category:** Logic · Edge Case  
**Severity:** High

**Reproduction:**
1. Add experience entry with 3 bullet points
2. Click "Improve" → receive 3 suggestions (cached with `fingerprint(resume, entryId)`)
3. Manually delete bullet #2 in the editor (now 2 bullets)
4. Click "Apply All"
5. Observe: bullet #2 suggestion is silently skipped (correct), but if you had edited bullet #0 or #1 text, the cached suggestions are now misaligned

**Expected:** Cached suggestions that reference `bulletIndex` values beyond the current array length are skipped.

**Actual:** The bounds check `s.bulletIndex >= 0 && s.bulletIndex < bullets.length` (line 245) works, but stale cache is not invalidated when bullets are manually edited. The fingerprint includes `resume` (entire object), so ANY field change invalidates ALL entry caches — but this means changing a bullet's text invalidates the cache even though the suggestions are still valid for that bullet's position.

**Root cause:** Over-broad cache invalidation. `fingerprint(resume, entryId)` at `useOptimization.ts:179` hashes the full resume, not just the entry.

**Suggested fix:** Change fingerprint to hash only the specific entry:
```tsx
const entry = resume.experience.find(e => e.id === entryId);
const fp = fingerprint(entry, entryId);
```

This way, editing one entry doesn't invalidate another entry's cached suggestions.

---

### BUG-007: Import Parser — Education Section Never Closes When No `school` Field Detected

**File:** `src/utils/resume-parser.ts:194-231`  
**Category:** Logic · Edge Case  
**Severity:** Medium

**Reproduction:**
1. Upload a resume PDF with this education text:
   ```
   Bachelor of Science, Computer Science
   2018 - 2022
   Relevant coursework: Data Structures, Algorithms
   ```
2. Observe imported data: education array is empty

**Expected:** Parser extracts degree, year, field even when "University" or "College" keywords are not present in the school name.

**Actual:** `parseEducationSection` only starts a new entry when `schoolMatch` regex fires (line 203). If the school name doesn't match `/University|College|Institute|School|Academy/i`, no entry is ever created. Degree, year, and field lines accumulate in `current` but are never pushed to `items`.

**Root cause:**
```tsx
// Lines 203-207
const schoolMatch = trimmed.match(/^(?:University|College|Institute|School|Academy)\s+of\s+(.+)|^(.+?)\s+(?:University|College|Institute)/i);
if (schoolMatch && current.school) { // Only true if regex matches
  if (current.school) items.push(current);
  current = { school: trimmed, degree: "", year: "", field: "" };
  continue;
}
```

**Suggested fix:** Track when any education-related field (degree, year) is detected and push the entry at section end:
```tsx
if (current.degree || current.year) items.push(current);
```

---

### BUG-008: `dismissBullet` Filters by `bulletIndex` Equality — Fails When Multiple Suggestions Target Same Index

**File:** `src/lib/ai/useOptimization.ts:231-239`  
**Category:** Logic  
**Severity:** Medium

**Reproduction:**
1. Add experience entry with 2 identical bullet points (same text)
2. Click "Improve" → AI returns 2 suggestions, both with `bulletIndex: 0` (if both bullets are identical, AI might deduplicate internally or return the same improved text twice)
3. Click "Dismiss" on first suggestion card
4. Observe: BOTH suggestions are removed

**Expected:** Only the dismissed suggestion is removed from UI.

**Actual:** `.filter((s) => s.bulletIndex !== bulletIndex)` removes ALL suggestions with that `bulletIndex` value, not just the one the user clicked.

**Root cause:**
```tsx
// Lines 231-239
const dismissBullet = useCallback((entryId: string, bulletIndex: number) => {
  setBulletsState((prev) => ({
    ...prev,
    suggestions: {
      ...prev.suggestions,
      [entryId]: (prev.suggestions[entryId] ?? []).filter((s) => s.bulletIndex !== bulletIndex),
    },
  }));
}, []);
```

**Suggested fix:** Pass a unique suggestion ID (or use array index) instead of `bulletIndex`:
```tsx
dismissBullet: (entryId: string, suggestionIndex: number) => {
  setBulletsState((prev) => ({
    ...prev,
    suggestions: {
      ...prev.suggestions,
      [entryId]: (prev.suggestions[entryId] ?? []).filter((_, i) => i !== suggestionIndex),
    },
  }));
}
```

Update `BulletDiff` to pass array index instead of `bulletIndex`.

---

## MEDIUM

### BUG-009: PDF Import — Two-Column Detection Threshold Too High for Narrow-Margin Resumes

**File:** `src/app/api/import/route.ts:30-86`  
**Category:** Logic · Edge Case  
**Severity:** Medium

**Reproduction:**
1. Create a two-column resume in Word with 0.5" margins
2. Export as PDF
3. Upload to Patorbit
4. Observe: columns are interleaved line-by-line instead of left-column-first, right-column-second

**Expected:** Two-column layout detected; left column extracted first, then right column.

**Actual:** `COLUMN_GAP_THRESHOLD = 150` (150pt ≈ 2 inches) is too high for resumes with narrow margins. A typical two-column resume with 0.5" margins has a ~30-50pt gap between columns. The threshold is never exceeded, so `isTwoColumn` stays false.

**Root cause:**
```tsx
// Line 34
const COLUMN_GAP_THRESHOLD = 150; // pt
```

**Suggested fix:** Lower threshold to 60pt (≈ 0.8 inches):
```tsx
const COLUMN_GAP_THRESHOLD = 60;
```

---

### BUG-010: `clearSummary` Discards Draft Without User Confirmation

**File:** `src/components/resume-builder/optimization/OptimizationPanel.tsx:481`  
**Category:** UX · Data Loss  
**Severity:** Medium

**Reproduction:**
1. Generate a professional summary (wait for completion)
2. Read the draft, decide you want to regenerate with a different tone
3. Change tone selector to "Technical"
4. Click "X" button (line 481: `onClick={() => { clearSummary(); onResumeChange({ ...resume, summary: resume.summary }); }}`)
5. Click "Generate Summary"
6. Observe: the first draft is permanently lost, no way to compare

**Expected:** User is asked "Discard this draft?" OR the draft is kept in memory until a new generation starts.

**Actual:** Draft is cleared immediately with no confirmation. If user clicked "X" by accident, the generated text is unrecoverable.

**Root cause:** No confirmation step before `clearSummary()`.

**Suggested fix:**
```tsx
const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

// On X button:
onClick={() => setShowDiscardConfirm(true)}

// Confirmation modal:
{showDiscardConfirm && (
  <ConfirmDialog
    message="Discard this generated summary?"
    onConfirm={() => { clearSummary(); setShowDiscardConfirm(false); }}
    onCancel={() => setShowDiscardConfirm(false)}
  />
)}
```

---

### BUG-011: `resetResume` Clears Evidence and TrustScore But Leaves Claims

**File:** `src/store/resume-builder.ts:160`  
**Category:** State · Data Loss  
**Severity:** Medium

**Reproduction:**
1. Accept 3 claims from Claims Review
2. Add evidence to 2 claims
3. Build trust score snapshot
4. Click "Reset Resume" (if exposed in UI, or via direct store call)
5. Observe: `resume.claims` array is reset to `[]`, but the claims *were* part of `resume` so they should be cleared too

**Expected:** All user data (including claims, evidence, trust score) is cleared.

**Actual:**
```tsx
// Line 160
resetResume: () => set({
  resume: defaultResume,
  analysis: null,
  jobMatch: null,
  saveStatus: "unsaved",
  suggestedClaims: [],
  evidence: [],
  trustScore: null,
  trustReport: null
}),
```

`defaultResume` at line 27 defines `claims: []`, so claims ARE cleared. This is correct.

**Re-assessment:** Not a bug — claims are part of `defaultResume` and are cleared. Marking as **false positive**.

---

### BUG-012: `withIds` Mutates Input Array In-Place

**File:** `src/utils/resume-parser.ts:307-309`  
**Category:** Logic  
**Severity:** Low

**Reproduction:**
1. Call `rawToResume(text)` twice with the same input
2. Observe: second call returns entries with `id: 1, 2, 3...` (correct)
3. Check the parsed object from first call: IDs are ALSO present (incorrect — function mutates shared reference)

**Expected:** `withIds` returns a new array without mutating input.

**Actual:**
```tsx
export function withIds<T extends object>(items: T[] | undefined): (T & { id: number })[] {
  return (items || []).map((item, i) => ({ ...item, id: i + 1 }));
}
```

This IS correct — `.map()` with object spread creates new objects. Not a bug.

**Re-assessment:** False positive.

---

### BUG-013: Import API — `jobDescription` Field Not Stripped from Imported Resume

**File:** `src/app/api/import/route.ts:207`  
**Category:** API Contract  
**Severity:** Low

**Reproduction:**
1. Export a resume JSON that includes `jobDescription: "Software Engineer at XYZ Corp"`
2. Re-import the JSON
3. Observe: `jobDescription` is present in the imported resume object, even though it's not part of the Resume schema

**Expected:** Only valid Resume fields are accepted; `jobDescription` is stripped (or causes validation error).

**Actual:** `parseResumeJson` (Zod validation) at line 207 strips unknown fields automatically if the schema uses `.strict()`. If not, extra fields pass through silently.

**Root cause:** Check whether `src/utils/resume-schema.ts` uses `.strict()` on the Resume schema.

**Suggested fix:** Add `.strict()` to the Resume schema:
```tsx
export const ResumeSchema = z.object({
  name: z.string(),
  // ... all fields
}).strict();
```

---

## LOW

### BUG-014: `getActiveTemplate` Returns First Template on Mismatch — No Warning

**File:** `src/components/resume/ResumePreview.tsx:5-7`  
**Category:** Logic · UX  
**Severity:** Low

**Reproduction:**
1. Manually edit persisted resume JSON in browser DevTools → Storage → localStorage
2. Set `templateId: "non-existent-template"`
3. Refresh page
4. Observe: preview renders `modern-clean` (first template) with no indication that the requested template was not found

**Expected:** Console warning or fallback UI message: "Template 'non-existent-template' not found, using default."

**Actual:** Silent fallback to `TEMPLATES[0]`.

**Root cause:**
```tsx
export function getActiveTemplate(resume: Resume): ResumeTemplate {
  return TEMPLATES.find(t => t.id === resume.templateId) || TEMPLATES[0];
}
```

**Suggested fix:**
```tsx
export function getActiveTemplate(resume: Resume): ResumeTemplate {
  const found = TEMPLATES.find(t => t.id === resume.templateId);
  if (!found && resume.templateId) {
    console.warn(`Template "${resume.templateId}" not found, falling back to default.`);
  }
  return found || TEMPLATES[0];
}
```

---

## Summary Table

| ID | Issue | File | Category | Severity |
|---|---|---|---|---|
| BUG-001 | Side effect during render — summary streaming causes cascade | OptimizationPanel.tsx:216 | State · Rendering | **Critical** |
| BUG-002 | `startAnalysis()` fires on every page hydration | resume-builder.ts:372 | Logic · API | **Critical** |
| BUG-003 | `ResumePreview` always mounted off-screen, renders on every keystroke | ExportModal.tsx:183 | Rendering · Perf | **Critical** |
| BUG-004 | `progress()` / `sectionComplete()` stored as functions — not reactive | resume-builder.ts:339 | State · Logic | High |
| BUG-005 | No unmount cleanup for abort refs | useOptimization.ts:126 | State · Error | High |
| BUG-006 | Apply All uses stale cached suggestions after manual bullet edits | OptimizationPanel.tsx:245 | Logic · Cache | High |
| BUG-007 | Education parser never closes entry when school name doesn't match regex | resume-parser.ts:203 | Logic · Edge Case | Medium |
| BUG-008 | `dismissBullet` removes all suggestions with same `bulletIndex` | useOptimization.ts:236 | Logic | Medium |
| BUG-009 | Two-column PDF detection threshold too high (150pt) | import/route.ts:34 | Logic · Edge Case | Medium |
| BUG-010 | `clearSummary` discards draft without confirmation | OptimizationPanel.tsx:481 | UX · Data Loss | Medium |
| BUG-011 | ~~`resetResume` leaves claims~~ | *(false positive)* | — | — |
| BUG-012 | ~~`withIds` mutates input~~ | *(false positive)* | — | — |
| BUG-013 | Import API does not strip `jobDescription` from JSON | import/route.ts:207 | API Contract | Low |
| BUG-014 | `getActiveTemplate` silent fallback on mismatch | ResumePreview.tsx:5 | Logic · UX | Low |

---

## Immediate Action Checklist

- [ ] **BUG-001**: Move `onResumeChange` from render body to `useEffect` (OptimizationPanel.tsx:216)
- [ ] **BUG-002**: Remove `startAnalysis()` from `onRehydrateStorage` (resume-builder.ts:372)
- [ ] **BUG-003**: Conditionally mount `ResumePreview` only when printing (ExportModal.tsx:183)
- [ ] **BUG-004**: Convert `progress()` / `sectionComplete()` to external selector functions
- [ ] **BUG-005**: Add `useEffect` cleanup to abort all refs on unmount (useOptimization.ts)
- [ ] **BUG-006**: Change bullet cache fingerprint to hash only the specific entry, not full resume

---

*End of Bug Backlog. Structural issues: `docs/PRODUCTION_AUDIT_PART1.md`. Performance issues: `docs/PERFORMANCE_AUDIT.md`. Security issues: `docs/SECURITY_AUDIT.md`.*
