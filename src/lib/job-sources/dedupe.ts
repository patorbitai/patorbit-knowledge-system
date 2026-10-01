"use strict";

/**
 * M7A — content fingerprints + the conservative deduplication signal ladder.
 *
 * Fingerprint: deterministic SHA-256 (node:crypto — no new dependency) over
 * normalized company + title + location + description. Whitespace/case/format
 * differences vanish; materially different descriptions diverge.
 *
 * Signal ladder (first match wins), biased hard toward UNDER-MERGING —
 * a false merge (sending a user to the wrong job) is worse than a duplicate:
 *
 *   1. sourceKind + externalId  — exact source identity
 *   2. canonical URL            — same destination (tracking params ignored)
 *   3. content fingerprint      — same company + title + location + description
 *   4. soft key                 — company + title + location, ALL equal;
 *                                 NEVER merges on its own: it only reports a
 *                                 possible duplicate for later review.
 *
 * Hard guard: postings whose non-empty company keys differ are NEVER merged,
 * regardless of signal strength. One normalized Job may hold many source
 * postings; source records are never discarded by this module.
 */

import { createHash } from "node:crypto";
import type { NormalizedPosting, SourceKind } from "./types";
import {
  canonicalUrlKey,
  companyKey,
  locationKey,
  normalizeDescriptionText,
  titleKey,
} from "./normalize";

/** Minimum normalized description length before the fingerprint signal applies. */
export const FINGERPRINT_MIN_DESCRIPTION_CHARS = 40;

function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

/**
 * Fingerprint-grade description text: normalized, all whitespace (incl.
 * newlines) folded to single spaces, lowercased — so reflowing or re-casing
 * the same content cannot change its hash.
 */
export function fingerprintText(text: string): string {
  return normalizeDescriptionText(text).replace(/\s+/g, " ").trim().toLowerCase();
}

/** Deterministic content hash of a normalized description (JobPosting.contentHash). */
export function contentHash(descriptionText: string): string {
  return sha256Hex(fingerprintText(descriptionText));
}

export interface FingerprintInput {
  companyName: string;
  title: string;
  location?: string | null;
  description: string;
}

/**
 * Deterministic posting fingerprint over normalized company/title/location/
 * description. Inputs are normalized inside so callers may pass raw values.
 */
export function postingFingerprint(input: FingerprintInput): string {
  const parts = [
    companyKey(input.companyName),
    titleKey(input.title),
    input.location ? locationKey(input.location) : "",
    fingerprintText(input.description),
  ];
  return sha256Hex(parts.join("\u0000"));
}

/** Fingerprint of a normalized posting (the form dedupe compares). */
export function fingerprintPosting(posting: NormalizedPosting): string {
  return postingFingerprint({
    companyName: posting.companyName,
    title: posting.title,
    location: posting.locationRaw,
    description: posting.descriptionText,
  });
}

/* ── Signal ladder ───────────────────────────────────────────────────────── */

export type DedupeSignal =
  | "source_external_id"
  | "canonical_url"
  | "fingerprint"
  | "soft_key"
  | "none";

/** One posting row attached to an existing normalized Job. */
export interface ExistingPostingRef {
  sourceKind: SourceKind | string;
  externalId: string;
  /** Canonical URL key of the posting's source/apply URL (null when none). */
  canonicalUrlKey: string | null;
}

/** The existing normalized Job a candidate would be linked into. */
export interface ExistingJob {
  jobId: string;
  companyKey: string;
  titleKey: string;
  /** null when the existing job has no location. */
  locationKey: string | null;
  fingerprintHash: string;
  /** Normalized description length (guards empty-description fingerprints). */
  descriptionLength: number;
  postings: ExistingPostingRef[];
}

export type DedupeDecision =
  | { action: "merge"; jobId: string; signal: "source_external_id" | "canonical_url" | "fingerprint" }
  | { action: "possible_duplicate"; candidateJobIds: string[]; signal: "soft_key" }
  | { action: "new" };

