"use strict";

/**
 * M7A tests — source registry (B), host allowlist (C), HTTPS enforcement (D),
 * redirect validation (E), private/loopback guards, rate-limit config.
 */

import { describe, expect, it } from "vitest";
import {
  JOB_SOURCES,
  JOB_SOURCE_LIST,
  JOB_SOURCE_RATE_LIMIT,
  getSourceDefinition,
  isPrivateOrLoopbackHostname,
  validateRedirectTarget,
  validateSourceUrl,
} from "@/lib/job-sources/registry";
import { SOURCE_KINDS, isSourceKind } from "@/lib/job-sources/types";
import { greenhouseAdapter } from "@/lib/job-sources/adapters/greenhouse";
import { leverAdapter } from "@/lib/job-sources/adapters/lever";
import { ashbyAdapter } from "@/lib/job-sources/adapters/ashby";
import { arbeitnowAdapter } from "@/lib/job-sources/adapters/arbeitnow";

describe("source registry (B)", () => {
  it("exposes exactly the four M7 product-approved sources", () => {
    expect([...SOURCE_KINDS].sort()).toEqual([
      "arbeitnow",
      "ashby",
      "greenhouse",
      "lever",
    ]);
    expect(JOB_SOURCE_LIST).toHaveLength(4);
    expect(JOB_SOURCE_LIST.map((s) => s.kind).sort()).toEqual([
      "arbeitnow",
      "ashby",
      "greenhouse",
      "lever",
    ]);
  });

  it("every definition carries display name, attribution, adapter and https rules", () => {
    for (const source of JOB_SOURCE_LIST) {
      expect(source.displayName.length).toBeGreaterThan(0);
      expect(source.attributionText.length).toBeGreaterThan(0);
      expect(source.attributionUrl.startsWith("https://")).toBe(true);
      expect(source.allowedHosts.length).toBeGreaterThan(0);
      expect(source.urlRules.requireHttps).toBe(true);
      expect(source.adapter.kind).toBe(source.kind);
      expect(source.adapter.displayName).toBe(source.displayName);
      for (const host of source.allowedHosts) {
        expect(host).toBe(host.toLowerCase());
        expect(host).not.toContain("*");
        expect(host).not.toContain("/");
      }
    }
  });

  it("wires each source to its own adapter", () => {
    expect(JOB_SOURCES.greenhouse.adapter).toBe(greenhouseAdapter);
    expect(JOB_SOURCES.lever.adapter).toBe(leverAdapter);
    expect(JOB_SOURCES.ashby.adapter).toBe(ashbyAdapter);
    expect(JOB_SOURCES.arbeitnow.adapter).toBe(arbeitnowAdapter);
  });

  it("resolves known kinds and rejects everything else", () => {
    expect(getSourceDefinition("greenhouse")?.displayName).toBe("Greenhouse");
    expect(getSourceDefinition("lever")?.displayName).toBe("Lever");
    expect(getSourceDefinition("ashby")?.displayName).toBe("Ashby");
    expect(getSourceDefinition("arbeitnow")?.displayName).toBe("Arbeitnow");
    expect(getSourceDefinition("linkedin")).toBeUndefined();
    expect(getSourceDefinition("indeed")).toBeUndefined();
    expect(getSourceDefinition("adzuna")).toBeUndefined();
    expect(getSourceDefinition("GREENHOUSE")).toBeUndefined();
    expect(getSourceDefinition("")).toBeUndefined();
    expect(isSourceKind("greenhouse")).toBe(true);
    expect(isSourceKind("naukri")).toBe(false);
  });

  it("freezes rate-limit configuration for the future M7B limiter", () => {
    expect(JOB_SOURCE_RATE_LIMIT).toEqual({ maxRequests: 10, windowMs: 60_000 });
    expect(Object.isFrozen(JOB_SOURCE_RATE_LIMIT)).toBe(true);
  });
});

describe("host allowlist (C)", () => {
  it("accepts each registry host for its own source only", () => {
    for (const source of JOB_SOURCE_LIST) {
      for (const host of source.allowedHosts) {
        const decision = validateSourceUrl(source.kind, `https://${host}/path`);
        expect(decision.ok).toBe(true);
      }
    }
  });

  it("rejects lookalike, subdomain, and cross-source hosts", () => {
    const cases: Array<[string, string]> = [
      ["greenhouse", "https://evil.com/v1/boards/x/jobs"],
      ["greenhouse", "https://boards-api.greenhouse.io.evil.com/jobs"],
      ["greenhouse", "https://evilboards-api.greenhouse.io/jobs"],
      ["greenhouse", "https://x.boards-api.greenhouse.io/jobs"],
      ["greenhouse", "https://api.lever.co/v0/postings/acme"],
      ["lever", "https://boards-api.greenhouse.io/v1/boards/x/jobs"],
      ["ashby", "https://api.ashbyhq.com.evil.com/posting-api/job-board/x"],
      ["arbeitnow", "https://www.arbeitnow.com.evil.com/api/job-board-api"],
    ];
    for (const [kind, url] of cases) {
      const decision = validateSourceUrl(kind, url);
      expect(decision.ok).toBe(false);
      if (!decision.ok) expect(decision.reason).toBe("host_not_allowed");
    }
  });

  it("rejects unknown sources outright", () => {
    const decision = validateSourceUrl("indeed", "https://www.indeed.com/jobs");
    expect(decision).toEqual({ ok: false, reason: "unknown_source" });
  });
});

