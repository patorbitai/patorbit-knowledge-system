"use strict";

/**
 * M7A — Ashby adapter.
 *
 * Official API: Public Job Postings API (unauthenticated)
 *   GET https://api.ashbyhq.com/posting-api/job-board/{board}
 *
 * Source-supplied fields read (defensively — absent fields stay null):
 * id, title, location, secondaryLocations, isRemote, descriptionPlain /
 * descriptionHtml, publishedAt, applyUrl / jobUrl, employmentType.
 * Ashby's default feed supplies no salary or expiration → null.
 */

import {
  SourceAdapterError,
  type NormalizedPosting,
  type SourceAdapter,
  type SourceListParams,
  type SourceParseContext,
  type SourceParseResult,
  type SourceKind,
} from "../types";
import {
  asHttpsUrl,
  asNonEmptyString,
  indicatesRemote,
  normalizeCompanyName,
  normalizeDescriptionText,
  normalizeEmploymentType,
  normalizeLocation,
  parseSourceTimestamp,
} from "../normalize";

export const ASHBY_KIND: SourceKind = "ashby";

function buildListRequest(params: SourceListParams): URL {
  const board = asNonEmptyString(params.board);
  if (!board) {
    throw new SourceAdapterError(
      "Ashby requires a board identifier to build a list request.",
    );
  }
  return new URL(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(board)}`,
  );
}

/** Join primary + secondary locations into one source-stated string. */
function readLocations(row: Record<string, unknown>): string | null {
  const parts: string[] = [];
  const primary = asNonEmptyString(row.location);
  if (primary) parts.push(primary);

  const secondary = row.secondaryLocations;
  if (Array.isArray(secondary)) {
    for (const entry of secondary) {
      if (typeof entry !== "object" || entry === null) continue;
      const record = entry as Record<string, unknown>;
      const name = asNonEmptyString(record.location) ?? asNonEmptyString(record.name);
      if (name && !parts.includes(name)) parts.push(name);
    }
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

function parseJob(job: unknown, index: number): {
  posting?: NormalizedPosting;
  skip?: { index: number; reason: string };
} {
  if (typeof job !== "object" || job === null || Array.isArray(job)) {
    return { skip: { index, reason: "not_an_object" } };
  }
  const row = job as Record<string, unknown>;

  const id = row.id;
  const externalId =
    typeof id === "string" && id.trim()
      ? id.trim()
      : typeof id === "number"
        ? String(id)
        : "";
  if (!externalId) return { skip: { index, reason: "missing_external_id" } };

  const title = asNonEmptyString(row.title);
  if (!title) return { skip: { index, reason: "missing_title" } };

  const jobUrl = asHttpsUrl(row.jobUrl);
  const applyUrl = asHttpsUrl(row.applyUrl);
  const sourceUrl = jobUrl ?? applyUrl;
  if (!sourceUrl) return { skip: { index, reason: "missing_or_insecure_url" } };

  const locationRaw = readLocations(row);

  const descriptionRaw =
    typeof row.descriptionPlain === "string" && row.descriptionPlain.trim()
      ? row.descriptionPlain
      : typeof row.descriptionHtml === "string"
        ? row.descriptionHtml
        : "";
  const descriptionText = normalizeDescriptionText(descriptionRaw);

  const isRemote = row.isRemote === true;
  const remote = isRemote || indicatesRemote(locationRaw);

  return {
    posting: {
      sourceKind: ASHBY_KIND,
      externalId,
      sourceUrl,
      applyUrl: applyUrl ?? sourceUrl,
      title,
      companyName: "", // per-company feed: company comes from parse context
      locationRaw: locationRaw ? normalizeLocation(locationRaw) : null,
      remote,
      employmentType: normalizeEmploymentType(row.employmentType),
      salaryRaw: null, // default feed supplies no compensation field
      descriptionText,
      postedAt: parseSourceTimestamp(row.publishedAt),
      validThrough: null, // Ashby supplies no expiration in this feed
      raw: row,
    },
  };
}

function parseList(payload: unknown, context?: SourceParseContext): SourceParseResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { postings: [], skipped: [{ index: -1, reason: "payload_not_an_object" }] };
  }
  const jobs = (payload as Record<string, unknown>).jobs;
  if (!Array.isArray(jobs)) {
    return { postings: [], skipped: [{ index: -1, reason: "missing_jobs_array" }] };
  }

  const contextCompany = asNonEmptyString(context?.companyName) ?? "";
  const postings: NormalizedPosting[] = [];
  const skipped: SourceParseResult["skipped"] = [];
  jobs.forEach((job, index) => {
    const result = parseJob(job, index);
    if (result.posting) {
      postings.push({
        ...result.posting,
        companyName: normalizeCompanyName(contextCompany),
      });
    } else if (result.skip) {
      skipped.push(result.skip);
    }
  });
  return { postings, skipped };
}

export const ashbyAdapter: SourceAdapter = {
  kind: ASHBY_KIND,
  displayName: "Ashby",
  buildListRequest,
  parseList,
};
