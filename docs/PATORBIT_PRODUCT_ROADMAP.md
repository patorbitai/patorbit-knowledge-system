# Patorbit Product Roadmap

**Last Updated:** 2026-08-16  
**Version:** 2.1.0  
**Status:** Active — Career Intelligence (Phase 1); identity/trust direction documented in [MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md)

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

## Core Mission

> Patorbit helps qualified candidates avoid being overlooked because their experience is poorly represented or poorly matched to an opportunity.

The mission is the single filter for every decision in this roadmap. A feature earns its place only if it increases the probability that a qualified candidate is accurately understood by an opportunity.

## Product Positioning

Patorbit is NOT just an AI resume builder or an ATS score checker.

- Resume building is an input mechanism, not the product.
- ATS score is a vanity metric, not a value proposition.

Patorbit is a **career intelligence platform**: it understands a candidate's evidence, understands an opportunity, and helps the candidate present evidence in a way that an opportunity can recognize. Value is delivered through understanding and matching, not through templates or score numbers.

The **resume remains the presentation layer**; the **Career Profile becomes the derived professional evidence** that the system reasons over. **Evidence and provenance are fundamental** — nothing is shown without a traceable source, and **AI must never fabricate candidate facts**.

### Long-Term Product Shape

```
Career Intelligence
  -> Job Understanding
    -> Qualification Match
      -> Evidence-Based Application Optimization
        -> Application Outcomes
          -> Career Memory (feeds back into Career Intelligence)
```

Each stage informs the next. Outcomes feed back so that the system's understanding of both the candidate and the job market improves over time.

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

## Master Architecture & Current vs. Future

**Canonical current-vs-future direction:** [MASTER_ARCHITECTURE.md](./MASTER_ARCHITECTURE.md)

That document is the single project-direction reference for:

- the product principle that **resume content ≠ verified truth** (editing a resume never silently rewrites historical verified evidence),
- the **claim / evidence / verification / conflict / trust** models and their current-vs-future status,
- the **Patorbit Network** (trusted issuer integrations) and scalable verification levels L0–L3,
- the **resume import** and **A4 pagination** architectures as currently implemented,
- the identity/trust **6-phase roadmap** (Stabilize Builder → Evidence + Provenance → Verification Engine → Professional Passport → Issuer Network → Patorbit Platform).

This file's roadmap below remains the **career-intelligence** delivery plan; the identity/trust roadmap in the Master Architecture document is the **verification** delivery plan. They are complementary, not competing.

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

## ROADMAP

## PHASE 0 - FOUNDATION / BETA STABILITY

### Status Note (Repository Evidence)

The application codebase is present in this repository (Resume Builder, import pipeline, AI optimization, Trust Score, Knowledge Graph, evidence management, and more — see Current State below). Phase 0 scope below is treated as the pre-existing product baseline and is tracked against the actual codebase.

### Foundation / Beta Stability Checklist

| Item | Status (repo evidence) |
| --- | --- |
| Resume import | Deployed (import pipeline in codebase) |
| AI resume extraction | Deployed (AI optimization / extraction system) |
| Import review | Implemented |
| Resume builder | Deployed (29 templates, section editors, visual gallery, live customization, Professional Preview) |
| Premium template library | Deployed (expanded template library) |
| PDF/DOCX export | Implemented (print-based export) |
| AI optimization | Deployed (AI optimization system) |
| Authentication | Deployed (login / register / session) |
| Rate limiting | Implemented |
| Performance optimization | Implemented |
| Security fixes | Implemented (ongoing, see Security tracking) |
| Next.js security upgrade | Implemented (Next.js 16.3.0) |

### Remaining Security / Deprecation Tracking

Tracked separately as an ongoing, non-blocking queue. Items are promoted to blockers **only** if the codebase proves them to be (e.g., a flagged dependency that is actually exercised by shipped code, or a confirmed exploitable path).

- Dependency deprecations and CVEs (advisory-level, track not act)
- Node.js / Next.js EOL and upgrade windows
- Authentication and rate-limiting hardening review
- Secrets handling and env-config hygiene
- PII storage and retention review
- Open redirect and SSRF review of any import/export URL handling
- Third-party service deprecations (template rendering, document conversion, storage)