describe("HTTPS enforcement (D)", () => {
  it("rejects non-HTTPS URLs without upgrading them", () => {
    const cases = [
      "http://boards-api.greenhouse.io/v1/boards/x/jobs",
      "ftp://boards-api.greenhouse.io/x",
      "https:/broken",
    ];
    for (const url of cases) {
      const decision = validateSourceUrl("greenhouse", url);
      expect(decision.ok).toBe(false);
    }
    const http = validateSourceUrl("greenhouse", "http://boards-api.greenhouse.io/x");
    expect(http).toEqual({ ok: false, reason: "not_https" });
  });

  it("rejects malformed and credential-bearing URLs", () => {
    expect(validateSourceUrl("greenhouse", "not a url")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
    expect(validateSourceUrl("greenhouse", "")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
    const creds = validateSourceUrl(
      "greenhouse",
      "https://user:pass@boards-api.greenhouse.io/v1/boards/x/jobs",
    );
    expect(creds).toEqual({ ok: false, reason: "credentials_in_url" });
  });

  it("rejects private, loopback, and metadata destinations before allowlist checks", () => {
    const privates = [
      "https://127.0.0.1/x",
      "https://[::1]/x",
      "https://2130706433/x", // decimal-encoded 127.0.0.1 (URL-normalized)
      "https://localhost/x",
      "https://169.254.169.254/latest/meta-data",
      "https://10.0.0.8/x",
      "https://192.168.1.10/x",
    ];
    for (const url of privates) {
      const decision = validateSourceUrl("greenhouse", url);
      expect(decision.ok).toBe(false);
      if (!decision.ok) {
        expect(["private_or_loopback_destination", "host_not_allowed"]).toContain(
          decision.reason,
        );
      }
    }
  });

  it("classifies private/loopback hostnames precisely", () => {
    const privates = [
      "localhost",
      "foo.localhost",
      "svc.local",
      "db.internal",
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "[::1]",
      "::1",
      "fc00::1",
      "fd12:3456::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ];
    for (const host of privates) {
      expect(isPrivateOrLoopbackHostname(host), host).toBe(true);
    }
    const publicHosts = [
      "boards-api.greenhouse.io",
      "api.lever.co",
      "8.8.8.8",
      "11.0.0.1",
      "172.32.0.1",
      "192.169.1.1",
    ];
    for (const host of publicHosts) {
      expect(isPrivateOrLoopbackHostname(host), host).toBe(false);
    }
  });
});

describe("redirect validation (E)", () => {
  it("resolves relative Location headers against the current request URL", () => {
    const decision = validateRedirectTarget(
      "greenhouse",
      "/v1/boards/acme/jobs?page=2",
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs?content=true",
    );
    expect(decision.ok).toBe(true);
    if (decision.ok) {
      expect(decision.url.toString()).toBe(
        "https://boards-api.greenhouse.io/v1/boards/acme/jobs?page=2",
      );
    }
  });

  it("rejects cross-source redirect targets", () => {
    const decision = validateRedirectTarget(
      "greenhouse",
      "https://api.lever.co/v0/postings/acme",
      "https://boards-api.greenhouse.io/v1/boards/acme/jobs",
    );
    expect(decision).toEqual({ ok: false, reason: "host_not_allowed" });
  });

  it("rejects redirect targets that are private or non-HTTPS", () => {
    expect(
      validateRedirectTarget(
        "greenhouse",
        "https://127.0.0.1/steal",
        "https://boards-api.greenhouse.io/x",
      ).ok,
    ).toBe(false);
    expect(
      validateRedirectTarget(
        "greenhouse",
        "http://boards-api.greenhouse.io/x",
        "https://boards-api.greenhouse.io/x",
      ),
    ).toEqual({ ok: false, reason: "not_https" });
    expect(
      validateRedirectTarget(
        "greenhouse",
        "http://[",
        "https://boards-api.greenhouse.io/x",
      ),
    ).toEqual({ ok: false, reason: "invalid_url" });
  });

  it("rejects an unresolvable Location without a base", () => {
    expect(validateRedirectTarget("greenhouse", "/relative-only")).toEqual({
      ok: false,
      reason: "invalid_url",
    });
  });
});
