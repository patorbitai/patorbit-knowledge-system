# Patorbit Project Master Roadmap

**Last Updated:** 2026-08-07  
**Version:** 0.1.0  
**Status:** Active Development (Sprint 4 Complete)

---

## Project Vision

**Patorbit** is building the world's first **Professional Identity Platform** — transforming the resume from a static document into a dynamic, verifiable, AI-powered career passport.

### Mission

Enable professionals to **own, verify, and leverage their career data** through:
- AI-powered resume creation and optimization
- Verifiable professional credentials (Trust Score)
- Knowledge graphs connecting skills, experience, and evidence
- A unified Professional Passport that replaces traditional CVs

### The Problem We Solve

1. **Resumes are static and unverifiable** — employers can't trust what they read
2. **Professional achievements are scattered** — LinkedIn, GitHub, certificates, projects all disconnected
3. **Career data is siloed** — no single source of truth for your professional identity
4. **Job matching is broken** — keyword filters miss qualified candidates

### Our Solution

A **three-layer platform**:

1. **Resume Builder** (MVP) — AI-powered resume creation with 22 professional templates
2. **Professional Passport** — Verified credential aggregation with Trust Score
3. **Career Intelligence** — Knowledge graphs, AI insights, and career progression tracking

---

## Current Project Status

### Production Status

✅ **DEPLOYED TO PRODUCTION**  
- Platform: Vercel  
- URL: [Production URL]  
- Database: PostgreSQL (Vercel Postgres)  
- Authentication: NextAuth.js with credentials provider  
- Status: Live, accepting users

### Completion Overview

| Module | Status | Completion | Notes |
|---|---|---|---|
| **Authentication** | ✅ Deployed | 100% | Email/password, session management, protected routes |
| **Landing Website** | ✅ Deployed | 95% | Homepage, pricing, platform, features, legal pages |
| **Resume Builder** | ✅ Deployed | 90% | 22 templates, AI assistance, export (PDF/DOCX) |
| **Dashboard (Overview)** | ✅ Deployed | 85% | Professional Identity hub, widget system |
| **Pricing** | ✅ Deployed | 100% | 3-tier model (Starter free, Professional $29/mo, Enterprise) |
| **Career Passport** | 🚧 In Progress | 40% | UI complete, verification pipeline WIP |
| **Trust Score** | 🚧 In Progress | 35% | Core pipeline built, UI integration pending |
| **Knowledge Graph** | 🚧 In Progress | 30% | Backend services ready, visualization pending |
| **AI Copilot** | ✅ Deployed | 75% | Resume analysis, ATS optimization, tone improvement |
| **Evidence Management** | 🚧 In Progress | 25% | Storage layer ready, attachment flow pending |
| **Network/Connections** | 📋 Planned | 0% | Not started |
| **Settings** | ✅ Deployed | 60% | Basic profile, preferences stubbed |

**Overall Project Completion: ~65%**

---

## Architecture Overview

### Tech Stack

**Frontend**
- **Framework:** Next.js 16.2.12 (App Router, React 19, Turbopack)
- **Styling:** Tailwind CSS 4 (custom design system)
- **State:** Zustand 5 (with persist middleware)
- **Animation:** Framer Motion 12
- **UI Components:** Lucide React icons, custom component library

**Backend**
- **API:** Next.js API Routes (REST)
- **Auth:** NextAuth.js 4.24 with Prisma adapter
- **Database:** PostgreSQL (Prisma ORM 6.19)
- **AI:** OpenAI GPT-4 (via OpenAI SDK 6.49)

**Infrastructure**
- **Deployment:** Vercel (production + preview)
- **Database:** Vercel Postgres
- **Storage:** IndexedDB (client-side evidence attachments via idb-keyval)
- **CI/CD:** Vercel Git integration (auto-deploy on push to main)

**Testing**
- **Unit:** Vitest 4.1
- **E2E:** Playwright 1.62
- **Performance:** Lighthouse 13.4

### Major Modules

#### 1. Authentication System
- **Status:** ✅ Production-ready
- **Features:**
  - Email/password registration with bcryptjs hashing
  - NextAuth.js session management (JWT strategy)
  - Protected routes via middleware
  - Automatic redirect flows (login ↔ overview)
- **Routes:** `/login`, `/register`, `/api/auth/[...nextauth]`

#### 2. Resume Builder
- **Status:** ✅ Core complete, polish ongoing
- **Features:**
  - 22 professional templates (Executive, Modern Clean, Creative, ATS-optimized)
  - Real-time editor with sections: Experience, Education, Skills, Projects, Certifications, Languages, Achievements
  - AI assistance: summary generation, bullet point improvement, ATS optimization
  - Export: PDF (html2canvas), DOCX (server-side via `/api/export-docx`)
  - Zustand state with localStorage persistence (`patorbit-resume-v2`)
  - Auto-save (2s debounce)
  - Live preview with template switcher
