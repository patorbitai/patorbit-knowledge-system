"use strict";

/**
 * Career Journey — Domain Error Types.
 *
 * Centralized error type for the Career Journey domain package. Validation
 * uses structured results (see validation.ts); this error type is used for
 * unexpected, exceptional conditions such as illegal lifecycle transitions.
 */

/** Error codes scoped to the Career Journey domain. */
export type JourneyErrorCode =
  /** An invalid lifecycle transition was requested. */
  | "ILLEGAL_TRANSITION"
  /** A lifecycle operation referenced an unknown status. */
  | "UNKNOWN_STATUS"
  /** Validation failed on a given input. */
  | "INVALID_INPUT";

/** A domain-level error carrying a stable, machine-readable code. */
export class JourneyError extends Error {
  readonly code: JourneyErrorCode;
  readonly details?: unknown;

  constructor(code: JourneyErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "JourneyError";
    this.code = code;
    this.details = details;
  }
}