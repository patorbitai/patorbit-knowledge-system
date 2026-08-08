# Patorbit Product Roadmap

**Last Updated:** 2026-08-08  
**Version:** 1.0.0  
**Status:** Active — Sprint 5

---

## Vision

**Patorbit** is building the trust layer for professional identity — transforming the resume from a static document into a dynamic, verifiable, AI-powered career passport.

### Mission

Enable professionals to own, verify, and leverage their career data through:

- AI-powered resume creation and optimization
- Verifiable professional credentials (Trust Score)
- Evidence-backed career narrative (Career Journey)
- A unified Professional Passport that replaces traditional CVs

### The Problem We Solve

1. Resumes are static and unverifiable — employers cannot trust what they read
2. Professional achievements are scattered across LinkedIn, GitHub, certificates, and projects
3. Career data is siloed — no single source of truth for professional identity
4. Job matching is broken — keyword filters miss qualified candidates

---

## Three-Layer Platform Model

Every decision is classified against three layers. The guiding question: *what is the smallest trustworthy version we can confidently release?*

**Layer 1 — Marketing Website** (what new visitors see)  
Must be polished before launch: Home, Features, Pricing, About, Legal, SEO, Accessibility.

**Layer 2 — MVP Application** (what early users actually use)  
Must work: Resume Builder, Resume Preview, Export, Professional Passport, Trust Score, Credential Verification, AI assistance.

**Layer 3 — Future Platform** (ships clearly labeled as previews or coming soon)  
Knowledge Graph, Trust Timeline, Job Match, Career Hub extensions, Advanced AI Insights.

---

## Core Domain Model (ADR-006 — frozen)

**First-class objects:** Professional Identity (root aggregate), Claims, Evidence, Verification, Trust, Identity Intelligence, Career Journey, Professional Passport (projection).

**Canonical pipeline:**  
`Sources → Claims → Evidence → Verification → Trust → Identity Intelligence → Career Journey → Projections`

**Projections:** Passport / Recruiter / University / Government / API

**Constitutional laws:**
- Professional Identity is the single root aggregate
- No trust or narrative without Claims
- Trust derives only from supported Claims
- Every trust decision traces to Claims and Evidence
- No fabrication — everything shown traces to a source
- Exactly one canonical Career Journey; audience versions are projections
- The Passport is a projection, never the authoritative source

**Product filter:** every feature must strengthen at least one core object.

---

## Current State

**Overall completion: ~65%** (as of Sprint 4, 2026-08-07)

| Module | Status | Completion |
|---|---|---|
| Authentication | Deployed | 100% |
| Landing Website | Deployed | 95% |
| Resume Builder | Deployed | 90% |
| Dashboard (Overview) | Deployed | 85% |
| Pricing | Deployed | 100% |
| AI Copilot | Deployed | 75% |
| Settings | Deployed | 60% |
| Career Passport | In Progress | 40% |
| Trust Score | In Progress | 35% |
| Knowledge Graph | In Progress | 30% |
| Evidence Management | In Progress | 25% |
| Network / Connections | Planned | 0% |

---

## Sprint Roadmap

### Sprint 1 — Foundation (Complete)
- Authentication (login / register / session)
- Database schema (Prisma)
- Landing pages (homepage, pricing, features)
- Basic resume builder UI

### Sprint 2 — Resume Builder MVP (Complete)
- 22 professional templates
- Section editors (Experience, Education, Skills, Projects, Certifications)
- AI integration (summary, bullets, ATS optimization)
- Export (PDF / DOCX)
- Auto-save with Zustand persist

### Sprint 3 — Professional Identity & Polish (Complete)
- Dashboard redesign (Overview as Professional Identity command center)
- Trust Score backend pipeline
- Knowledge Graph services
- Identity Pipeline Coordinator
- Evidence storage layer (IndexedDB)

### Sprint 4 — Production Polish (Complete — 2026-08-07)
- Deployment version detection with update banner
- Dashboard breadcrumb navigation
- Dark Elegance template print-safe redesign
- Auto-expand newly added resume items
- Replace browser `alert()` with inline errors
- Print CSS for A4 page-break control

### Sprint 5 — Trust Platform (Current)
- Complete Trust Score UI integration
- Professional Passport preview functionality
- Evidence attachment flow (upload / link / verify)
- Knowledge Graph visualization (basic)

### Sprint 6 — Career Hub Foundation (Planned)
- AuthenticatedLayout and Career Hub navigation
- Widget architecture
- AnalysisReport extraction
- Career Timeline widget (interactive)

---

## Future Milestones

### Short-term (Sprints 5–7)

**Trust & Verification**
- Evidence attachment flow complete
- Trust Score public display
- Verification badges (LinkedIn, GitHub OAuth)
- Email verification for new users

**Resume Builder Enhancements**
- Template color / font picker UI
- Multi-resume management
- Resume version history

**Career Insights**
- Career progression timeline (visual)
- Skill gap analysis

### Mid-term (Sprints 8–12)

**API & Integrations**
- Public API (beta)
- LinkedIn import
- GitHub activity sync
- Certificate provider integrations (Coursera, Udemy)

**Monetization**
- Stripe payment integration
- Professional tier paywall
- Enterprise SSO / SCIM

### Long-term Vision (6–12 months)

- AI career coach (personalized guidance)
- Job board integration (apply with Passport)
- University / employer partnerships
- Mobile apps (iOS / Android)
- Enterprise talent pool management

---

## Production Readiness Gates

Every release must pass six mandatory gates before shipping:

1. **Security & Auth** — route protection, session lifecycle, API authorization
2. **Product Integrity** — no fabricated social proof, no fake verified credentials
3. **Core User Journey** — Home → Pricing → Sign-Up → Dashboard → Builder → Preview → Export (no dead ends)
4. **Communication** — contact / support flow functional or removed
5. **Stability** — metadata, error boundaries, 404, loading states
6. **Core Device Support** — desktop, tablet, mobile (including mobile Builder nav)

Canonical release docs in `patorbit-docs/09_RELEASES/`:
- `Release-Readiness-Checklist.md` (PKS-REL-001)
- `MVP-Launch-Criteria.md` (PKS-REL-002)
- `Known-Issues.md` (PKS-REL-003)

---

## Success Metrics (Target Q3 2026)

| Metric | Target |
|---|---|
| Registered accounts | 10,000 |
| Resumes created | 25,000+ |
| Trust Score adoption | 40% of users verify ≥1 claim |
| Free → Professional conversion | 5% |
| NPS | ≥50 |

---

## Team

**Current team:** Solo founder + AI development assistance  
**Phase:** Bootstrapped MVP → seed fundraising preparation
