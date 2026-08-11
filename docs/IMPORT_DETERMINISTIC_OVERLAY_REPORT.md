# Deterministic Evidence Overlay — Implementation & Progress Report

> **Date:** 2026-08-11
> **Scope:** `/api/import` deterministic-first pipeline + evidence overlay onto the resume.
> **Status:** Implemented, tests green (325/325), typecheck clean, new-code lint clean.

---

## 1. What this does

The import route now follows the **PATORBIT CORE RULE (NO AI for import)**:

```
Upload (PDF / DOCX / JSON)
   │
   ├─ PDF  → pdfjs page-by-page text → pageTexts[]
   ├─ DOCX → mammoth raw text
   └─ JSON → direct
        │
        ▼
rawToResume(text)  ← deterministic regex parse
        │
        ├─ confident (≥2 structured signals) → done, NO AI
        └─ low coverage + fallback enabled  → extractWithAI (optional last resort,
              gap-fill ONLY — mergeResume never overwrites deterministic values)
        │
        ▼
mapEvidenceToResume(resume, facts)   ← deterministic evidence overlay
        │
        ▼
parseResumeJson (Zod) → resume + meta + document + evidence
```

Parallel to the resume, the route builds a `DocumentRecord` from per-page text and
extracts `EvidenceFacts` (existing Document Model — no new extraction engine). The
evidence overlay then lets **provable facts win** over parser guesses, and anything
the grouping cannot confidently assign is returned in `uncertain` for review —
never invented or dropped.

---

## 2. Files

| File | Role |
|------|------|
| `src/app/api/import/route.ts` | Deterministic-first resolution, AI kill-switch (`IMPORT_AI_FALLBACK`), evidence overlay wiring, `meta.evidenceOverlay`, `document` + `evidence` in the response. |
| `src/utils/evidence-resume-mapper.ts` *(new)* | `mapEvidenceToResume` — maps facts → resume fields; returns `{ resume, changed, uncertain }`. |
| `src/utils/experience-grouping.ts` *(new)* | `groupExperienceEntries` — order-preserving company/role/date/bullet grouping. |
| `src/utils/education-grouping.ts` *(new)* | `groupEducationEntries` — school/degree/field/date grouping. |
| `src/utils/project-grouping.ts` *(new)* | `groupProjectEntries`. |
| `src/utils/certification-grouping.ts` *(new)* | `groupCertificationEntries`. |
| `src/utils/language-grouping.ts` *(new)* | `groupLanguageEntries`. |
| `src/utils/summary-normalization.ts` *(new)* | Removes independently-classified contact/link tokens from summary prose; never rewords. |
| `src/lib/document-model/evidence.ts` | Exports `EMAIL_RE`/`PHONE_RE`; extracts explicit header location as a `contact` fact. |
| `src/lib/document-model/sections.ts` | More certifications aliases (`certifications & awards`, etc.). |
| `src/utils/resume-parser.ts` | `splitSkillLevel` (deterministic "Skill – Level" split), `SKILL_LEVELS`, omit empty level. |
| Tests | `src/utils/__tests__/import-e2e.test.ts`, `summary-normalization.test.ts`, `section-grouping.test.ts`. |

---

## 3. Work completed in this session

1. **Header location → `resume.address`.** A `City, Region` shape on a contact line
   ("Mumbai, India carvind35@gmail.com 9226232697") is kept verbatim as a `contact`
   fact and mapped to `resume.address`. Nothing is inferred from prose elsewhere.
   - `evidence.ts:addContactFacts` — location regex, reuses the existing `contact`
     fact type (no `EvidenceFact` architecture change).
   - `evidence-resume-mapper.ts` — `address` added to `EvidenceOverlayFields`, mapped
     from a contact fact that is neither email nor phone and matches the location shape.

2. **Company + position on the same line.** `Usher Technologies – AI/ML Engineer`
   previously produced one `company` fact and an empty position. Now split
   deterministically into `company = "Usher Technologies"`, `position = "AI/ML Engineer"`.
   - `experience-grouping.ts:splitCompanyPosition` — only a spaced `–`/`-`/`—`
     separator on an explicit company line, trailing part must be role-like (never
     a date or sentence), so hyphenated brand names ("T-Mobile") are never split.

3. **Skill-level validation fix.** `splitSkillLevel` returned `level: ""` for a
   plain skill name, which the `SkillSchema` enum rejects → `parseResumeJson` threw
   on ANY resume with skills. Fixed by omitting an empty `level` so the schema's own
   default applies, and widening `ParsedResume["skills"].level` to optional.
   Affected all skills-bearing tests in `import-e2e` + `summary-normalization`.

4. **Regression tests** for both new behaviors added to `import-e2e.test.ts`
   ("real resume: header location and company/position on the same line").

---

## 4. Verification

| Check | Result |
|-------|--------|
| `npx vitest run` (full suite) | **325 passed / 325** (25 files) |
| `npx tsc --noEmit` | clean |
| `npx eslint <all new/changed non-`any`>` | clean (new code) |
| Real-resume snippet (Arvind Chauhan PDF text) | `Mumbai, India` → `resume.address`; `Usher Technologies – AI/ML Engineer` → company+position |

**Pre-existing (not introduced here):** 3 `@typescript-eslint/no-explicit-any`
errors in `resume-parser.ts:123,222,306` — present on the committed baseline too.

---

## 5. Remaining / known issues

- The pre-existing `no-explicit-any` warnings in `resume-parser.ts` (parse
  experience/education/projects internals) can be cleaned in a follow-up.
- Vite emits a config-loading warning (`configLoader: 'native'`, ESM-in-CJS);
  cosmetic, planned migration to `.mjs` config.
- No commit made yet — changes are staged in the working tree only (per
  repo convention, commit only when requested).
