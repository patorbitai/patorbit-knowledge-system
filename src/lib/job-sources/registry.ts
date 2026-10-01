"use strict";

/**
 * M7A — Job source registry: THE source of truth for which sources exist,
 * which hosts may be fetched for each, attribution, and their adapters.
 *
 * Security contract (SSRF boundary):
 *  - Host allowlists live HERE only — never scattered through adapters.
 *  - Exact hostname matching: no wildcards, no suffix tricks.
 *  - HTTPS is mandatory; a non-HTTPS URL is REJECTED, never upgraded.
 *  - Credentials embedded in a URL are rejected.
 *  - Private/loopback destinations are rejected even if somehow allowlisted.
 *  - No user-provided URLs are ever validated here for fetching in M7A:
 *    only registry-listed source hosts are fetchable, and M7A performs no
 *    product fetches at all (fetch.ts is the only I/O path, used in M7B+).
 */

import type { SourceDefinition, SourceKind, SourceUrlDecision } from "./types";
import { SOURCE_KINDS, isSourceKind } from "./types";
import { greenhouseAdapter } from "./adapters/greenhouse";
import { leverAdapter } from "./adapters/lever";
import { ashbyAdapter } from "./adapters/ashby";
import { arbeitnowAdapter } from "./adapters/arbeitnow";

/* ── The registry ────────────────────────────────────────────────────────── */

export const JOB_SOURCES: Readonly<Record<SourceKind, SourceDefinition>> =
  Object.freeze({
    greenhouse: Object.freeze({
      kind: "greenhouse" as const,
      displayName: "Greenhouse",
      attributionText: "Jobs via Greenhouse",
      attributionUrl: "https://www.greenhouse.io/",
      allowedHosts: Object.freeze([
        "boards-api.greenhouse.io",
      ]) as readonly string[],
      urlRules: Object.freeze({
        requireHttps: true as const,
        note: "Official Job Board API only (v1/boards/{board}/jobs).",
      }),
      adapter: greenhouseAdapter,
    }),
    lever: Object.freeze({
      kind: "lever" as const,
      displayName: "Lever",
      attributionText: "Jobs via Lever",
      attributionUrl: "https://www.lever.co/",
      allowedHosts: Object.freeze(["api.lever.co"]) as readonly string[],
      urlRules: Object.freeze({
        requireHttps: true as const,
        note: "Official public postings feed only (v0/postings/{org}).",
      }),
      adapter: leverAdapter,
    }),
    ashby: Object.freeze({
      kind: "ashby" as const,
      displayName: "Ashby",
      attributionText: "Jobs via Ashby",
      attributionUrl: "https://www.ashbyhq.com/",
      allowedHosts: Object.freeze(["api.ashbyhq.com"]) as readonly string[],
      urlRules: Object.freeze({
        requireHttps: true as const,
        note: "Official public job board feed only (posting-api/job-board/{board}).",
      }),
      adapter: ashbyAdapter,
    }),
    arbeitnow: Object.freeze({
      kind: "arbeitnow" as const,
      displayName: "Arbeitnow",
      attributionText: "Jobs by Arbeitnow",
      attributionUrl: "https://www.arbeitnow.com/",
      allowedHosts: Object.freeze([
        "arbeitnow.com",
        "www.arbeitnow.com",
        "arbeitnow.co.uk",
        "www.arbeitnow.co.uk",
      ]) as readonly string[],
      urlRules: Object.freeze({
        requireHttps: true as const,
        note: "Official free job board API only (api/job-board-api).",
      }),
      adapter: arbeitnowAdapter,
    }),
  });

/** Every supported source, in stable order. */
export const JOB_SOURCE_LIST: readonly SourceDefinition[] = Object.freeze(
  SOURCE_KINDS.map((kind) => JOB_SOURCES[kind]),
);

/** Look up a source definition by kind (unknown kind → undefined). */
export function getSourceDefinition(
  kind: string,
): SourceDefinition | undefined {
  return isSourceKind(kind) ? JOB_SOURCES[kind] : undefined;
}

/* ── Private / loopback destination guard ────────────────────────────────── */

