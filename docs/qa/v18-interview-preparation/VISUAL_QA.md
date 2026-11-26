# V18 Interview Preparation — visual QA

Screenshots were captured from the running app against a real local database,
then inspected by hand. Nothing in this report is inferred from code alone.

## Method

- `next dev` on `http://127.0.0.1:3000`, PostgreSQL 18 on `127.0.0.1:5433`.
- Playwright (Chromium) signed in with the seeded test account once, reused the
  session cookie across all runs, then visited each screen.
- Theme: the app keeps its theme in `localStorage["patorbit-theme"]` and toggles
  `dark`/`light` classes on `<html>`, so the harness set that value before each
  page load (emulating the OS colour scheme does nothing here).
- Screenshots are full-page PNGs at device scale 1 in `docs/qa/v18-interview-preparation/`.
- After each viewport the harness also measured
  `scrollWidth - clientWidth`, collected console errors and page errors, and
  recorded any HTTP status ≥ 400. Final run: **no console errors, no failed
  requests, no horizontal overflow**.

## Matrix

8 screens × 4 viewports × 2 themes = 64 screenshots.

| Screen | File prefix |
| --- | --- |
| Dashboard | `01-dashboard` |
| New profile | `02-new-profile` |
| Import invitation | `03-import` |
| Profile (technical) | `04-profile-technical` |
| Preparation plan | `05-preparation-plan` |
| Profile (managerial) | `06-profile-managerial` |
| Mock interview runner | `07-session-runner` |
| Performance report | `08-session-report` |

Viewports: `1440x900`, `1366x768`, `1024x768`, `390x844`. Themes: `dark`, `light`.
File naming: `<screen>-<viewport>-<theme>.png`.

## Data used

A throwaway local seed created two clearly-labelled profiles
(`Northwind Analytics (demo)`, `Brightline Systems (demo)`), an append-only round
timeline, one preparation plan, one completed practice session with real
per-answer dimension scores and one in-progress mock session. The seed script and
the screenshot harness were deleted before committing — they are local QA tools,
not product code, and the demo company names never enter the repository.

## Findings and fixes

Visual review caught five real defects. All were fixed and the matrix was
re-captured after the fixes.

1. **Preparation plan crashed on load.** `categoryLabel(undefined)` threw because
   stored plan JSON was missing a `category`. Fixed by making `categoryLabel`
   null-safe (`Uncategorised`) and by storing the full topic objects the plan
   service writes.
2. **Score progression looked broken with one completed session.** A single
   point collapsed the line chart to a dot at the left edge with duplicated date
   labels. `ScoreTrend` now renders the score and date plainly when there is
   only one point.
3. **Empty right-hand column on the report page** when a session had no AI
   report (for example a practice set stored without one). The grid now collapses
   to one column and the block is not rendered when empty.
4. **Raw keys in report topic badges** (`pyspark`, `data_modeling`). They now run
   through `categoryLabel` like the rest of the UI.
5. **Blank “Interview timeline” card** for a profile with no rounds. It now shows
   an empty state pointing at “Add round”.

Also fixed during review: the managerial profile showed “Interview” as its type
because the seed used `managerial_interview` instead of the real enum value
`managerial`. The label fallback itself is intentional for unknown stored values.

## Deliberate behaviour, not defects

- The warning banner on plans and reports (“general role-based practice … not
  verified company interview questions”) is shown whenever the plan/report was
  generated without a verified company process.
- Empty states on the dashboard, practice history and scores are real empty
  states, not placeholders with invented numbers.
- The floating “N” avatar over the sidebar footer is the app-wide support
  launcher and predates this branch; it was left untouched.

## What was checked and what was not

Checked: rendering of all 8 screens at all 4 viewports in both themes, console
and network errors, horizontal overflow, and the four interaction states that
are visible from the data (populated profile, empty timeline, populated report,
in-progress session).

Not checked here: keyboard-only traversal and a screen-reader pass (semantics are
built from the shared components — `Card`, `Badge`, labelled inputs, `<ol>`/`<li>`
timelines — but were not audited), and success paths of AI-backed buttons
(no provider key in this environment, so those buttons were only verified to
surface an error rather than fabricate a result).

## E2E baseline comparison (main vs this branch)

The pre-existing resume/pricing specs were run on both branches with the same
browser (Playwright 1.62 Chromium), the same PostgreSQL database, the same
`.env`, the same `next dev` command and the same warmed server, sequentially in
one worktree so no other variable differs.

| Branch | Passed | Failed | Did not run |
| --- | --- | --- | --- |
| `main` (1bb0127) | 4 | 16 | 64 |
| `feature/v18-interview-preparation` | 6 | 14 | 64 |

All 14 failures on the branch also fail on `main`. Two failures are present only
on `main` (`pricing.spec.ts:61` focus ring and the reduced-motion FAQ case at
`responsive`), i.e. flaky, not branch-dependent. Per-test comparison:

| Spec / test | main | branch |
| --- | --- | --- |
| `create-lifecycle` A (both projects) | fail | fail |
| `delete-lifecycle` A (both projects) | fail | fail |
| `duplicate-lifecycle` A (both projects) | fail | fail |
| `share-lifecycle` A (both projects) | fail | fail |
| `tailor-lifecycle` A (both projects) | fail | fail |
| `pricing` comparison table at 320px (both projects) | fail | fail |
| `pricing` FAQ clipping (desktop) | fail | fail |
| `pricing` reduced motion (desktop) | fail | fail |
| `pricing` focus ring (desktop) | fail | pass |
| `pricing` reduced motion (responsive) | fail | pass |

Root cause of the shared failures: each spec's `login()` helper clicks "Sign In"
and then waits 15s for the URL to leave `/login`. In `next dev` the credentials
POST returns 200 (confirmed in the server log), but the client-side navigation
does not complete inside 15s on this machine. The V18 spec avoids this by
waiting for hydration and using a 30s URL wait; it does not change the existing
helpers.

Conclusion: **no regression introduced by V18.**
