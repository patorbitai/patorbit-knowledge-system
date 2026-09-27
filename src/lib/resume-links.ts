"use strict";

/**
 * Resume link handling — ONE source of truth for turning user-entered
 * contact/social values into safe, real hyperlinks (M4).
 *
 * Used by:
 *  - the preview templates (shared.tsx SocialLink / ContactRow / headers)
 *  - the DOCX exporter (ExternalHyperlink relationships)
 *  - the editor (validation feedback)
 *
 * Rules:
 *  - Only http/https may become an external href. javascript:, data:,
 *    vbscript:, file: and every other scheme are rejected outright.
 *  - A bare value that LOOKS like a URL (example.com/path) is prefixed with
 *    https:// — the long-standing display behaviour of normalizeSocialUrl.
 *  - Arbitrary user text is NOT silently URL-ified: it fails validation so
 *    the editor can say so, and the renderer falls back to plain text.
 *  - Email/phone never round-trip through URL logic: we build mailto:/tel:
 *    ourselves from the raw value.
 */

/** Matches a leading URI scheme ("javascript:", "https:", "mailto:" …). */
const SCHEME_RE = /^[a-z][a-z0-9+.\-]*:/i;

/** The only schemes allowed in an outgoing href. */
const SAFE_SCHEMES = new Set(["http:", "https:"]);

/**
 * Bare value that looks like a host[/path]:
 *   example.com · www.x.io/a?b#c · sub.domain.co.uk:8080/x
 * Deliberately requires a dot so prose ("my site") never becomes a URL.
 */
const BARE_URL_RE = /^[^\s/?#:]+(\.[^\s/?#:]+)+(:\d+)?([/?#][^\s]*)?$/;

/** Characters that must never leak into an href we construct. */
const HREF_UNSAFE_RE = /["'<>\\]/g;

export interface SafeHref {
  ok: boolean;
  /** Normalized href when ok; "" otherwise. */
  href: string;
}

/**
 * Normalize + validate a user-entered web URL for use as an href.
 *
 * - "linkedin.com/in/jane"        → https://linkedin.com/in/jane
 * - "https://github.com/jane"     → unchanged
 * - "javascript:alert(1)"         → rejected (ok: false)
 * - "some prose"                  → rejected (not silently URL-ified)
 * - "" / whitespace               → rejected (renderers treat as absent)
 */
export function toSafeHref(value: string | null | undefined): SafeHref {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { ok: false, href: "" };

  const schemeMatch = SCHEME_RE.exec(trimmed);
  if (schemeMatch) {
    const scheme = schemeMatch[0].toLowerCase();
    if (!SAFE_SCHEMES.has(scheme)) return { ok: false, href: "" };
    // Already carries an allowed scheme — preserve the user's text verbatim
    // (keeps the documented "HTTPS://EXAMPLE.com/x is preserved" behaviour).
    return { ok: true, href: trimmed };
  }

  if (!BARE_URL_RE.test(trimmed)) return { ok: false, href: "" };
  return { ok: true, href: `https://${trimmed}` };
}

/** Convenience: the safe href, or "" when the value is unsafe/invalid. */
export function safeHref(value: string | null | undefined): string {
  return toSafeHref(value).href;
}

/**
 * Clean visible label for a link value: protocol stripped, trailing slash
 * removed. Applied to unsafe values too so text stays visible (as text).
 */
export function linkLabel(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

/** Build a mailto: href from a raw email value. "" when it can't be trusted. */
export function mailtoHref(email: string | null | undefined): string {
  const trimmed = (email ?? "").trim();
  if (!trimmed) return "";
  // A valid email address never contains whitespace or a URI scheme of its own.
  if (/\s/.test(trimmed)) return "";
  if (SCHEME_RE.test(trimmed)) return "";
  return `mailto:${trimmed.replace(HREF_UNSAFE_RE, "")}`;
}

/**
 * Build a tel: href from a raw phone value. Keeps digits and a single
 * leading "+"; everything else (spaces, dashes, parentheses) is transport
 * noise. "" when there is no dialable number.
 */
export function telHref(phone: string | null | undefined): string {
  const trimmed = (phone ?? "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^\d+]/g, "");
  const plus = digits.startsWith("+") ? "+" : "";
  const bare = digits.replace(/\+/g, "");
  if (!bare) return "";
  return `tel:${plus}${bare}`;
}

export type UrlValidity =
  | { valid: true }
  | { valid: false; message: string };

/**
 * Editor-facing validation. Empty is valid (the field is optional);
 * everything else must be an http(s) URL or a bare host[/path].
 */
export function validateWebUrl(value: string | null | undefined): UrlValidity {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return { valid: true };

  const schemeMatch = SCHEME_RE.exec(trimmed);
  if (schemeMatch) {
    const scheme = schemeMatch[0].toLowerCase();
    if (SAFE_SCHEMES.has(scheme)) return { valid: true };
    return { valid: false, message: "Only http:// and https:// links are allowed." };
  }
  if (!BARE_URL_RE.test(trimmed)) {
    return {
      valid: false,
      message: "Enter a full link like https://example.com/you or example.com/you.",
    };
  }
  return { valid: true };
}