- **Routes:** `/resume-builder`, `/resume-builder/preview`
- **State:** `src/store/resume-builder.ts`
- **Templates:** 22 total (IDs: `modern-clean`, `executive`, `split-vibrant`, etc.)

#### 3. Dashboard (Overview)
- **Status:** ✅ Redesigned in Sprint 3, deployed
- **Concept:** Professional Identity command center
- **Widgets:**
  - Resume Health (ATS score, completion)
  - Trust Score (verification status)
  - Career Timeline (experience visualization)
  - Recent Activity
  - Quick Actions (Resume Builder, Add Evidence, View Passport)
- **Route:** `/overview`

#### 4. Professional Passport
- **Status:** 🚧 UI scaffolded, verification pipeline in development
- **Concept:** Unified credential viewer with Trust Score badge
- **Planned Features:**
  - Single-page professional summary
  - Verified claims with evidence badges
  - QR code for sharing
  - Exportable as PDF
- **Route:** `/passport`

#### 5. Trust Score System
- **Status:** 🚧 Backend pipeline built, UI integration partial
- **Architecture:**
  - Identity Pipeline Coordinator (orchestrates claim → evidence → graph flow)
  - Graph Service (knowledge graph management)
  - Trust Service (scoring algorithm)
  - Evidence storage (IndexedDB for large attachments)
- **Scoring Factors:**
  - Claim verification coverage
  - Evidence strength (document types, recency)
  - Credential authority (issuer reputation)
  - Activity recency
- **Files:** `src/services/identity-pipeline-coordinator.ts`, `src/services/trust-service.ts`

#### 6. AI Copilot
- **Status:** ✅ Integrated into Resume Builder
- **Endpoint:** `/api/ai` (unified action dispatcher)
- **Functions:**
  - `generateSummary` — professional summary from resume
  - `rewrite` — improve grammar/clarity with tone control
  - `improveTone` — enhance professionalism
  - `atsOptimization` — keyword optimization for ATS
  - `improveBulletPoints` — rewrite achievement bullets
  - `generateAchievements` — create bullets from experience
  - `generateProjects` — write project descriptions
  - `suggestSkills` — recommend missing skills
  - `analyzeResume` — full ATS/grammar/readability analysis
  - `analyzeJobMatch` — compare resume vs. job description
  - `generateClaims` — suggest verifiable claims (Trust pipeline)
- **Provider:** OpenAI GPT-4 (configurable in `src/lib/ai/provider.ts`)
- **Client:** `src/lib/ai/client.ts`

#### 7. Landing Website (Marketing)
- **Status:** ✅ Complete, deployed
- **Pages:**
  - `/` — Homepage with hero, benefits, social proof
  - `/pricing` — 3-tier pricing table (Starter/Professional/Enterprise)
  - `/platform` — Feature deep-dive with timeline
  - `/solutions` — Use cases by audience
  - `/features`, `/about`, `/contact`, `/careers`
  - Legal: `/privacy`, `/terms`, `/security`, `/compliance`
- **Design:** Glassmorphism, dark theme, cyan/blue accent palette

---

## Completed Milestones

### Sprint 1: Foundation (Complete)
- ✅ Authentication system (login/register)
- ✅ Database schema (Prisma)
- ✅ Landing pages (homepage, pricing, features)
- ✅ Basic resume builder UI

### Sprint 2: Resume Builder MVP (Complete)
- ✅ Template system (22 templates)
- ✅ Section editors (Experience, Education, Skills, etc.)
- ✅ AI integration (summary, bullets, ATS)
- ✅ Export (PDF/DOCX)
- ✅ Auto-save with Zustand persist

### Sprint 3: Professional Identity & Polish (Complete)
- ✅ Dashboard redesign (Overview as command center)
- ✅ Trust Score backend pipeline
- ✅ Knowledge Graph services
- ✅ Identity Pipeline Coordinator
- ✅ Evidence storage layer (IndexedDB)

### Sprint 4: Production Polish (Complete — 2026-08-07)
- ✅ Deployment version detection with update banner
- ✅ Timeline vertical alignment fix
- ✅ Dashboard breadcrumb navigation
- ✅ Misleading "Cloud Synced" label replaced with "Saved locally"
- ✅ Duplicate localStorage autosave removed
- ✅ Dark Elegance template print-safe redesign (white background)
- ✅ Auto-expand newly added items (UX improvement)
- ✅ Remove hover scale jitter from inputs
- ✅ Replace browser `alert()` with inline errors
- ✅ Fix stale localStorage key in dead code
- ✅ Add proper print CSS for A4 page-break control

