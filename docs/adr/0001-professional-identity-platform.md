# ADR-0001: Professional Identity Platform Architecture

**Status:** Accepted  
**Date:** 2026-08-07  
**Type:** Implementation ADR  
**Supersedes:** N/A  
**Implements:** `patorbit-docs/04_ADR/ADR-003`, `ADR-006`

---

## Context

Patorbit began as a resume builder. During Sprint 2, the team completed a full resume builder (22 templates, AI assistance, export). Before Sprint 3, an architecture review found that the v0.9 design was **resume-centric** — Claims, Evidence, and Trust were bolted onto the Resume Builder as sections, rather than being first-class domain objects.

The v1.0 specification (ADR-003, ADR-006) established the **Professional Identity-Centric** model. This ADR records how that decision was implemented at the code level.

---

## Decision

Implement the platform as a **multi-surface app** where the Resume Builder is one input surface, not the product core.

### Surface Map

```
/ (marketing)              Public marketing site
├── /pricing               Pricing tiers
├── /platform              Product overview
└── ...

/login, /register          Auth surfaces (no persistent layout)

/(hub)                     Authenticated Professional Identity Hub
├── /overview              Dashboard command center (identity summary)
├── /resume                Resume list (feeds identity)
├── /passport              Professional Passport (projection)
├── /trust                 Trust Score (verification coverage)
├── /ai                    AI Copilot
├── /network               Professional network
└── /settings              Account settings

/resume-builder            Resume editing workspace (isolated layout)
├── /                      3-column editor
└── /preview               Preview + export
```

### Domain Object Ownership

Per ADR-006 and ADR-007:

```
User (auth principal)
  └── ProfessionalIdentity (root aggregate)
        ├── Resume (input source — stored in localStorage, MVP)
        ├── Claims (derived assertions)
        ├── Evidence (claim support)
        ├── Trust (verification coverage signal)
        ├── Passport (presentation projection)
        └── Career Journey (canonical narrative)
```

**No business object attaches directly to `User`.** The `ProfessionalIdentity` model in Prisma owns all domain data.

### Tech Stack Choices

| Concern | Choice | Reason |
|---|---|---|
| Framework | Next.js 16.2.12 App Router | Route groups enable distinct layouts per surface without coupling |
| State (client) | Zustand 5 + persist | Offline-first resume editing; no server round-trip on keystroke |
| State (server) | PostgreSQL via Prisma | Identity and auth data persisted server-side |
| Styling | Tailwind CSS v4 | Utility-first; fast iteration on glassmorphism design system |
| Animation | Framer Motion | Glassmorphism aesthetic requires fluid transitions |

### Route Group Strategy

Next.js App Router route groups (`(auth)`, `(hub)`, `(marketing)`) provide:
- Isolated layouts per surface (marketing nav vs. app shell vs. no chrome)
- No URL impact (group name not in path)
- Correct middleware targeting without regex gymnastics

---

## Consequences

**Positive:**
- Clean separation: Resume Builder stays focused on editing; Hub owns identity
- Future input sources (GitHub, certifications, publications) feed the Hub without touching the Resume Builder
- Route protection is straightforward: middleware guards `/(hub)` and `/resume-builder` route groups

**Trade-offs:**
- Until the Hub surfaces are fully built (Claims UI, Evidence upload, Trust panel), users see partial/empty states in the Hub
- Two navigation contexts (Hub sidebar vs. Builder header) increase design surface area

**Deferred:**
- Multi-resume support (currently one resume per user in localStorage)
- Real-time cross-device sync (localStorage-only in v0.1)
- Public Passport URL (`/passport/[userId]`)

---

## Cross-References

| ADR | Relationship |
|---|---|
| `patorbit-docs/04_ADR/ADR-003` | Establishes the identity-centric model this implements |
| `patorbit-docs/04_ADR/ADR-006` | Constitutional laws this implementation must not violate |
| `patorbit-docs/04_ADR/ADR-004` | Hub architecture; `/(hub)` route group is its implementation |
| `patorbit-docs/04_ADR/ADR-007` | Auth ownership model; `User → ProfessionalIdentity` relation |
| `docs/adr/0005-authentication-architecture.md` | Auth implementation specifics |
| `docs/adr/0002-resume-builder-workspace.md` | Resume Builder implementation specifics |
