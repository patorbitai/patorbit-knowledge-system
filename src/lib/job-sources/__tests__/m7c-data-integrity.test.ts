"use strict";

/**
 * M7C — data integrity tests: source-feed identity, normalization
 * idempotence, fingerprint regressions, feed-scoped dedup, and static
 * checks on the additive provenance schema/migration.
 *
 * ZERO live API calls: everything here is pure or filesystem-only.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  JOB_SOURCES,
  SOURCE_KINDS,
  SourceAdapterError,
  buildSourceFeedKey,
} from "@/lib/job-sources";
import {
  canonicalUrlKey,
  companyKey,
  indicatesRemote,
  locationKey,
  normalizeCompanyName,
  normalizeDescriptionText,
  normalizeEmploymentType,
  normalizeLocation,
  parseSourceTimestamp,
  titleKey,
} from "@/lib/job-sources/normalize";
import {
  contentHash,
  decideDedupe,
  fingerprintPosting,
  fingerprintText,
  type ExistingJob,
} from "@/lib/job-sources/dedupe";
import type { NormalizedPosting } from "@/lib/job-sources/types";

/* ── Feed identity (§3) ─────────────────────────────────────────────────── */

describe("buildSourceFeedKey — deterministic source/feed identity", () => {
  it("names the exact board-scoped feed per source", () => {
    expect(buildSourceFeedKey("greenhouse", "acme")).toBe("greenhouse:acme");
    expect(buildSourceFeedKey("lever", "acmecorp")).toBe("lever:acmecorp");
    expect(buildSourceFeedKey("ashby", "acme")).toBe("ashby:acme");
  });

  it("treats Arbeitnow as ONE global corpus — a page number is not a feed", () => {
    expect(buildSourceFeedKey("arbeitnow")).toBe("arbeitnow:global");
    expect(buildSourceFeedKey("arbeitnow", null)).toBe("arbeitnow:global");
    // Even a stray board-ish value can never split the global corpus.
    expect(buildSourceFeedKey("arbeitnow", "page-2")).toBe("arbeitnow:global");
  });

  it("board A and board B are distinct feeds for every board-scoped source", () => {
    for (const kind of ["greenhouse", "lever", "ashby"] as const) {
      expect(buildSourceFeedKey(kind, "board-a")).not.toBe(
        buildSourceFeedKey(kind, "board-b"),
      );
    }
  });

  it("preserves case verbatim — the key identifies the exact path fetched", () => {
    expect(buildSourceFeedKey("greenhouse", "Acme")).toBe("greenhouse:Acme");
    expect(buildSourceFeedKey("greenhouse", "Acme")).not.toBe(
      buildSourceFeedKey("greenhouse", "acme"),
    );
  });

  it("throws (never fabricates identity) for unknown sources", () => {
    expect(() => buildSourceFeedKey("linkedin")).toThrowError(SourceAdapterError);
    expect(() => buildSourceFeedKey("")).toThrowError(SourceAdapterError);
  });

  it.each(["", "../etc", "a/b", "a b", "%2e%2e", "a".repeat(65), "acme corp"])(
    "throws before any I/O for invalid board identifier %j",
    (board) => {
      expect(() => buildSourceFeedKey("greenhouse", board)).toThrowError(
        SourceAdapterError,
      );
      expect(() => buildSourceFeedKey("lever", board)).toThrowError(
        SourceAdapterError,
      );
    },
  );

  it("documented feed policies: only single-response feeds can self-complete", () => {
    expect(JOB_SOURCES.greenhouse.feedPolicy).toBe("single_response");
    expect(JOB_SOURCES.lever.feedPolicy).toBe("single_response");
    expect(JOB_SOURCES.ashby.feedPolicy).toBe("single_response");
    expect(JOB_SOURCES.arbeitnow.feedPolicy).toBe("paginated");
  });

  it("every source documents its feed-identity semantics", () => {
    for (const kind of SOURCE_KINDS) {
      expect(JOB_SOURCES[kind].feedIdentityNote.length).toBeGreaterThan(20);
    }
    expect(JOB_SOURCES.arbeitnow.feedIdentityNote).toContain("global");
  });
});

/* ── Normalization (§5) ─────────────────────────────────────────────────── */

