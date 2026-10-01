"use strict";

/**
 * M7A tests — adapter parsing (A), missing source dates (M), malformed
 * upstream data (O), deterministic repeated results (Q), request URL
 * construction for all four sources. Fixtures only — no live APIs.
 */

import { describe, expect, it } from "vitest";
import { SourceAdapterError } from "@/lib/job-sources/types";
import {
  GREENHOUSE_KIND,
  greenhouseAdapter,
} from "@/lib/job-sources/adapters/greenhouse";
import { LEVER_KIND, leverAdapter } from "@/lib/job-sources/adapters/lever";
import { ASHBY_KIND, ashbyAdapter } from "@/lib/job-sources/adapters/ashby";
import {
  ARBEITNOW_KIND,
  arbeitnowAdapter,
} from "@/lib/job-sources/adapters/arbeitnow";

import greenhouseFixture from "./fixtures/greenhouse-jobs.json";
import greenhouseAfterRemoval from "./fixtures/greenhouse-jobs-after-removal.json";
import leverFixture from "./fixtures/lever-postings.json";
import ashbyFixture from "./fixtures/ashby-jobs.json";
import arbeitnowFixture from "./fixtures/arbeitnow-feed.json";

const GH_CONTEXT = { companyName: "Acme Test Labs" };

describe("greenhouse adapter", () => {
  it("builds the official Job Board API URL and requires a board", () => {
    const url = greenhouseAdapter.buildListRequest({ board: "acme" });
    expect(url.toString()).toBe(
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true",
    );
    expect(() => greenhouseAdapter.buildListRequest({})).toThrow(SourceAdapterError);
    expect(() => greenhouseAdapter.buildListRequest({ board: "  " })).toThrow(
      SourceAdapterError,
    );
    expect(
      greenhouseAdapter.buildListRequest({ board: "a/b" }).toString(),
    ).toContain("a%2Fb");
  });

  it("parses valid rows and skips malformed ones with reasons", () => {
    const result = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT);
    expect(result.postings).toHaveLength(2);
    expect(result.skipped).toHaveLength(2);
    const reasons = result.skipped.map((s) => s.reason);
    expect(reasons).toContain("missing_external_id");
    expect(reasons).toContain("missing_or_insecure_url");
  });

  it("maps documented fields without inventing absent ones", () => {
    const { postings } = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT);
    const [first, second] = postings;

    expect(first.sourceKind).toBe(GREENHOUSE_KIND);
    expect(first.externalId).toBe("900001");
    expect(first.title).toBe("Senior Backend Engineer");
    expect(first.companyName).toBe("Acme Test Labs");
    expect(first.locationRaw).toBe("London, UK");
    expect(first.remote).toBe(false);
    // Destination untouched: tracking params remain on the stored URL.
    expect(first.sourceUrl).toContain("utm_source=feed");
    expect(first.applyUrl).toBe(first.sourceUrl);
    // first_published preferred over updated_at.
    expect(first.postedAt).toBe("2026-09-01T10:00:00.000Z");
    expect(first.salaryRaw).toBeNull();
    expect(first.employmentType).toBeNull();
    expect(first.validThrough).toBeNull();
    expect(first.descriptionText).toContain("PostgreSQL");
    expect(first.descriptionText).not.toContain("<");
    expect(first.raw).toHaveProperty("departments");

    // Missing date falls back to updated_at; remote location detected.
    expect(second.postedAt).toBe("2026-08-20T12:30:00.000Z");
    expect(second.remote).toBe(true);
    expect(second.locationRaw).toBe("Remote - US");
  });

  it("leaves company empty when no parse context is supplied", () => {
    const { postings } = greenhouseAdapter.parseList(greenhouseFixture);
    expect(postings[0].companyName).toBe("");
  });

  it("represents source removal as feed absence (closed fixture)", () => {
    const before = greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT);
    const after = greenhouseAdapter.parseList(greenhouseAfterRemoval, GH_CONTEXT);
    const beforeIds = before.postings.map((p) => p.externalId);
    const afterIds = after.postings.map((p) => p.externalId);
    expect(beforeIds).toContain("900001");
    expect(afterIds).not.toContain("900001");
  });

  it("handles structurally wrong payloads without throwing", () => {
    expect(greenhouseAdapter.parseList(null).skipped[0].reason).toBe(
      "payload_not_an_object",
    );
    expect(greenhouseAdapter.parseList("nope").skipped[0].reason).toBe(
      "payload_not_an_object",
    );
    expect(greenhouseAdapter.parseList({ jobs: "not-an-array" }).skipped[0].reason).toBe(
      "missing_jobs_array",
    );
    expect(greenhouseAdapter.parseList([]).skipped[0].reason).toBe(
      "payload_not_an_object",
    );
  });

  it("is deterministic across repeated parses (Q)", () => {
    const a = JSON.stringify(greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT));
    const b = JSON.stringify(greenhouseAdapter.parseList(greenhouseFixture, GH_CONTEXT));
    expect(a).toBe(b);
  });
});

