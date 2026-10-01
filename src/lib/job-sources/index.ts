"use strict";

/**
 * M7A — Job Source Foundation public surface.
 *
 * Foundation only: adapters, registry, normalization, dedupe, freshness and
 * the secured fetch path. No API routes, no UI, no AI calls (M7B+).
 */

export * from "./types";
export {
  JOB_SOURCES,
  JOB_SOURCE_LIST,
  JOB_SOURCE_RATE_LIMIT,
  getSourceDefinition,
  isPrivateOrLoopbackHostname,
  validateSourceUrl,
  validateRedirectTarget,
} from "./registry";
export * from "./normalize";
export * from "./dedupe";
export * from "./freshness";
export {
  SOURCE_FETCH_LIMITS,
  SourceFetchError,
  fetchSourceJson,
  type FetchLike,
  type FetchSourceOptions,
  type SourceFetchErrorCode,
} from "./fetch";
