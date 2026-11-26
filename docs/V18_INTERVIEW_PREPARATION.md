# V18 — Interview Preparation

An authenticated workspace at `/interview-preparation` that turns an interview
invitation (or a manually entered role) into a preparation plan, a practice
question bank and a text mock interview with a report.

Everything shown in the UI comes from the database for the signed-in user.
There are no sample companies, fabricated scores or demo histories in the
product code.

## Data model

Seven new models, all scoped to `ProfessionalIdentity`; every service filters by
that id, so a client-supplied id alone never grants access.

| Model | Purpose |
| --- | --- |
| `InterviewProfile` | Company, role, seniority, JD, required/preferred skills, date + timezone, duration, round name, format, interview type, notes, status, source. |
| `InterviewEmail` | An imported invitation: original content, source type, and the field-level extraction result (value + evidence + confidence + explicit/inferred). |
| `InterviewRound` | Append-only timeline per profile. A completed round is never overwritten. |
| `PreparationPlan` | Validated structured plan (summary, roadmap, topics, questions, sequence) plus a progress percentage derived from completed answers. |
| `PracticeSession` | A practice set or text mock interview: questions, answers with per-answer evaluations, derived overall score, report. |
| `SavedPracticeQuestion` | Questions the user chose to keep, for later drilling. |
| `InterviewEmailConnection` | Read-only mailbox link with AES-GCM encrypted tokens. |

`JobApplication` and `ApplicationEvent` are untouched; linking a profile to an
application reuses its company/role and records an `interview_scheduled` event
for new rounds. Deleting a `User` cascades to `ProfessionalIdentity` and from
there to all seven tables, so account deletion removes interview data.

## Migration history — what was broken and how it is repaired

`prisma/migrations` could not be deployed on **any** database before this
branch. The gaps were:

| Gap | Referenced by |
| --- | --- |
| `EvidenceRecord` table never created | `20260907010000` (ALTER + FK + index), `20260907020000` (FK from `VerificationEvent`) |
| `Subscription` table never created | `20260908000000` (ALTER, trial columns) |
| `UsageRecord` table never created | nothing (used by the app) |
| `User.razorpayCustomerId`, `User.razorpayContactId`, `User.subscriptionTier`, `User.subscriptionStatus`, `User.currentPeriodEnd`, `User.cancelAtPeriodEnd` never added | schema only |
| `ProfessionalIdentity.trustShareToken`, `.trustShareEnabled`, `.trustReportCache`, `.passportShareEnabled`, `.passportDataCache` never added | schema only |

`20260907010000_add_claim_model_and_evidence_fk` was therefore the first hard
failure (`relation "EvidenceRecord" does not exist`). Production databases were
created with `prisma db push`, so they contain all of these objects while their
migration history is incomplete — that is why a naive fresh baseline is unsafe.

The fix is `prisma/migrations/20260907005000_repair_missing_core_tables`, which
sits immediately before the first broken migration and:

- creates `EvidenceRecord` as it existed at that point (claimId `NOT NULL`, no
  FK — the next migration drops the NOT NULL and adds the FK), `Subscription`
  without trial columns (added by `20260908000000`) and `UsageRecord`;
- adds the nine columns and the unique indexes above;
- is **idempotent**: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`,
  `CREATE INDEX IF NOT EXISTS` and constraint creation guarded by
  `pg_constraint` lookups. Running it against a database that already has these
  objects (a `db push` production database) is a no-op instead of an error.

After it, the whole chain applies cleanly and reproduces `schema.prisma`
exactly — verified with
`prisma migrate diff --from-url … --to-schema-datamodel prisma/schema.prisma --exit-code`
returning "empty migration" (exit 0) on a freshly deployed database and on the
production-like database described below.

### Scenario 1 — fresh database (new environment / CI)

```bash
createdb patorbit
DATABASE_URL="postgresql://…/patorbit?schema=public" npx prisma migrate deploy
```

All 25 migrations apply, including the repair and V18. No manual steps.

### Scenario 2 — existing production database (created with `db push`)

Production already contains every table and column, so the historical
migrations must be **recorded**, not executed. Baseline everything before V18,
then deploy:

```bash
# 1. Snapshot first (always): pg_dump -Fc "$DATABASE_URL" > pre-v18.dump
# 2. Mark every migration that predates V18 as already applied.
for name in $(ls prisma/migrations | grep -v '^migration_lock.toml$' | grep -v '^20261126000000_'); do
  npx prisma migrate resolve --applied "$name"
