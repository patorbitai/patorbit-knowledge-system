# Known Issues

**Last Updated:** 2026-08-15
**Status:** Active tracking of production bugs, limitations, and technical debt

Issues are ordered by severity: **Critical** → **High** → **Medium** → **Low**

---

## Critical (Production-Blocking)

None at this time.

---

## High (Impacts Core Workflows)

### H-01: PDF Export Page Breaks — Resolved via Browser Print

**Status:** ✅ Resolved (2026-08)
**Affected:** Resume Builder PDF export  

**Resolution:** The Export button now opens the browser print dialog (`window.print()`), so page breaks are driven by the same CSS layout as the on-screen resume. The print block pins exact A4 geometry (`@page { size: A4; margin: 0 }`, `print-color-adjust: exact`) and shares the `A4` constants with the preview, so Print → Save as PDF matches the Professional Preview.

**Remaining:** `html2canvas` / `jspdf` remain in `package.json` but have no imports in `src/` — candidates for removal in a dependency cleanup pass.

**Deferred layout caveat:** on some multi-page templates with full-height sidebars/background panels, a partially filled later page may not visually extend the sidebar/background to the bottom of the A4 page (see M-06).

---

### H-02: Trust Score Pipeline Not Wired to UI

**Status:** Backend Complete, Frontend Incomplete  
**Affected:** `/trust` page, overview dashboard Trust Score widget  
**Impact:** Trust Score data is calculated but not displayed to users

**Root Cause:**  
Services (`TrustService`, `IdentityPipelineCoordinator`) are implemented and tested, but no React component reads and renders the data. The `/trust` page has placeholder UI only.

**Next Steps:**
1. Wire `TrustService.getTrustSnapshot(userId)` to `/trust` page
2. Add Trust Score widget to overview (`/overview`)
3. Display verification badge on claim cards

**Backlog Items:** T-01, T-03, T-04

---

### H-03: Evidence Attachment Upload Not Implemented

**Status:** Storage Layer Ready, Upload Flow Missing  
**Affected:** Claim evidence linking  
**Impact:** Users cannot upload files (diplomas, certificates, etc.) as evidence for claims

**Root Cause:**  
IndexedDB storage is wired (`idb-keyval` integration), but no file picker UI or upload handler exists in the Resume Builder or Trust page.

**Next Steps:**
1. Add file input to claim card
2. Upload → IndexedDB via `idb.set(key, file)`
3. Link evidence record to claim ID
4. Display attached files in evidence list

**Backlog Item:** T-02

---

## Medium (Annoyances, Non-Critical)

### M-01: No Email Verification on Registration

**Status:** Not Implemented  
**Affected:** Auth flow  
**Impact:** Users can register with invalid emails; no account recovery mechanism

**Root Cause:**  
Sprint 1 shipped credentials auth without email verification to move faster. `VerificationToken` model exists in schema but is unused.

**Next Steps:**
1. Send verification email on registration
2. Block login until verified
3. Add resend verification link

**Backlog Item:** A-01

---

### M-02: No Password Reset Flow

**Status:** Not Implemented  
**Affected:** Auth flow  
**Impact:** Users who forget password cannot recover access

**Workaround:**  
Manual password reset via database admin (not scalable)

**Next Steps:**
1. `/forgot-password` page → send reset token email
2. `/reset-password/[token]` page → validate token, update password
3. Expire tokens after 1 hour

**Backlog Item:** A-02

---

### M-03: Resume Data Only in localStorage (No Multi-Device Sync)

**Status:** By Design (MVP Constraint)  
**Affected:** Resume Builder  
**Impact:** Users cannot access their resume from a different device or after clearing browser data

**Root Cause:**  
Sprint 2 chose localStorage for speed and offline capability. Database sync was deferred to reduce MVP scope.

**Next Steps:**
1. Add `Resume` model to Prisma schema
2. Sync Zustand persist to database on save
3. Hydrate from database on first load per device

**Backlog Item:** I-01

---

### M-04: Drag-and-Drop Bullet Reordering Disabled

