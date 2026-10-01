"use strict";

/**
 * M7A tests — normalization (F) and URL canonicalization (G):
 * company/title/location keys, HTML stripping, entity decoding, employment
 * types, source timestamps, tracking-param-safe URL keys.
 */

import { describe, expect, it } from "vitest";
import {
  asHttpsUrl,
  asNonEmptyString,
  canonicalUrlKey,
  collapseWhitespace,
  companyKey,
  decodeEntities,
  indicatesRemote,
  isHttpsUrl,
  locationKey,
  looksLikeHtml,
  normalizeCompanyName,
  normalizeDescriptionText,
  normalizeEmploymentType,
  normalizeLocation,
  parseSourceTimestamp,
  stripHtml,
  titleKey,
} from "@/lib/job-sources/normalize";

describe("text normalization (F)", () => {
  it("collapses whitespace deterministically (incl. NBSP)", () => {
    expect(collapseWhitespace("  a   b\t\tc  ")).toBe("a b c");
    expect(collapseWhitespace("a\u00a0b")).toBe("a b");
    expect(collapseWhitespace("line1\n\n\n\nline2")).toBe("line1\nline2");
    expect(collapseWhitespace("  \n  spaced  \n  lines  ")).toBe("spaced\nlines");
  });

  it("decodes the fixed entity set and guards invalid codepoints", () => {
    expect(decodeEntities("a &amp; b &lt;c&gt; &quot;d&quot; &#39;e&#39;")).toBe(
      'a & b <c> "d" \'e\'',
    );
    expect(decodeEntities("&nbsp;x")).toBe(" x");
    expect(decodeEntities("&#xD800;")).toBe("&#xD800;"); // surrogate → untouched
    expect(decodeEntities("&#x110000;")).toBe("&#x110000;"); // out of range
    expect(decodeEntities("&unknownentity;")).toBe("&unknownentity;");
  });

  it("strips hostile HTML including script/style content and comments", () => {
    const dirty =
      "<!-- hidden --><style>body{display:none}</style><script>alert('pwn')</script><p>Visible <b>text</b></p>";
    const clean = stripHtml(dirty);
    expect(clean).toBe("Visible text");
    expect(clean).not.toContain("alert");
    expect(clean).not.toContain("display:none");
    expect(clean).not.toContain("hidden");
  });

  it("turns block boundaries into lines before stripping tags", () => {
    const html = "<ul><li>one</li><li>two</li></ul>";
    expect(stripHtml(html)).toBe("one\ntwo");
  });

  it("detects markup and normalizes descriptions (HTML and plain inputs)", () => {
    expect(looksLikeHtml("<p>x</p>")).toBe(true);
    expect(looksLikeHtml("plain text")).toBe(false);
    expect(normalizeDescriptionText("<p>Hello   <b>world</b></p>")).toBe("Hello world");
    expect(normalizeDescriptionText("just   plain\n\n text")).toBe("just plain\ntext");
  });

  it("neutralizes entity-encoded markup so stored text stays inert", () => {
    const encoded = "&lt;script&gt;alert(1)&lt;/script&gt; stay calm";
    const text = normalizeDescriptionText(encoded);
    expect(text).not.toContain("<");
    expect(text).toContain("stay calm");
    expect(text).toContain("alert(1)"); // text content preserved, markup not
  });

  it("normalizes company names and keys", () => {
    expect(normalizeCompanyName("  Acme,   Inc.  ")).toBe("Acme, Inc.");
    expect(normalizeCompanyName("Acme;")).toBe("Acme");
    expect(companyKey("Acme, Inc.")).toBe("acme");
    expect(companyKey("ACME INC")).toBe("acme");
    expect(companyKey("Acme")).toBe(companyKey("Acme, Inc."));
    expect(companyKey("Acme Systems Ltd")).toBe("acme systems");
    expect(companyKey("Foo & Bar LLC")).toBe("foo and bar");
    expect(companyKey("Prüfwerk GmbH")).toBe(companyKey("Prufwerk GmbH"));
    expect(companyKey("Ltd")).toBe("ltd"); // single token never erased
    expect(companyKey("")).toBe("");
  });

  it("normalizes title keys without locale dependence", () => {
    expect(titleKey("Senior Backend Engineer!!")).toBe("senior backend engineer");
    expect(titleKey("Senior   Backend ENGINEER")).toBe(titleKey("Senior Backend Engineer"));
    expect(titleKey("C++ Developer")).toBe("c++ developer");
    expect(titleKey("Node.js Engineer")).toBe("node.js engineer");
    expect(titleKey("Sr. Backend Eng.")).toBe("sr. backend eng.");
  });

  it("normalizes locations and detects remote wording conservatively", () => {
    expect(normalizeLocation("  London, UK  ")).toBe("London, UK");
    expect(normalizeLocation("Austin, TX;")).toBe("Austin, TX");
    expect(locationKey("London, UK")).toBe("london uk");
    expect(locationKey("LONDON uk")).toBe(locationKey("London, UK"));

    expect(indicatesRemote("Remote - US")).toBe(true);
    expect(indicatesRemote("remote")).toBe(true);
    expect(indicatesRemote("Hybrid - London")).toBe(false);
    expect(indicatesRemote("Remoteness")).toBe(false); // word boundary respected
    expect(indicatesRemote(null)).toBe(false);
    expect(indicatesRemote("")).toBe(false);
  });

  it("normalizes employment types to snake_case or null", () => {
    expect(normalizeEmploymentType("Full-time")).toBe("full_time");
    expect(normalizeEmploymentType("FullTime")).toBe("full_time");
    expect(normalizeEmploymentType("FULL_TIME")).toBe("full_time");
    expect(normalizeEmploymentType("Part Time")).toBe("part_time");
    expect(normalizeEmploymentType("Contract")).toBe("contract");
    expect(normalizeEmploymentType("  ")).toBeNull();
    expect(normalizeEmploymentType(null)).toBeNull();
    expect(normalizeEmploymentType(42)).toBeNull();
  });

  it("parses only plausible source timestamps (M)", () => {
    expect(parseSourceTimestamp(1789430400)).toBe("2026-09-15T00:00:00.000Z"); // seconds
    expect(parseSourceTimestamp(1789430400000)).toBe("2026-09-15T00:00:00.000Z"); // ms
    expect(parseSourceTimestamp("2026-09-15T00:00:00Z")).toBe("2026-09-15T00:00:00.000Z");
    expect(parseSourceTimestamp("1789430400")).toBe("2026-09-15T00:00:00.000Z");
    expect(parseSourceTimestamp(946684800)).toBe("2000-01-01T00:00:00.000Z"); // lower bound
    expect(parseSourceTimestamp(946684799)).toBeNull(); // before 2000 → garbage
    expect(parseSourceTimestamp(4102444800000)).toBe("2100-01-01T00:00:00.000Z");
    expect(parseSourceTimestamp(4102444801000)).toBeNull(); // beyond 2100 → garbage
    expect(parseSourceTimestamp(0)).toBeNull();
    expect(parseSourceTimestamp(-5)).toBeNull();
    expect(parseSourceTimestamp("not a date")).toBeNull();
    expect(parseSourceTimestamp(null)).toBeNull();
    expect(parseSourceTimestamp(undefined)).toBeNull();
    expect(parseSourceTimestamp({})).toBeNull();
  });

  it("provides conservative string/url helpers for adapters", () => {
    expect(asNonEmptyString("  hi  ")).toBe("hi");
    expect(asNonEmptyString("   ")).toBeNull();
    expect(asNonEmptyString(7)).toBeNull();
    expect(asHttpsUrl("https://x.example/j")).toBe("https://x.example/j");
    expect(asHttpsUrl("http://x.example/j")).toBeNull();
    expect(asHttpsUrl("javascript:alert(1)")).toBeNull();
    expect(isHttpsUrl("https://x.example")).toBe(true);
    expect(isHttpsUrl("HTTPS://x.example")).toBe(true); // scheme case-insensitive
    expect(isHttpsUrl("http://x.example")).toBe(false);
    expect(isHttpsUrl("nonsense")).toBe(false);
  });
});

