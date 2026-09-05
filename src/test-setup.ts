/**
 * test-setup.ts — Global test setup that enforces database safety.
 *
 * This file runs BEFORE any test file. It ensures:
 *   1. If TEST_DATABASE_URL is set, it validates it's not production
 *   2. If TEST_DATABASE_URL is set, it overrides DATABASE_URL
 *   3. If TEST_DATABASE_URL is NOT set, it warns but allows unit tests to run
 *
 * SAFETY: Database-backed tests MUST set TEST_DATABASE_URL.
 * The prisma.ts client enforces this at the Prisma level via a lazy Proxy guard.
 */

// ── Production hostname patterns ───────────────────────────────────────────
const PRODUCTION_HOST_PATTERNS = [
  "ep-frosty-lab-azufiuom-pooler",
  "ep-frosty-lab-azufiuom",
];

// ── Check TEST_DATABASE_URL ────────────────────────────────────────────────
const testDbUrl = process.env.TEST_DATABASE_URL;

if (testDbUrl) {
  // Validate the test database URL is not production
  const lowerTestUrl = testDbUrl.toLowerCase();
  for (const pattern of PRODUCTION_HOST_PATTERNS) {
    if (lowerTestUrl.includes(pattern)) {
      console.error("\n" + "=".repeat(70));
      console.error(`[TEST SAFETY] TEST_DATABASE_URL contains production hostname "${pattern}".`);
      console.error("Tests MUST NOT connect to the production database.");
      console.error("Set TEST_DATABASE_URL to an isolated test database.");
      console.error("=".repeat(70) + "\n");
      process.exit(1);
    }
  }

  // Override DATABASE_URL so Prisma uses the test database
  process.env.DATABASE_URL = testDbUrl;
  console.log("[TEST SAFETY] DATABASE_URL overridden to TEST_DATABASE_URL.");
} else {
  // No test database configured — warn and fail closed for DB-backed tests
  console.warn("[TEST SAFETY] TEST_DATABASE_URL not set.");
  console.warn("[TEST SAFETY] Database-backed tests CANNOT run.");
  console.warn("[TEST SAFETY] Production DATABASE_URL will NOT be used as a fallback.");
  console.warn("[TEST SAFETY] Database access will fail closed via prisma.ts guard.");
  console.warn("[TEST SAFETY] To run database tests, set TEST_DATABASE_URL in .env.test.");
}

console.log("[TEST SAFETY] Test setup complete.");