**Status:** Partially Implemented, Feature Disabled  
**Affected:** Experience/Education bullet lists  
**Impact:** Users cannot reorder bullets within a section item; must cut/paste text manually

**Root Cause:**  
`react-dnd` was wired during Sprint 2 but caused flicker with Framer Motion animations. Disabled pending fix.

**Next Steps:**
1. Replace `react-dnd` with `@dnd-kit/core` (better animation compatibility)
2. Re-enable drag handles on bullet items

**Backlog Item:** R-06

---

### M-05: Resume Builder Editor Not Fully Mobile-Responsive

**Status:** Partially Implemented
**Affected:** Resume Builder 3-column editor layout
**Impact:** The editor itself is desktop-focused (sections may overlap on small screens)

**Current state:** The Template Gallery, FullTemplatePreview, Professional Preview, and Customize workspace are responsive (stack on mobile, no horizontal overflow). The core editor columns (`LeftSidebar` / `CenterWorkspace` / `RightCopilot`) remain desktop-first.

**Next Steps:**
1. Collapse sidebar + copilot on `md` breakpoint
2. Add tab navigation for sections on mobile
3. Test on iOS Safari + Android Chrome

**Backlog Item:** I-07

---

### M-06: Multi-Page Sidebar / Background Height (DEFERRED)

**Status:** ⏸️ Deferred — intentional, do not modify during release validation
**Affected:** Multi-page templates with full-height sidebars or background panels (e.g., sidebar/band templates)
**Impact:** On a partially filled later page, the sidebar/background may stop before the bottom of the A4 page instead of extending to the sheet edge

**Note:** This is a known, intentional layout deferral. It does not crash the app and does not invalidate PDF generation. A dedicated layout pass is planned.

---

## Low (Minor Issues, Nice-to-Have Fixes)

### L-01: Deployment Update Banner Polls Every 12 Minutes

**Status:** By Design  
**Affected:** All pages  
**Impact:** Small unnecessary API calls when user leaves tab open for hours

**Optimization:**  
Switch to SSE (Server-Sent Events) or WebSocket for push-based updates instead of polling.

**Priority:** Low (works fine, just not optimal)

---

### L-02: Missing Error Monitoring

**Status:** Not Implemented  
**Affected:** All pages  
**Impact:** Production errors are invisible; no telemetry for debugging

**Next Steps:**
1. Add Sentry integration
2. Set up error boundary components
3. Add performance tracing for slow API routes

**Backlog Item:** I-04

---

### L-03: No Usage Analytics

**Status:** Not Implemented  
**Affected:** Product decisions  
**Impact:** No data on which features are used, where users drop off, A/B test results

**Next Steps:**
1. Add PostHog or Plausible
2. Track key events: resume created, template changed, AI action used, export clicked

**Backlog Item:** I-05

---

### L-04: Hard-Coded AI Model in Service Layer

**Status:** Technical Debt  
**Affected:** `/api/ai` → `openai.ts`  
**Impact:** Cannot easily switch models (GPT-4 → GPT-4o, GPT-4 Turbo, etc.) without code change

**Root Cause:**  
`openai.chat.completions.create({ model: "gpt-4" })` is hard-coded in `src/lib/ai/openai.ts`.

**Next Steps:**
1. Add `OPENAI_MODEL` environment variable (default: `gpt-4`)
2. Allow per-action model override in `AIService`

**Priority:** Low (not blocking users)

---

### L-05: Stale `node_modules/next/dist/docs/` Reference in AGENTS.md

**Status:** Documentation Constraint  
**Impact:** None (docs exist but are rarely checked)

**Note:**  
`AGENTS.md` instructs reading Next.js docs from `node_modules/next/dist/docs/` before writing code. This path exists and contains upgrade guides, but developers rarely consult it. Consider adding to onboarding checklist.

---

## Fixed Issues (Historical)

### ✅ F-01: bcrypt Native Module Failed on Vercel

**Fixed In:** v0.0.2  
**Solution:** Replaced `bcrypt` with `bcryptjs` (pure JS, no native deps)