Rule: do not hold up Phase 1 work on advisory-level items. Only codebase-proven issues block.

---

## PHASE 1 - CAREER INTELLIGENCE

The core engine. Nothing downstream is built before this is genuinely useful. The milestone sequence is unambiguous: **M1 → M2 → M3 → M4 → M5**, in strict order, one milestone at a time (see MILESTONE RULE).

### M1 - Career Profile Foundation

Create a canonical Career Profile from existing resume data.

- A single structured profile derived from the user's imported/extracted resume data.
- Every field carries **evidence/provenance** - the source item (or absence of a source) is recorded.
- **Never invent candidate information.** Anything not present in the source data is absent from the profile.

The Career Profile is **derived state**: it is rebuilt deterministically from the canonical Resume (the editable source) plus available Claims/Evidence. Provenance does not equal verification; nothing is automatically treated as independently verified.

**Status: IMPLEMENTED and verified in `ff22c3d`** — data model, deterministic builder, provenance on all fields, tests covering provenance and non-invention behavior, TypeScript check, build verification, and security/privacy review are complete.

### M2 - Job Understanding Engine

Understand a job description structurally:

- requirements
- responsibilities
- skills
- seniority
- domain
- qualifications
- implicit competencies (skills/behaviors not literally stated but implied by context)

Output is a structured Job Profile. No matching happens inside this milestone; it only produces the Job Profile.

### M3 - Qualification Match

Compare the Career Profile against the Job Profile.

Classify every piece of candidate evidence against the job's requirements:

- `PROVEN` - evidence directly demonstrates the requirement
- `RELATED` - evidence is adjacent but not direct
- `MISSING` - no evidence exists
- `COMMUNICATION GAP` - evidence likely exists but is not represented in the application

**Constraints:**

- Do not reduce matching to keyword matching. Matching is semantic/contextual and evidence-based.
- Do not promise ATS bypass.
- Do not promise guaranteed interviews.

### M4 - Evidence-Based Application Optimizer

Improve resume/application content using actual candidate evidence only.

- Rewrites and reorders content based on what the candidate has actually done.
- Surfaces `COMMUNICATION GAP` items as opportunities to represent existing evidence better.

**Never fabricate:**

- skills
- employers
- dates
- achievements
- metrics
- qualifications

Evidence-based optimization must never invent experience or qualifications. Every recommendation must be traceable to candidate evidence (see M1 provenance).

### M5 - Application Outcome Feedback Loop

Track the full lifecycle:

```
Job -> Match -> Resume version -> Application -> Interview -> Outcome
```

Use outcomes to improve career recommendations over time. This is the seed of Career Memory. Outcomes must not be used to fabricate or exaggerate candidate claims; they improve the quality of understanding and recommendation only.

---

## PHASE 2 - CUSTOMER ACQUISITION

Build an automated acquisition funnel around the core problem:

> "Are you qualified but being overlooked?"

**Do not build this before the core Career Intelligence engine is sufficiently useful.** Acquisition without a useful engine converts nobody.

### Free Entry Product (Proposed)

Resume + Job Description analysis: input a resume and a job description, receive a qualification/communication gap analysis for free.

### Funnel

```
Traffic -> Free analysis -> Identify qualification/communication gaps
  -> Useful result -> Account creation -> Tailored application -> Pro conversion
```

### Funnel Components

- **SEO**: content and landing structure targeting qualification- and ATS-anxiety search intent
- **Landing pages**: problem-focused pages ("Are you qualified but being overlooked?")
- **Free analysis**: the entry product described above
- **Conversion points**: account creation, tailored application, Pro upgrade
- **Referral/share potential**: shareable analysis results and gap summaries
- **Analytics**: funnel measurement from traffic to conversion

---

## PHASE 3 - CAREER PLATFORM

Longer-term, only after Phases 1 and 2 are real:

- application tracking
- interview intelligence
- career analytics
- career planning
- career memory
- subscription / Pro features

Career Memory closes the loop begun in M5: accumulated, evidence-based knowledge of the candidate's career and the job market, driving better Career Intelligence over time.

---

## Current State

**Overall completion: ~75%** (as of C55.1, 2026-09-03); Phase 1 M1 implemented; Job Application Workspace complete.