describe("normalization is deterministic and idempotent", () => {
  const COMPANY_INPUTS = [
    "  Acme   Corp  ",
    "ACME\tCORP",
    "acme corp",
    "Acme&nbsp;Corp",
    "  <b>Acme</b> Corp ",
    "München  GmbH",
    "A".repeat(300),
  ];
  const LOCATION_INPUTS = [
    "  New   York, NY ",
    "NEW YORK",
    "Remote - US",
    "Zürich,  Switzerland",
    "New\nYork",
  ];
  const DESCRIPTION_INPUTS = [
    "<p>Build&nbsp;things   daily.</p>",
    "Build things daily.",
    "BUILD   THINGS\NDAILY.",
    "<script>alert('x')</script><p>Safe   text  here.</p>",
    "Entities: &lt;not&gt; tags &amp; more",
    "   ",
  ];

  it("normalizeCompanyName(normalizeCompanyName(x)) === normalizeCompanyName(x)", () => {
    for (const input of COMPANY_INPUTS) {
      const once = normalizeCompanyName(input);
      expect(normalizeCompanyName(once)).toBe(once);
    }
  });

  it("normalizeLocation is idempotent", () => {
    for (const input of LOCATION_INPUTS) {
      const once = normalizeLocation(input);
      expect(normalizeLocation(once)).toBe(once);
    }
  });

  it("normalizeDescriptionText is idempotent (HTML/entity/whitespace inputs)", () => {
    for (const input of DESCRIPTION_INPUTS) {
      const once = normalizeDescriptionText(input);
      expect(normalizeDescriptionText(once)).toBe(once);
    }
  });

  it("employment-type normalization is idempotent and stable", () => {
    for (const raw of ["Full-time", "part time", "Contract", "INTERNSHIP", "full_time"]) {
      const once = normalizeEmploymentType(raw);
      if (once !== null) expect(normalizeEmploymentType(once)).toBe(once);
    }
    expect(normalizeEmploymentType("Full-time")).toBe("full_time");
    expect(normalizeEmploymentType("???")).toBeNull();
  });

  it("dedup keys are idempotent (comparison keys, never stored destinations)", () => {
    for (const input of COMPANY_INPUTS) {
      const once = companyKey(input);
      expect(companyKey(once)).toBe(once);
    }
    for (const input of LOCATION_INPUTS) {
      const once = locationKey(input);
      expect(locationKey(once)).toBe(once);
    }
    for (const input of ["Sr. Backend  Engineer", "Backend Engineer (Senior)"]) {
      const once = titleKey(input);
      expect(titleKey(once)).toBe(once);
    }
  });

  it("canonicalUrlKey never rewrites stored URLs and is idempotent", () => {
    const url = "https://Example.COM:443/jobs/1?utm_source=x&keep=1#frag";
    const key = canonicalUrlKey(url);
    expect(key).toBe("example.com/jobs/1?keep=1");
    // Deterministic: same input ⇒ same key, and the scheme-less key
    // re-canonicalizes to itself (idempotent comparison identity).
    expect(canonicalUrlKey(url)).toBe(key);
    expect(canonicalUrlKey(`https://${key as string}`)).toBe(key);
    // The input string itself is untouched (callers store verbatim).
    expect(url).toBe("https://Example.COM:443/jobs/1?utm_source=x&keep=1#frag");
  });

  it("remote detection is deterministic", () => {
    for (const input of ["Remote", "remote - US", "New York", "", null]) {
      expect(indicatesRemote(input)).toBe(indicatesRemote(input));
    }
    expect(indicatesRemote("Remote")).toBe(true);
  });

  it("timestamp parsing is deterministic and idempotent over its own output", () => {
    for (const input of [
      "2026-09-25T00:00:00Z",
      "2026-09-25T00:00:00.000Z",
      1758758400,
      1758758400000,
      "not-a-date",
      "",
    ]) {
      const once = parseSourceTimestamp(input);
      expect(parseSourceTimestamp(input)).toBe(once);
      if (once !== null) expect(parseSourceTimestamp(once)).toBe(once);
    }
  });
});

/* ── Fingerprint regressions (§6) ───────────────────────────────────────── */

function sample(over: Partial<NormalizedPosting> = {}): NormalizedPosting {
  return {
    sourceKind: "greenhouse",
    externalId: "9001",
    sourceUrl: "https://job-boards.greenhouse.io/acme/jobs/9001",
    applyUrl: "https://job-boards.greenhouse.io/acme/jobs/9001",
    title: "Data Engineer",
    companyName: "Acme Corp",
    locationRaw: "New York",
    remote: false,
    employmentType: null,
    salaryRaw: null,
    descriptionText:
      "Own and operate reliable data pipelines across regions and clouds for the platform team.",
    postedAt: "2026-09-25T00:00:00.000Z",
    validThrough: null,
    raw: {},
    ...over,
  };
}