/** Build an ExistingJob view from a normalized posting (used by tests/M7B). */
export function toExistingJobView(
  jobId: string,
  posting: NormalizedPosting,
): ExistingJob {
  return {
    jobId,
    companyKey: companyKey(posting.companyName),
    titleKey: titleKey(posting.title),
    locationKey: posting.locationRaw ? locationKey(posting.locationRaw) : null,
    fingerprintHash: fingerprintPosting(posting),
    descriptionLength: normalizeDescriptionText(posting.descriptionText).length,
    postings: [
      {
        sourceKind: posting.sourceKind,
        externalId: posting.externalId,
        canonicalUrlKey:
          canonicalUrlKey(posting.sourceUrl) ?? canonicalUrlKey(posting.applyUrl),
      },
    ],
  };
}

function companiesConflict(a: string, b: string): boolean {
  // Conflict only when BOTH are known and different. Empty company evidence
  // never forces a merge decision either way (URL/ID signals still apply).
  return a.length > 0 && b.length > 0 && a !== b;
}

/**
 * Decide whether `candidate` should merge into an existing job.
 *
 * Pure and deterministic: same candidate + same existing list ⇒ same decision.
 */
export function decideDedupe(
  candidate: NormalizedPosting,
  existing: readonly ExistingJob[],
): DedupeDecision {
  const candCompany = companyKey(candidate.companyName);
  const candTitle = titleKey(candidate.title);
  const candLocation = candidate.locationRaw ? locationKey(candidate.locationRaw) : null;
  const candUrlKey = canonicalUrlKey(candidate.sourceUrl) ?? canonicalUrlKey(candidate.applyUrl);
  const candFingerprint = fingerprintPosting(candidate);
  const candDescriptionLength = normalizeDescriptionText(candidate.descriptionText).length;
  const fingerprintEligible = candDescriptionLength >= FINGERPRINT_MIN_DESCRIPTION_CHARS;

  const compatible = existing.filter(
    (job) => !companiesConflict(candCompany, job.companyKey),
  );

  // Signal 1 — exact source identity (same sourceKind + externalId).
  for (const job of compatible) {
    const hit = job.postings.some(
      (posting) =>
        posting.sourceKind === candidate.sourceKind &&
        posting.externalId === candidate.externalId &&
        posting.externalId.length > 0,
    );
    if (hit) return { action: "merge", jobId: job.jobId, signal: "source_external_id" };
  }

  // Signal 2 — canonical URL equality (tracking params ignored; key only).
  if (candUrlKey) {
    for (const job of compatible) {
      const hit = job.postings.some((posting) => posting.canonicalUrlKey === candUrlKey);
      if (hit) return { action: "merge", jobId: job.jobId, signal: "canonical_url" };
    }
  }

  // Signal 3 — content fingerprint (requires a substantive description on
  // both sides so two nearly-empty postings can't merge on title alone).
  if (fingerprintEligible) {
    for (const job of compatible) {
      if (
        job.fingerprintHash === candFingerprint &&
        job.descriptionLength >= FINGERPRINT_MIN_DESCRIPTION_CHARS
      ) {
        return { action: "merge", jobId: job.jobId, signal: "fingerprint" };
      }
    }
  }

  // Signal 4 — conservative soft key: ALL of company + title + location
  // equal, location known on both sides, and exactly one candidate. This
  // NEVER merges — it only surfaces a possible duplicate for later review.
  if (candCompany && candTitle && candLocation) {
    const softMatches = compatible.filter(
      (job) =>
        job.companyKey === candCompany &&
        job.titleKey === candTitle &&
        job.locationKey === candLocation,
    );
    if (softMatches.length >= 1) {
      return {
        action: "possible_duplicate",
        candidateJobIds: softMatches.map((job) => job.jobId),
        signal: "soft_key",
      };
    }
  }

  return { action: "new" };
}