| Module | Status | Completion |
|---|---|---|
| Authentication | Deployed | 100% |
| Landing Website | Deployed | 100% (C52 rewrite — accurate positioning) |
| Resume Builder | Deployed | 95% (32 templates, 7 layouts, tailoring, import/export) |
| Dashboard / Solutions | Deployed | 95% (C54 `/solutions` home, C55 applications section) |
| Professional Identity | Deployed | 90% (C48 full editor in Settings, onboarding, resume seeding) |
| Job Tailoring (AI) | Deployed | 90% (C33/C33.2 server-authoritative, Gemini, trust safeguards) |
| Job Application Workspace | Deployed | 85% (C55/C55.1 persistent applications with tailoring integration) |
| AI Provider (Gemini) | Deployed | 95% (C33.3 primary provider, C38 verified) |
| Pricing | Deployed | 100% |
| AI Copilot | Deployed | 80% (section-level AI actions, tailoring, analysis) |
| Settings | Deployed | 85% (C48 full PI editor) |
| Templates | Deployed | 90% (C40-C40.2 structural diversification, C47 discovery audit) |
| Export (PDF/DOCX) | Deployed | 90% (A4 parity, style config) |
| Sharing | Deployed | 85% (public share URLs, owner controls) |
| Career Passport | In Progress | 40% |
| Trust Score | In Progress | 35% |
| Knowledge Graph | In Progress | 30% |
| Evidence Management | In Progress | 25% |
| Career Profile (M1) | Implemented | 100% |
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

## PRODUCT PRINCIPLES

1. **Evidence over invention.** Never fabricate anything about a candidate.
2. **Career intelligence over template quantity.** Understanding beats feature count.
3. **Explain recommendations.** Every recommendation must say why.
4. **Do not promise ATS bypass or guaranteed interviews.**
5. **Semantic/contextual matching over simple keyword stuffing.**
6. **Reuse existing architecture before creating duplicate systems.**
7. **Small independently testable milestones.**
8. **Do not build future phases prematurely.**
9. **Every milestone must preserve existing functionality.**
10. **Security and user privacy are mandatory.** PII is protected end to end.
11. **Do not add features merely because competitors have them.**
12. **Prioritize features that improve the chance that a qualified candidate is accurately understood.**

---

## DEFINITION OF DONE

Every milestone must include, in order:

1. Architecture review
2. Implementation plan
3. Scoped implementation
4. Tests
5. TypeScript check
6. Build verification where appropriate
7. Security/privacy review
8. Git commit
9. Push to main
10. Short completion report

A milestone is not done until all ten items are complete.

---

## MILESTONE RULE

- **Only ONE milestone may be actively implemented at a time.**
- Do not automatically continue to the next milestone.
- After completing a milestone, **stop** and report:
  - what changed
  - what was tested
  - known issues
  - remaining work
  - recommended next milestone

---

## CURRENT POSITION

- Phase 0 (Foundation / Beta Stability) is complete.
- **M1 - Career Profile Foundation** implemented and verified.
- **C33-C33.3** — AI provider migration to Gemini complete; server-authoritative tailoring with trust/factuality safeguards.
- **C35-C36.1** — Professional Identity architecture: PI as canonical source, resume seeding, server-authoritative creation.
- **C40-C40.2** — Template system redesign: 32 templates, 7 genuine structural layouts.
- **C42-C43** — Dashboard and Builder UX improvements.
- **C44-C44.1** — End-to-end product readiness; rendering error fix.
- **C48** — Professional Identity full editor in Settings.
- **C50-C52** — Product differentiation audit; landing page rewrite (accurate positioning).
- **C53** — Product hardening and end-to-end validation.
- **C54-C54.1** — Authenticated home at `/solutions`; `/overview` redirect cleanup.
- **C55-C55.1** — Job Application Workspace with tailoring integration.
- The next development focus should be **product development based on user value**, not another audit cycle.
- The forward sequence for Phase 1 is: **M1 ✅ → M2 → M3 → M4 → M5**, followed by Phase 2 (Customer Acquisition) and Phase 3 (Career Platform).

---

## Team

**Current team:** Solo founder + AI development assistance  
**Phase:** Bootstrapped MVP → seed fundraising preparation
