# Release Plan

**Last Updated:** 2026-08-07  
**Current Version:** 0.1.0  
**Next Milestone:** 0.2.0 (Trust Score MVP)

---

## Versioning Policy

Patorbit follows [Semantic Versioning](https://semver.org/) with pragmatic interpretation for a pre-1.0 product:

- **0.x.0** — Minor: meaningful new user-facing capability shipped (sprint milestone)
- **0.0.x** — Patch: bug fixes, polish, infrastructure changes
- **1.0.0** — Stable: paid tier live, email verification complete, Trust Score publicly accessible

Until 1.0, minor versions can include breaking internal changes (store shape, API contracts) as long as user data is migrated.

---

## Version History

| Version | Name | Date | Status |
|---|---|---|---|
| 0.1.0 | Sprint 4 Polish | 2026-08-07 | ✅ Released |
| 0.0.9 | Auth Polish | 2026-07 | ✅ Released |
| 0.0.8 | Overview Redesign | 2026-07 | ✅ Released |
| 0.0.7 | AI Integration | 2026-06 | ✅ Released |
| 0.0.6 | Trust System Foundation | 2026-06 | ✅ Released |
| 0.0.5 | Templates | 2026-05 | ✅ Released |
| 0.0.4 | Resume Builder Core | 2026-05 | ✅ Released |
| 0.0.3 | Marketing Site | 2026-04 | ✅ Released |
| 0.0.2 | Auth & Database | 2026-03 | ✅ Released |
| 0.0.1 | Project Init | 2026-02 | ✅ Released |

---

## Upcoming Releases

### 0.2.0 — Trust Score MVP

**Target:** Sprint 5 completion (~2026-09)  
**Theme:** Make Trust Score a visible, interactive user feature

**Scope:**

| Item | Backlog ID | Priority |
|---|---|---|
| Trust Score panel live data wiring | T-01 | P0 |
| Evidence attachment upload | T-02 | P0 |
| Trust Score overview widget | T-03 | P0 |
| Passport page live data | P-01 | P0 |
| Claim status badges | T-04 | P1 |
| Evidence list view | T-05 | P1 |
| Email verification | A-01 | P0 |
| Password reset | A-02 | P1 |

**Go/No-Go Criteria:**
- [ ] Users can upload at least one piece of evidence and see it linked to a claim
- [ ] Trust Score displays on overview and `/trust` page with real data
- [ ] Email verification sends successfully in production

---

### 0.3.0 — Multi-Resume & Template Customization

**Target:** Sprint 6 (~2026-10)  
**Theme:** Power user resume management

> **Note (2026-08-15):** the template customization half of this milestone shipped early as part of the resume-builder release-readiness work (R-02 / R-03 below).

**Scope:**

| Item | Backlog ID | Priority | Status |
|---|---|---|---|
| Multi-resume support | R-01 | P1 | Store-level infrastructure exists (`resumes` + `activeResumeId`); full UI polish pending |
| Template color picker UI | R-02 | P1 | ✅ **Completed early** — `ResumeStyleConfig` colors (accent/heading/body presets) |
| Template font picker UI | R-03 | P1 | ✅ **Completed early** — curated font family/size/line-height controls |
| Passport QR code + public URL | P-03, P-04 | P1 | Pending |
| Resume version history | R-04 | P2 | Pending |
| Error monitoring (Sentry) | I-04 | P1 | Pending |
| API rate limiting on `/api/ai` | I-03 | P1 | Pending (open finding in `docs/SECURITY_AUDIT.md` H-1) |

**Go/No-Go Criteria:**
- [ ] Users can create and switch between multiple resumes
- [x] Template color + font selectable in UI without code changes (done)
- [ ] Passport shareable via public link

---

### 0.4.0 — Monetization

**Target:** Sprint 7 (~2026-11)  
**Theme:** Paid tier launch

**Scope:**

| Item | Backlog ID | Priority |
|---|---|---|
| Stripe subscription checkout | M-01 | P1 |
| Subscription management page | M-02 | P1 |
| Feature gating (Professional limits) | M-03 | P1 |
| AI usage metering | M-04 | P1 |
| Billing portal | M-06 | P2 |
| Resume data DB sync (multi-device) | I-01 | P1 |
| S3/Cloudinary evidence storage | I-02 | P1 |

**Go/No-Go Criteria:**
- [ ] Professional tier checkout works end-to-end in production
- [ ] Free tier users see correct feature limits
- [ ] Paying user data persists across devices
- [ ] No critical billing bugs in staging for 48h before release

---

### 1.0.0 — Public Launch

**Target:** Q1 2027 (estimate)  
**Theme:** Production-stable, monetized, differentiating features live

**Requirements for 1.0:**
- [ ] Email verification mandatory for new accounts
- [ ] Password reset flow functional
- [ ] Professional tier payment live and working
- [ ] Trust Score publicly shareable (Passport public URL)
- [ ] Evidence upload works in production (S3, not IndexedDB)
- [ ] Error monitoring active (Sentry)
- [ ] Analytics active (PostHog or Plausible)
- [ ] Mobile resume builder usable (not broken)
- [ ] Zero P0 known issues
- [ ] Lighthouse performance score ≥ 80 on key pages

---

## Deployment Process

All releases deploy automatically via Vercel Git integration on push to `main`.

**Pre-release Checklist:**
1. Run `npm run build` locally — zero TypeScript errors
2. Run `npx prisma generate` — no schema drift
3. Verify environment variables in Vercel dashboard (add any new ones)
4. Check Vercel preview deployment passes
5. Review CHANGELOG entry is accurate
6. Merge to `main` → Vercel auto-deploys to production

**Rollback Process:**  
Vercel maintains deployment history. To roll back: Vercel Dashboard → Deployments → select previous → Promote to Production. Takes ~60 seconds.

**Database Migrations:**  
Run `npx prisma migrate deploy` manually via Vercel shell or local connection before promoting any deployment that includes schema changes.

---

## Feature Flags

Currently no feature flag system is implemented. Strategy:

- **Pre-1.0:** Merge only when ready. Feature branches stay off `main` until shippable.
- **Post-1.0:** Consider implementing a lightweight flag system (GrowthBook or custom) when A/B testing or staged rollouts are needed.

---

## Dependency Version Policy

- Lock all production dependencies to exact versions in `package.json`
- Update dependencies intentionally, not via `npm update` globally
- Test after any major dependency upgrade (especially Next.js, Prisma, NextAuth, OpenAI SDK)
- Never upgrade Next.js without reading `/node_modules/next/dist/docs/` for breaking changes (per `AGENTS.md`)