---

## Sprint Timeline

### Current Sprint: Sprint 5 (Planning)

**Focus Areas (Proposed):**
- Complete Trust Score UI integration
- Professional Passport preview functionality
- Evidence attachment flow (upload/link/verify)
- Knowledge Graph visualization (basic)

### Next Sprint: Sprint 6 (Estimated)

**Proposed Objectives:**
- Career Timeline widget (interactive)
- ATS job matching improvements
- Template customization (colors/fonts in UI)
- Mobile responsiveness pass

---

## Future Roadmap

### Short-term (Sprints 5-7)

**Trust & Verification**
- Complete evidence attachment flow
- Launch Trust Score public display
- Add verification badges (LinkedIn, GitHub OAuth)
- Email verification for new users

**Resume Builder Enhancements**
- Template color/font picker UI
- Multi-resume management
- Resume version history
- Collaborative editing (share for feedback)

**Career Insights**
- Career progression timeline (visual)
- Skill gap analysis
- Salary benchmarking (via integrations)

### Mid-term (Sprints 8-12)

**API & Integrations**
- Public API (beta)
- LinkedIn import
- GitHub activity sync
- Certificate provider integrations (Coursera, Udemy, etc.)

**Monetization**
- Stripe payment integration
- Professional tier paywall
- Enterprise SSO/SCIM

**Network Features**
- Professional connections
- Endorsements
- Recommendations

### Long-term Vision (6-12 months)

**Platform Expansion**
- AI career coach (personalized guidance)
- Job board integration (apply with Passport)
- University/employer partnerships
- Mobile apps (iOS/Android)
- Blockchain verification (optional)

**Enterprise Features**
- Talent pool management
- Bulk verification
- Custom branding
- Analytics dashboard

---

## Technical Debt

### Known Limitations

1. **PDF Export Quality**
   - Uses html2canvas (pixel-based) — produces large files, poor text selection
   - **Fix:** Replace with layout-aware PDF renderer (pdfmake, Puppeteer)
   - **Priority:** P1

2. **No Multi-Resume Support**
   - Users can only have one resume (localStorage key conflict)
   - **Fix:** Add resume list to Zustand, persist array of resumes
   - **Priority:** P2

3. **Evidence Storage Scalability**
   - IndexedDB for attachments works locally but not synced
   - **Fix:** S3/Cloudinary for production evidence storage
   - **Priority:** P1

4. **No Real-Time Collaboration**
   - Single-user editing only
   - **Fix:** WebSocket or CRDT for multi-user editing
   - **Priority:** P3

5. **Limited Mobile Support**
   - Resume Builder UI not optimized for mobile
   - **Fix:** Responsive design pass, mobile-first section nav
   - **Priority:** P2

6. **No Email Verification**
   - Users can register with any email
   - **Fix:** Add email verification flow (send token, verify link)
   - **Priority:** P1

### Build/Infrastructure Issues

- **Prisma DLL lock on Windows** — occasionally requires `taskkill //F //IM node.exe` during dev
- **CSS validation warnings** — Firefox orphans/widows property support (informational, non-breaking)

---

## Immediate Priorities

### P0 (Critical)
1. Complete Trust Score UI integration
2. Evidence attachment flow (upload)
3. Email verification

### P1 (High)
1. Professional Passport export (PDF)
2. Multi-resume management
3. Template customization UI
4. Mobile responsiveness

### P2 (Medium)
1. Knowledge Graph visualization
2. Career Timeline interactivity
3. Salary benchmarking integration
4. API documentation

### P3 (Low)
1. Real-time collaboration
2. Blockchain verification
3. Mobile apps

---

## Success Metrics (Target Q3 2026)

- **Users:** 10,000 registered accounts
- **Resumes Created:** 25,000+
- **Trust Score Adoption:** 40% of users verify ≥1 claim
- **Paid Conversions:** 5% free → Professional tier
- **NPS Score:** ≥50

---

## Team & Resources

**Current Team:** Solo founder + AI development assistance  
**Phase:** Bootstrapped MVP → seed fundraising preparation  
**Burn Rate:** Minimal (Vercel free tier, OpenAI credits)

---

## Conclusion

Patorbit is **65% complete** toward a production-ready MVP. Sprint 4 delivered critical polish for the Resume Builder and established production deployment infrastructure. Sprint 5 will focus on **Trust Score UI integration** and **Professional Passport functionality** — the differentiating features that transform Patorbit from "another resume builder" into a **Professional Identity Platform**.

The roadmap balances **shipping fast** (Resume Builder is live and monetizable) with **building moats** (Trust Score + Knowledge Graph create defensible competitive advantages).

Next milestone: **Launch Professional tier paywall** (Sprint 6-7) to validate monetization before scaling user acquisition.
