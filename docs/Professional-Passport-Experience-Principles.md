# Professional Passport Experience Principles

**Status:** Proposed — pending founder approval
**Date:** 2026-08-04
**Related:** ADR-003 (Identity-Centric Model), ADR-004 (Identity Hub), PKS-SRS-PIP-1

---

## North Star

**Patorbit is building the trust layer for professional identity.** Every feature — resume builder, claims, evidence, passport, trust, knowledge graph — serves one identity. The Professional Passport is its visible, recruiter-facing representation.

## What the Passport Is

The visible representation of a **continuously evolving Professional Identity**. It answers, at a glance: who this person is, what they have demonstrated, and why that information should be trusted.

## What the Passport Is Not

- **Not a resume.** A resume lists roles and responsibilities. The Passport shows claims and the proof behind them.
- **Not LinkedIn.** LinkedIn is self-reported career history. The Passport explains *why* each piece of information deserves trust.
- **Not an evidence repository.** Evidence lives behind the scenes. The Passport shows only the trust signal that evidence produces.

## The Three Questions

Every section — present or future — must answer exactly one of:

1. **Who is this professional?**
2. **What have they demonstrated?**
3. **Why should this information be trusted?**

Any information that improves none of these three answers does not belong in the Passport. This is the feature-creep guardrail.

## The Differentiator: Explainability

The magic is not the claim. It is:

> **"I can explain why this information deserves trust."**

A resume says "Built a payment platform." LinkedIn says "Built a payment platform." The Passport says:

```
Claim: Built payment platform
  ↓ Evidence: GitHub · Architecture doc · Performance review
  ↓ Trust: Supported
```

The claim is one sentence; the *explainability* is the chain from claim → evidence → trust. That chain is what makes the Passport hard to copy.

## Information Hierarchy (30-Second Scan)

A recruiter scanning for 30 seconds should follow one path:

1. **Identity** — name, title, location, one-line summary. *Who.*
2. **Career Snapshot / Journey** — what they do, and the arc of how they got here. *Demonstrated.*
3. **Trust** — why this is believable, in plain language. *Trust.*
4. **Strongest Proof (hero)** — the single most compelling claim and its evidence. *The story they remember.*
5. **Professional Highlights** — top supported claims that corroborate the hero.

## Recruiter-First Design Principles

- **30-second scan.** The first screen answers who / what / why immediately.
- **Story over list.** Recruiters remember stories, not bullet points.
- **One hero proof.** Surface the single strongest claim; a list of five equally-weighted items is forgettable.
- **Hierarchy over equality.** Not everything deserves the same visual weight.
- **Drillable trust.** Every "why trust" signal can be expanded to the underlying evidence.
- **No overload.** Fewer, more meaningful sections beat exhaustive ones.

## Honesty Principles

- Never imply external verification that does not exist.
- Beta vocabulary: **Supported**, **Supported by Evidence**, **Evidence Coverage**. Never use **Verified** unless genuine external verification exists.
- Never fabricate data. Missing information renders a helpful empty state.
- Bad inference is worse than no inference. If a derived value (e.g., career focus) is uncertain, omit it.

## Identity-First Architecture

The Passport is the terminal view of an identity-centric stack:

```
Professional Identity
  → Career Journey      (first-class object)
  → Claims              (derived assertions)
  → Evidence            (support for claims)
  → Trust               (signal derived from claims + evidence)
  → Passport            (visible representation)
```

The resume is **one input source** to the identity, not its container. The Career Journey is a first-class object, not a UI section.

## Design Vocabulary (Beta)

| Use                     | Never Use               |
|-------------------------|-------------------------|
| Supported Claim         | Verified Claim          |
| Supported by Evidence   | Officially Verified     |
| Evidence Coverage       | Certified Trust         |
| Needs Evidence          | Unverified              |
| Professional Trust      | Trust Score (as label)  |