describe("URL canonicalization (G)", () => {
  it("never rewrites destinations — produces a key only", () => {
    const destination = "https://job-boards.greenhouse.io/acme/jobs/1?utm_source=feed";
    // The key drops tracking params…
    expect(canonicalUrlKey(destination)).toBe(
      "job-boards.greenhouse.io/acme/jobs/1",
    );
    // …but callers keep the original destination string untouched (adapters
    // store sourceUrl/applyUrl verbatim; this function only compares).
    expect(destination).toContain("utm_source=feed");
  });

  it("returns null for non-HTTPS or malformed URLs", () => {
    expect(canonicalUrlKey("http://example.com/x")).toBeNull();
    expect(canonicalUrlKey("ftp://example.com/x")).toBeNull();
    expect(canonicalUrlKey("not a url")).toBeNull();
    expect(canonicalUrlKey("")).toBeNull();
  });

  it("strips tracking parameters of every known family", () => {
    const withTracking =
      "https://example.com/jobs/1?utm_source=a&utm_medium=b&gclid=zz&fbclid=yy&ref=src&gh_src=q&level=senior";
    expect(canonicalUrlKey(withTracking)).toBe("example.com/jobs/1?level=senior");
    const without =
      "https://example.com/jobs/1?level=senior";
    expect(canonicalUrlKey(withTracking)).toBe(canonicalUrlKey(without));
  });

  it("keeps meaningful query parameters and order-insensitivity", () => {
    expect(canonicalUrlKey("https://example.com/x?b=2&a=1")).toBe(
      canonicalUrlKey("https://example.com/x?a=1&b=2"),
    );
    expect(canonicalUrlKey("https://example.com/x?page=2")).toBe(
      "example.com/x?page=2",
    );
  });

  it("normalizes host case, default port, fragments and trailing slashes", () => {
    expect(canonicalUrlKey("https://Example.COM:443/Path/#frag")).toBe(
      "example.com/Path",
    );
    expect(canonicalUrlKey("https://example.com/")).toBe("example.com/");
    expect(canonicalUrlKey("https://example.com/a/")).toBe("example.com/a");
    // Path case is preserved — a case difference simply will not merge.
    expect(canonicalUrlKey("https://example.com/Path")).not.toBe(
      canonicalUrlKey("https://example.com/path"),
    );
  });

  it("makes equal destinations equal across tracking variants", () => {
    const a = "https://jobs.lever.co/acme/abc123?ref=feed";
    const b = "https://jobs.lever.co/acme/abc123";
    const c = "https://JOBS.lever.co/acme/abc123?utm_campaign=x";
    expect(canonicalUrlKey(a)).toBe(canonicalUrlKey(b));
    expect(canonicalUrlKey(b)).toBe(canonicalUrlKey(c));
  });
});
