"use strict";

/**
 * M7A — Lever adapter.
 *
 * Official API: Public Postings API (unauthenticated)
 *   GET https://api.lever.co/v0/postings/{organization}?mode=json
 *
 * Source-supplied fields read: id, text, hostedUrl, applyUrl (when present),
 * createdAt (epoch ms), categories.location / categories.commitment,
 * workplaceType (when present), descriptionPlain / description.
 * Lever standardly supplies no salary and no expiration → null.
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

export const LEVER_KIND: SourceKind = "lever";

function buildListRequest(params: SourceListParams): URL {
  const board = asNonEmptyString(params.board);
  if (!board) {
    throw new SourceAdapterError(
      "Lever requires an organization identifier to build a list request.",
    );
  }
  return new URL(
    `https://api.lever.co/v0/postings/${encodeURIComponent(board)}?mode=json`,
  );
}

function parsePosting(
  posting: unknown,
  index: number,
  context?: SourceParseContext,
): {
  posting?: NormalizedPosting;
  skip?: { index: number; reason: string };
} {
  if (typeof posting !== "object" || posting === null || Array.isArray(posting)) {
    return { skip: { index, reason: "not_an_object" } };
  }
  const row = posting as Record<string, unknown>;

  const id = row.id;
  const externalId =
    typeof id === "string" && id.trim() ? id.trim()
    : typeof id === "number" ? String(id)
    : "";
  if (!externalId) return { skip: { index, reason: "missing_external_id" } };

  const title = asNonEmptyString(row.text);
  if (!title) return { skip: { index, reason: "missing_title" } };

  const hostedUrl = asHttpsUrl(row.hostedUrl);
  const applyUrl = asHttpsUrl(row.applyUrl);
  const sourceUrl = hostedUrl ?? applyUrl;
  if (!sourceUrl) return { skip: { index, reason: "missing_or_insecure_url" } };

  const categories =
    typeof row.categories === "object" && row.categories !== null
      ? (row.categories as Record<string, unknown>)
      : {};
  const locationRaw = asNonEmptyString(categories.location);

  const descriptionRaw =
    typeof row.descriptionPlain === "string" && row.descriptionPlain.trim()
      ? row.descriptionPlain
      : typeof row.description === "string"
        ? row.description
        : "";
  const descriptionText = normalizeDescriptionText(descriptionRaw);

  const workplaceType = asNonEmptyString(row.workplaceType);
  const remote =
    (workplaceType ? workplaceType.toLowerCase() === "remote" : false) ||
    indicatesRemote(locationRaw) ||
    indicatesRemote(asNonEmptyString(row.country));

  // The public postings payload carries no company field — the organization
  // is implied by the board URL. Company comes from caller context when known.
  const companyName = asNonEmptyString(context?.companyName) ?? "";
  const postedAt = parseSourceTimestamp(row.createdAt);

  return {
    posting: {
      sourceKind: LEVER_KIND,
      externalId,
      sourceUrl,
      applyUrl: applyUrl ?? sourceUrl,
      title,
      companyName: normalizeCompanyName(companyName ?? ""),
      locationRaw: locationRaw ? normalizeLocation(locationRaw) : null,
      remote,
      employmentType: normalizeEmploymentType(categories.commitment),
      salaryRaw: null, // Lever's public postings supply no salary field
      descriptionText,
      postedAt,
      validThrough: null, // Lever supplies no expiration in this feed
      raw: row,
    },
  };
}

function parseList(payload: unknown, context?: SourceParseContext): SourceParseResult {
  if (!Array.isArray(payload)) {
    return { postings: [], skipped: [{ index: -1, reason: "payload_not_an_array" }] };
  }
  const postings: NormalizedPosting[] = [];
  const skipped: SourceParseResult["skipped"] = [];
  payload.forEach((posting, index) => {
    const result = parsePosting(posting, index, context);
    if (result.posting) postings.push(result.posting);
    else if (result.skip) skipped.push(result.skip);
  });
  return { postings, skipped };
}

export const leverAdapter: SourceAdapter = {
  kind: LEVER_KIND,
  displayName: "Lever",
  buildListRequest,
  parseList,
};
