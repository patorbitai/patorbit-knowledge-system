# V18 — Interview Preparation

An authenticated workspace at `/interview-preparation` that turns an interview
invitation (or a manually entered role) into a preparation plan, a practice
question bank and a text mock interview with a report.

Everything shown in the UI comes from the database for the signed-in user.
There are no sample companies, fabricated scores or demo histories in the
product code.

## Data model

All five new tables are scoped to `ProfessionalIdentity` and every service
filters by that id, so a client-supplied id alone never grants access.

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
for new rounds.

## Migrations — read this before deploying

`prisma/migrations` upstream is already broken independently of V18: the
migration `20260907010000_add_claim_model_and_evidence_fk` references an
`EvidenceRecord` table that no migration creates, and `UsageRecord` /
`Subscription` are likewise missing from the migration chain. A fresh
`prisma migrate deploy` fails on that migration.

Consequences for this branch:

- The V18 migration (`prisma/migrations/20261126000000_add_interview_preparation/migration.sql`)
  was generated with `prisma migrate diff --from-schema-datamodel … --script`
  and is a pure `CREATE TABLE` addition — it is correct, but it cannot be
  applied on top of a broken chain.
- Locally the schema was applied with `prisma db push --accept-data-loss` so
  the app could run and be screenshotted.

Recommended fix before a real deployment: repair the upstream chain (add a
migration creating `EvidenceRecord`, `UsageRecord` and `Subscription` before
`20260907010000_…`), or baseline the existing production database with
`prisma migrate resolve --applied` and then apply this migration.

## Environment variables

Required (already used by the rest of the app):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Session encryption. Also the secret the mailbox token key is derived from. |
| `NEXTAUTH_URL` | Canonical app URL (OAuth redirect base). |

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
user selects, and stores tokens encrypted. When credentials are absent the UI
shows setup instructions instead of claiming the provider is connected.

## Deployment steps

1. `npm ci`
2. Apply migrations (see the migration note above) — or `prisma db push` for a
   throwaway environment.
3. `npm run build`
4. `npm start` behind the existing reverse proxy; set the four app env vars plus
   whichever optional providers you want live.
5. Configure the OAuth redirect URIs listed above for the deployed origin.
6. Smoke test: sign in → create a profile → import an email → generate a plan →
   start a practice set → finish it → open the report.

## Known limitations

- AI generation is implemented but was **not exercised against a live provider**
  in this environment (no API key was available). Deterministic extraction and
  all non-AI flows were exercised.
- Gmail/Outlook import was **not exercised against live providers** (no OAuth
  credentials). The connect/search/fetch/revoke paths and their state, scope and
  encryption handling are covered by unit tests only.
- Voice interviews are intentionally out of scope; the mock interview is text
  only and says so.
- No arbitrary code execution: the app never runs user or model code.
- The repository-wide `npm run lint` still reports pre-existing errors in
  unrelated files (for example `src/store/resume-builder.ts`); the V18 files
  lint clean.
- `src/utils/__tests__/arvind-pdf-import.test.ts` fails on this machine because
  it reads `D:\Resume\ARVIND ABHAY NARAYAN CHAUHAN.pdf`, which does not exist
  here. That test is unrelated to V18 and predates this branch.
- `npm run test:e2e` (the pre-existing resume/pricing specs, none of which touch
  Interview Preparation) reported 30 passed, 16 failed, 64 did not run. The
  failures come from the suite's shared login helper: the credential POST
  returns 200, but the helper's 15s `waitForURL` expires before the client
  navigation completes in `next dev`. One further failure is the 320px pricing
  comparison-table scroll assertion. Both were observed only on this machine and
  were not compared against a clean baseline checkout.

## Verification results for this branch

- `npx tsc --noEmit` — exit 0.
- `npm run build` — exit 0 (route table includes all `/interview-preparation`
  and `/api/interview/**` routes).
- `npm test` — 213 passed files / 2710 passed tests, with only the two
  `arvind-pdf-import` path failures described above and 4 skipped files.
- Interview-specific suites: 7 files / 87 tests, all passing.
- Targeted eslint over every added or modified V18 file: 0 errors.
- Visual QA: 64 screenshots across 8 screens × 4 viewports × 2 themes, see
  `docs/qa/v18-interview-preparation/VISUAL_QA.md`.