describe("lever adapter", () => {
  it("builds the official postings URL and requires an organization", () => {
    expect(leverAdapter.buildListRequest({ board: "acme" }).toString()).toBe(
      "https://api.lever.co/v0/postings/acme?mode=json",
    );
    expect(() => leverAdapter.buildListRequest({})).toThrow(SourceAdapterError);
  });

  it("parses rows, keeps the duplicate sighting, skips malformed rows", () => {
    const result = leverAdapter.parseList(leverFixture, GH_CONTEXT);
    expect(result.postings).toHaveLength(3);
    expect(result.skipped).toHaveLength(3);
    const reasons = result.skipped.map((s) => s.reason);
    expect(reasons).toContain("missing_external_id");
    expect(reasons).toContain("missing_or_insecure_url");
    expect(reasons).toContain("not_an_object");
    // Duplicate id survives parsing; dedupe decides how to merge it.
    const ids = result.postings.map((p) => p.externalId);
    expect(ids.filter((id) => id === "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d")).toHaveLength(2);
  });

  it("maps commitment, workplace, dates and leaves absent fields null", () => {
    const { postings } = leverAdapter.parseList(leverFixture, GH_CONTEXT);
    const [fullTime, contract] = postings;

    expect(fullTime.employmentType).toBe("full_time");
    expect(fullTime.locationRaw).toBe("Berlin, Germany");
    expect(fullTime.remote).toBe(false);
    expect(fullTime.postedAt).toBe(new Date(1789430400000).toISOString());
    expect(fullTime.salaryRaw).toBeNull();
    expect(fullTime.validThrough).toBeNull();
    expect(fullTime.sourceUrl).toBe(
      "https://jobs.lever.co/acme/a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    );
    expect(fullTime.applyUrl).toContain("ref=patorbit-test"); // destination untouched

    expect(contract.employmentType).toBe("contract");
    expect(contract.locationRaw).toBeNull(); // source omitted location
    expect(contract.remote).toBe(true); // workplaceType "remote"
    expect(contract.descriptionText).toContain("accessible web interfaces");
    expect(contract.descriptionText).not.toContain("<");
  });

  it("rejects non-array payloads", () => {
    expect(leverAdapter.parseList({ jobs: [] }).skipped[0].reason).toBe(
      "payload_not_an_array",
    );
    expect(leverAdapter.parseList(null).skipped[0].reason).toBe("payload_not_an_array");
  });

  it("is deterministic across repeated parses (Q)", () => {
    const a = JSON.stringify(leverAdapter.parseList(leverFixture, GH_CONTEXT));
    const b = JSON.stringify(leverAdapter.parseList(leverFixture, GH_CONTEXT));
    expect(a).toBe(b);
  });
});

describe("ashby adapter", () => {
  it("builds the official job board URL and requires a board", () => {
    expect(ashbyAdapter.buildListRequest({ board: "acme" }).toString()).toBe(
      "https://api.ashbyhq.com/posting-api/job-board/acme",
    );
    expect(() => ashbyAdapter.buildListRequest({})).toThrow(SourceAdapterError);
  });

  it("parses rows, joins multiple locations, skips missing id/URL rows", () => {
    const result = ashbyAdapter.parseList(ashbyFixture, GH_CONTEXT);
    expect(result.postings).toHaveLength(3);
    expect(result.skipped).toHaveLength(2);
    const reasons = result.skipped.map((s) => s.reason);
    expect(reasons).toContain("missing_external_id");
    expect(reasons).toContain("missing_or_insecure_url");

    const [multi, remote, numeric] = result.postings;
    expect(multi.locationRaw).toBe("New York, NY, Remote - US, Boston, MA");
    expect(multi.employmentType).toBe("full_time"); // "FullTime"
    expect(multi.postedAt).toBe("2026-09-05T09:00:00.000Z");
    expect(multi.salaryRaw).toBeNull();
    expect(multi.validThrough).toBeNull();
    expect(multi.sourceUrl).toBe(
      "https://jobs.ashbyhq.com/acme/8f14e45f-ceea-467f-a1d6-1f8efb0b1c2d",
    );

    expect(remote.remote).toBe(true); // isRemote flag
    expect(remote.employmentType).toBe("part_time"); // "PartTime"
    expect(remote.descriptionText).toContain("documentation");
    expect(remote.descriptionText).not.toContain("<");

    expect(numeric.externalId).toBe("42"); // numeric ids stringified
    expect(numeric.postedAt).toBeNull(); // no publishedAt supplied (M)
    expect(numeric.descriptionText).toBe(""); // no description supplied
  });

  it("takes company from context, not from payload invention", () => {
    const withContext = ashbyAdapter.parseList(ashbyFixture, GH_CONTEXT);
    const without = ashbyAdapter.parseList(ashbyFixture);
    expect(withContext.postings.every((p) => p.companyName === "Acme Test Labs")).toBe(true);
    expect(without.postings.every((p) => p.companyName === "")).toBe(true);
  });

  it("handles structurally wrong payloads", () => {
    expect(ashbyAdapter.parseList([]).skipped[0].reason).toBe("payload_not_an_object");
    expect(ashbyAdapter.parseList({ jobs: 7 }).skipped[0].reason).toBe(
      "missing_jobs_array",
    );
  });

  it("is deterministic across repeated parses (Q)", () => {
    const a = JSON.stringify(ashbyAdapter.parseList(ashbyFixture, GH_CONTEXT));
    const b = JSON.stringify(ashbyAdapter.parseList(ashbyFixture, GH_CONTEXT));
    expect(a).toBe(b);
  });
});

describe("arbeitnow adapter", () => {
  it("builds the official feed URL with page defaults", () => {
    expect(arbeitnowAdapter.buildListRequest({}).toString()).toBe(
      "https://www.arbeitnow.com/api/job-board-api?page=1",
    );
    expect(arbeitnowAdapter.buildListRequest({ page: 3 }).toString()).toBe(
      "https://www.arbeitnow.com/api/job-board-api?page=3",
    );
    expect(() => arbeitnowAdapter.buildListRequest({ page: 0 })).toThrow(
      SourceAdapterError,
    );
    expect(() => arbeitnowAdapter.buildListRequest({ page: 1.5 })).toThrow(
      SourceAdapterError,
    );
  });

  it("parses rows and skips malformed ones with reasons", () => {
    const result = arbeitnowAdapter.parseList(arbeitnowFixture);
    expect(result.postings).toHaveLength(4);
    expect(result.skipped).toHaveLength(4);
    const reasons = result.skipped.map((s) => s.reason);
    expect(reasons).toContain("missing_external_id"); // slug (covers missing title too)
    expect(reasons).toContain("missing_or_insecure_url");
    expect(reasons).toContain("missing_company");
  });

  it("maps source fields: dates in both formats, remote flag, job type", () => {
    const { postings } = arbeitnowAdapter.parseList(arbeitnowFixture);
    const [normal, remote, noDate] = postings;

    expect(normal.companyName).toBe("Acme Test Labs");
    expect(normal.postedAt).toBe("2026-09-15T00:00:00.000Z"); // epoch seconds
    expect(normal.remote).toBe(false);
    expect(normal.employmentType).toBe("full_time");
    expect(normal.salaryRaw).toBeNull();
    expect(normal.validThrough).toBeNull();

    expect(remote.postedAt).toBe("2026-09-12T08:00:00.000Z"); // ISO string
    expect(remote.remote).toBe(true);
    expect(remote.locationRaw).toBeNull(); // empty location stays null (M)
    expect(remote.employmentType).toBe("part_time"); // "part-time"

    expect(noDate.postedAt).toBeNull(); // no posted_at supplied (M)
    expect(noDate.employmentType).toBe("internship");
  });

  it("uses parse context only as a fallback for missing company", () => {
    const withFallback = arbeitnowAdapter.parseList(arbeitnowFixture, GH_CONTEXT);
    // Source-supplied company wins; context never overrides it.
    expect(withFallback.postings[0].companyName).toBe("Acme Test Labs");
    const noCompany = {
      data: [
        {
          slug: "x",
          title: "T",
          description: "A sufficiently long description for a posting row.",
          url: "https://www.arbeitnow.com/job/x",
        },
      ],
    };
    const fallback = arbeitnowAdapter.parseList(noCompany, GH_CONTEXT);
    expect(fallback.postings).toHaveLength(1); // context saves an otherwise-companyless row
    expect(fallback.postings[0].companyName).toBe("Acme Test Labs");
  });

  it("handles structurally wrong payloads", () => {
    expect(arbeitnowAdapter.parseList({ data: "x" }).skipped[0].reason).toBe(
      "missing_data_array",
    );
    expect(arbeitnowAdapter.parseList(42).skipped[0].reason).toBe(
      "payload_not_an_object",
    );
  });

  it("is deterministic across repeated parses (Q)", () => {
    const a = JSON.stringify(arbeitnowAdapter.parseList(arbeitnowFixture));
    const b = JSON.stringify(arbeitnowAdapter.parseList(arbeitnowFixture));
    expect(a).toBe(b);
  });
});