describe("fingerprint stability regressions (§6)", () => {
  it("same posting ⇒ same fingerprint", () => {
    expect(fingerprintPosting(sample())).toBe(fingerprintPosting(sample()));
  });

  it("whitespace variation ⇒ same fingerprint", () => {
    const noisy = sample({
      title: "  Data   Engineer ",
      companyName: " Acme    Corp",
      descriptionText:
        "Own   and operate\n reliable data pipelines   across regions and clouds for the platform team.",
    });
    expect(fingerprintPosting(noisy)).toBe(fingerprintPosting(sample()));
  });

  it("harmless formatting variation (markup vs plain, casing) ⇒ same fingerprint", () => {
    const formatted = sample({
      title: "DATA ENGINEER",
      descriptionText:
        "<p>Own and operate reliable data pipelines across regions and clouds for the platform team.</p>",
    });
    expect(fingerprintPosting(formatted)).toBe(fingerprintPosting(sample()));
  });

  it("materially different descriptions ⇒ different fingerprint", () => {
    const different = sample({
      descriptionText:
        "Lead our payments platform migration to a new ledger architecture while mentoring engineers across the org.",
    });
    expect(fingerprintPosting(different)).not.toBe(fingerprintPosting(sample()));
  });

  it("different company ⇒ different fingerprint (never a shared identity)", () => {
    const otherCompany = sample({ companyName: "Globex Inc" });
    expect(fingerprintPosting(otherCompany)).not.toBe(fingerprintPosting(sample()));
  });

  it("volatile fields are OUTSIDE the fingerprint: source, feed, ids, urls, dates", () => {
    const twin = sample({
      sourceKind: "lever",
      externalId: "totally-different-id",
      sourceUrl: "https://jobs.lever.co/other/uuid-1",
      applyUrl: "https://jobs.lever.co/other/uuid-1/apply",
      postedAt: "2026-01-01T00:00:00.000Z",
      raw: { anything: true },
    });
    // Content identity is cross-source by design (same company/title/
    // location/description ⇒ same content), provenance stays on the row.
    expect(fingerprintPosting(twin)).toBe(fingerprintPosting(sample()));
    expect(fingerprintText(twin.descriptionText)).toBe(
      fingerprintText(sample().descriptionText),
    );
  });

  it("contentHash: deterministic, whitespace-insensitive, 64-hex", () => {
    expect(contentHash("Same   Text")).toBe(contentHash("same text"));
    expect(contentHash("Same Text")).not.toBe(contentHash("Different Text"));
    expect(contentHash("Same Text")).toMatch(/^[0-9a-f]{64}$/);
  });
});

/* ── Feed-scoped dedup (§4) ─────────────────────────────────────────────── */

describe("signal 1 is feed-scoped (same externalId on different feeds never collides)", () => {
  const candidate: NormalizedPosting = sample({ sourceFeedKey: "greenhouse:board-a" });
  const existing = (feedKey: string | undefined, externalId = "9001"): ExistingJob => ({
    jobId: "job-existing",
    companyKey: companyKey("Acme Corp"),
    titleKey: titleKey("Some Other Role"),
    locationKey: locationKey("London, UK"),
    fingerprintHash: "0".repeat(64),
    descriptionLength: 120,
    postings: [
      {
        sourceKind: "greenhouse",
        sourceFeedKey: feedKey,
        externalId,
        canonicalUrlKey: null,
      },
    ],
  });

  it("same source + same feed + same externalId ⇒ merge (signal 1)", () => {
    const decision = decideDedupe(candidate, [existing("greenhouse:board-a")]);
    expect(decision).toEqual({
      action: "merge",
      jobId: "job-existing",
      signal: "source_external_id",
    });
  });

  it("same source + same externalId but DIFFERENT feed ⇒ never signal 1", () => {
    const decision = decideDedupe(candidate, [existing("greenhouse:board-b")]);
    expect(decision.action).not.toBe("merge");
    expect(decision.action).toBe("new"); // no other signal matches either
  });

  it("adapter-level views without provenance still match each other (M7A compat)", () => {
    const noProvenance = sample();
    expect(noProvenance.sourceFeedKey).toBeUndefined();
    const decision = decideDedupe(noProvenance, [
      {
        jobId: "job-compat",
        companyKey: companyKey("Acme Corp"),
        titleKey: titleKey("Data Engineer"),
        locationKey: locationKey("New York"),
        fingerprintHash: "0".repeat(64),
        descriptionLength: 120,
        postings: [
          {
            sourceKind: "greenhouse",
            sourceFeedKey: undefined,
            externalId: "9001",
            canonicalUrlKey: null,
          },
        ],
      },
    ]);
    // Titles differ, so only signal 1 (both sides lacking feed keys) can hit.
    expect(decision).toEqual({
      action: "merge",
      jobId: "job-compat",
      signal: "source_external_id",
    });
  });

  it("different companies never merge even with identical feed identity", () => {
    const impostor: NormalizedPosting = sample({
      companyName: "Evil Corp",
      sourceFeedKey: "greenhouse:board-a",
    });
    const sameFeedJob: ExistingJob = {
      jobId: "job-acme",
      companyKey: companyKey("Acme Corp"),
      titleKey: titleKey("Data Engineer"),
      locationKey: locationKey("New York"),
      fingerprintHash: fingerprintPosting(sample()),
      descriptionLength: 100,
      postings: [
        {
          sourceKind: "greenhouse",
          sourceFeedKey: "greenhouse:board-a",
          externalId: "9001",
          canonicalUrlKey: null,
        },
      ],
    };
    expect(decideDedupe(impostor, [sameFeedJob])).toEqual({ action: "new" });
  });
});

