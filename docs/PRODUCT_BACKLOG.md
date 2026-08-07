# Product Backlog

**Last Updated:** 2026-08-07  
**Current Sprint:** 5 (Planning)  
**Format:** Priority · Estimate · Status

Items are ordered by priority within each epic. Estimates are story points (1 = trivial, 5 = large, 8 = week-scale).

---

## Active Epics

### EPIC-01: Trust Score & Verification

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| T-01 | Wire Trust Score panel in `/trust` page to live `TrustService` data | P0 | 3 | Ready |
| T-02 | Evidence attachment upload (file picker → IndexedDB → evidence record) | P0 | 5 | Ready |
| T-03 | Trust Score display widget on `/overview` dashboard | P0 | 2 | Ready |
| T-04 | Claim card UI: show verification status badge (verified/pending/unverified) | P1 | 3 | Ready |
| T-05 | Evidence list view: show attached files per claim | P1 | 3 | Ready |
| T-06 | Link evidence to claim (connect evidence record to specific claim ID) | P1 | 3 | Ready |
| T-07 | Trust Score breakdown: show scoring factors (coverage, strength, recency) | P1 | 5 | Backlog |
| T-08 | LinkedIn OAuth import for automatic claim verification | P2 | 8 | Backlog |
| T-09 | GitHub activity sync for project/contribution claims | P2 | 8 | Backlog |
| T-10 | Certificate provider integrations (Coursera, Udemy, Google, AWS) | P2 | 13 | Backlog |
| T-11 | Trust Score public share URL (view-only page) | P2 | 5 | Backlog |
| T-12 | Claim dispute / correction flow | P3 | 5 | Backlog |

---

### EPIC-02: Professional Passport

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| P-01 | Passport page live data: render actual claims + evidence from store | P0 | 3 | Ready |
| P-02 | Passport PDF export (layout-aware, not pixel-captured) | P1 | 8 | Backlog |
| P-03 | Passport QR code generation for shareable URL | P1 | 3 | Backlog |
| P-04 | Passport public view page (`/passport/[userId]`) | P1 | 5 | Backlog |
| P-05 | Privacy controls: choose which sections are public | P2 | 5 | Backlog |
| P-06 | Passport embed widget (iframe or JS snippet) | P3 | 8 | Backlog |

---

### EPIC-03: Resume Builder Enhancements

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| R-01 | Multi-resume support: resume list, switch/create/delete | P1 | 8 | Backlog |
| R-02 | Template color picker UI (select palette in builder, not code) | P1 | 5 | Backlog |
| R-03 | Template font picker UI (select from 14 fonts in builder) | P1 | 3 | Backlog |
| R-04 | Resume version history (snapshot on export) | P2 | 5 | Backlog |
| R-05 | Replace html2canvas PDF export with layout-aware renderer | P1 | 13 | Backlog |
| R-06 | Drag-and-drop section reordering | P2 | 5 | Backlog |
| R-07 | Collaborative share link (view feedback, not real-time edit) | P3 | 8 | Backlog |
| R-08 | Resume analytics: track views/downloads when passport is shared | P3 | 5 | Backlog |
| R-09 | Custom section builder (free-form sections with user-defined labels) | P2 | 8 | Backlog |
| R-10 | ATS score real-time feedback per field (not just full analysis) | P2 | 5 | Backlog |

---

### EPIC-04: Knowledge Graph

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| K-01 | Knowledge Graph visualization in `/resume-builder` preview tab | P2 | 8 | Backlog |
| K-02 | Graph node detail panel (click node → show related claims/evidence) | P2 | 5 | Backlog |
| K-03 | Skill cluster detection: auto-group related skills into domains | P3 | 8 | Backlog |
| K-04 | Career progression path visualization (timeline graph) | P2 | 8 | Backlog |

---

### EPIC-05: Auth & User Management

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| A-01 | Email verification on registration (send token, verify link) | P0 | 5 | Backlog |
| A-02 | Password reset flow (forgot password → email link → reset) | P1 | 5 | Backlog |
| A-03 | User profile settings (name, email, profile photo) | P1 | 3 | Ready |
| A-04 | Account deletion (GDPR-compliant data purge) | P1 | 5 | Backlog |
| A-05 | OAuth providers: Google, LinkedIn (future) | P2 | 8 | Backlog |
| A-06 | Two-factor authentication (TOTP) | P3 | 8 | Backlog |

---

### EPIC-06: Monetization

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| M-01 | Stripe integration: subscription checkout (Professional tier) | P1 | 13 | Backlog |
| M-02 | Subscription management page (upgrade/downgrade/cancel) | P1 | 8 | Backlog |
| M-03 | Feature gating: enforce Professional limits (multi-resume, AI calls) | P1 | 5 | Backlog |
| M-04 | Usage metering: track AI action calls per user per month | P1 | 3 | Backlog |
| M-05 | Enterprise SSO (SAML / SCIM) | P3 | 13 | Backlog |
| M-06 | Billing portal (Stripe Customer Portal integration) | P2 | 3 | Backlog |

---

### EPIC-07: Infrastructure & DevEx

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| I-01 | Move resume data from localStorage to database (multi-device sync) | P1 | 13 | Backlog |
| I-02 | S3/Cloudinary for evidence attachment storage (replace IndexedDB) | P1 | 8 | Backlog |
| I-03 | API rate limiting per user on `/api/ai` endpoint | P1 | 3 | Backlog |
| I-04 | Error monitoring (Sentry integration) | P1 | 3 | Backlog |
| I-05 | Analytics (PostHog or Plausible for usage events) | P2 | 3 | Backlog |
| I-06 | End-to-end test coverage for Resume Builder critical paths | P1 | 8 | Backlog |
| I-07 | Mobile responsiveness pass for Resume Builder | P2 | 8 | Backlog |
| I-08 | Public API (developer access) | P3 | 13 | Backlog |

---

### EPIC-08: Marketing & Growth

| ID | Title | Priority | Estimate | Status |
|---|---|---|---|---|
| G-01 | Blog CMS integration (MDX or Contentlayer) | P2 | 5 | Backlog |
| G-02 | SEO audit and meta tag pass across marketing pages | P2 | 3 | Backlog |
| G-03 | Waitlist / referral system | P2 | 5 | Backlog |
| G-04 | OpenGraph image generation for Passport share URLs | P2 | 3 | Backlog |
| G-05 | Product Hunt launch preparation | P2 | 3 | Backlog |

---

## Completed (Sprint 1–4)

See `SPRINT_HISTORY.md` for full details.

**Summary of shipped items:**
- ✅ Authentication (register, login, session, middleware)
- ✅ Marketing site (homepage, pricing, features, legal)
- ✅ Resume Builder core (22 templates, all section editors, auto-save)
- ✅ AI integration (13 action types via `/api/ai`)
- ✅ PDF + DOCX export
- ✅ Trust Score backend pipeline (services, graph, coordinator)
- ✅ Dashboard Overview redesign
- ✅ Deployment version detection + update banner
- ✅ Print CSS for A4 export
- ✅ All Sprint 4 UX polish items

---

## Backlog Grooming Notes

**Next Sprint 5 candidate items (by priority + readiness):**
1. T-01 — Trust Score live data wiring (backend exists, needs UI wiring)
2. T-02 — Evidence attachment upload (highest user-visible value)
3. T-03 — Trust Score overview widget
4. P-01 — Passport live data render
5. A-01 — Email verification (security compliance)
6. A-02 — Password reset (user experience)
