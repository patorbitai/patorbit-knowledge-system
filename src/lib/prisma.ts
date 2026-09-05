import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// ── Production hostname patterns ───────────────────────────────────────────
// These are known production Neon pooler hostnames.
const PRODUCTION_HOST_PATTERNS = [
  "ep-frosty-lab-azufiuom-pooler",
  "ep-frosty-lab-azufiuom",
];

/**
 * Check if we're in a test environment.
 * Exported for testing.
 */
export function isTestEnvironment(): boolean {
  return (
    process.env.NODE_ENV === "test" ||
    process.env.VITEST !== undefined ||
    !!process.env.VITEST_POOL_ID
  );
}

/**
 * Validate a database URL is not production.
 * Exported for testing.
 * @throws if URL matches a known production hostname pattern
 */
export function validateNotProduction(url: string, label: string): void {
  const lower = url.toLowerCase();
  for (const p of PRODUCTION_HOST_PATTERNS) {
    if (lower.includes(p)) {
      throw new Error(
        `[SAFETY] ${label} targets production (contains "${p}"). ` +
        `Tests must not connect to production.`
      );
    }
  }
}

/**
 * The core database safety guard.
 * Exported for testing.
 *
 * Returns the database URL to use, or throws if unsafe.
 */
export function resolveDatabaseUrl(): string | undefined {
  const testUrl = process.env.TEST_DATABASE_URL;

  if (testUrl) {
    validateNotProduction(testUrl, "TEST_DATABASE_URL");
    return testUrl;
  }

  if (isTestEnvironment()) {
    // Fail closed: no test database configured in test environment
    throw new Error(
      `[SAFETY] Cannot create Prisma client in test environment without TEST_DATABASE_URL. ` +
      `Tests must not fall back to the production DATABASE_URL. ` +
      `Set TEST_DATABASE_URL in .env.test or your environment.`
    );
  }

  // Production/dev: use DATABASE_URL (undefined = Prisma default)
  return undefined;
}

/**
 * Create the real Prisma client (lazy — only called when first used).
 */
let _realClient: PrismaClient | null = null;

function getOrCreateClient(): PrismaClient {
  if (_realClient) return _realClient;

  const url = resolveDatabaseUrl();
  _realClient = url
    ? new PrismaClient({ datasources: { db: { url } } })
    : new PrismaClient();

  return _realClient;
}

/**
 * Production-safe Prisma client proxy.
 *
 * The guard is enforced lazily — only when a Prisma method is actually called.
 * This allows test files to import modules that reference `prisma` without
 * triggering the guard, as long as they mock the database calls.
 *
 * SAFETY:
 *   - If TEST_DATABASE_URL is set → connects to test database (validated)
 *   - If TEST_DATABASE_URL is NOT set in test env → REFUSES to connect
 *   - If TEST_DATABASE_URL is NOT set in prod/dev → uses DATABASE_URL normally
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    const client = getOrCreateClient();
    const value = Reflect.get(client, prop, client);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as unknown as PrismaClient;
}