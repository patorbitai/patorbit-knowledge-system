"use strict";

/**
 * M7A — Greenhouse adapter.
 *
 * Official API: Job Board API (public, unauthenticated)
 *   GET https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true
 *
 * Only documented, source-supplied fields are read:
 *   id, title, absolute_url, location.name, content (HTML),
 *   first_published (when present) / updated_at.
 * Greenhouse does not standardly supply salary, employment type, or an
 * expiration → those are null, never invented.
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
  normalizeDescriptionText,
  normalizeCompanyName,
  normalizeLocation,
  parseSourceTimestamp,
} from "../normalize";

export const GREENHOUSE_KIND: SourceKind = "greenhouse";

function buildListRequest(params: SourceListParams): URL {
  const board = asNonEmptyString(params.board);
  if (!board) {
    throw new SourceAdapterError(
      "Greenhouse requires a board identifier to build a list request.",
    );
  }
  return new URL(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board)}/jobs?content=true`,
  );
}

function parseJob(
  job: unknown,
  index: number,
  context?: SourceParseContext,
): {
  posting?: NormalizedPosting;
  skip?: { index: number; reason: string };
} {
  if (typeof job !== "object" || job === null || Array.isArray(job)) {
    return { skip: { index, reason: "not_an_object" } };
  }
  const row = job as Record<string, unknown>;

  const id = row.id;
  const externalId =
    typeof id === "string" || typeof id === "number" ? String(id).trim() : "";
  if (!externalId) return { skip: { index, reason: "missing_external_id" } };

  const title = asNonEmptyString(row.title);
  if (!title) return { skip: { index, reason: "missing_title" } };

  const sourceUrl = asHttpsUrl(row.absolute_url);
  if (!sourceUrl) return { skip: { index, reason: "missing_or_insecure_url" } };

  const locationObj =
    typeof row.location === "object" && row.location !== null
      ? (row.location as Record<string, unknown>)
      : null;
  const locationRaw = locationObj
    ? asNonEmptyString(locationObj.name)
    : asNonEmptyString(row.location);

  const descriptionRaw =
    typeof row.content === "string" ? row.content : "";
  const descriptionText = normalizeDescriptionText(descriptionRaw);

  // postedAt: prefer an explicit first-published date; fall back to the
  // source's updated_at (both source-supplied; see type docs).
  const postedAt =
    parseSourceTimestamp(row.first_published) ??
    parseSourceTimestamp(row.updated_at);

  // The Job Board API payload carries no company field — the board IS the
  // company. It comes from caller context when known, else stays empty.
  const companyName = asNonEmptyString(context?.companyName) ?? "";

  return {
    posting: {
      sourceKind: GREENHOUSE_KIND,
      externalId,
      sourceUrl,
      applyUrl: sourceUrl, // the Greenhouse-hosted page is the application page
      title,
      companyName: normalizeCompanyName(companyName),
      locationRaw: locationRaw ? normalizeLocation(locationRaw) : null,
      remote: indicatesRemote(locationRaw),
      employmentType: null, // not standardly supplied by the Job Board API
      salaryRaw: null, // not standardly supplied
      descriptionText,
      postedAt,
      validThrough: null, // Greenhouse Job Board API supplies no expiration
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

  const postings: NormalizedPosting[] = [];
  const skipped: SourceParseResult["skipped"] = [];
  jobs.forEach((job, index) => {
    const result = parseJob(job, index, context);
    if (result.posting) postings.push(result.posting);
    else if (result.skip) skipped.push(result.skip);
  });
  return { postings, skipped };
}

export const greenhouseAdapter: SourceAdapter = {
  kind: GREENHOUSE_KIND,
  displayName: "Greenhouse",
  buildListRequest,
  parseList,
};
