"use strict";

/**
 * M7A — the ONLY sanctioned network path for job-source requests.
 *
 * Security boundaries enforced here (none of this is optional):
 *  - URL must pass `validateSourceUrl` (HTTPS + source registry host
 *    allowlist + private/loopback rejection + no embedded credentials).
 *  - Redirects are handled MANUALLY; every Location is re-validated against
 *    the SAME source allowlist (cross-source redirects rejected).
 *  - Short timeout (AbortSignal + race), response-size cap, JSON-only.
 *  - No credentials, no cookies, no auth headers — the request carries a
 *    fixed User-Agent/Accept only. User resume/profile data can NEVER be
 *    attached: this function accepts only a source kind and a URL.
 *  - Arbitrary/user-provided URLs are not supported: an invalid source or
 *    non-allowlisted host throws before any I/O.
 *
 * M7A itself performs no product fetches (no API routes this milestone);
 * tests inject a fake `fetchImpl` and never touch the network.
 */

import { getSourceDefinition, validateRedirectTarget, validateSourceUrl } from "./registry";

export const SOURCE_FETCH_LIMITS = Object.freeze({
  /** Overall request timeout (connect + headers + body). */
  timeoutMs: 10_000,
  /** Hard cap on response body size. */
  maxBytes: 2_000_000,
  /** Redirect hops allowed before failing (each hop re-validated). */
  maxRedirects: 3,
});

export type SourceFetchErrorCode =
  | "unknown_source"
  | "invalid_url"
  | "redirect_blocked"
  | "too_many_redirects"
  | "timeout"
  | "too_large"
  | "http_error"
  | "invalid_json"
  | "network_error";

export class SourceFetchError extends Error {
  readonly code: SourceFetchErrorCode;
  constructor(message: string, code: SourceFetchErrorCode) {
    super(message);
    this.name = "SourceFetchError";
    this.code = code;
  }
}

/** Minimal fetch signature so tests can inject a deterministic fake. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface FetchSourceOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

async function readBodyCapped(response: Response, maxBytes: number): Promise<string> {
  const contentLength = response.headers?.get?.("content-length");
  if (contentLength !== null && contentLength !== undefined) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new SourceFetchError("Response exceeded size limit.", "too_large");
    }
  }

  if (response.body && typeof response.body.getReader === "function") {
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > maxBytes) {
          try {
            await reader.cancel();
          } catch {
            /* best effort */
          }
          throw new SourceFetchError("Response exceeded size limit.", "too_large");
        }
        chunks.push(value);
      }
    }
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
      merged.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(merged);
  }

  // Fallback when the runtime exposes no body stream.
  const text = await response.text();
  if (text.length > maxBytes) {
    throw new SourceFetchError("Response exceeded size limit.", "too_large");
  }
  return text;
}

/**
 * Fetch and JSON-parse an official source feed URL for `kind`.
 * Throws SourceFetchError for every failure mode — never returns partial
 * data, never retries silently, never sends anything but the fixed headers.
 */
export async function fetchSourceJson<T = unknown>(
  kind: string,
  input: string | URL,
  options: FetchSourceOptions = {},
): Promise<T> {
  const definition = getSourceDefinition(kind);
  if (!definition) {
    throw new SourceFetchError(`Unknown job source: ${kind}.`, "unknown_source");
  }

  const decision = validateSourceUrl(kind, input);
  if (!decision.ok) {
    // Every validation failure blocks the request before any I/O. The stable
    // machine code stays "invalid_url"; the human message carries the reason.
    throw new SourceFetchError(
      `Blocked source URL (${decision.reason}).`,
      "invalid_url",
    );
  }

  const fetchImpl: FetchLike =
    options.fetchImpl ?? (globalThis.fetch as FetchLike | undefined) ?? (() => {
      throw new SourceFetchError("No fetch implementation available.", "network_error");
    });
  const timeoutMs = options.timeoutMs ?? SOURCE_FETCH_LIMITS.timeoutMs;
  const maxBytes = options.maxBytes ?? SOURCE_FETCH_LIMITS.maxBytes;
  const maxRedirects = options.maxRedirects ?? SOURCE_FETCH_LIMITS.maxRedirects;

  let current = decision.url;
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(timeoutMs)
      : undefined;
  const init: RequestInit = {
    method: "GET",
    redirect: "manual",
    credentials: "omit",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": `Patorbit-JobSources/1.0 (+${definition.attributionUrl})`,
    },
    signal: timeoutSignal ?? null,
  };

  for (let hop = 0; hop <= maxRedirects; hop++) {
    let response: Response;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const request = fetchImpl(current.toString(), init);
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new SourceFetchError("Source request timed out.", "timeout")),
          timeoutMs,
        );
      });
      response = await Promise.race([request, deadline]);
    } catch (err) {
      if (err instanceof SourceFetchError) throw err;
      const name = (err as { name?: string } | null)?.name;
      if (name === "TimeoutError" || name === "AbortError") {
        throw new SourceFetchError("Source request timed out.", "timeout");
      }
      throw new SourceFetchError(
        "Source request failed at the network layer.",
        "network_error",
      );
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }

    if (REDIRECT_STATUSES.has(response.status)) {
      const location = response.headers?.get?.("location");
      if (!location) {
        throw new SourceFetchError("Redirect without Location header.", "redirect_blocked");
      }
      const target = validateRedirectTarget(kind, location, current);
      if (!target.ok) {
        throw new SourceFetchError(
          `Redirect blocked (${target.reason}).`,
          "redirect_blocked",
        );
      }
      if (hop === maxRedirects) {
        throw new SourceFetchError("Too many redirects.", "too_many_redirects");
      }
      current = target.url;
      continue;
    }

    if (!response.ok) {
      throw new SourceFetchError(
        `Source responded with HTTP ${response.status}.`,
        "http_error",
      );
    }

    const text = await readBodyCapped(response, maxBytes);
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new SourceFetchError("Source returned invalid JSON.", "invalid_json");
    }
  }

  throw new SourceFetchError("Too many redirects.", "too_many_redirects");
}
