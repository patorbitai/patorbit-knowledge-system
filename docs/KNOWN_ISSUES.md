# Known Issues

**Last Updated:** 2026-08-07  
**Status:** Active tracking of production bugs, limitations, and technical debt

Issues are ordered by severity: **Critical** → **High** → **Medium** → **Low**

---

## Critical (Production-Blocking)

None at this time.

---

## High (Impacts Core Workflows)

### H-01: PDF Export Does Not Respect Page Breaks

**Status:** Known Limitation  
**Affected:** Resume Builder PDF export  
**Impact:** Experience/Education entries may split mid-item across pages, causing awkward visual breaks

**Root Cause:**  
`exportToPdf` uses `html2canvas` (pixel-based screenshot) + `jsPDF`. CSS `break-inside: avoid` rules have no effect because html2canvas captures pixels, not layout boxes. The print CSS added in Sprint 4.8 only benefits browser Ctrl+P / Save as PDF, not the Export button.

**Workaround:**  
Users can use browser print (Ctrl+P / Cmd+P → Save as PDF) for better page-break control.

**Long-term Fix:**  
Replace html2canvas with layout-aware PDF renderer:
- Option A: Puppeteer server-side (needs /api/export-pdf endpoint, higher infra cost)
- Option B: `@react-pdf/renderer` (requires rewriting all templates to React-PDF primitives)
- Option C: wkhtmltopdf or similar headless browser on server

**Backlog Item:** R-05

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

### M-05: No Mobile Responsiveness in Resume Builder

**Status:** Not Implemented  
**Affected:** Resume Builder 3-column layout  
**Impact:** Builder is unusable on mobile/tablet (layout breaks, sections overlap)

**Root Cause:**  
Sprint 2 prioritized desktop experience. Tailwind breakpoints not applied to `LeftSidebar` / `CenterWorkspace` / `RightCopilot`.

**Next Steps:**
1. Collapse sidebar + copilot on `md` breakpoint
2. Add tab navigation for sections on mobile
3. Test on iOS Safari + Android Chrome

**Backlog Item:** I-07

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

## Reporting Issues

**Internal:** Add issues to this file via PR  
**External (post-1.0):** GitHub Issues at `https://github.com/anthropics/claude-code/issues` (placeholder — replace with actual repo)

**Triage Criteria:**
- **Critical:** Production down, data loss, security vulnerability
- **High:** Core feature broken for all users
- **Medium:** Workaround exists, or affects subset of users
- **Low:** Polish, optimization, nice-to-have
