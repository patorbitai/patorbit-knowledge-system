/**
 * Database Safety Tests
 *
 * These tests exercise the ACTUAL guard implementation exported from @/lib/prisma.
 * They do NOT duplicate the guard logic — they import and test the real functions.
 *
 * Functions tested:
 *   - isTestEnvironment()     — checks if we're in a test environment
 *   - validateNotProduction() — rejects URLs matching production hostnames
 *   - resolveDatabaseUrl()    — the core guard: returns URL or throws
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  isTestEnvironment,
  validateNotProduction,
  resolveDatabaseUrl,
  prisma,
} from "@/lib/prisma";

// Allow overriding NODE_ENV in tests (TypeScript treats it as read-only)
const env = process.env as Record<string, string | undefined>;

// ── Environment save/restore ───────────────────────────────────────────────

const ENV_KEYS = ["NODE_ENV", "VITEST", "VITEST_POOL_ID", "TEST_DATABASE_URL", "DATABASE_URL"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete env[key];
    } else {
      env[key] = savedEnv[key];
    }
  }
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe("isTestEnvironment() — actual implementation", () => {
  it("returns true when NODE_ENV=test", () => {
    env.NODE_ENV = "test";
    expect(isTestEnvironment()).toBe(true);
  });

  it("returns true when VITEST is set", () => {
    process.env.VITEST = "true";
    expect(isTestEnvironment()).toBe(true);
  });

  it("returns true when VITEST_POOL_ID is set", () => {
    process.env.VITEST_POOL_ID = "0";
    expect(isTestEnvironment()).toBe(true);
  });

  it("returns false when not in test environment", () => {
    delete env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.VITEST_POOL_ID;
    expect(isTestEnvironment()).toBe(false);
  });
});

describe("validateNotProduction() — actual implementation", () => {
  it("accepts a non-production URL", () => {
    expect(() =>
      validateNotProduction("postgresql://user:pass@localhost:5432/testdb", "TEST")
    ).not.toThrow();
  });

  it("rejects production Neon pooler hostname", () => {
    expect(() =>
      validateNotProduction(
        "postgresql://user:pass@ep-frosty-lab-azufiuom-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb",
        "TEST_DATABASE_URL"
      )
    ).toThrow("production");
    expect(() =>
      validateNotProduction(
        "postgresql://user:pass@ep-frosty-lab-azufiuom-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb",
        "TEST_DATABASE_URL"
      )
    ).toThrow("ep-frosty-lab-azufiuom-pooler");
  });

  it("rejects production host without pooler suffix", () => {
    expect(() =>
      validateNotProduction(
        "postgresql://user:pass@ep-frosty-lab-azufiuom.some-region.aws.neon.tech/neondb",
        "TEST"
      )
    ).toThrow("production");
  });

  it("is case-insensitive", () => {
    expect(() =>
      validateNotProduction(
        "postgresql://user:pass@EP-FROSTY-LAB-AZUFIUOM-POOLER.neon.tech/neondb",
        "TEST"
      )
    ).toThrow("production");
  });
});

describe("resolveDatabaseUrl() — actual guard (Case A: missing TEST_DATABASE_URL in test env)", () => {
  it("throws when NODE_ENV=test and TEST_DATABASE_URL is absent", () => {
    env.NODE_ENV = "test";
    delete process.env.TEST_DATABASE_URL;
    expect(() => resolveDatabaseUrl()).toThrow("Cannot create Prisma client");
    expect(() => resolveDatabaseUrl()).toThrow("TEST_DATABASE_URL");
  });

  it("throws when NODE_ENV=test and TEST_DATABASE_URL is empty", () => {
    env.NODE_ENV = "test";
    process.env.TEST_DATABASE_URL = "";
    expect(() => resolveDatabaseUrl()).toThrow("Cannot create Prisma client");
  });

  it("throws when VITEST is set and TEST_DATABASE_URL is absent", () => {
    process.env.VITEST = "true";
    delete process.env.TEST_DATABASE_URL;
    expect(() => resolveDatabaseUrl()).toThrow("Cannot create Prisma client");
  });

  it("does NOT fall back to DATABASE_URL", () => {
    env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://neondb_owner:pass@ep-frosty-lab-azufiuom-pooler.neon.tech/neondb";
    delete process.env.TEST_DATABASE_URL;
    expect(() => resolveDatabaseUrl()).toThrow("Cannot create Prisma client");
  });
});

describe("resolveDatabaseUrl() — actual guard (Case B: production TEST_DATABASE_URL)", () => {
  it("rejects TEST_DATABASE_URL containing production hostname", () => {
    env.NODE_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://user:pass@ep-frosty-lab-azufiuom-pooler.c-3.neon.tech/neondb";
    expect(() => resolveDatabaseUrl()).toThrow("targets production");
    expect(() => resolveDatabaseUrl()).toThrow("ep-frosty-lab-azufiuom-pooler");
  });

  it("rejects TEST_DATABASE_URL containing production host without pooler", () => {
    env.NODE_ENV = "test";
    process.env.TEST_DATABASE_URL =
      "postgresql://user:pass@ep-frosty-lab-azufiuom.neon.tech/neondb";
    expect(() => resolveDatabaseUrl()).toThrow("targets production");
  });
});

describe("resolveDatabaseUrl() — actual guard (Case C: safe test URL)", () => {
  it("accepts a non-production TEST_DATABASE_URL", () => {
    env.NODE_ENV = "test";
    process.env.TEST_DATABASE_URL = "postgresql://user:pass@localhost:5432/patorbit_test";
    expect(resolveDatabaseUrl()).toBe("postgresql://user:pass@localhost:5432/patorbit_test");
  });

  it("accepts a test database with different hostname", () => {
    env.NODE_ENV = "test";
    process.env.TEST_DATABASE_URL = "postgresql://user:pass@my-test-db.example.com:5432/testdb";
    expect(resolveDatabaseUrl()).toBe("postgresql://user:pass@my-test-db.example.com:5432/testdb");
  });
});

describe("resolveDatabaseUrl() — non-test environment", () => {
  it("returns undefined (uses DATABASE_URL) when not in test env", () => {
    delete env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.VITEST_POOL_ID;
    delete process.env.TEST_DATABASE_URL;
    expect(resolveDatabaseUrl()).toBeUndefined();
  });

  it("uses TEST_DATABASE_URL when set even in non-test env", () => {
    delete env.NODE_ENV;
    delete process.env.VITEST;
    delete process.env.VITEST_POOL_ID;
    process.env.TEST_DATABASE_URL = "postgresql://user:pass@localhost:5432/testdb";
    expect(resolveDatabaseUrl()).toBe("postgresql://user:pass@localhost:5432/testdb");
  });
});

describe("Proxy behavior (Case D)", () => {
  it("importing @/lib/prisma does not throw or connect", () => {
    // If we got here, the import at the top of this file succeeded
    // without triggering the guard. The guard only fires on method calls.
    expect(true).toBe(true);
  });

  it("prisma object is a Proxy (guard fires on access, not import)", () => {
    // The static import at the top of this file imported prisma from @/lib/prisma.
    // prisma is a Proxy — it does NOT connect on import.
    // Accessing a property triggers getOrCreateClient() which runs the guard.
    env.NODE_ENV = "test";
    delete process.env.TEST_DATABASE_URL;

    // Accessing any property on the Proxy triggers the guard
    expect(() => {
      // This triggers the Proxy get trap → getOrCreateClient() → throws
      void (prisma as any).$connect;
    }).toThrow("Cannot create Prisma client");
  });
});
