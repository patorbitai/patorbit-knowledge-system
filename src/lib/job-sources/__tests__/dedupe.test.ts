"use strict";

/**
 * M7A tests — fingerprint stability (H), cross-source deduplication (I),
 * different-company non-merge (J), conservative soft-key behavior (K),
 * deterministic repeated results (Q).
 */

import { describe, expect, it } from "vitest";
import {
  FINGERPRINT_MIN_DESCRIPTION_CHARS,
  contentHash,
  decideDedupe,
  fingerprintPosting,
  postingFingerprint,
  toExistingJobView,
  type ExistingJob,
} from "@/lib/job-sources/dedupe";
import { greenhouseAdapter } from "@/lib/job-sources/adapters/greenhouse";
import { leverAdapter } from "@/lib/job-sources/adapters/lever";
import { arbeitnowAdapter } from "@/lib/job-sources/adapters/arbeitnow";
import type { NormalizedPosting } from "@/lib/job-sources/types";

import greenhouseFixture from "./fixtures/greenhouse-jobs.json";
import leverFixture from "./fixtures/lever-postings.json";
import arbeitnowFixture from "./fixtures/arbeitnow-feed.json";

const GH_CONTEXT = { companyName: "Acme Test Labs" };

function ghJob(): ExistingJob {
  const { postings } = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT);
  return toExistingJobView("job-gh", postings[0]);
}

/** Same posting, materially different description + different source URL. */
function rivalJob(overrides: Partial<NormalizedPosting> = {}): NormalizedPosting {
  return {
    sourceKind: "arbeitnow",
    externalId: "other-id",
    sourceUrl: "https://www.arbeitnow.com/job/other",
    applyUrl: "https://www.arbeitnow.com/job/other",
    title: "Data Engineer",
    companyName: "Acme Test Labs",
    locationRaw: "Berlin, Germany",
    remote: false,
    employmentType: "full_time",
    salaryRaw: null,
    descriptionText:
      "Completely different responsibilities that describe another role entirely with unique wording and scope.",
    postedAt: null,
    validThrough: null,
    raw: {},
    ...overrides,
  };
}

