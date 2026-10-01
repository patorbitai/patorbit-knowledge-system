"use strict";

/**
 * M7A — Arbeitnow adapter.
 *
 * Official API: free public Job Board API (no key)
 *   GET https://www.arbeitnow.com/api/job-board-api?page=N
 *   (UK mirror: https://www.arbeitnow.co.uk/api/job-board-api)
 *
 * Source-supplied fields read: slug, company_name, title, description (HTML),
 * location, url, posted_at (epoch seconds or ISO), remote (bool), job_type.
 * Arbeitnow supplies no salary or expiration in this feed → null.
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

export const ARBEITNOW_KIND: SourceKind = "arbeitnow";

function buildListRequest(params: SourceListParams): URL {
  const page = params.page ?? 1;
  if (!Number.isInteger(page) || page < 1) {
    throw new SourceAdapterError(
      "Arbeitnow page must be a positive integer.",
    );
  }
  return new URL(`https://www.arbeitnow.com/api/job-board-api?page=${page}`);
}

function parseEntry(entry: unknown, index: number): {
  posting?: NormalizedPosting;
  skip?: { index: number; reason: string };
} {
  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    return { skip: { index, reason: "not_an_object" } };
  }
  const row = entry as Record<string, unknown>;

  const slug = asNonEmptyString(row.slug);
  if (!slug) return { skip: { index, reason: "missing_external_id" } };

  const title = asNonEmptyString(row.title);
  if (!title) return { skip: { index, reason: "missing_title" } };

  const url = asHttpsUrl(row.url);
  if (!url) return { skip: { index, reason: "missing_or_insecure_url" } };

  const companyName = asNonEmptyString(row.company_name) ?? "";

  const locationRaw = asNonEmptyString(row.location);
  const remote = row.remote === true || indicatesRemote(locationRaw);

  const descriptionRaw = typeof row.description === "string" ? row.description : "";
  const descriptionText = normalizeDescriptionText(descriptionRaw);

  return {
    posting: {
      sourceKind: ARBEITNOW_KIND,
      externalId: slug,
      sourceUrl: url,
      applyUrl: url, // Arbeitnow's entry URL is the canonical way to the posting
      title,
      companyName: normalizeCompanyName(companyName),
      locationRaw: locationRaw ? normalizeLocation(locationRaw) : null,
      remote,
      employmentType: normalizeEmploymentType(row.job_type),
      salaryRaw: null, // not supplied by this feed
      descriptionText,
      postedAt: parseSourceTimestamp(row.posted_at),
      validThrough: null, // not supplied by this feed
      raw: row,
    },
  };
}

function parseList(payload: unknown, context?: SourceParseContext): SourceParseResult {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return { postings: [], skipped: [{ index: -1, reason: "payload_not_an_object" }] };
  }
  const data = (payload as Record<string, unknown>).data;
  if (!Array.isArray(data)) {
    return { postings: [], skipped: [{ index: -1, reason: "missing_data_array" }] };
  }

  const contextCompany = asNonEmptyString(context?.companyName);
  const postings: NormalizedPosting[] = [];
  const skipped: SourceParseResult["skipped"] = [];
  data.forEach((entry, index) => {
    const result = parseEntry(entry, index);
    if (result.posting) {
      const resolved =
        contextCompany && !result.posting.companyName
          ? { ...result.posting, companyName: normalizeCompanyName(contextCompany) }
          : result.posting;
      if (resolved.companyName) {
        postings.push(resolved);
      } else {
        skipped.push({ index, reason: "missing_company" });
      }
    } else if (result.skip) {
      skipped.push(result.skip);
    }
  });
  return { postings, skipped };
}

export const arbeitnowAdapter: SourceAdapter = {
  kind: ARBEITNOW_KIND,
  displayName: "Arbeitnow",
  buildListRequest,
  parseList,
};