---

### ✅ F-02: Duplicate localStorage Auto-Save Caused Stale Data

**Fixed In:** v0.0.9  
**Solution:** Deleted `debouncedSave` function; Zustand persist is sole writer

---

### ✅ F-03: Dark Elegance Template Rendered Black Blobs in PDF

**Fixed In:** v0.1.0 (Sprint 4.3)  
**Solution:** Complete rewrite — white paper background, charcoal ink, no dark rectangles

---

### ✅ F-04: Adding Section Items Required Two Clicks (Add Then Expand)

**Fixed In:** v0.1.0 (Sprint 4.4)  
**Solution:** Auto-expand newly added items via `useResumeBuilder.getState()` sync read

---

### ✅ F-05: Hover Scale Jitter on Name/Title Input Fields

**Fixed In:** v0.1.0 (Sprint 4.5)  
**Solution:** Removed `whileHover={{ scale: 1.01 }}` from input wrappers

---

### ✅ F-06: Browser alert() Calls Blocked Async Export Errors

**Fixed In:** v0.1.0 (Sprint 4.6)  
**Solution:** Replaced with inline `role="alert"` error components

---

### ✅ F-07: Dead localStorage Key "patorbit-resume-data"

**Fixed In:** v0.1.0 (Sprint 4.7)  
**Solution:** Deleted orphaned `loadResume()` function; single key `"patorbit-resume-v2"`

---

### ✅ F-08: DOCX Export Failed With "Failed to generate DOCX"

**Fixed In:** staged work (2026-08)
**Solution:** Removed the `"use client"` directive from `src/lib/resume-design-system/style-config.ts`. The route imported a client-module function, which Turbopack rejected at runtime (`Attempted to call resolveStyleConfig() from the server`). Verified end-to-end with a real authenticated request returning a valid DOCX.

---

### ✅ F-09: Print/PDF Did Not Match the Professional Preview

**Fixed In:** staged work (2026-08)
**Solution:** Print CSS now pins exact A4 geometry (`@page { size: A4; margin: 0 }`, `width: 210mm; min-height: 297mm; box-sizing: border-box`), keeps `print-color-adjust: exact` so backgrounds print, and removes width/scale/font/break-avoiding overrides. Preview, gallery, and print share one A4 constants module.

---

### ✅ F-10: "Switch to Light Mode" Did Not Theme the Application

**Fixed In:** staged work (2026-08)
**Solution:** Wired Tailwind's `dark:` variant to the manual `.dark` class, extended the `.light` CSS layer to cover Builder/Preview chrome classes, and mounted the real `AccountMenu` in the Builder header (the old Account button had no dropdown). Persisted via `localStorage["patorbit-theme"]`; resume template styling is isolated from the app theme.

---

### ✅ F-11: Template Gallery React "unique key" Warning

**Fixed In:** staged work (2026-08)
**Solution:** Added a `key` to the sidebar section fragment in `TemplateGallery`.

---

### ✅ F-12: Dead Settings Gear Button

**Fixed In:** staged work (2026-08)
**Solution:** Removed the gear button and deleted the orphaned `SettingsModal.tsx` — the four settings fields it wrote had zero consumers. Builder header is now Saved · Preview · Profile.

---

### ✅ F-13: React Hooks / Static-Components Lint Issues

**Fixed In:** staged work (2026-08)
**Solution:** Hoisted render-time component definitions to module scope in the 8 flagship templates; refactored the conditional `useMemo` in `NetworkView` so hooks run unconditionally; stabilized the Vitest thread pool on Windows.

---

## Reporting Issues

**Internal:** Add issues to this file via PR  
**External (post-1.0):** GitHub Issues at `https://github.com/anthropics/claude-code/issues` (placeholder — replace with actual repo)

**Triage Criteria:**
- **Critical:** Production down, data loss, security vulnerability
- **High:** Core feature broken for all users
- **Medium:** Workaround exists, or affects subset of users
- **Low:** Polish, optimization, nice-to-have