describe("fingerprint stability (H)", () => {
  const base = {
    companyName: "Acme Test Labs",
    title: "Senior Backend Engineer",
    location: "London, UK",
    description: "Build reliable APIs with PostgreSQL and TypeScript.",
  };

  it("identical normalized postings produce the same fingerprint", () => {
    expect(postingFingerprint(base)).toBe(postingFingerprint({ ...base }));
    expect(postingFingerprint(base)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("insignificant whitespace/case/formatting changes keep the fingerprint", () => {
    const messy = {
      companyName: "  ACME   test LABS  ",
      title: "senior   backend   engineer",
      location: " london,   uk ",
      description: "  Build   reliable APIs\n\nwith PostgreSQL  and TypeScript. ",
    };
    expect(postingFingerprint(messy)).toBe(postingFingerprint(base));
  });

  it("materially different descriptions change the fingerprint", () => {
    const other = {
      ...base,
      description: "Build reliable APIs with MySQL and Python.",
    };
    expect(postingFingerprint(other)).not.toBe(postingFingerprint(base));
  });

  it("different companies never share a fingerprint even when title/description match", () => {
    const otherCompany = { ...base, companyName: "Evil Corp" };
    expect(postingFingerprint(otherCompany)).not.toBe(postingFingerprint(base));
  });

  it("location differences change the fingerprint", () => {
    expect(postingFingerprint({ ...base, location: "Berlin, Germany" })).not.toBe(
      postingFingerprint(base),
    );
  });

  it("contentHash is deterministic over normalized descriptions", () => {
    expect(contentHash("Same   Text")).toBe(contentHash("same text"));
    expect(contentHash("Same Text")).not.toBe(contentHash("Different Text"));
    expect(contentHash("Same Text")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("cross-source deduplication (I)", () => {
  it("merges the same job seen from Greenhouse and Arbeitnow via fingerprint", () => {
    const gh = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT).postings[0];
    const an = arbeitnowAdapter.parseList(arbeitnowFixture).postings[0];

    // Same company/title/location/description text, different source + URL.
    expect(fingerprintPosting(gh)).toBe(fingerprintPosting(an));

    const decision = decideDedupe(an, [toExistingJobView("job-1", gh)]);
    expect(decision).toEqual({ action: "merge", jobId: "job-1", signal: "fingerprint" });
  });

  it("merges identical sourceKind + externalId (signal 1 first)", () => {
    const { postings } = leverAdapter.parseList(leverFixture, GH_CONTEXT);
    const [firstSighting, , repeatSighting] = postings;
    const decision = decideDedupe(repeatSighting, [
      toExistingJobView("job-lever", firstSighting),
    ]);
    expect(decision).toEqual({
      action: "merge",
      jobId: "job-lever",
      signal: "source_external_id",
    });
  });

  it("merges equal canonical URLs across tracking variants (signal 2)", () => {
    const existing = ghJob();
    const twin: NormalizedPosting = {
      ...rivalJob({
        sourceKind: "lever",
        externalId: "totally-different-id",
        title: "Senior Backend Engineer",
        locationRaw: "London, UK",
        descriptionText:
          "A completely different description body with its own wording and responsibilities listed here.",
      }),
      sourceUrl:
        "https://job-boards.greenhouse.io/acme/jobs/900001?utm_source=some-other-feed",
      applyUrl: "https://job-boards.greenhouse.io/acme/jobs/900001",
    };
    // Re-key company/title so only the URL signal can match.
    const keyed: ExistingJob = { ...existing };
    const decision = decideDedupe(twin, [keyed]);
    expect(decision).toEqual({ action: "merge", jobId: "job-gh", signal: "canonical_url" });
  });

  it("keeps one Job per duplicate sighting without discarding postings", () => {
    const { postings } = leverAdapter.parseList(leverFixture, GH_CONTEXT);
    const existing = [toExistingJobView("job-1", postings[0])];
    const second = decideDedupe(postings[2], existing);
    expect(second.action).toBe("merge");
    // The caller links the extra posting to the same Job — source records
    // accumulate on the Job rather than being replaced.
    expect(existing).toHaveLength(1);
  });
});

describe("different-company non-merge (J)", () => {
  it("never merges postings from different companies, even on identical content", () => {
    const gh = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT).postings[0];
    const impostor: NormalizedPosting = {
      ...gh,
      sourceKind: "arbeitnow",
      externalId: "impostor-1",
      sourceUrl: "https://www.arbeitnow.com/job/impostor",
      applyUrl: "https://www.arbeitnow.com/job/impostor",
      companyName: "Evil Corp",
    };
    // Identical title/location/description → fingerprint differs by company…
    expect(fingerprintPosting(impostor)).not.toBe(fingerprintPosting(gh));
    // …and the hard guard blocks every signal anyway.
    const decision = decideDedupe(impostor, [toExistingJobView("job-gh", gh)]);
    expect(decision).toEqual({ action: "new" });
  });

  it("blocks even an exact externalId match when companies conflict", () => {
    const gh = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT).postings[0];
    const impostor: NormalizedPosting = {
      ...gh,
      companyName: "Different Company Ltd",
    };
    const decision = decideDedupe(impostor, [toExistingJobView("job-gh", gh)]);
    expect(decision).toEqual({ action: "new" });
  });
});

describe("conservative soft-key behavior (K)", () => {
  it("reports a possible duplicate but NEVER merges on soft key alone", () => {
    const existing = ghJob();
    const softTwin = rivalJob({
      title: "Senior Backend Engineer",
      locationRaw: "London, UK",
      descriptionText:
        "A rival posting of the same role with genuinely different wording, scope, and phrasing that cannot fingerprint-match.",
    });
    const decision = decideDedupe(softTwin, [existing]);
    expect(decision.action).toBe("possible_duplicate");
    if (decision.action === "possible_duplicate") {
      expect(decision.signal).toBe("soft_key");
      expect(decision.candidateJobIds).toEqual(["job-gh"]);
    }
  });

  it("lists every soft-key candidate when several match", () => {
    const existing = ghJob();
    const rival: ExistingJob = {
      ...ghJob(),
      jobId: "job-rival",
      fingerprintHash: "different-hash",
    };
    const softTwin = rivalJob({
      title: "Senior Backend Engineer",
      locationRaw: "London, UK",
      descriptionText:
        "A rival posting of the same role with genuinely different wording, scope, and phrasing that cannot fingerprint-match.",
    });
    const decision = decideDedupe(softTwin, [existing, rival]);
    expect(decision.action).toBe("possible_duplicate");
    if (decision.action === "possible_duplicate") {
      expect(decision.candidateJobIds.sort()).toEqual(["job-gh", "job-rival"]);
    }
  });

  it("does not soft-key match when location differs", () => {
    const decision = decideDedupe(
      rivalJob({ title: "Senior Backend Engineer", locationRaw: "Berlin, Germany" }),
      [ghJob()],
    );
    expect(decision).toEqual({ action: "new" });
  });

  it("does not soft-key match when location is unknown on either side", () => {
    const decision = decideDedupe(
      rivalJob({ title: "Senior Backend Engineer", locationRaw: null }),
      [ghJob()],
    );
    expect(decision).toEqual({ action: "new" });
  });

  it("never fingerprint-merges descriptions below the substance threshold", () => {
    expect(FINGERPRINT_MIN_DESCRIPTION_CHARS).toBeGreaterThan(0);
    const thinExisting = toExistingJobView(
      "job-thin",
      rivalJob({ descriptionText: "Short blurb." }),
    );
    const thinTwin = rivalJob({
      sourceKind: "lever",
      externalId: "thin-twin",
      sourceUrl: "https://jobs.lever.co/acme/thin-twin",
      applyUrl: "https://jobs.lever.co/acme/thin-twin",
      descriptionText: "Short blurb.",
    });
    const decision = decideDedupe(thinTwin, [thinExisting]);
    // Same company/title/location but no substantive description → soft-key
    // candidate only, never a merge.
    expect(decision.action).toBe("possible_duplicate");
  });

  it("returns 'new' when nothing matches at all", () => {
    const decision = decideDedupe(rivalJob(), [ghJob()]);
    expect(decision).toEqual({ action: "new" });
  });

  it("returns 'new' when there are no existing jobs", () => {
    const gh = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT).postings[0];
    expect(decideDedupe(gh, [])).toEqual({ action: "new" });
  });
});

describe("deterministic repeated decisions (Q)", () => {
  it("same candidate + same existing list ⇒ identical decision", () => {
    const gh = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT).postings[0];
    const an = arbeitnowAdapter.parseList(arbeitnowFixture).postings[0];
    const existing = [toExistingJobView("job-1", gh)];
    const a = decideDedupe(an, existing);
    const b = decideDedupe(an, existing);
    expect(a).toEqual(b);
    expect(a).toEqual({ action: "merge", jobId: "job-1", signal: "fingerprint" });
  });
});