done
# 3. Apply only the new migration.
npx prisma migrate deploy
```

`migrate resolve --applied` writes history rows only; it does not touch data.
Do **not** run the repair migration against such a database by hand — baselining
covers it, and it is idempotent if it does run.

### Scenario 3 — applying the V18 migration itself

`20261126000000_add_interview_preparation` is pure additive DDL: seven
`CREATE TABLE` statements, their indexes and foreign keys. It creates no
defaults on existing tables, drops nothing and backfills nothing. Verified
against a production-like database with rows in `User`, `ProfessionalIdentity`,
`Claim`, `EvidenceRecord`, `UsageRecord`, `Subscription` and `Resume`: row
counts were identical before and after, the seven V18 tables appeared empty, and
the schema had no drift.

Never use `prisma db push --accept-data-loss` as a deployment strategy.

## Environment variables

Required:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Session encryption. Also the secret the mailbox token key is derived from. |
| `NEXTAUTH_URL` | Canonical app URL. Used for OAuth redirect URIs and to derive callback redirects (never the request Host). |

Optional — AI features (plan, questions, evaluation, report, explain):

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google Gemini. |
| `OPENAI_API_KEY` (+ `OPENAI_BASE_URL`, `OPENAI_MODEL` if used) | OpenAI-compatible provider. |

Without an AI key the app still works: email paste/upload extraction falls back
to a deterministic parser, and AI-backed actions surface a clear error instead
of inventing content. Failed AI calls do not consume quota.

Optional — mailbox import (read-only):

| Variable | Purpose |
| --- | --- |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Gmail search + fetch of a single selected message. |
| `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID` | Outlook / Microsoft Graph equivalent. |

### Google (Gmail) setup

1. Google Cloud Console → APIs & Services → Enable **Gmail API**.
2. OAuth consent screen → add scope `https://www.googleapis.com/auth/gmail.readonly`.
3. Credentials → Create OAuth client ID → Web application.
4. Authorised redirect URI: `{NEXTAUTH_URL}/api/interview/connections/google/callback`.
5. Put the id/secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### Microsoft (Outlook) setup

1. Entra ID → App registrations → New registration.
2. Redirect URI (Web): `{NEXTAUTH_URL}/api/interview/connections/microsoft/callback`.
3. API permissions → Microsoft Graph → Delegated → `Mail.Read` → grant consent.
4. Certificates & secrets → new client secret.
5. Set `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `MICROSOFT_TENANT_ID`.

Mailbox import is read-only, user-initiated, fetches only the single message the
user selects, and stores tokens encrypted (AES-256-GCM). Disconnect revokes the
token at Google and always deletes the local copy; Microsoft has no public
revocation endpoint for delegated Graph tokens, so disconnect removes the local
tokens and the user revokes from their account page. When credentials are absent
the UI shows setup instructions instead of claiming the provider is connected.

## Deployment steps

1. `npm ci`
2. Pick the database scenario above (fresh deploy, or baseline + deploy).
3. `npm run build`
4. `npm start` behind the existing reverse proxy.
5. Set the required env vars, plus the optional AI/mailbox ones you want live.
6. Configure the OAuth redirect URIs listed above for the deployed origin.
7. Smoke test: sign in → create a profile → import an email → generate a plan →
   start a practice set → finish it → open the report.

## Known limitations

- AI generation is implemented but was **not exercised against a live provider**
  in this environment (no API key was available). Deterministic extraction and
  all non-AI flows were exercised.
- Gmail/Outlook import was **not exercised against live providers** (no OAuth
  credentials). Connect/search/fetch/revoke paths, state validation and token
  encryption are covered by unit tests only.
- Voice interviews are intentionally out of scope; the mock interview is text
  only and says so.
- No arbitrary code execution: the app never runs user or model code.
- The repository-wide `npm run lint` still reports pre-existing errors in
  unrelated files (for example `src/store/resume-builder.ts`); the V18 files
  lint clean.
- `src/utils/__tests__/arvind-pdf-import.test.ts` fails on this machine because
  it reads a PDF path that only exists on another machine. That test predates
  this branch.
- The pre-existing resume/pricing E2E specs fail identically on `main` (see the
  E2E baseline comparison in `docs/qa/v18-interview-preparation/VISUAL_QA.md`);
  their shared login helper waits for a client navigation that does not finish
  within 15s in `next dev`.

## Verification results for this branch

- `npx tsc --noEmit` — exit 0.
- `npm run build` — exit 0.
- `npm test` — 213 passed files / 2710 passed tests, 4 skipped files / 22
  skipped tests (407s); the only failures are the two `arvind-pdf-import` cases
  above, which read a PDF outside the repository.
- `npm run test:e2e` (full suite, 118 tests, 6 workers) — 19 passed, 30 failed,
  69 did not run. The 69 skipped are the remainder of `test.describe.serial`
  files whose first test failed. 27 of the 30 failures are the shared login
  helper timing out on the post-sign-in redirect; they hit every pre-existing
  spec and reproduce on `main` (see the baseline comparison in
  `docs/qa/v18-interview-preparation/VISUAL_QA.md`). The remaining 3 are the
  known flaky responsive-pricing assertions (`pricing.spec.ts:22` overflow,
  `pricing.spec.ts:97` reduced motion), which V18 does not touch.
- `npx playwright test e2e/interview-preparation.spec.ts --workers=1` — 6
  passed, 2 skipped (both projects), exit 0. The interview spec is only red in
  the full parallel run because it shares the same login helper and starves
  alongside 118 tests on 6 workers.
- Interview suites — 7 files / 87 tests, all passing.
- Targeted eslint over every added or modified V18 file — 0 errors.
- Migration chain — `prisma migrate deploy` succeeds on a fresh database (25/25
  migrations) and on a baselined production-like database, with no schema drift.
- Visual QA — 64 screenshots across 8 screens × 4 viewports × 2 themes, see
  `docs/qa/v18-interview-preparation/VISUAL_QA.md`.
