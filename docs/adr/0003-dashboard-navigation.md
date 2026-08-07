# ADR-0003: Dashboard & Navigation Architecture

**Status:** Accepted  
**Date:** 2026-08-07  
**Type:** Implementation ADR  
**Implements:** `patorbit-docs/04_ADR/ADR-004` (Identity Hub)

---

## Context

ADR-004 established the **Professional Identity Hub** as the organizing surface for identity-domain features (Overview, Career Journey, Claims, Evidence, Trust, Passport). This ADR records the implementation decisions for routing, layout, and navigation that bring the Hub to life.

The key tension: the Hub must feel like a coherent app (not a list of disconnected pages) while keeping the Resume Builder as a separate, focused workspace.

---

## Decision

### 1. Route Group Architecture

Two authenticated surfaces, each with its own layout:

```
app/(hub)/layout.tsx          App shell: sidebar + top nav + session guard
  ├── /overview               Dashboard command center
  ├── /resume                 Resume list (feeds identity)
  ├── /passport               Professional Passport
  ├── /trust                  Trust Score
  ├── /ai                     AI Copilot
  ├── /network                Professional network
  └── /settings               Account settings

app/resume-builder/layout.tsx  Builder shell: 3-column, no Hub chrome
  ├── /                        Editor
  └── /preview                 Preview + export
```

The Resume Builder has its **own layout** deliberately — it has no Hub sidebar, no top nav. It is accessed via a dedicated entry point from the Hub, and returns to the Hub via a breadcrumb back link.

### 2. Overview as Identity Command Center

`/overview` is the Hub entry point after login. It is not a generic dashboard — it surfaces the state of the user's **Professional Identity**:

- Resume Health score (from AI analysis)
- Trust Score summary (verification coverage)
- Quick Actions (edit resume, review claims, upload evidence)
- Recent Activity

Design principle: every widget on Overview maps to one of the constitutional domain objects (ADR-006). Widgets that don't map to the identity domain do not belong on Overview.

### 3. Navigation Hierarchy

```
Top-level nav (Hub sidebar):
  ├── Overview          /overview
  ├── Resume            /resume
  ├── Career Journey    /career-journey    (future)
  ├── Passport          /passport
  ├── Trust             /trust
  ├── AI                /ai
  ├── Network           /network
  └── Settings          /settings

Resume Builder (separate context):
  └── ← Dashboard > Resume Builder [name]   (breadcrumb back link)
```

The Resume Builder breadcrumb is the only navigation connection between the two surfaces. There is no persistent Hub sidebar in the Builder.

### 4. Route Protection

`src/middleware.ts` guards authenticated routes at the edge using NextAuth `getToken()`:

**Protected:**
- `/(hub)/*` → redirect to `/login?callbackUrl=...` if no token
- `/resume-builder/*` → same
- `/dashboard/*` → same (legacy, redirects to `/overview`)

**Public (no auth):**
- `/(marketing)/*`
- `/(auth)/*` (login, register, forgot-password)
- `/passport/[userId]/*` (public Passport view — future)

**Redirect when authenticated:**
- `/login` → `/overview`
- `/register` → `/overview`

### 5. Legacy Dashboard Redirect

`/dashboard` redirects to `/overview` to preserve any bookmarks from earlier sprint navigation. This is a permanent redirect, not a page.

### 6. Deployment Update Banner

`DeploymentUpdateBanner` in `app/layout.tsx` (root layout) detects new deployments across all surfaces via `/api/version` polling:
- Polls every 12 minutes + on `visibilitychange` + on `online` events
- Shows a glassmorphism toast (bottom-right) when SHA changes
- "Refresh Now" CTA — user-initiated, never forced

This lives in the root layout so it appears on all surfaces (marketing, auth, hub, builder).

---

## Alternatives Considered

**Option A: Single layout for all authenticated pages.**  
Rejected: Resume Builder's 3-column workspace is fundamentally different from the Hub's 1-column + sidebar layout. A shared shell would require complex conditional rendering.

**Option B: Full modal navigation (no page transitions).**  
Rejected: Deep-linkability matters for Passport sharing, direct-linking to Trust page, etc. Full-page routes preserve browser history and URL copy.

**Option C: Top navigation bar instead of sidebar for Hub.**  
Deferred: Hub currently has enough destinations for a sidebar. If the nav grows, a sidebar-to-topbar migration can happen without changing routes.

---

## Consequences

**Positive:**
- Clean mental model: Hub = identity, Builder = editor
- Deep-linkable routes for all surfaces
- Route groups allow per-surface layouts with zero URL pollution

**Trade-offs:**
- Context switch between Hub and Builder feels like a full page navigation (no transitions)
- `/overview` widgets are partially stubbed — Trust Score and Passport data not yet live-wired

**Deferred:**
- Mobile responsive layout for Hub sidebar
- Animated route transitions between Hub pages
- Active nav state persistence across refreshes

---

## Cross-References

| ADR | Relationship |
|---|---|
| `patorbit-docs/04_ADR/ADR-004` | Hub architecture this implements |
| `patorbit-docs/04_ADR/ADR-006` | Constitutional laws guide which widgets belong on Overview |
| `docs/adr/0005-authentication-architecture.md` | Route protection mechanism |
| `docs/adr/0002-resume-builder-workspace.md` | Builder layout separate from Hub |