/* ── Schema & migration static checks (§20 SCHEMA, §22 MIGRATION RULE) ─── */

describe("additive provenance schema + unapplied migration", () => {
  const schema = readFileSync(
    path.join(process.cwd(), "prisma", "schema.prisma"),
    "utf8",
  );
  const migrationPath = path.join(
    process.cwd(),
    "prisma",
    "migrations",
    "20261001000000_add_source_feed_provenance",
    "migration.sql",
  );
  const migration = readFileSync(migrationPath, "utf8");

  it("JobPosting carries source/feed provenance and absence evidence columns", () => {
    const posting = schema.slice(
      schema.indexOf("model JobPosting {"),
      schema.indexOf("model JobSourceObservation {"),
    );
    expect(posting).toContain("sourceFeedKey   String");
    expect(posting).toContain("applyUrl        String");
    expect(posting).toContain("lastConfirmedAt DateTime?");
    expect(posting).toContain("absentConsecutiveChecks Int @default(0)");
    expect(posting).toContain(
      "@@unique([sourceKind, sourceFeedKey, externalId])",
    );
    // The old feed-blind unique key must be gone (cross-feed collision fix).
    expect(posting).not.toContain("@@unique([sourceKind, externalId])");
    expect(posting).toContain("@@index([sourceKind, sourceFeedKey])");
  });

  it("JobSourceObservation records which feed was checked, when, and how complete", () => {
    expect(schema).toContain("model JobSourceObservation {");
    expect(schema).toMatch(/sourceFeedKey\s+String/);
    expect(schema).toMatch(/complete\s+Boolean/);
    expect(schema).toMatch(/presentExternalIds\s+String\[\]/);
    expect(schema).toMatch(/skippedCount\s+Int\s+@default\(0\)/);
  });

  it("the canonical Job model keeps its first-seen convenience applyUrl", () => {
    const job = schema.slice(
      schema.indexOf("model Job {"),
      schema.indexOf("model JobPosting {"),
    );
    expect(job).toContain("applyUrl");
    expect(job).toContain("fingerprintHash");
    expect(job).toContain("lastConfirmedAt");
  });

  it("the M7C migration is additive: no destructive operations", () => {
    expect(migration).not.toMatch(/DROP TABLE/i);
    expect(migration).not.toMatch(/TRUNCATE/i);
    expect(migration).not.toMatch(/DELETE FROM/i);
    expect(migration).not.toMatch(/ALTER TABLE "Job" /i);
    expect(migration).not.toMatch(/ALTER TABLE "JobPosting" DROP COLUMN/i);
  });

  it("the M7C migration creates the observation table and feed-scoped unique index", () => {
    expect(migration).toContain('CREATE TABLE "JobSourceObservation"');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "JobPosting_sourceKind_sourceFeedKey_externalId_key"',
    );
    expect(migration).toContain('DROP INDEX "JobPosting_sourceKind_externalId_key"');
    expect(migration).toContain('ADD COLUMN "sourceFeedKey" TEXT NOT NULL');
    expect(migration).toContain('ADD COLUMN "applyUrl" TEXT NOT NULL');
    expect(migration).toContain('ADD COLUMN "absentConsecutiveChecks" INTEGER NOT NULL DEFAULT 0');
  });
});
