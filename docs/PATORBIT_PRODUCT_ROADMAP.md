# Patorbit Product Roadmap

Status: Active working document
Last updated: 2026-08-08

---

## Core Mission

> Patorbit helps qualified candidates avoid being overlooked because their experience is poorly represented or poorly matched to an opportunity.

The mission is the single filter for every decision in this roadmap. A feature earns its place only if it increases the probability that a qualified candidate is accurately understood by an opportunity.

## Product Positioning

Patorbit is NOT just an AI resume builder or an ATS score checker.

- Resume building is an input mechanism, not the product.
- ATS score is a vanity metric, not a value proposition.

Patorbit is a **career intelligence platform**: it understands a candidate's evidence, understands an opportunity, and helps the candidate present evidence in a way that an opportunity can recognize. Value is delivered through understanding and matching, not through templates or score numbers.

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

## ROADMAP

## PHASE 0 - FOUNDATION / BETA STABILITY

### Status Note (Repository Evidence)

As of the date of this document, the repository contains only an initial commit with a `.gitignore` and **no application code**. The Phase 0 items below therefore **cannot be marked complete based on repository evidence** in the current state.

Phase 0 scope is treated as the pre-existing product baseline. If and when application code lands in this repository, this table must be re-verified item by item against the actual codebase and updated accordingly.

### Foundation / Beta Stability Checklist

| Item | Status (repo evidence) |
| --- | --- |
| Resume import | Not verifiable - no application code in repository |
| AI resume extraction | Not verifiable - no application code in repository |
| Import review | Not verifiable - no application code in repository |
| Resume builder | Not verifiable - no application code in repository |
| Premium template library | Not verifiable - no application code in repository |
| PDF/DOCX export | Not verifiable - no application code in repository |
| AI optimization | Not verifiable - no application code in repository |
| Authentication | Not verifiable - no application code in repository |
| Rate limiting | Not verifiable - no application code in repository |
| Performance optimization | Not verifiable - no application code in repository |
| Security fixes | Not verifiable - no application code in repository |
| Next.js security upgrade | Not verifiable - no application code in repository |

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

The core engine. Nothing downstream is built before this is genuinely useful.

### M1 - Career Profile Foundation

Create a canonical Career Profile from existing resume data.

- A single structured profile derived from the user's imported/extracted resume data.
- Every field carries **evidence/provenance** - the source item (or absence of a source) is recorded.
- **Never invent candidate information.** Anything not present in the source data is absent from the profile.

Definition of done for the milestone: a Career Profile data model, a build path from existing resume data into the profile, provenance attached to all fields, tests covering provenance and non-invention behavior, TypeScript check, build verification, security/privacy review, commit, push to main, and a short completion report.

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

Every recommendation must be traceable to candidate evidence (see M1 provenance).

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

- Phase 0 is stated as substantially complete (see Phase 0 status note for the current repository evidence caveat).
- The next milestone is: **M1 - Career Profile Foundation**.
- M1 is **not** being implemented at this time; this roadmap document defines the plan only.