function isPrivateOrLoopbackIpv4(host: string): boolean {
  const parts = host.split(".");
  if (parts.length !== 4) return false;
  const octets = parts.map((p) => Number(p));
  if (octets.some((o) => !Number.isInteger(o) || o < 0 || o > 255)) return false;
  const [a, b] = octets;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local (incl. metadata)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (host === "255.255.255.255") return true; // broadcast
  return false;
}

function isPrivateOrLoopbackIpv6(host: string): boolean {
  let h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h.includes("%")) h = h.split("%")[0]; // zone id
  if (h === "::" || h === "::1") return true;
  if (h.startsWith("::ffff:")) {
    const tail = h.slice("::ffff:".length);
    // Dotted-quad form: ::ffff:127.0.0.1
    if (/^\d+\.\d+\.\d+\.\d+$/.test(tail)) return isPrivateOrLoopbackIpv4(tail);
    // Hex form: ::ffff:7f00:1 → decode to dotted quad and re-check.
    const hex = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      const ipv4 = `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
      return isPrivateOrLoopbackIpv4(ipv4);
    }
    return false;
  }
  if (/^f[cd]/.test(h)) return true; // fc00::/7 unique local
  if (/^fe[89ab]/.test(h)) return true; // fe80::/10 link-local
  return false;
}

/**
 * True when a hostname denotes a private, loopback, link-local, or
 * otherwise non-public destination. Hostnames are expected to come from the
 * WHATWG URL parser (which normalizes decimal/octal IPv4 forms).
 */
export function isPrivateOrLoopbackHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, ""); // FQDN trailing dot
  if (!host) return true;
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (host.endsWith(".local") || host.endsWith(".localdomain")) return true;
  if (host.endsWith(".internal")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return isPrivateOrLoopbackIpv4(host);
  if (host.includes(":") || host.startsWith("[")) return isPrivateOrLoopbackIpv6(host);
  return false;
}

/* ── URL validation (SSRF gate) ──────────────────────────────────────────── */

/**
 * Validate a URL for fetching against a specific source's allowlist.
 * Failure reasons are stable strings (tested): "invalid_url",
 * "not_https", "credentials_in_url", "private_or_loopback_destination",
 * "unknown_source", "host_not_allowed".
 */
export function validateSourceUrl(kind: string, input: string | URL): SourceUrlDecision {
  const definition = getSourceDefinition(kind);
  if (!definition) return { ok: false, reason: "unknown_source" };

  let url: URL;
  try {
    url = typeof input === "string" ? new URL(input) : new URL(input.toString());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (url.protocol !== "https:") return { ok: false, reason: "not_https" };
  if (url.username || url.password) {
    return { ok: false, reason: "credentials_in_url" };
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (isPrivateOrLoopbackHostname(host)) {
    return { ok: false, reason: "private_or_loopback_destination" };
  }
  if (!definition.allowedHosts.includes(host)) {
    return { ok: false, reason: "host_not_allowed" };
  }
  return { ok: true, url };
}

/**
 * Validate a redirect target: resolved against the current request URL
 * (relative Location headers are allowed), then held to the SAME source
 * allowlist. Cross-source redirects are rejected.
 */
export function validateRedirectTarget(
  kind: string,
  location: string,
  baseUrl?: string | URL,
): SourceUrlDecision {
  let resolved: URL;
  try {
    resolved = baseUrl !== undefined
      ? new URL(location, typeof baseUrl === "string" ? baseUrl : baseUrl.toString())
      : new URL(location);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  return validateSourceUrl(kind, resolved);
}

/* ── Rate-limit configuration (config only — M6 untouched) ───────────────── */

/**
 * Configuration for the FUTURE job-source rate limiter (M7B wires it).
 * M7A deliberately does NOT modify src/lib/rate-limit.ts: no M6 AI limit,
 * quota behavior, or classification changes belong to this milestone.
 */
export const JOB_SOURCE_RATE_LIMIT = Object.freeze({
  /** Max source list requests per user per window (M7B enforcement). */
  maxRequests: 10,
  /** Sliding window length in milliseconds. */
  windowMs: 60_000,
});
